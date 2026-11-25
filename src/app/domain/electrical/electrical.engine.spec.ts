import { describe, expect, it } from 'vitest';
import { INITIAL_ASSEMBLY_STATE } from '../assembly/assembly.models';
import { evaluatePortConnection } from '../connections/connection.engine';
import {
  VOLTAGE_RAILS,
  evaluateElectricalOverlay,
  findVoltageRailById,
} from './electrical.engine';

describe('electrical.engine — Sistema Elétrico e Linhas de Tensão (Sprint 6)', () => {
  it('define todas as linhas principais e secundárias da PCWare IPM41-D3', () => {
    const ids = VOLTAGE_RAILS.map((r) => r.id);
    expect(ids).toEqual(['+12V', '+5V', '+3.3V', '+5VSB', 'VCORE', 'DDR3_1V5']);

    const rail12v = findVoltageRailById('+12V');
    expect(rail12v.branches.map((b) => b.label)).toEqual([
      'CPU VRM',
      'Cooler',
      'HD Samsung',
      'GPU',
    ]);
  });

  it('identifica dinamicamente quais ramos de +12V estão com cabo conectado ou desconectado', () => {
    // Sem nenhum cabo conectado
    const emptyEval = evaluateElectricalOverlay('+12V', INITIAL_ASSEMBLY_STATE, []);
    expect(emptyEval.activeConnectionIds).toEqual([]);
    expect(emptyEval.branches.every((b) => !b.energized)).toBe(true);

    // Conectando CPU 4P + SATA Power
    const cpu4 = evaluatePortConnection('psu-out-cpu4', 'mb-in-cpu4', INITIAL_ASSEMBLY_STATE, []);
    const sataPwr = evaluatePortConnection(
      'psu-out-sata-power',
      'hdd-in-sata-power',
      INITIAL_ASSEMBLY_STATE,
      [cpu4.connection!]
    );

    const partialEval = evaluateElectricalOverlay('+12V', INITIAL_ASSEMBLY_STATE, [
      cpu4.connection!,
      sataPwr.connection!,
    ]);

    expect(partialEval.activeConnectionIds).toEqual(['conn-cpu-4p', 'conn-sata-power']);
    const vrmBranch = partialEval.branches.find((b) => b.branch.label === 'CPU VRM');
    const hddBranch = partialEval.branches.find((b) => b.branch.label === 'HD Samsung');
    const gpuBranch = partialEval.branches.find((b) => b.branch.label === 'GPU');

    expect(vrmBranch?.energized).toBe(true);
    expect(hddBranch?.energized).toBe(true);
    expect(gpuBranch?.energized).toBe(false);
  });

  it('mapeia corretamente a linha +5V para HD Samsung, PCI legado e Southbridge ICH7', () => {
    const rail5v = findVoltageRailById('+5V');
    expect(rail5v.relatedTargetIds).toContain('component-hdd-samsung');
    expect(rail5v.relatedTargetIds).toContain('motherboard-pci');
    expect(rail5v.relatedTargetIds).toContain('motherboard-southbridge-ich7');
  });
});
