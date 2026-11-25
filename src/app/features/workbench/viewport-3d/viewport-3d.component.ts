import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { findWorkbenchItemById } from '../../../domain/catalog/workbench.catalog';
import { SceneManager } from '../../../engine/core/scene-manager';
import { GraphicsQualityStateService } from '../../../state/graphics-quality.state';
import { CameraPreset, WorkbenchFacade } from '../../../state/workbench.facade';
import { MissionChecklistComponent } from '../mission-checklist/mission-checklist.component';

@Component({
  selector: 'app-viewport-3d',
  standalone: true,
  imports: [MissionChecklistComponent],
  template: `
    <div class="viewport-shell" #viewportHost>
      <canvas #viewportCanvas class="viewport-canvas"></canvas>

      @if (webglError()) {
        <div class="webgl-fallback">
          <strong>Contexto WebGL indisponível</strong>
          <p>{{ webglError() }}</p>
        </div>
      }

      <!-- HUD Superior Esquerdo: Identificação em tempo real (Hover) -->
      <div class="hud-top-left">
        <div class="hud-pill status-pill">
          <span class="dot"></span>
          <span>{{ facade.activeEquipment().shortName }} · {{ facade.activeEquipment().formFactor }}</span>
        </div>
        @if (facade.buzzerBeeping()) {
          <div class="hud-pill beep-pill" role="status" aria-live="polite">
            <span class="beep-wave">🔊</span>
            <strong>BEEP!</strong>
            <span>{{ facade.buzzerPatternLabel() }}</span>
          </div>
        }
        @if (facade.hoveredObject(); as hovered) {
          <div class="hud-pill hover-pill" [style.border-color]="hovered.accentColor">
            <span class="hover-dot" [style.background]="hovered.accentColor"></span>
            <span class="hover-name">{{ hovered.name }}</span>
            <code class="hover-anchor">{{ hovered.anchorName }}</code>
          </div>
        }
      </div>

      <!-- HUD Superior Direito: Telemetria WebGL + Checklist da Missão -->
      <div class="hud-top-right">
        <div class="hud-pill telemetry-pill" title="Telemetria WebGL em tempo real">
          <span><strong>{{ facade.telemetry().fps }}</strong> FPS</span>
          <span class="sep">·</span>
          <span><strong>{{ facade.telemetry().drawCalls }}</strong> calls</span>
          <span class="sep">·</span>
          <span><strong>{{ facade.telemetry().triangles }}</strong> tris</span>
        </div>
        @if (facade.activeEquipment().supportsFullAssembly) {
          <app-mission-checklist />
        }
      </div>

      <!-- HUD Superior Central: Feedback em tempo real de Drag & Drop / Compatibilidade -->
      @if (facade.dragFeedback(); as drag) {
        <div
          class="drag-banner"
          [class.valid]="drag.evaluation?.status === 'COMPATIBLE'"
          [class.warning]="drag.evaluation?.status === 'COMPATIBLE_WITH_WARNING'"
          [class.invalid]="drag.evaluation?.status === 'INCOMPATIBLE'"
        >
          @if (drag.evaluation; as ev) {
            <span class="drag-icon">
              @if (ev.status === 'COMPATIBLE') { ✓ }
              @else if (ev.status === 'COMPATIBLE_WITH_WARNING') { ⚠ }
              @else { ✗ }
            </span>
            <div class="drag-copy">
              <strong>{{ ev.title }}</strong>
              <span>{{ ev.reason }}</span>
            </div>
          } @else {
            <span class="drag-icon">⇄</span>
            <div class="drag-copy">
              <strong>Arrastando componente</strong>
              <span>Aproxime de um slot ou conector da placa-mãe para testar compatibilidade e encaixar.</span>
            </div>
          }
        </div>
      } @else if (facade.lastNotification(); as toast) {
        <div
          class="toast-banner"
          [class.valid]="toast.kind === 'success'"
          [class.warning]="toast.kind === 'warning'"
          [class.invalid]="toast.kind === 'error'"
        >
          <strong>{{ toast.title }}:</strong>
          <span>{{ toast.message }}</span>
        </div>
      }

      <!-- Alerta Crítico de Segurança Elétrica (Manutenção com PC Ligado) -->
      @if (facade.powerSafetyAlert(); as alert) {
        <div class="safety-backdrop" role="alertdialog" aria-modal="true" aria-label="Alerta de Segurança Elétrica">
          <div class="safety-card">
            <div class="safety-header">
              <span class="safety-icon">⚡⚠️</span>
              <div>
                <span class="safety-badge">RISCO DE CURTO-CIRCUITO / DANO AO HARDWARE</span>
                <h3>{{ alert.headline }}</h3>
              </div>
            </div>
            <p class="safety-body">{{ alert.technicalRisk }}</p>
            <div class="safety-actions">
              <button
                type="button"
                class="safety-poweroff-btn"
                (click)="facade.powerOff()"
              >
                ⏻ Desligar Bancada Agora (Seguro)
              </button>
              <button
                type="button"
                class="safety-dismiss-btn"
                (click)="facade.dismissPowerSafetyAlert()"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      }

      <!-- HUD Inferior Esquerdo: Controles de Câmera e Inspeção 3D -->
      <div class="hud-bottom-left">
        <div class="control-group" role="group" aria-label="Presets de câmera">
          @for (preset of cameraPresets; track preset.id) {
            <button
              type="button"
              class="hud-btn"
              [class.active]="facade.cameraPresetCommand().preset === preset.id"
              (click)="facade.requestCameraPreset(preset.id)"
            >
              {{ preset.label }}
            </button>
          }
        </div>

        <div class="control-group" role="group" aria-label="Visualização técnica">
          <button
            type="button"
            class="hud-btn"
            [class.active]="facade.showAnchors()"
            (click)="facade.toggleAnchors()"
            title="Exibir pontos ANCHOR_* usados para encaixe de peças e cabos"
          >
            Anchors
          </button>
          <button
            type="button"
            class="hud-btn"
            [class.active]="facade.wireframeMode()"
            (click)="facade.toggleWireframe()"
            title="Alternar malha wireframe"
          >
            Wireframe
          </button>
          <button
            type="button"
            class="hud-btn"
            (click)="graphics.cyclePreset()"
            title="Alternar qualidade gráfica 3D (Auto / Baixo / Médio / Alto)"
          >
            GPU: {{ graphics.resolvedSettings().label }}
          </button>
          <button
            type="button"
            class="hud-btn electric-btn"
            [class.active]="facade.electricalModeActive()"
            (click)="facade.toggleElectricalMode()"
            title="Ativar Modo Visualização Elétrica (+12V, +5V, +3.3V, +5VSB, Vcore, 1.5V)"
          >
            ⚡ Elétrico
          </button>
          <button
            type="button"
            class="hud-btn power-hud-btn"
            [class.active]="facade.isPoweredOn()"
            (click)="facade.togglePower()"
            [title]="facade.isPoweredOn() ? 'Desligar a bancada (Power OFF) antes de mexer em peças ou cabos' : 'Ligar a bancada e executar o teste POST'"
          >
            @if (facade.isPoweredOn()) {
              ⏻ Desligar (ON)
            } @else {
              ⏻ Ligar
            }
          </button>
          <button
            type="button"
            class="hud-btn buzzer-btn"
            [class.beeping]="facade.buzzerBeeping()"
            (click)="facade.toggleBuzzerMute()"
            [title]="facade.buzzerMuted() ? 'Ativar som dos bips de POST (Speaker da placa-mãe)' : 'Silenciar bips do Speaker'"
          >
            {{ facade.buzzerMuted() ? '🔇 Mudo' : '🔊 Bips' }}
          </button>
        </div>

        @if (facade.electricalModeActive()) {
          <div class="control-group rail-bar" role="group" aria-label="Selecionar linha de tensão">
            @for (rail of facade.voltageRails(); track rail.id) {
              <button
                type="button"
                class="hud-btn rail-btn"
                [class.active]="facade.selectedVoltageRail() === rail.id"
                [style.--rail-color]="rail.colorHex"
                (click)="facade.selectVoltageRail(rail.id)"
              >
                <span class="rail-dot" [style.background]="rail.colorHex"></span>
                {{ rail.label }}
              </button>
            }
          </div>
        }
      </div>

      <!-- Dica de navegação (Desktop & Touch) -->
      <div class="hud-bottom-right">
        <span class="hint-text">Arrastar / Segurar (touch): encaixar · Fundo: orbitar · Pinça/Scroll: zoom</span>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 0;
    }

    .viewport-shell {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #0b0f17;
    }

    .viewport-canvas {
      display: block;
      width: 100%;
      height: 100%;
      outline: none;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }

    .webgl-fallback {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: #cbd5e1;
      background: #0b0f17;
      padding: 1.5rem;
      text-align: center;
    }

    .hud-top-left,
    .hud-top-right,
    .hud-bottom-left,
    .hud-bottom-right {
      position: absolute;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      pointer-events: none;
      z-index: 5;
    }

    .hud-top-left {
      top: 0.85rem;
      left: 0.85rem;
      flex-direction: column;
      align-items: flex-start;
    }

    .hud-top-right {
      top: 0.85rem;
      right: 0.85rem;
      flex-direction: column;
      align-items: flex-end;
    }

    .hud-bottom-left {
      bottom: 0.85rem;
      left: 0.85rem;
      flex-wrap: wrap;
      pointer-events: auto;
    }

    .hud-bottom-right {
      bottom: 0.85rem;
      right: 0.85rem;
    }

    .hud-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem 0.65rem;
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.82);
      border: 1px solid rgba(148, 163, 184, 0.22);
      backdrop-filter: blur(8px);
      font-size: 0.75rem;
      color: #e2e8f0;
    }

    .status-pill .dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: #22c55e;
      box-shadow: 0 0 8px #22c55e;
    }

    .hover-pill {
      border-width: 1px;
    }

    .hover-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      flex-shrink: 0;
    }

    .hover-name {
      font-weight: 600;
    }

    .hover-anchor {
      font-size: 0.68rem;
      color: #94a3b8;
      background: rgba(15, 23, 42, 0.9);
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
    }

    .telemetry-pill {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.72rem;
      color: #94a3b8;
    }

    .telemetry-pill strong {
      color: #e2e8f0;
    }

    .sep {
      opacity: 0.45;
    }

    .control-group {
      display: inline-flex;
      background: rgba(15, 23, 42, 0.86);
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 6px;
      padding: 0.2rem;
      gap: 0.2rem;
      backdrop-filter: blur(8px);
    }

    .hud-btn {
      appearance: none;
      border: 1px solid transparent;
      background: transparent;
      color: #cbd5e1;
      font-size: 0.74rem;
      font-weight: 500;
      padding: 0.3rem 0.6rem;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }

    .hud-btn:hover {
      background: rgba(56, 189, 248, 0.14);
      color: #f8fafc;
    }

    .hud-btn.active {
      background: rgba(14, 165, 233, 0.25);
      border-color: rgba(56, 189, 248, 0.55);
      color: #38bdf8;
    }

    .electric-btn.active {
      background: rgba(234, 179, 8, 0.24);
      border-color: rgba(234, 179, 8, 0.7);
      color: #fde047;
    }

    .power-hud-btn {
      color: #86efac;
    }

    .power-hud-btn.active {
      background: rgba(34, 197, 94, 0.26);
      border-color: rgba(74, 222, 128, 0.7);
      color: #4ade80;
    }

    .rail-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.71rem;
    }

    .rail-btn.active {
      background: rgba(255, 255, 255, 0.12);
      border-color: var(--rail-color, #eab308);
      color: #f8fafc;
    }

    .rail-dot {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      flex-shrink: 0;
    }

    .hint-text {
      font-size: 0.72rem;
      color: #94a3b8;
      background: rgba(11, 15, 23, 0.72);
      padding: 0.28rem 0.55rem;
      border-radius: 4px;
      border: 1px solid rgba(148, 163, 184, 0.14);
    }

    .drag-banner,
    .toast-banner {
      position: absolute;
      top: 0.85rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10;
      max-width: min(460px, calc(100% - 2rem));
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.5rem 0.85rem;
      border-radius: 8px;
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(56, 189, 248, 0.45);
      backdrop-filter: blur(10px);
      color: #e2e8f0;
      font-size: 0.76rem;
      pointer-events: none;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.45);
    }

    .drag-banner.valid,
    .toast-banner.valid {
      border-color: rgba(34, 197, 94, 0.7);
      background: rgba(6, 78, 59, 0.88);
      color: #dcfce7;
    }

    .drag-banner.warning,
    .toast-banner.warning {
      border-color: rgba(245, 158, 11, 0.75);
      background: rgba(120, 53, 15, 0.9);
      color: #fef3c7;
    }

    .drag-banner.invalid,
    .toast-banner.invalid {
      border-color: rgba(239, 68, 68, 0.75);
      background: rgba(127, 29, 29, 0.9);
      color: #fee2e2;
    }

    .drag-icon {
      font-size: 1.05rem;
      font-weight: 800;
      flex-shrink: 0;
    }

    .drag-copy {
      display: flex;
      flex-direction: column;
      gap: 0.12rem;
      line-height: 1.35;
    }

    .safety-backdrop {
      position: absolute;
      inset: 0;
      z-index: 30;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(15, 4, 4, 0.72);
      backdrop-filter: blur(4px);
    }

    .safety-card {
      width: min(470px, 100%);
      padding: 1.15rem 1.25rem;
      border-radius: 12px;
      border: 2px solid #ef4444;
      background: linear-gradient(160deg, rgba(69, 10, 10, 0.97), rgba(24, 10, 18, 0.98));
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.22), 0 22px 48px rgba(0, 0, 0, 0.7);
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
      color: #fee2e2;
    }

    .safety-header {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .safety-icon {
      font-size: 1.75rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .safety-badge {
      display: inline-block;
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      padding: 0.14rem 0.45rem;
      border-radius: 4px;
      background: rgba(239, 68, 68, 0.28);
      border: 1px solid rgba(248, 113, 113, 0.65);
      color: #fecaca;
      margin-bottom: 0.3rem;
    }

    .safety-header h3 {
      margin: 0;
      font-size: 0.96rem;
      line-height: 1.3;
      color: #ffffff;
    }

    .safety-body {
      margin: 0;
      font-size: 0.8rem;
      line-height: 1.5;
      color: #fecaca;
    }

    .safety-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
      margin-top: 0.15rem;
    }

    .safety-poweroff-btn {
      flex: 1;
      appearance: none;
      padding: 0.62rem 0.9rem;
      border-radius: 8px;
      border: 1px solid rgba(248, 113, 113, 0.85);
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      color: #ffffff;
      font-size: 0.82rem;
      font-weight: 800;
      cursor: pointer;
    }

    .safety-poweroff-btn:hover {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }

    .safety-dismiss-btn {
      appearance: none;
      padding: 0.62rem 0.9rem;
      border-radius: 8px;
      border: 1px solid rgba(148, 163, 184, 0.45);
      background: rgba(30, 41, 59, 0.85);
      color: #e2e8f0;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
    }

    .beep-pill {
      border-color: rgba(250, 204, 21, 0.85) !important;
      background: rgba(113, 63, 18, 0.92) !important;
      color: #fef08a !important;
      box-shadow: 0 0 18px rgba(250, 204, 21, 0.45);
    }

    .buzzer-btn.beeping {
      border-color: #facc15;
      background: rgba(234, 179, 8, 0.35);
      color: #fef08a;
      box-shadow: 0 0 14px rgba(250, 204, 21, 0.55);
    }

    @media (max-width: 768px), (max-height: 540px) and (orientation: landscape) {
      .hud-bottom-right {
        display: none;
      }

      .hud-bottom-left {
        max-width: calc(100% - 142px);
        bottom: max(0.6rem, env(safe-area-inset-bottom));
        left: max(0.6rem, env(safe-area-inset-left));
        gap: 0.35rem;
      }

      .hud-btn {
        font-size: 0.68rem;
        padding: 0.28rem 0.46rem;
      }

      .telemetry-pill {
        display: none;
      }
    }
  `,
})
export class Viewport3DComponent {
  protected readonly facade = inject(WorkbenchFacade);
  protected readonly graphics = inject(GraphicsQualityStateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('viewportCanvas');
  private readonly hostRef = viewChild.required<ElementRef<HTMLDivElement>>('viewportHost');

  protected readonly webglError = signal<string | null>(null);

  protected readonly cameraPresets: readonly { id: CameraPreset; label: string }[] = [
    { id: 'overview', label: 'Geral' },
    { id: 'top', label: 'Topo' },
    { id: 'front', label: 'Frontal' },
    { id: 'isometric', label: 'Iso' },
    { id: 'parts', label: 'Peças' },
  ];

  private sceneManager: SceneManager | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private lastPresetSeq = 0;
  private lastFocusSeq = 0;

  constructor() {
    afterNextRender(() => {
      this.initializeEngine();
    });

    effect(() => {
      const equipment = this.facade.activeEquipment();
      this.sceneManager?.loadEquipment(equipment);
    });

    effect(() => {
      const selectedId = this.facade.selectedTargetId();
      this.sceneManager?.setSelectedTarget(selectedId);
    });

    effect(() => {
      const showAnchors = this.facade.showAnchors();
      this.sceneManager?.setShowAnchors(showAnchors);
    });

    effect(() => {
      const wireframe = this.facade.wireframeMode();
      this.sceneManager?.setWireframe(wireframe);
    });

    effect(() => {
      const presetCmd = this.facade.cameraPresetCommand();
      if (presetCmd.sequence > this.lastPresetSeq) {
        this.lastPresetSeq = presetCmd.sequence;
        this.sceneManager?.setCameraPreset(presetCmd.preset);
      }
    });

    effect(() => {
      const focusCmd = this.facade.cameraFocusCommand();
      if (focusCmd && focusCmd.sequence > this.lastFocusSeq) {
        this.lastFocusSeq = focusCmd.sequence;

        // Se a peça já foi instalada na placa-mãe, foca no slot onde ela está
        // em vez de focar no espaço vazio onde ficava na manta ESD!
        const installedSlotId =
          focusCmd.targetId === 'component-thermal-paste' &&
          this.facade.assemblyState().thermalPasteApplied
            ? 'motherboard-cpu-socket'
            : this.facade.getInstalledSlotId(focusCmd.targetId);

        const resolvedId = installedSlotId ?? focusCmd.targetId;
        const target =
          this.facade.allItems().find((i) => i.id === resolvedId) ??
          findWorkbenchItemById(resolvedId);
        if (target) {
          this.sceneManager?.focusCamera(target.cameraFocus);
        }
      }
    });

    effect(() => {
      const assembly = this.facade.assemblyState();
      this.sceneManager?.syncAssemblyState(assembly);
    });

    effect(() => {
      const connections = this.facade.connections();
      this.sceneManager?.syncConnections(connections);
    });

    effect(() => {
      const active = this.facade.isCableModeActive();
      const pendingPort = this.facade.pendingSourcePortId();
      this.sceneManager?.setCableMode(active, pendingPort);
    });

    effect(() => {
      const settings = this.graphics.resolvedSettings();
      this.sceneManager?.applyGraphicsSettings(settings);
    });

    effect(() => {
      const post = this.facade.lastPostReport();
      this.sceneManager?.updateMonitorPost(post);
    });

    effect(() => {
      const electricalActive = this.facade.electricalModeActive();
      const analysis = this.facade.electricalAnalysis();
      // Reaplica overlay sempre que cabos, modo ou linha de tensão mudam
      this.facade.connections();
      this.sceneManager?.setElectricalOverlay(electricalActive, analysis);
    });

    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
      this.resizeObserver = null;
      this.sceneManager?.dispose();
      this.sceneManager = null;
    });
  }

  private initializeEngine(): void {
    const canvas = this.canvasRef().nativeElement;
    const host = this.hostRef().nativeElement;

    try {
      this.sceneManager = new SceneManager(
        canvas,
        {
          onSelectTarget: (targetId) => this.facade.selectFromScene(targetId),
          onHoverTarget: (targetId) => this.facade.setHoveredFromScene(targetId),
          onTelemetry: (snapshot) => this.facade.updateTelemetry(snapshot),
          evaluatePlacement: (cid, sid) => this.facade.evaluateComponentPlacement(cid, sid),
          onAttemptInstall: (cid, sid) => this.facade.attemptInstall(cid, sid),
          onAttemptRemove: (cid) => this.facade.attemptRemove(cid),
          onDragFeedback: (fb) => this.facade.setDragFeedback(fb),
          onPortClicked: (portId) => this.facade.handlePortClick(portId),
        },
        this.facade.activeEquipment()
      );

      this.sceneManager.setSelectedTarget(this.facade.selectedTargetId());
      this.sceneManager.setShowAnchors(this.facade.showAnchors());
      this.sceneManager.setWireframe(this.facade.wireframeMode());
      this.sceneManager.applyGraphicsSettings(this.graphics.resolvedSettings());
      this.sceneManager.syncAssemblyState(this.facade.assemblyState());
      this.sceneManager.syncConnections(this.facade.connections());
      this.sceneManager.setCableMode(
        this.facade.isCableModeActive(),
        this.facade.pendingSourcePortId()
      );
      this.sceneManager.setElectricalOverlay(
        this.facade.electricalModeActive(),
        this.facade.electricalAnalysis()
      );
      this.sceneManager.updateMonitorPost(this.facade.lastPostReport());

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver((entries) => {
          const entry = entries[0];
          if (entry) {
            this.sceneManager?.resize(entry.contentRect.width, entry.contentRect.height);
          }
        });
        this.resizeObserver.observe(host);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao inicializar WebGLRenderer.';
      this.webglError.set(message);
    }
  }
}
