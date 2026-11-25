import { describe, expect, it } from 'vitest';
import { INITIAL_ASSEMBLY_STATE } from '../assembly/assembly.models';
import { applyPlacement } from '../assembly/compatibility.engine';
import { evaluatePortConnection } from '../connections/connection.engine';
import { CableConnectionEntity } from '../connections/connection.models';
import { evaluateAssemblyMission } from './assembly-mission.engine';

describe('assembly-mission.engine — Modo Montagem (Sprint 8)', () => {
  it('inicia com 0/10 concluídos e todos os 10 itens da missão (incluindo Pasta Térmica) presentes', () => {
    const report = evaluateAssemblyMission(INITIAL_ASSEMBLY_STATE, []);
    expect(report.completedCount).toBe(0);
    expect(report.totalCount).toBe(10);
    expect(report.progressPercent).toBe(0);
    expect(report.isCompleted).toBe(false);
    expect(report.steps.map((s) => s.label)).toEqual([
      'CPU',
      'Pasta Térmica',
      'RAM',
      'Cooler',
      'GPU',
      'ATX',
      'CPU POWER',
      'SSD (Boot)',
      'HD (Armaz.)',
      'Cabo SATA',
    ]);
  });

  it('conclui a missão (10/10) quando todas as peças, pasta térmica, SSD (Boot) e HD (Armaz.) estão instalados', () => {
    let assembly = INITIAL_ASSEMBLY_STATE;
    assembly = applyPlacement('component-cpu-lga775', 'motherboard-cpu-socket', assembly);
    assembly = applyPlacement('component-thermal-paste', 'motherboard-cpu-socket', assembly);
    assembly = applyPlacement('component-cooler-lga775', 'motherboard-cpu-socket', assembly);
    assembly = applyPlacement('component-ram-ddr3', 'motherboard-dimm-1', assembly);
    assembly = applyPlacement('component-gpu-pcie', 'motherboard-pcie-x16', assembly);

    const connections: CableConnectionEntity[] = [];
    for (const [a, b] of [
      ['psu-out-atx24', 'mb-in-atx24'],
      ['psu-out-cpu4', 'mb-in-cpu4'],
      ['psu-out-ssd-power', 'ssd-in-power'],
      ['ssd-port-sata', 'mb-port-sata-2'],
      ['psu-out-sata-power', 'hdd-in-sata-power'],
      ['hdd-port-sata-data', 'mb-port-sata-data'],
    ] as const) {
      const res = evaluatePortConnection(a, b, assembly, connections);
      expect(res.valid).toBe(true);
      connections.push(res.connection!);
    }

    const report = evaluateAssemblyMission(assembly, connections);
    expect(report.completedCount).toBe(10);
    expect(report.progressPercent).toBe(100);
    expect(report.isCompleted).toBe(true);
    expect(report.nextRecommendedStep).toBeNull();
  });

  it('gera nota de engenharia se o Cooler for instalado sem pasta térmica', () => {
    let assembly = applyPlacement('component-cpu-lga775', 'motherboard-cpu-socket', INITIAL_ASSEMBLY_STATE);
    assembly = applyPlacement('component-cooler-lga775', 'motherboard-cpu-socket', assembly);

    const report = evaluateAssemblyMission(assembly, []);
    const coolerStep = report.steps.find((s) => s.id === 'mission-cooler');
    expect(coolerStep?.completed).toBe(true);
    expect(coolerStep?.warningNote).toContain('Sem pasta');
    expect(report.engineeringNotes.some((n) => n.includes('pasta térmica'))).toBe(true);
  });
});
