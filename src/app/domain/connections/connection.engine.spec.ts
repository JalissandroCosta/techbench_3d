import { describe, expect, it } from 'vitest';
import { INITIAL_ASSEMBLY_STATE } from '../assembly/assembly.models';
import { applyPlacement } from '../assembly/compatibility.engine';
import {
  BENCH_CONNECTION_BLUEPRINTS,
  evaluatePortConnection,
} from './connection.engine';

describe('connection.engine — Sistema de Conexões (Sprint 5)', () => {
  it('conecta os 4 cabos obrigatórios da Sprint 5 gerando entidades completas', () => {
    const corePairs: readonly [string, string, string][] = [
      ['psu-out-atx24', 'mb-in-atx24', 'conn-atx-24p'],
      ['psu-out-cpu4', 'mb-in-cpu4', 'conn-cpu-4p'],
      ['psu-out-sata-power', 'hdd-in-sata-power', 'conn-sata-power'],
      ['hdd-port-sata-data', 'mb-port-sata-data', 'conn-sata-data'],
    ];

    const connected = [];
    for (const [a, b, expectedId] of corePairs) {
      const res = evaluatePortConnection(a, b, INITIAL_ASSEMBLY_STATE, connected);
      expect(res.valid, res.reason).toBe(true);
      expect(res.connection?.id).toBe(expectedId);
      expect(res.connection?.source.deviceName.length).toBeGreaterThan(0);
      expect(res.connection?.target.deviceName.length).toBeGreaterThan(0);
      expect(res.connection?.functionSummary.length).toBeGreaterThan(10);
      expect(res.connection?.compatibilitySummary.length).toBeGreaterThan(10);
      connected.push(res.connection!);
    }

    expect(connected.length).toBe(4);
  });

  it('recusa incompatibilidades críticas (PCIe em CPU 4P e SATA Power em SATA Data)', () => {
    const pcieInCpu = evaluatePortConnection(
      'psu-out-pcie6',
      'mb-in-cpu4',
      INITIAL_ASSEMBLY_STATE,
      []
    );
    expect(pcieInCpu.valid).toBe(false);
    expect(pcieInCpu.code).toBe('PCIE_VS_CPU_KEYING');

    const sataPowerInData = evaluatePortConnection(
      'psu-out-sata-power',
      'mb-port-sata-data',
      INITIAL_ASSEMBLY_STATE,
      []
    );
    expect(sataPowerInData.valid).toBe(false);
    expect(sataPowerInData.code).toBe('SATA_POWER_VS_DATA');
  });

  it('impede conectar cabo em porta já ocupada', () => {
    const first = evaluatePortConnection(
      'psu-out-atx24',
      'mb-in-atx24',
      INITIAL_ASSEMBLY_STATE,
      []
    );
    expect(first.valid).toBe(true);

    const duplicate = evaluatePortConnection(
      'psu-out-atx24',
      'mb-in-atx24',
      INITIAL_ASSEMBLY_STATE,
      [first.connection!]
    );
    expect(duplicate.valid).toBe(false);
    expect(duplicate.code).toBe('PORT_OCCUPIED');
  });

  it('exige GPU instalada antes de conectar PCIe 6P auxiliar', () => {
    const withoutGpu = evaluatePortConnection(
      'psu-out-pcie6',
      'gpu-in-pcie6',
      INITIAL_ASSEMBLY_STATE,
      []
    );
    expect(withoutGpu.valid).toBe(false);
    expect(withoutGpu.code).toBe('COMPONENT_NOT_INSTALLED');

    const withGpu = applyPlacement(
      'component-gpu-pcie',
      'motherboard-pcie-x16',
      INITIAL_ASSEMBLY_STATE
    );
    const validGpuPower = evaluatePortConnection('psu-out-pcie6', 'gpu-in-pcie6', withGpu, []);
    expect(validGpuPower.valid).toBe(true);
    expect(BENCH_CONNECTION_BLUEPRINTS.length).toBe(8);
  });
});
