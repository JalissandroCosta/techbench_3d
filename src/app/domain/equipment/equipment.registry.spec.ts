import { describe, expect, it } from 'vitest';
import { buildDossierForRegion } from '../education/technical-info.adapter';
import {
  BUILTIN_EQUIPMENTS,
  DEFAULT_CUSTOM_CONFIG,
  DEFAULT_EQUIPMENT_ID,
  createCustomEquipmentProfile,
  findBuiltinEquipmentById,
} from './equipment.registry';

describe('equipment.registry — Arquitetura Multi-Equipamentos (Sprint 11)', () => {
  it('registra os 4 equipamentos principais (PCWare, Dell 3070, Servidor 1U, Notebook)', () => {
    expect(BUILTIN_EQUIPMENTS.length).toBe(4);
    expect(findBuiltinEquipmentById(DEFAULT_EQUIPMENT_ID)?.supportsFullAssembly).toBe(true);
    expect(findBuiltinEquipmentById('equip-dell-optiplex-3070')).not.toBeNull();
    expect(findBuiltinEquipmentById('equip-server-rack-1u')).not.toBeNull();
    expect(findBuiltinEquipmentById('equip-notebook-14')).not.toBeNull();
  });

  it('garante que todas as regiões de todos os equipamentos geram dossiês educacionais completos', () => {
    for (const eq of BUILTIN_EQUIPMENTS) {
      expect(eq.regions.length).toBeGreaterThanOrEqual(5);
      for (const region of eq.regions) {
        const dossier = buildDossierForRegion(region);
        expect(dossier.whatIsIt.length).toBeGreaterThan(10);
        expect(dossier.whatHappensIfWrong.length).toBeGreaterThan(10);
      }
    }
  });

  it('cria equipamento personalizado dinamicamente com regiões coerentes à configuração', () => {
    const custom = createCustomEquipmentProfile({
      ...DEFAULT_CUSTOM_CONFIG,
      name: 'Workstation AM5 Lab',
      formFactor: 'Mini-ITX',
      socket: 'AM5',
      ramGeneration: 'DDR5',
      dimmSlots: 2,
      storageType: 'M.2 NVMe',
    });

    expect(custom.category).toBe('custom');
    expect(custom.name).toBe('Workstation AM5 Lab');
    expect(custom.architectureTag).toContain('AM5');
    expect(custom.architectureTag).toContain('2× DDR5');
    expect(custom.regions.length).toBe(5);
  });
});
