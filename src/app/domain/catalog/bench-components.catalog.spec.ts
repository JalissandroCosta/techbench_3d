import { describe, expect, it } from 'vitest';
import {
  TECHBENCH_COMPONENTS,
  findBenchComponentById,
  getBenchComponentsByType,
} from './bench-components.catalog';

describe('bench-components.catalog — Componentes 3D da Bancada (Sprint 3)', () => {
  it('contém todos os 10 componentes obrigatórios da bancada (incluindo SSD 2.5" e 2 Cabos SATA) com IDs únicos', () => {
    expect(TECHBENCH_COMPONENTS.length).toBe(10);
    const ids = TECHBENCH_COMPONENTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(10);

    const requiredIds = [
      'component-cpu-lga775',
      'component-ram-ddr3',
      'component-cooler-lga775',
      'component-thermal-paste',
      'component-gpu-pcie',
      'component-hdd-samsung',
      'component-ssd-sata',
      'component-psu-atx',
      'component-cable-sata',
      'component-cable-sata-ssd',
    ];

    for (const id of requiredIds) {
      expect(findBenchComponentById(id), `Componente ausente: ${id}`).not.toBeNull();
    }
  });

  it('garante que todos os 9 componentes possuem os 10 blocos técnicos obrigatórios', () => {
    for (const comp of TECHBENCH_COMPONENTS) {
      expect(comp.entityKind).toBe('bench-component');
      // 1. Identificação
      expect(comp.name.trim().length).toBeGreaterThan(0);
      expect(comp.categoryLabel.trim().length).toBeGreaterThan(0);
      expect(comp.modelCode.trim().length).toBeGreaterThan(0);
      // 2. Descrição
      expect(comp.description.trim().length).toBeGreaterThan(10);
      // 3. Função
      expect(comp.functionSummary.trim().length).toBeGreaterThan(10);
      // 4. Características
      expect(comp.characteristics.length).toBeGreaterThan(0);
      // 5. Compatibilidade
      expect(comp.compatibility.length).toBeGreaterThan(0);
      // 6. Conectores
      expect(comp.connectors.length).toBeGreaterThan(0);
      // 7. Alimentação
      expect(comp.powerInfo.voltages.length).toBeGreaterThan(0);
      expect(comp.powerInfo.consumption.trim().length).toBeGreaterThan(0);
      expect(comp.powerInfo.source.trim().length).toBeGreaterThan(0);
      // 8. Conexões
      expect(comp.connections.length).toBeGreaterThan(0);
      // 9. Cuidados
      expect(comp.precautions.length).toBeGreaterThan(0);
      // 10. Problemas comuns
      expect(comp.commonProblems.length).toBeGreaterThan(0);
    }
  });

  it('filtra corretamente por tipo de componente', () => {
    const ram = getBenchComponentsByType('ram-ddr3');
    expect(ram.length).toBe(1);
    expect(ram[0].categoryLabel).toBe('MEMÓRIA RAM');
  });
});
