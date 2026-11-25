import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { TECHBENCH_MOTHERBOARD_ID } from '../domain/catalog/motherboard.catalog';
import { WorkbenchFacade } from './workbench.facade';

describe('WorkbenchFacade', () => {
  let facade: WorkbenchFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    facade = TestBed.inject(WorkbenchFacade);
  });

  it('inicializa com a placa-mãe PCWare IPM41-D3 selecionada por padrão', () => {
    expect(facade.selectedTargetId()).toBe(TECHBENCH_MOTHERBOARD_ID);
    expect(facade.selectedObject()?.name).toContain('PCWare IPM41-D3');
  });

  it('atualiza seleção a partir da cena 3D e abre aba de Informações', () => {
    facade.setActiveTab('components');
    facade.selectFromScene('motherboard-atx-24pin');

    expect(facade.selectedTargetId()).toBe('motherboard-atx-24pin');
    expect(facade.selectedObject()?.name).toBe('ATX 24 pinos');
    expect(facade.selectedObject()?.type).toBe('power-connector');
    expect(facade.activeTab()).toBe('info');
  });

  it('dispara comando de foco de câmera ao selecionar a partir do painel Angular', () => {
    expect(facade.cameraFocusCommand()).toBeNull();

    facade.selectFromPanel('motherboard-cpu-power');
    const cmd1 = facade.cameraFocusCommand();
    expect(cmd1?.targetId).toBe('motherboard-cpu-power');
    expect(cmd1?.sequence).toBe(1);

    facade.selectFromPanel('motherboard-cpu-power');
    expect(facade.cameraFocusCommand()?.sequence).toBe(2);
  });

  it('seleciona componentes da bancada (Sprint 3) e alterna filtro do catálogo', () => {
    facade.selectFromPanel('component-ram-ddr3');
    const selected = facade.selectedObject();
    expect(selected?.entityKind).toBe('bench-component');
    expect(selected?.id).toBe('component-ram-ddr3');
    expect(facade.activeTab()).toBe('info');

    facade.setCatalogFilter('motherboard-regions');
    expect(facade.catalogFilter()).toBe('motherboard-regions');
  });

  it('instala, recusa incompatibilidades, remove e reseta montagem (Sprint 4)', () => {
    const rejected = facade.attemptInstall('component-ram-ddr3', 'motherboard-pcie-x16');
    expect(rejected.status).toBe('INCOMPATIBLE');
    expect(facade.isComponentInstalled('component-ram-ddr3')).toBe(false);
    expect(facade.lastNotification()?.kind).toBe('error');

    const accepted = facade.attemptInstall('component-ram-ddr3', 'motherboard-dimm-1');
    expect(accepted.status).toBe('COMPATIBLE');
    expect(facade.isComponentInstalled('component-ram-ddr3')).toBe(true);
    expect(facade.installedCount()).toBe(1);

    expect(facade.attemptRemove('component-ram-ddr3')).toBe(true);
    expect(facade.installedCount()).toBe(0);

    facade.attemptInstall('component-cpu-lga775', 'motherboard-cpu-socket');
    facade.resetAssembly();
    expect(facade.installedCount()).toBe(0);
  });

  it('gerencia conexões como entidades (conectar, selecionar, desconectar e validar erro)', () => {
    const ok = facade.connectPorts('psu-out-atx24', 'mb-in-atx24');
    expect(ok.valid).toBe(true);
    expect(facade.connections().length).toBe(1);
    expect(facade.coreConnectionsCompletedCount()).toBe(1);

    facade.selectConnection('conn-atx-24p');
    expect(facade.selectedConnection()?.id).toBe('conn-atx-24p');
    expect(facade.activeTab()).toBe('info');

    const bad = facade.connectPorts('psu-out-pcie6', 'mb-in-cpu4');
    expect(bad.valid).toBe(false);
    expect(facade.lastNotification()?.kind).toBe('error');

    facade.disconnectCable('conn-atx-24p');
    expect(facade.connections().length).toBe(0);
    expect(facade.selectedConnection()).toBeNull();
  });

  it('ativa modo visualização elétrica e alterna linhas de tensão (Sprint 6)', () => {
    expect(facade.electricalModeActive()).toBe(false);
    expect(facade.selectedVoltageRail()).toBe('+12V');

    facade.selectVoltageRail('+5V');
    expect(facade.electricalModeActive()).toBe(true);
    expect(facade.selectedVoltageRail()).toBe('+5V');
    expect(facade.electricalAnalysis().rail.id).toBe('+5V');

    facade.toggleElectricalMode();
    expect(facade.electricalModeActive()).toBe(false);
  });

  it('gera dossiê educacional unificado para peça, região da placa-mãe e conexão (Sprint 7)', () => {
    facade.selectFromPanel('component-ram-ddr3');
    expect(facade.selectedDossier()?.entityType).toBe('bench-component');
    expect(facade.selectedDossier()?.whatIsIt.length).toBeGreaterThan(10);

    facade.selectFromScene('motherboard-atx-24pin');
    expect(facade.selectedDossier()?.entityType).toBe('motherboard-region');
    expect(facade.selectedDossier()?.howItWorks.length).toBeGreaterThan(10);

    facade.connectPorts('psu-out-atx24', 'mb-in-atx24');
    facade.selectConnection('conn-atx-24p');
    expect(facade.selectedDossier()?.entityType).toBe('cable-connection');
    expect(facade.selectedDossier()?.whatHappensIfWrong.length).toBeGreaterThan(10);
  });

  it('acompanha a Missão Monte o Computador até concluir 9/9 (Sprint 8)', () => {
    expect(facade.missionReport().completedCount).toBe(0);
    expect(facade.missionReport().isCompleted).toBe(false);

    facade.attemptInstall('component-cpu-lga775', 'motherboard-cpu-socket');
    expect(facade.lastNotification()?.title).toBe('✓ CPU instalada');

    facade.attemptInstall('component-thermal-paste', 'motherboard-cpu-socket');
    facade.attemptInstall('component-cooler-lga775', 'motherboard-cpu-socket');
    expect(facade.lastNotification()?.title).toBe('✓ Cooler instalado');

    facade.attemptInstall('component-ram-ddr3', 'motherboard-dimm-1');
    expect(facade.lastNotification()?.title).toBe('✓ Memória instalada');

    facade.attemptInstall('component-gpu-pcie', 'motherboard-pcie-x16');
    facade.connectPorts('psu-out-atx24', 'mb-in-atx24');
    expect(facade.lastNotification()?.title).toBe('✓ ATX conectado');

    facade.connectPorts('psu-out-cpu4', 'mb-in-cpu4');
    facade.connectPorts('psu-out-ssd-power', 'ssd-in-power');
    facade.connectPorts('ssd-port-sata', 'mb-port-sata-2');
    facade.connectPorts('psu-out-sata-power', 'hdd-in-sata-power');
    facade.connectPorts('hdd-port-sata-data', 'mb-port-sata-data');

    expect(facade.missionReport().completedCount).toBe(10);
    expect(facade.missionReport().isCompleted).toBe(true);
    expect(facade.lastNotification()?.title).toBe('✓ Montagem concluída!');
  });

  it('carrega caso de diagnóstico com defeito oculto, investiga e resolve no POST (Sprint 9)', () => {
    facade.loadDiagnosticCase('case-no-video-cpu4p');
    expect(facade.activeDiagnosticCaseId()).toBe('case-no-video-cpu4p');
    expect(facade.lastPostReport()?.passed).toBe(false);
    expect(facade.diagnosticCaseSolved()).toBe(false);

    facade.inspectArea('power');
    expect(facade.inspectionLogs().length).toBe(1);
    expect(facade.inspectionLogs()[0].status).toBe('critical');

    // Usuário corrige o defeito conectando CPU 4P e testa o POST
    facade.connectPorts('psu-out-cpu4', 'mb-in-cpu4');
    const post = facade.runPowerPostTest();
    expect(post.passed).toBe(true);
    expect(facade.diagnosticCaseSolved()).toBe(true);
  });

  it('registra erros, dicas, XP, histórico e habilita certificado interno (Sprint 10)', () => {
    facade.clearGamificationHistory();

    // Gera 1 erro proposital antes de completar a montagem
    facade.attemptInstall('component-ram-ddr3', 'motherboard-pcie-x16');
    expect(facade.sessionErrorsCount()).toBe(1);

    // Completa a montagem
    facade.attemptInstall('component-cpu-lga775', 'motherboard-cpu-socket');
    facade.attemptInstall('component-thermal-paste', 'motherboard-cpu-socket');
    facade.attemptInstall('component-cooler-lga775', 'motherboard-cpu-socket');
    facade.attemptInstall('component-ram-ddr3', 'motherboard-dimm-1');
    facade.attemptInstall('component-gpu-pcie', 'motherboard-pcie-x16');
    facade.connectPorts('psu-out-atx24', 'mb-in-atx24');
    facade.connectPorts('psu-out-cpu4', 'mb-in-cpu4');
    facade.connectPorts('psu-out-ssd-power', 'ssd-in-power');
    facade.connectPorts('ssd-port-sata', 'mb-port-sata-2');
    facade.connectPorts('psu-out-sata-power', 'hdd-in-sata-power');
    facade.connectPorts('hdd-port-sata-data', 'mb-port-sata-data');

    expect(facade.latestEvaluation()?.errorsCount).toBe(1);
    expect(facade.totalXp()).toBeGreaterThan(0);
    expect(facade.evaluationHistory().length).toBe(1);
    expect(facade.certificateEligible()).toBe(false);

    // Resolve 1 caso de diagnóstico com 1 dica -> habilita certificado!
    facade.loadDiagnosticCase('case-no-video-cpu4p');
    facade.revealDiagnosticHint();
    expect(facade.sessionHintsUsedCount()).toBe(1);
    facade.connectPorts('psu-out-cpu4', 'mb-in-cpu4');
    facade.runPowerPostTest();

    expect(facade.evaluationHistory().length).toBe(2);
    expect(facade.certificateEligible()).toBe(true);
  });

  it('alterna entre equipamentos (Dell 3070, Servidor 1U, Notebook) e cria equipamento personalizado (Sprint 11)', () => {
    facade.selectEquipment('equip-dell-optiplex-3070');
    expect(facade.activeEquipment().id).toBe('equip-dell-optiplex-3070');
    expect(facade.motherboardRegions().some((r) => r.id === 'dell-power-6pin')).toBe(true);

    facade.selectEquipment('equip-server-rack-1u');
    expect(facade.activeEquipment().id).toBe('equip-server-rack-1u');
    expect(facade.motherboardRegions().some((r) => r.id === 'srv-redundant-psu')).toBe(true);

    facade.applyCustomEquipment({
      name: 'Meu Lab AM5',
      formFactor: 'Micro-ATX',
      socket: 'AM5',
      ramGeneration: 'DDR5',
      dimmSlots: 4,
      storageType: 'M.2 NVMe',
      pcbColorHex: '#133b6e',
    });
    expect(facade.activeEquipment().category).toBe('custom');
    expect(facade.activeEquipment().name).toBe('Meu Lab AM5');
    expect(facade.selectedDossier()?.title).toContain('Meu Lab AM5');
  });

  it('alterna anchors, wireframe e presets de câmera corretamente', () => {
    expect(facade.showAnchors()).toBe(false);
    facade.toggleAnchors();
    expect(facade.showAnchors()).toBe(true);

    expect(facade.wireframeMode()).toBe(false);
    facade.toggleWireframe();
    expect(facade.wireframeMode()).toBe(true);

    facade.requestCameraPreset('top');
    expect(facade.cameraPresetCommand().preset).toBe('top');
    expect(facade.cameraPresetCommand().sequence).toBe(1);
  });
});
