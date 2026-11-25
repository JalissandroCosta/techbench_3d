import { describe, expect, it } from 'vitest';
import {
  TECHBENCH_INSPECTABLE_OBJECTS,
  TECHBENCH_MOTHERBOARD_ID,
  findInspectableObjectById,
  getInspectableObjectsByType,
} from './motherboard.catalog';

describe('motherboard.catalog — PCWare IPM41-D3 (Domain Headless)', () => {
  it('contém IDs únicos e todas as regiões obrigatórias da PCWare IPM41-D3', () => {
    const ids = TECHBENCH_INSPECTABLE_OBJECTS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);

    const requiredIds = [
      TECHBENCH_MOTHERBOARD_ID,
      'motherboard-cpu-socket',
      'motherboard-dimm-1',
      'motherboard-dimm-2',
      'motherboard-pcie-x16',
      'motherboard-pci',
      'motherboard-sata',
      'motherboard-atx-24pin',
      'motherboard-cpu-power',
      'motherboard-fan',
    ];

    for (const id of requiredIds) {
      expect(findInspectableObjectById(id), `Região obrigatória ausente: ${id}`).not.toBeNull();
    }
  });

  it('garante que cada região possui todos os 8 campos técnico-didáticos obrigatórios', () => {
    for (const item of TECHBENCH_INSPECTABLE_OBJECTS) {
      expect(item.name.trim().length).toBeGreaterThan(0);
      expect(item.functionSummary.trim().length).toBeGreaterThan(10);
      expect(item.locationDescription.trim().length).toBeGreaterThan(10);
      expect(item.purpose.trim().length).toBeGreaterThan(10);
      expect(item.relatedVoltages.length).toBeGreaterThan(0);
      expect(item.connectedComponent.trim().length).toBeGreaterThan(5);
      expect(item.physicalIdentification.trim().length).toBeGreaterThan(10);
      expect(item.commonConnectionErrors.length).toBeGreaterThan(0);
      expect(item.anchorName).toMatch(/^ANCHOR_/);
    }
  });

  it('identifica corretamente os conectores de energia (ATX 24P e CPU Power 4P)', () => {
    const powerConnectors = getInspectableObjectsByType('power-connector');
    expect(powerConnectors.map((p) => p.id)).toEqual([
      'motherboard-atx-24pin',
      'motherboard-cpu-power',
    ]);

    const atx24 = findInspectableObjectById('motherboard-atx-24pin');
    expect(atx24?.type).toBe('power-connector');
    expect(atx24?.name).toBe('ATX 24 pinos');
  });

  it('retorna null para ID inexistente ou nulo', () => {
    expect(findInspectableObjectById(null)).toBeNull();
    expect(findInspectableObjectById('INEXISTENTE')).toBeNull();
  });
});
