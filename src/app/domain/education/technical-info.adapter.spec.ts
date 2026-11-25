import { describe, expect, it } from 'vitest';
import { INITIAL_ASSEMBLY_STATE } from '../assembly/assembly.models';
import { applyPlacement } from '../assembly/compatibility.engine';
import { TECHBENCH_COMPONENTS } from '../catalog/bench-components.catalog';
import { TECHBENCH_INSPECTABLE_OBJECTS } from '../catalog/motherboard.catalog';
import {
  BENCH_CONNECTION_BLUEPRINTS,
  evaluatePortConnection,
} from '../connections/connection.engine';
import {
  buildDossierForComponent,
  buildDossierForConnection,
  buildDossierForRegion,
} from './technical-info.adapter';
import { TechnicalDossier } from './technical-info.models';

function assertCompleteDossier(dossier: TechnicalDossier): void {
  expect(dossier.title.trim().length, `title vazio em ${dossier.id}`).toBeGreaterThan(0);
  // 1. Visão geral
  expect(dossier.whatIsIt.trim().length, `whatIsIt vazio em ${dossier.id}`).toBeGreaterThan(10);
  expect(dossier.whyItExists.trim().length, `whyItExists vazio em ${dossier.id}`).toBeGreaterThan(10);
  // 2. Função
  expect(dossier.beginnerFunction.trim().length).toBeGreaterThan(10);
  expect(dossier.howItWorks.trim().length).toBeGreaterThan(10);
  // 3. Especificações
  expect(dossier.specs.length).toBeGreaterThan(0);
  // 4. Instalação
  expect(dossier.installationGuide.trim().length).toBeGreaterThan(10);
  expect(dossier.precautions.length).toBeGreaterThan(0);
  // 5. Conexões
  expect(dossier.howItConnects.trim().length).toBeGreaterThan(5);
  expect(dossier.connectionLinks.length).toBeGreaterThan(0);
  // 6. Alimentação
  expect(dossier.voltages.length).toBeGreaterThan(0);
  // 7. Compatibilidade
  expect(dossier.compatibilityRules.length).toBeGreaterThan(0);
  // 8. Diagnóstico
  expect(dossier.whatHappensIfWrong.trim().length).toBeGreaterThan(10);
  expect(dossier.commonFaults.length).toBeGreaterThan(0);
}

describe('technical-info.adapter — Sistema de Informações Técnicas (Sprint 7)', () => {
  it('gera dossiê completo com as 8 abas para todos os 9 componentes da bancada', () => {
    for (const comp of TECHBENCH_COMPONENTS) {
      assertCompleteDossier(buildDossierForComponent(comp));
    }
  });

  it('gera dossiê completo com as 8 abas para todas as 13 regiões da PCWare IPM41-D3', () => {
    for (const region of TECHBENCH_INSPECTABLE_OBJECTS) {
      assertCompleteDossier(buildDossierForRegion(region));
    }
  });

  it('gera dossiê completo com as 8 abas para todas as 6 conexões de cabo', () => {
    let assembly = applyPlacement('component-cpu-lga775', 'motherboard-cpu-socket', INITIAL_ASSEMBLY_STATE);
    assembly = applyPlacement('component-cooler-lga775', 'motherboard-cpu-socket', assembly);
    assembly = applyPlacement('component-gpu-pcie', 'motherboard-pcie-x16', assembly);

    for (const bp of BENCH_CONNECTION_BLUEPRINTS) {
      const res = evaluatePortConnection(bp.sourcePortId, bp.targetPortId, assembly, []);
      expect(res.valid, res.reason).toBe(true);
      assertCompleteDossier(buildDossierForConnection(res.connection!));
    }
  });
});
