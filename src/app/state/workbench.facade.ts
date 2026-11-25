import { Injectable, computed, inject, signal } from '@angular/core';
import {
  AssemblyNotification,
  AssemblyState,
  CompatibilityEvaluation,
  DragFeedbackState,
  INITIAL_ASSEMBLY_STATE,
} from '../domain/assembly/assembly.models';
import {
  applyPlacement,
  applyRemoval,
  evaluatePlacement,
  evaluateRemoval,
} from '../domain/assembly/compatibility.engine';
import { TECHBENCH_COMPONENTS, findBenchComponentById } from '../domain/catalog/bench-components.catalog';
import {
  TECHBENCH_INSPECTABLE_OBJECTS,
  TECHBENCH_MOTHERBOARD_ID,
} from '../domain/catalog/motherboard.catalog';
import { ALL_WORKBENCH_ITEMS, findWorkbenchItemById } from '../domain/catalog/workbench.catalog';
import {
  BENCH_CONNECTION_BLUEPRINTS,
  BENCH_HARDWARE_PORTS,
  evaluatePortConnection,
  findPortById,
} from '../domain/connections/connection.engine';
import {
  BENCH_CONNECTOR_AUDIT,
  getUnusedAllowedConnectors,
} from '../domain/connections/connector-audit.catalog';
import {
  PSU_CONNECTOR_SPECS,
  PsuConnectorSpec,
} from '../domain/connections/psu-connectors.catalog';
import {
  CableConnectionEntity,
  ConnectionBlueprint,
  ConnectionValidationResult,
  ConnectorAuditEntry,
  HardwarePortDefinition,
} from '../domain/connections/connection.models';
import {
  DIAGNOSTIC_CASES,
  evaluateSystemPost,
  findDiagnosticCaseById,
  inspectWorkbenchArea,
} from '../domain/diagnostics/diagnostics.engine';
import {
  DiagnosticCaseDefinition,
  InspectionLogEntry,
  InvestigationArea,
  PostTestReport,
} from '../domain/diagnostics/diagnostics.models';
import {
  buildDossierForComponent,
  buildDossierForConnection,
  buildDossierForRegion,
} from '../domain/education/technical-info.adapter';
import { TechnicalDossier } from '../domain/education/technical-info.models';
import {
  VOLTAGE_RAILS,
  evaluateElectricalOverlay,
} from '../domain/electrical/electrical.engine';
import {
  ElectricalOverlayAnalysis,
  VoltageRailDefinition,
  VoltageRailId,
} from '../domain/electrical/electrical.models';
import {
  BUILTIN_EQUIPMENTS,
  createCustomEquipmentProfile,
  findBuiltinEquipmentById,
} from '../domain/equipment/equipment.registry';
import {
  CustomEquipmentConfig,
  EquipmentProfile,
} from '../domain/equipment/equipment.models';
import { evaluateAssemblyMission } from '../domain/mission/assembly-mission.engine';
import { AssemblyMissionReport } from '../domain/mission/assembly-mission.models';
import {
  BenchComponentObject,
  InspectableHardwareObject,
  SelectableWorkbenchItem,
} from '../domain/models/hardware.models';
import { RankingSortMode } from '../domain/gamification/gamification.models';
import { GamificationStateService } from './gamification.state';
import { PostBuzzerService } from './post-buzzer.service';

export type CameraPreset = 'overview' | 'top' | 'front' | 'isometric' | 'parts';
export type WorkbenchTab = 'components' | 'connections' | 'electrical' | 'diagnostics' | 'info';
export type CatalogFilter = 'bench-components' | 'motherboard-regions' | 'all';

export interface EngineTelemetry {
  readonly fps: number;
  readonly drawCalls: number;
  readonly triangles: number;
}

export interface CameraFocusCommand {
  readonly targetId: string;
  readonly sequence: number;
}

export interface CameraPresetCommand {
  readonly preset: CameraPreset;
  readonly sequence: number;
}

