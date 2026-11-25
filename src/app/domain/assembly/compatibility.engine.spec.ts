import { describe, expect, it } from 'vitest';
import { INITIAL_ASSEMBLY_STATE } from './assembly.models';
import {
  applyPlacement,
  applyRemoval,
  evaluatePlacement,
  evaluateRemoval,
} from './compatibility.engine';

describe('compatibility.engine — Motor de Compatibilidade e Montagem (Sprint 4)', () => {
  it('aceita RAM DDR3 em DIMM 1 e DIMM 2, mas recusa em slots incompatíveis', () => {
    const valid1 = evaluatePlacement('component-ram-ddr3', 'motherboard-dimm-1', INITIAL_ASSEMBLY_STATE);
    expect(valid1.status).toBe('COMPATIBLE');

    const valid2 = evaluatePlacement('component-ram-ddr3', 'motherboard-dimm-2', INITIAL_ASSEMBLY_STATE);
    expect(valid2.status).toBe('COMPATIBLE');

    const invalidPcie = evaluatePlacement('component-ram-ddr3', 'motherboard-pcie-x16', INITIAL_ASSEMBLY_STATE);
    expect(invalidPcie.status).toBe('INCOMPATIBLE');
    expect(invalidPcie.code).toBe('WRONG_SLOT_FOR_RAM');
  });

  it('recusa GPU PCIe x16 em slot PCI legado 32-bit e aceita em PCIe x16', () => {
    const invalidLegacy = evaluatePlacement('component-gpu-pcie', 'motherboard-pci', INITIAL_ASSEMBLY_STATE);
    expect(invalidLegacy.status).toBe('INCOMPATIBLE');
    expect(invalidLegacy.code).toBe('GPU_ON_LEGACY_PCI');

    const validPcie = evaluatePlacement('component-gpu-pcie', 'motherboard-pcie-x16', INITIAL_ASSEMBLY_STATE);
    expect(validPcie.status).toBe('COMPATIBLE');
  });

  it('impõe ordem lógica: CPU → Pasta Térmica → Cooler (e alerta se instalar Cooler sem pasta)', () => {
    // Sem CPU, pasta térmica e cooler são recusados
    expect(
      evaluatePlacement('component-thermal-paste', 'motherboard-cpu-socket', INITIAL_ASSEMBLY_STATE).status
    ).toBe('INCOMPATIBLE');
    expect(
      evaluatePlacement('component-cooler-lga775', 'motherboard-cpu-socket', INITIAL_ASSEMBLY_STATE).status
    ).toBe('INCOMPATIBLE');

    // Instala CPU
    const withCpu = applyPlacement('component-cpu-lga775', 'motherboard-cpu-socket', INITIAL_ASSEMBLY_STATE);

    // Cooler sem pasta -> COMPATIBLE_WITH_WARNING
    const coolerNoPaste = evaluatePlacement('component-cooler-lga775', 'motherboard-cpu-socket', withCpu);
    expect(coolerNoPaste.status).toBe('COMPATIBLE_WITH_WARNING');
    expect(coolerNoPaste.code).toBe('COOLER_WITHOUT_PASTE');

    // Aplica pasta térmica -> Cooler agora é COMPATIBLE sem alerta
    const withPaste = applyPlacement('component-thermal-paste', 'motherboard-cpu-socket', withCpu);
    expect(withPaste.thermalPasteApplied).toBe(true);
    const coolerWithPaste = evaluatePlacement('component-cooler-lga775', 'motherboard-cpu-socket', withPaste);
    expect(coolerWithPaste.status).toBe('COMPATIBLE');
  });

  it('bloqueia remoção da CPU enquanto o Cooler ainda está montado sobre ela', () => {
    let state = applyPlacement('component-cpu-lga775', 'motherboard-cpu-socket', INITIAL_ASSEMBLY_STATE);
    state = applyPlacement('component-thermal-paste', 'motherboard-cpu-socket', state);
    state = applyPlacement('component-cooler-lga775', 'motherboard-cpu-socket', state);

    const blocked = evaluateRemoval('component-cpu-lga775', state);
    expect(blocked.allowed).toBe(false);

    // Remove cooler primeiro -> agora permite remover CPU
    const withoutCooler = applyRemoval('component-cooler-lga775', state);
    expect(evaluateRemoval('component-cpu-lga775', withoutCooler).allowed).toBe(true);

    // Ao remover CPU, pasta térmica é limpa
    const withoutCpu = applyRemoval('component-cpu-lga775', withoutCooler);
    expect(withoutCpu.thermalPasteApplied).toBe(false);
  });

  it('recusa encaixe direto de HD Samsung e Fonte ATX sobre a placa-mãe com explicação didática', () => {
    const hddCheck = evaluatePlacement('component-hdd-samsung', 'motherboard-sata', INITIAL_ASSEMBLY_STATE);
    expect(hddCheck.status).toBe('INCOMPATIBLE');
    expect(hddCheck.code).toBe('HDD_NEEDS_CABLE');

    const psuCheck = evaluatePlacement('component-psu-atx', 'motherboard-atx-24pin', INITIAL_ASSEMBLY_STATE);
    expect(psuCheck.status).toBe('INCOMPATIBLE');
    expect(psuCheck.code).toBe('PSU_NEEDS_CABLES');
  });
});