export interface PowerSafetyAlert {
  readonly actionLabel: string;
  readonly headline: string;
  readonly technicalRisk: string;
  readonly timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class WorkbenchFacade {
  private focusSeq = 0;
  private presetSeq = 0;

  // Arquitetura Multi-Equipamentos (Sprint 11)
  readonly builtinEquipments = signal<readonly EquipmentProfile[]>(BUILTIN_EQUIPMENTS);
  readonly activeEquipment = signal<EquipmentProfile>(BUILTIN_EQUIPMENTS[0]);
  readonly equipmentModalOpen = signal<boolean>(false);

  readonly benchComponents = computed<readonly BenchComponentObject[]>(
    () => this.activeEquipment().components
  );
  readonly motherboardRegions = computed<readonly InspectableHardwareObject[]>(
    () => this.activeEquipment().regions
  );
  readonly allItems = computed<readonly SelectableWorkbenchItem[]>(() => [
    ...this.benchComponents(),
    ...this.motherboardRegions(),
  ]);
  readonly connectionBlueprints = signal<readonly ConnectionBlueprint[]>(BENCH_CONNECTION_BLUEPRINTS);
  readonly hardwarePorts = signal<readonly HardwarePortDefinition[]>(BENCH_HARDWARE_PORTS);
  readonly connectorAudit = signal<readonly ConnectorAuditEntry[]>(BENCH_CONNECTOR_AUDIT);
  readonly unusedAllowedConnectors = signal<readonly ConnectorAuditEntry[]>(
    getUnusedAllowedConnectors()
  );
  readonly psuConnectorSpecs = signal<readonly PsuConnectorSpec[]>(PSU_CONNECTOR_SPECS);
  readonly voltageRails = signal<readonly VoltageRailDefinition[]>(VOLTAGE_RAILS);
  readonly diagnosticCases = signal<readonly DiagnosticCaseDefinition[]>(DIAGNOSTIC_CASES);

  // Estado do Modo Visualização Elétrica (Sprint 6)
  readonly electricalModeActive = signal<boolean>(false);
  readonly selectedVoltageRail = signal<VoltageRailId>('+12V');

  // Estado do Laboratório de Diagnóstico / Troubleshooting (Sprint 9)
  private logSeq = 0;
  private thermalTimers: ReturnType<typeof setTimeout>[] = [];
  readonly isPoweredOn = signal<boolean>(false);
  readonly powerSafetyAlert = signal<PowerSafetyAlert | null>(null);
  readonly activeDiagnosticCaseId = signal<string | null>(null);
  readonly lastPostReport = signal<PostTestReport | null>(null);
  readonly inspectionLogs = signal<readonly InspectionLogEntry[]>([]);
  readonly hintRevealed = signal<boolean>(false);
  readonly diagnosticCaseSolved = signal<boolean>(false);

  // Estado de Gamificação delegado ao GamificationStateService (Etapa 5)
  private readonly gamification = inject(GamificationStateService);
  private readonly buzzer = inject(PostBuzzerService);
  readonly buzzerMuted = this.buzzer.muted;
  readonly buzzerBeeping = this.buzzer.isBeeping;
  readonly buzzerPatternLabel = this.buzzer.activePatternLabel;
  readonly sessionErrorsCount = this.gamification.sessionErrorsCount;
  readonly sessionHintsUsedCount = this.gamification.sessionHintsUsedCount;
  readonly playerName = this.gamification.playerName;
  readonly welcomeModalOpen = this.gamification.welcomeModalOpen;
  readonly savedProfiles = this.gamification.savedProfiles;
  readonly rankingSortMode = this.gamification.rankingSortMode;
  readonly totalXp = this.gamification.totalXp;
  readonly evaluationHistory = this.gamification.evaluationHistory;
  readonly latestEvaluation = this.gamification.latestEvaluation;
  readonly evaluationModalOpen = this.gamification.evaluationModalOpen;
  readonly technicianLevel = this.gamification.technicianLevel;
  readonly challenges = this.gamification.challenges;
  readonly ranking = this.gamification.ranking;
  readonly certificateEligible = this.gamification.certificateEligible;
  readonly masteredDomains = this.gamification.masteredDomains;

  readonly catalogFilter = signal<CatalogFilter>('bench-components');
  readonly selectedTargetId = signal<string | null>(TECHBENCH_MOTHERBOARD_ID);
  readonly selectedConnectionId = signal<string | null>(null);
  readonly hoveredTargetId = signal<string | null>(null);
  readonly activeTab = signal<WorkbenchTab>('components');
  readonly showAnchors = signal<boolean>(false);
  readonly wireframeMode = signal<boolean>(false);
  readonly telemetry = signal<EngineTelemetry>({
    fps: 0,
    drawCalls: 0,
    triangles: 0,
  });

  // Estado de montagem (Sprint 4)
  readonly assemblyState = signal<AssemblyState>(INITIAL_ASSEMBLY_STATE);
  readonly dragFeedback = signal<DragFeedbackState | null>(null);
  readonly lastNotification = signal<AssemblyNotification | null>(null);

  // Estado de conexões / cabos (Sprint 5)
  readonly connections = signal<readonly CableConnectionEntity[]>([]);
  readonly pendingSourcePortId = signal<string | null>(null);

  readonly cameraFocusCommand = signal<CameraFocusCommand | null>(null);
  readonly cameraPresetCommand = signal<CameraPresetCommand>({
    preset: 'overview',
    sequence: 0,
  });

  readonly selectedObject = computed<SelectableWorkbenchItem | null>(() => {
    const id = this.selectedTargetId();
    if (!id) return null;
    return this.allItems().find((item) => item.id === id) ?? findWorkbenchItemById(id);
  });
  readonly hoveredObject = computed<SelectableWorkbenchItem | null>(() => {
    const id = this.hoveredTargetId();
    if (!id) return null;
    return this.allItems().find((item) => item.id === id) ?? findWorkbenchItemById(id);
  });

  readonly selectedConnection = computed(
    () => this.connections().find((c) => c.id === this.selectedConnectionId()) ?? null
  );

  readonly selectedDossier = computed<TechnicalDossier | null>(() => {
    const conn = this.selectedConnection();
    if (conn) {
      return buildDossierForConnection(conn);
    }
    const obj = this.selectedObject();
    if (!obj) {
      return null;
    }
    return obj.entityKind === 'bench-component'
      ? buildDossierForComponent(obj)
      : buildDossierForRegion(obj);
  });

  readonly pendingSourcePort = computed(() => findPortById(this.pendingSourcePortId()));

  readonly isCableModeActive = computed(() => this.activeTab() === 'connections');

  readonly installedCount = computed(() => {
    const state = this.assemblyState();
    return Object.keys(state.installed).length + (state.thermalPasteApplied ? 1 : 0);
  });

  readonly coreConnectionsCompletedCount = computed(
    () => this.connections().filter((c) => c.requiredForBoot).length
  );

  readonly electricalAnalysis = computed<ElectricalOverlayAnalysis>(() =>
    evaluateElectricalOverlay(
      this.selectedVoltageRail(),
      this.assemblyState(),
      this.connections()
    )
  );

  readonly missionReport = computed<AssemblyMissionReport>(() =>
    evaluateAssemblyMission(this.assemblyState(), this.connections())
  );

  readonly activeDiagnosticCase = computed(() =>
    findDiagnosticCaseById(this.activeDiagnosticCaseId())
  );

  selectFromScene(targetId: string | null): void {
    if (targetId && this.connections().some((c) => c.id === targetId)) {
      this.selectConnection(targetId);
      return;
    }
    this.selectedConnectionId.set(null);
    this.selectedTargetId.set(targetId);
    if (!targetId) {
      return;
    }

    // Ao clicar na Fonte ATX na bancada completa, abre a aba Conexões mostrando seus cabos e portas 3D
    if (targetId === 'component-psu-atx' && this.activeEquipment().supportsFullAssembly) {
      this.activeTab.set('connections');
      this.lastNotification.set({
        kind: 'success',
        title: 'Fonte ATX 500W selecionada — Portas sinalizadas em 3D!',
        message: 'Clique em uma porta da Fonte (Origem) e depois na porta verde destacada na Placa-Mãe, SSD ou HD para conectar manualmente.',
        timestamp: Date.now(),
      });
      return;
    }

    // Se o usuário já está em Conexões operando cabos, não tira o foco da aba ao clicar em conectores
    if (
      this.activeTab() === 'connections' &&
      (targetId === 'motherboard-atx-24pin' ||
        targetId === 'motherboard-cpu-power' ||
        targetId === 'motherboard-sata' ||
        targetId === 'component-hdd-samsung' ||
        targetId === 'component-ssd-sata')
    ) {
      return;
    }

    this.activeTab.set('info');
  }

  selectFromPanel(targetId: string): void {
    this.selectedConnectionId.set(null);
    this.selectedTargetId.set(targetId);
    this.activeTab.set('info');
    this.focusSeq += 1;
    this.cameraFocusCommand.set({ targetId, sequence: this.focusSeq });
  }

  selectConnection(connectionId: string): void {
    this.selectedTargetId.set(null);
    this.selectedConnectionId.set(connectionId);
    this.activeTab.set('info');
  }

  setHoveredFromScene(targetId: string | null): void {
    if (this.hoveredTargetId() !== targetId) {
      this.hoveredTargetId.set(targetId);
    }
  }

  setActiveTab(tab: WorkbenchTab): void {
    this.activeTab.set(tab);
    if (tab !== 'connections') {
      this.pendingSourcePortId.set(null);
    }
  }

  setCatalogFilter(filter: CatalogFilter): void {
    this.catalogFilter.set(filter);
  }

  requestCameraPreset(preset: CameraPreset): void {
    this.presetSeq += 1;
    this.cameraPresetCommand.set({ preset, sequence: this.presetSeq });
  }

  toggleAnchors(): void {
    this.showAnchors.update((current) => !current);
  }

  toggleWireframe(): void {
    this.wireframeMode.update((current) => !current);
  }

  toggleElectricalMode(): void {
    const next = !this.electricalModeActive();
    this.electricalModeActive.set(next);
    if (next) {
      this.activeTab.set('electrical');
    }
  }

  selectVoltageRail(railId: VoltageRailId): void {
    this.selectedVoltageRail.set(railId);
    if (!this.electricalModeActive()) {
      this.electricalModeActive.set(true);
    }
  }

  updateTelemetry(metrics: EngineTelemetry): void {
    this.telemetry.set(metrics);
  }

  // =========================================================================
  // Montagem & Compatibilidade (Sprint 4)
  // =========================================================================

  evaluateComponentPlacement(componentId: string, slotId: string): CompatibilityEvaluation {
    return evaluatePlacement(componentId, slotId, this.assemblyState());
  }

  setDragFeedback(feedback: DragFeedbackState | null): void {
    this.dragFeedback.set(feedback);
  }

  attemptInstall(componentId: string, slotId: string): CompatibilityEvaluation {
    if (this.isPoweredOn()) {
      const comp = findBenchComponentById(componentId);
      this.triggerPoweredSafetyBlock(`instalar ${comp?.shortLabel ?? 'um componente'}`);
      return {
        status: 'INCOMPATIBLE',
        code: 'POWER_ON_SAFETY_BLOCK',
        title: 'PERIGO: Bancada energizada!',
        reason: 'Desligue o computador (Power OFF) antes de instalar componentes.',
        componentId,
        targetSlotId: slotId,
      };
    }

    const evaluation = evaluatePlacement(componentId, slotId, this.assemblyState());

    if (evaluation.status === 'INCOMPATIBLE') {
      this.gamification.recordError();
      this.lastNotification.set({
        kind: 'error',
        title: evaluation.title,
        message: evaluation.reason,
        timestamp: Date.now(),
      });
      return evaluation;
    }

    // Se o usuário arrastou um cabo físico da manta ESD até a porta, ativa a conexão real!
    if (componentId === 'component-cable-sata' && slotId === 'motherboard-sata') {
      this.connectPorts('hdd-port-sata-data', 'mb-port-sata-data');
      return evaluation;
    }
    if (componentId === 'component-cable-sata-ssd' && slotId === 'motherboard-sata') {
      this.connectPorts('ssd-port-sata', 'mb-port-sata-2');
      return evaluation;
    }
    if (componentId === 'component-cable-power' && slotId === 'motherboard-atx-24pin') {
      this.connectPorts('psu-out-atx24', 'mb-in-atx24');
      return evaluation;
    }
    if (componentId === 'component-cable-power' && slotId === 'motherboard-cpu-power') {
      this.connectPorts('psu-out-cpu4', 'mb-in-cpu4');
      return evaluation;
    }

    const prevReport = this.missionReport();
    const nextState = applyPlacement(componentId, slotId, this.assemblyState());
    this.assemblyState.set(nextState);
    this.lastPostReport.set(null);
    this.selectedConnectionId.set(null);
    this.selectedTargetId.set(componentId);

    const nextReport = this.missionReport();
    const newlyCompleted = nextReport.steps.find(
      (step, idx) => step.completed && !prevReport.steps[idx]?.completed
    );

    if (nextReport.isCompleted && !prevReport.isCompleted && !this.activeDiagnosticCaseId()) {
      this.recordCompletedSession(
        'Missão: Monte o computador',
        'ASSEMBLY_MISSION',
        ['CPU', 'RAM', 'Cooler', 'GPU', 'ATX', 'SATA']
      );
      this.lastNotification.set({
        kind: 'success',
        title: '✓ Montagem concluída!',
        message: 'Todos os 9 itens da missão foram completados na PCWare IPM41-D3.',
        timestamp: Date.now(),
      });
    } else {
      this.lastNotification.set({
        kind: evaluation.status === 'COMPATIBLE_WITH_WARNING' ? 'warning' : 'success',
        title: newlyCompleted?.completedMessage ?? evaluation.title,
        message: evaluation.reason,
        timestamp: Date.now(),
      });
    }

    return evaluation;
  }

  attemptRemove(componentId: string): boolean {
    if (!this.assemblyState().installed[componentId]) {
      return false;
    }

    if (this.isPoweredOn()) {
      const comp = findBenchComponentById(componentId);
      this.triggerPoweredSafetyBlock(`remover ${comp?.shortLabel ?? 'um componente'}`);
      return false;
    }

    const check = evaluateRemoval(componentId, this.assemblyState());
    const comp = findBenchComponentById(componentId);

    if (!check.allowed) {
      this.lastNotification.set({
        kind: 'error',
        title: 'Remoção bloqueada',
        message: check.reason,
        timestamp: Date.now(),
      });
      return false;
    }

    // Desconecta automaticamente cabos ligados ao componente removido (ex.: GPU ou Cooler)
    this.connections.update((list) =>
      list.filter((c) => c.source.deviceId !== componentId && c.target.deviceId !== componentId)
    );

    this.assemblyState.set(applyRemoval(componentId, this.assemblyState()));
    this.lastPostReport.set(null);
    this.lastNotification.set({
      kind: 'success',
      title: `${comp?.shortLabel ?? 'Componente'} removido`,
      message: 'Peça devolvida à manta antiestática da bancada.',
      timestamp: Date.now(),
    });
    return true;
  }

  isComponentInstalled(componentId: string): boolean {
    const state = this.assemblyState();
    if (componentId === 'component-thermal-paste') {
      return state.thermalPasteApplied;
    }
    return Boolean(state.installed[componentId]);
  }

  getInstalledSlotId(componentId: string): string | null {
    return this.assemblyState().installed[componentId] ?? null;
  }

  // =========================================================================
  // Conexões & Cabos (Sprint 5)
  // =========================================================================

  handlePortClick(portId: string): void {
    if (this.isPoweredOn()) {
      this.triggerPoweredSafetyBlock('manipular cabos na bancada');
      return;
    }

    const currentSource = this.pendingSourcePortId();
    if (!currentSource) {
      this.pendingSourcePortId.set(portId);
      const port = findPortById(portId);
      this.lastNotification.set({
        kind: 'success',
        title: `Origem selecionada: ${port?.shortLabel ?? portId}`,
        message: 'Agora clique na porta de destino para validar e conectar o cabo.',
        timestamp: Date.now(),
      });
      return;
    }

    if (currentSource === portId) {
      this.pendingSourcePortId.set(null);
      return;
    }

    this.connectPorts(currentSource, portId);
    this.pendingSourcePortId.set(null);
  }

  connectPorts(portAId: string, portBId: string): ConnectionValidationResult {
    if (this.isPoweredOn()) {
      this.triggerPoweredSafetyBlock('conectar um cabo');
      return {
        valid: false,
        code: 'POWER_ON_SAFETY_BLOCK',
        title: 'PERIGO: Bancada energizada!',
        reason: 'Desligue o computador (Power OFF) antes de conectar cabos internos.',
      };
    }

    const result = evaluatePortConnection(
      portAId,
      portBId,
      this.assemblyState(),
      this.connections()
    );

    if (!result.valid || !result.connection) {
      this.gamification.recordError();
      this.lastNotification.set({
        kind: 'error',
        title: result.title,
        message: result.reason,
        timestamp: Date.now(),
      });
      return result;
    }

    const prevReport = this.missionReport();
    this.connections.update((list) => [...list, result.connection!]);
    this.lastPostReport.set(null);
    const nextReport = this.missionReport();
    const newlyCompleted = nextReport.steps.find(
      (step, idx) => step.completed && !prevReport.steps[idx]?.completed
    );

    if (nextReport.isCompleted && !prevReport.isCompleted && !this.activeDiagnosticCaseId()) {
      this.recordCompletedSession(
        'Missão: Monte o computador',
        'ASSEMBLY_MISSION',
        ['CPU', 'RAM', 'Cooler', 'GPU', 'ATX', 'SATA']
      );
      this.lastNotification.set({
        kind: 'success',
        title: '✓ Montagem concluída!',
        message: 'Todos os 9 itens da missão foram completados na PCWare IPM41-D3.',
        timestamp: Date.now(),
      });
    } else {
      this.lastNotification.set({
        kind: 'success',
        title: newlyCompleted?.completedMessage ?? result.title,
        message: result.reason,
        timestamp: Date.now(),
      });
    }
    return result;
  }

  disconnectCable(connectionId: string): void {
    const existing = this.connections().find((c) => c.id === connectionId);
    if (!existing) {
      return;
    }
    if (this.isPoweredOn()) {
      this.triggerPoweredSafetyBlock(`desconectar o cabo ${existing.name}`);
      return;
    }
    this.connections.update((list) => list.filter((c) => c.id !== connectionId));
    this.lastPostReport.set(null);
    if (this.selectedConnectionId() === connectionId) {
      this.selectedConnectionId.set(null);
    }
    this.lastNotification.set({
      kind: 'warning',
      title: `Desconectado: ${existing.name}`,
      message: 'Cabo removido das portas de origem e destino.',
      timestamp: Date.now(),
    });
  }

  isBlueprintConnected(blueprintId: string): boolean {
    return this.connections().some((c) => c.id === blueprintId);
  }

  // =========================================================================
  // Laboratório de Diagnóstico & POST (Sprint 9)
  // =========================================================================

  loadDiagnosticCase(caseId: string): void {
    const scenario = findDiagnosticCaseById(caseId);
    if (!scenario) {
      return;
    }

    this.assemblyState.set({
      installed: { ...scenario.initialAssembly.installed },
      thermalPasteApplied: scenario.initialAssembly.thermalPasteApplied,
    });

    const builtConnections: CableConnectionEntity[] = [];
    for (const connId of scenario.initialConnectionIds) {
      const bp = BENCH_CONNECTION_BLUEPRINTS.find((b) => b.id === connId);
      if (!bp) continue;
      const res = evaluatePortConnection(
        bp.sourcePortId,
        bp.targetPortId,
        scenario.initialAssembly,
        builtConnections
      );
      if (res.valid && res.connection) {
        builtConnections.push(res.connection);
      }
    }

    this.connections.set(builtConnections);
    this.activeDiagnosticCaseId.set(scenario.id);
    this.hintRevealed.set(false);
    this.diagnosticCaseSolved.set(false);
    this.inspectionLogs.set([]);
    this.pendingSourcePortId.set(null);
    this.activeTab.set('diagnostics');
    this.resetSessionCounters();

    // Executa o primeiro teste de Power para expor o sintoma inicial, mantendo a bancada
    // desligada (segura) para que o aluno possa iniciar o reparo imediatamente.
    const initialPost = evaluateSystemPost(scenario.initialAssembly, builtConnections);
    this.lastPostReport.set(initialPost);
    this.isPoweredOn.set(false);
    this.powerSafetyAlert.set(null);

    this.lastNotification.set({
      kind: 'warning',
      title: scenario.title,
      message: scenario.customerComplaint,
      timestamp: Date.now(),
    });
  }

  togglePower(): void {
    if (this.isPoweredOn()) {
      this.powerOff();
    } else {
      this.runPowerPostTest();
    }
  }

  powerOff(): void {
    this.clearThermalTimers();
    this.buzzer.stop();
    this.isPoweredOn.set(false);
    this.lastPostReport.set(null);
    this.powerSafetyAlert.set(null);
    this.lastNotification.set({
      kind: 'success',
      title: '⏻ Bancada desligada (Power OFF)',
      message: 'Alimentação cortada. Agora é seguro instalar, remover componentes ou desconectar cabos.',
      timestamp: Date.now(),
    });
  }

  toggleBuzzerMute(): void {
    this.buzzer.toggleMute();
  }

  dismissPowerSafetyAlert(): void {
    this.powerSafetyAlert.set(null);
  }

  private triggerPoweredSafetyBlock(actionLabel: string): void {
    this.gamification.recordError();
    this.buzzer.playSafetyAlertBeep();
    const headline = `PERIGO ELÉTRICO: Não é permitido ${actionLabel} com o PC LIGADO!`;
    const technicalRisk =
      'Na prática, desconectar ou encaixar cabos e peças com a fonte energizada pode causar arco elétrico, curto-circuito nas trilhas +12V/+5V/+3.3V, corrupção permanente da placa-mãe/CPU/RAM e risco de choque. Desligue a bancada (Power OFF) antes de qualquer modificação!';
    this.powerSafetyAlert.set({
      actionLabel,
      headline,
      technicalRisk,
      timestamp: Date.now(),
    });
    this.lastNotification.set({
      kind: 'error',
      title: '⚡ Risco de dano ao hardware!',
      message: `Desligue o computador antes de ${actionLabel}.`,
      timestamp: Date.now(),
    });
  }

  runPowerPostTest(): PostTestReport {
    this.clearThermalTimers();
    const report = evaluateSystemPost(this.assemblyState(), this.connections());
    this.lastPostReport.set(report);
    this.powerSafetyAlert.set(null);
    this.buzzer.playPostReport(report);

    const staysPowered =
      report.monitorOutput !== 'NO_POWER' && report.monitorOutput !== 'THERMAL_SHUTDOWN';
    this.isPoweredOn.set(staysPowered);

    if (staysPowered && report.overheatRisk) {
      this.scheduleThermalOverheatRamp(report);
    }

    const activeCase = this.activeDiagnosticCase();
    if (report.passed) {
      if (activeCase && !this.diagnosticCaseSolved()) {
        this.diagnosticCaseSolved.set(true);
        this.recordCompletedSession(activeCase.title, 'DIAGNOSTIC_CASE', [
          'Diagnóstico POST',
          'Troubleshooting em Bancada',
          'PCWare IPM41-D3',
        ]);
      }
      this.lastNotification.set({
        kind: 'success',
        title: activeCase ? '✓ Defeito resolvido! POST OK' : '✓ POST aprovado!',
        message: report.observableSymptom,
        timestamp: Date.now(),
      });
    } else {
      this.lastNotification.set({
        kind: 'error',
        title: `Falha no POST (${report.reachedStage})`,
        message: report.observableSymptom,
        timestamp: Date.now(),
      });
    }
    return report;
  }

  inspectArea(area: InvestigationArea): void {
    const result = inspectWorkbenchArea(area, this.assemblyState(), this.connections());
    this.logSeq += 1;
    const entry: InspectionLogEntry = {
      id: this.logSeq,
      area,
      areaLabel: result.areaLabel,
      reading: result.reading,
      status: result.status,
    };
    this.inspectionLogs.update((logs) => [entry, ...logs.slice(0, 5)]);
  }

  revealDiagnosticHint(): void {
    if (!this.hintRevealed()) {
      this.hintRevealed.set(true);
      this.gamification.recordHintUsed();
    }
  }

  openEvaluationModal(): void {
    this.gamification.openModal();
  }

  closeEvaluationModal(): void {
    this.gamification.closeModal();
  }

  completeOnboarding(name: string): void {
    this.gamification.completeOnboarding(name);
  }

  openWelcomeModal(): void {
    this.gamification.openWelcomeModal();
  }

  closeWelcomeModal(): void {
    this.gamification.closeWelcomeModal();
  }

  setRankingSortMode(mode: RankingSortMode): void {
    this.gamification.setRankingSortMode(mode);
  }

  openEquipmentModal(): void {
    this.equipmentModalOpen.set(true);
  }

  closeEquipmentModal(): void {
    this.equipmentModalOpen.set(false);
  }

  selectEquipment(equipmentId: string): void {
    const profile = findBuiltinEquipmentById(equipmentId);
    if (!profile) {
      return;
    }
    this.activateEquipmentProfile(profile);
  }

  applyCustomEquipment(config: CustomEquipmentConfig): void {
    const profile = createCustomEquipmentProfile(config);
    this.activateEquipmentProfile(profile);
  }

  private activateEquipmentProfile(profile: EquipmentProfile): void {
    this.activeEquipment.set(profile);
    this.assemblyState.set(INITIAL_ASSEMBLY_STATE);
    this.connections.set([]);
    this.pendingSourcePortId.set(null);
    this.selectedConnectionId.set(null);
    this.electricalModeActive.set(false);
    this.exitDiagnosticCase();
    this.resetSessionCounters();

    const firstRegionId = profile.regions[0]?.id ?? null;
    this.selectedTargetId.set(firstRegionId);
    this.catalogFilter.set(profile.supportsFullAssembly ? 'bench-components' : 'motherboard-regions');
    this.activeTab.set('components');

    this.lastNotification.set({
      kind: 'success',
      title: `Equipamento carregado: ${profile.shortName}`,
      message: `${profile.formFactor} · ${profile.architectureTag}`,
      timestamp: Date.now(),
    });
  }

  setPlayerName(name: string): void {
    this.gamification.setPlayerName(name);
  }

  clearGamificationHistory(): void {
    this.gamification.clearHistory();
  }

  exitDiagnosticCase(): void {
    this.clearThermalTimers();
    this.isPoweredOn.set(false);
    this.powerSafetyAlert.set(null);
    this.activeDiagnosticCaseId.set(null);
    this.lastPostReport.set(null);
    this.inspectionLogs.set([]);
    this.hintRevealed.set(false);
    this.diagnosticCaseSolved.set(false);
  }

  resetAssembly(): void {
    this.clearThermalTimers();
    this.isPoweredOn.set(false);
    this.powerSafetyAlert.set(null);
    this.assemblyState.set(INITIAL_ASSEMBLY_STATE);
    this.connections.set([]);
    this.pendingSourcePortId.set(null);
    this.selectedConnectionId.set(null);
    this.dragFeedback.set(null);
    this.exitDiagnosticCase();
    this.resetSessionCounters();
    this.lastNotification.set({
      kind: 'success',
      title: 'Bancada reiniciada',
      message: 'Todos os componentes e cabos foram desconectados e devolvidos à manta ESD.',
      timestamp: Date.now(),
    });
  }

  private clearThermalTimers(): void {
    for (const timer of this.thermalTimers) {
      clearTimeout(timer);
    }
    this.thermalTimers = [];
  }

  /**
   * Simula o comportamento real de um PC ligado sem o cabo CPU_FAN conectado:
   * o computador liga e dá vídeo normalmente, mas a temperatura da CPU sobe
   * progressivamente até ultrapassar 100 °C e acionar o desligamento térmico.
   */
  private scheduleThermalOverheatRamp(initialReport: PostTestReport): void {
    const rampTemps = [74, 89];
    rampTemps.forEach((temp, idx) => {
      const t = setTimeout(() => {
        if (!this.isPoweredOn()) {
          return;
        }
        this.lastPostReport.set({
          ...initialReport,
          cpuTempC: temp,
        });
      }, (idx + 1) * 1500);
      this.thermalTimers.push(t);
    });

    const shutdownTimer = setTimeout(() => {
      if (!this.isPoweredOn()) {
        return;
      }
      const shutdownReport: PostTestReport = {
        passed: false,
        reachedStage: 'CPU_INIT',
        monitorOutput: 'THERMAL_SHUTDOWN',
        fansSpinning: false,
        beepDescription: 'Alarme térmico (4 bips rápidos · T > 100 °C)',
        observableSymptom:
          'O PC ligou normalmente, mas como a ventoinha do cooler (CPU_FAN) não estava conectada, a CPU superaqueceu acima de 100 °C e o sistema desligou para evitar danos!',
        stageStatuses: [
          { stage: 'PSU', status: 'OK' },
          { stage: 'CPU', status: 'FAIL' },
          { stage: 'DRAM', status: 'OK' },
          { stage: 'VGA', status: 'OK' },
          { stage: 'BOOT', status: 'OK' },
        ],
        cpuTempC: 102,
      };
      this.isPoweredOn.set(false);
      this.lastPostReport.set(shutdownReport);
      this.buzzer.playPostReport(shutdownReport);
      this.lastNotification.set({
        kind: 'error',
        title: '🌡️ Desligamento por superaquecimento (>100 °C)!',
        message: 'Sem o cabo CPU_FAN conectado, o PC liga mas desliga após alguns segundos por falta de resfriamento.',
        timestamp: Date.now(),
      });
    }, 4600);
    this.thermalTimers.push(shutdownTimer);
  }

  private resetSessionCounters(): void {
    this.gamification.resetSessionCounters();
  }

  private recordCompletedSession(
    title: string,
    mode: 'ASSEMBLY_MISSION' | 'DIAGNOSTIC_CASE',
    masteredDomains: readonly string[]
  ): void {
    this.gamification.recordCompletedSession(title, mode, masteredDomains);
  }
}
