import { Component, inject } from '@angular/core';
import { InvestigationArea } from '../../../domain/diagnostics/diagnostics.models';
import { WorkbenchFacade } from '../../../state/workbench.facade';

/**
 * Painel do Laboratório de Diagnóstico & Troubleshooting (Sprint 9).
 * Injeta defeitos reais na bancada 3D sem entregar a resposta pronta —
 * o usuário investiga com ferramentas de medição, corrige na bancada e testa o POST.
 */
@Component({
  selector: 'app-diagnostics-panel',
  standalone: true,
  template: `
    <div class="diag-view">
      <!-- Botão Principal de Power / POST -->
      <div class="power-bar">
        @if (facade.isPoweredOn()) {
          <div class="power-on-group">
            <button type="button" class="power-off-btn" (click)="facade.powerOff()">
              ⏻ Desligar Bancada (Seguro)
            </button>
            <button type="button" class="power-retest-btn" (click)="facade.runPowerPostTest()">
              ↻ Re-testar POST
            </button>
          </div>
        } @else {
          <button type="button" class="power-btn" (click)="facade.runPowerPostTest()">
            ⏻ Ligar Bancada / Testar POST
          </button>
        }
      </div>

      <!-- Caso de Troubleshooting Ativo -->
      @if (facade.activeDiagnosticCase(); as activeCase) {
        <section class="case-banner" [class.solved]="facade.diagnosticCaseSolved()">
          <div class="case-banner-top">
            <span class="diff-badge">{{ activeCase.difficulty }}</span>
            <button type="button" class="exit-case-btn" (click)="facade.exitDiagnosticCase()">
              Sair do Caso
            </button>
          </div>
          <h3 class="case-title">{{ activeCase.title }}</h3>
          <p class="case-complaint">
            <strong>Relato:</strong> {{ activeCase.customerComplaint }}
          </p>

          @if (facade.diagnosticCaseSolved()) {
            <div class="solved-box">
              <strong>✓ Defeito diagnosticado e corrigido!</strong>
              <p>{{ activeCase.rootCauseExplanation }}</p>
            </div>
          } @else {
            @if (facade.hintRevealed()) {
              <div class="hint-box">
                <strong>Dica técnica:</strong> {{ activeCase.subtleHint }}
              </div>
            } @else {
              <button type="button" class="hint-btn" (click)="facade.revealDiagnosticHint()">
                Pedir Dica Técnica (opcional)
              </button>
            }
          }
        </section>
      }

      <!-- Resultado do Último Teste POST -->
      @if (facade.lastPostReport(); as post) {
        <section class="post-card" [class.ok]="post.passed" [class.fail]="!post.passed">
          <div class="post-header">
            <span class="monitor-badge" [class.ok]="post.passed">
              {{ monitorLabel(post.monitorOutput) }}
            </span>
            <span class="temp-tag">{{ post.cpuTempC }} °C</span>
          </div>

          <div class="post-stages" aria-label="Estágios do POST">
            @for (st of post.stageStatuses; track st.stage) {
              <span
                class="stage-led"
                [class.ok]="st.status === 'OK'"
                [class.fail]="st.status === 'FAIL'"
              >
                <span class="led-dot"></span>
                {{ st.stage }}
              </span>
            }
          </div>

          <p class="symptom-text">{{ post.observableSymptom }}</p>

          <div class="post-meta">
            <span><strong>Speaker:</strong> {{ post.beepDescription }}</span>
            <span><strong>Ventoinhas:</strong> {{ post.fansSpinning ? 'Girando' : 'Paradas' }}</span>
          </div>
        </section>
      }

      <!-- Ferramentas de Investigação (Multímetro / Inspeção de Bancada) -->
      <section class="diag-section">
        <h3>Investigar Subsistemas</h3>
        <div class="probe-grid">
          @for (probe of probes; track probe.area) {
            <button
              type="button"
              class="probe-btn"
              (click)="facade.inspectArea(probe.area)"
            >
              {{ probe.label }}
            </button>
          }
        </div>

        @if (facade.inspectionLogs().length > 0) {
          <div class="logs-list">
            @for (entry of facade.inspectionLogs(); track entry.id) {
              <div
                class="log-entry"
                [class.normal]="entry.status === 'normal'"
                [class.suspect]="entry.status === 'suspect'"
                [class.critical]="entry.status === 'critical'"
              >
                <span class="log-area">{{ entry.areaLabel }}</span>
                <span class="log-reading">{{ entry.reading }}</span>
              </div>
            }
          </div>
        }
      </section>

      <!-- Lista de Casos do Laboratório -->
      <section class="diag-section">
        <h3>Laboratório de Defeitos (5 Cenários)</h3>
        <p class="section-hint">
          Escolha um cenário para injetar um defeito real na bancada 3D e investigue sem ver a resposta pronta.
        </p>
        <div class="cases-list">
          @for (c of facade.diagnosticCases(); track c.id) {
            <button
              type="button"
              class="case-item"
              [class.active]="facade.activeDiagnosticCaseId() === c.id"
              (click)="facade.loadDiagnosticCase(c.id)"
            >
              <div class="case-item-top">
                <span class="case-item-title">{{ c.title }}</span>
                <span class="case-item-diff">{{ c.difficulty }}</span>
              </div>
              <span class="case-item-desc">{{ c.customerComplaint }}</span>
            </button>
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    .diag-view {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }

    .power-btn {
      appearance: none;
      width: 100%;
      padding: 0.65rem 0.85rem;
      border-radius: 6px;
      border: 1px solid rgba(34, 197, 94, 0.65);
      background: linear-gradient(135deg, rgba(22, 163, 74, 0.35), rgba(14, 165, 233, 0.25));
      color: #ecfdf5;
      font-size: 0.84rem;
      font-weight: 700;
      cursor: pointer;
    }

    .power-on-group {
      display: flex;
      gap: 0.45rem;
    }

    .power-off-btn {
      flex: 1;
      appearance: none;
      padding: 0.62rem 0.7rem;
      border-radius: 6px;
      border: 1px solid rgba(239, 68, 68, 0.75);
      background: linear-gradient(135deg, rgba(220, 38, 38, 0.45), rgba(153, 27, 27, 0.45));
      color: #fee2e2;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
    }

    .power-retest-btn {
      appearance: none;
      padding: 0.62rem 0.65rem;
      border-radius: 6px;
      border: 1px solid rgba(56, 189, 248, 0.55);
      background: rgba(14, 165, 233, 0.2);
      color: #e0f2fe;
      font-size: 0.76rem;
      font-weight: 700;
      cursor: pointer;
    }

    .power-btn:hover {
      background: linear-gradient(135deg, rgba(22, 163, 74, 0.5), rgba(14, 165, 233, 0.35));
    }

    .case-banner {
      background: rgba(120, 53, 15, 0.22);
      border: 1px solid rgba(245, 158, 11, 0.45);
      border-radius: 6px;
      padding: 0.68rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .case-banner.solved {
      background: rgba(6, 78, 59, 0.32);
      border-color: rgba(34, 197, 94, 0.65);
    }

    .case-banner-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .diff-badge {
      font-size: 0.64rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.14rem 0.45rem;
      border-radius: 4px;
      background: rgba(245, 158, 11, 0.2);
      color: #fde68a;
    }

    .exit-case-btn {
      appearance: none;
      border: 1px solid rgba(148, 163, 184, 0.28);
      background: rgba(15, 23, 42, 0.7);
      color: #cbd5e1;
      font-size: 0.66rem;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      cursor: pointer;
    }

    .case-title {
      margin: 0;
      font-size: 0.86rem;
      color: #f8fafc;
    }

    .case-complaint {
      margin: 0;
      font-size: 0.76rem;
      line-height: 1.45;
      color: #e2e8f0;
    }

    .hint-btn {
      appearance: none;
      align-self: flex-start;
      border: 1px solid rgba(245, 158, 11, 0.45);
      background: rgba(245, 158, 11, 0.15);
      color: #fef3c7;
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.3rem 0.55rem;
      border-radius: 4px;
      cursor: pointer;
    }

    .hint-box {
      font-size: 0.74rem;
      line-height: 1.42;
      color: #fef3c7;
      background: rgba(15, 23, 42, 0.55);
      border-left: 3px solid #f59e0b;
      padding: 0.45rem 0.55rem;
      border-radius: 4px;
    }

    .solved-box {
      font-size: 0.75rem;
      line-height: 1.45;
      color: #dcfce7;
      background: rgba(22, 163, 74, 0.2);
      border-left: 3px solid #22c55e;
      padding: 0.5rem 0.6rem;
      border-radius: 4px;
    }

    .solved-box p {
      margin: 0.25rem 0 0;
    }

    .post-card {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 6px;
      padding: 0.68rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .post-card.ok {
      border-color: rgba(34, 197, 94, 0.6);
    }

    .post-card.fail {
      border-color: rgba(239, 68, 68, 0.55);
    }

    .post-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .monitor-badge {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.16rem 0.48rem;
      border-radius: 4px;
      background: rgba(239, 68, 68, 0.2);
      color: #fecaca;
    }

    .monitor-badge.ok {
      background: rgba(34, 197, 94, 0.22);
      color: #86efac;
    }

    .temp-tag {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.7rem;
      color: #94a3b8;
    }

    .post-stages {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 0.25rem;
    }

    .stage-led {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.22rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.62rem;
      padding: 0.22rem 0.2rem;
      border-radius: 4px;
      background: rgba(30, 41, 59, 0.65);
      color: #94a3b8;
    }

    .led-dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: #475569;
    }

    .stage-led.ok {
      color: #86efac;
    }

    .stage-led.ok .led-dot {
      background: #22c55e;
      box-shadow: 0 0 6px #22c55e;
    }

    .stage-led.fail {
      color: #fecaca;
      background: rgba(127, 29, 29, 0.45);
    }

    .stage-led.fail .led-dot {
      background: #ef4444;
      box-shadow: 0 0 6px #ef4444;
    }

    .symptom-text {
      margin: 0;
      font-size: 0.76rem;
      line-height: 1.45;
      color: #e2e8f0;
    }

    .post-meta {
      display: flex;
      flex-direction: column;
      gap: 0.18rem;
      font-size: 0.71rem;
      color: #94a3b8;
    }

    .diag-section h3 {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
      margin: 0 0 0.45rem;
    }

    .section-hint {
      margin: 0 0 0.55rem;
      font-size: 0.73rem;
      color: #94a3b8;
      line-height: 1.4;
    }

    .probe-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.35rem;
      margin-bottom: 0.55rem;
    }

    .probe-btn {
      appearance: none;
      padding: 0.42rem 0.5rem;
      border-radius: 5px;
      border: 1px solid rgba(56, 189, 248, 0.3);
      background: rgba(14, 165, 233, 0.12);
      color: #e0f2fe;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
    }

    .probe-btn:hover {
      background: rgba(14, 165, 233, 0.24);
    }

    .logs-list {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .log-entry {
      padding: 0.48rem 0.58rem;
      border-radius: 5px;
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.14);
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      font-size: 0.72rem;
      line-height: 1.4;
    }

    .log-entry.normal {
      border-left: 3px solid #22c55e;
    }

    .log-entry.suspect {
      border-left: 3px solid #f59e0b;
    }

    .log-entry.critical {
      border-left: 3px solid #ef4444;
    }

    .log-area {
      font-weight: 700;
      color: #f8fafc;
      font-size: 0.69rem;
    }

    .log-reading {
      color: #cbd5e1;
    }

    .cases-list {
      display: flex;
      flex-direction: column;
      gap: 0.42rem;
    }

    .case-item {
      appearance: none;
      width: 100%;
      padding: 0.55rem 0.65rem;
      border-radius: 6px;
      background: rgba(30, 41, 59, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.14);
      color: #e2e8f0;
      text-align: left;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.22rem;
    }

    .case-item:hover {
      border-color: rgba(245, 158, 11, 0.45);
      background: rgba(245, 158, 11, 0.08);
    }

    .case-item.active {
      border-color: #f59e0b;
      background: rgba(245, 158, 11, 0.16);
    }

    .case-item-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
    }

    .case-item-title {
      font-size: 0.76rem;
      font-weight: 700;
      color: #f8fafc;
    }

    .case-item-diff {
      font-size: 0.62rem;
      color: #fbbf24;
      flex-shrink: 0;
    }

    .case-item-desc {
      font-size: 0.7rem;
      color: #94a3b8;
      line-height: 1.38;
    }
  `,
})
export class DiagnosticsPanelComponent {
  protected readonly facade = inject(WorkbenchFacade);

  protected readonly probes: readonly { area: InvestigationArea; label: string }[] = [
    { area: 'power', label: '⚡ Medir Alimentação' },
    { area: 'cpu', label: '🌡 Verificar CPU/Térmica' },
    { area: 'ram', label: '▤ Verificar RAM' },
    { area: 'gpu', label: '▣ Verificar GPU' },
    { area: 'storage', label: '⛁ Verificar HD/SATA' },
  ];

  protected monitorLabel(output: string): string {
    switch (output) {
      case 'NO_POWER':
        return 'MONITOR: SEM ENERGIA';
      case 'NO_SIGNAL':
        return 'MONITOR: SEM SINAL';
      case 'THERMAL_SHUTDOWN':
        return 'DESARME TÉRMICO';
      case 'BIOS_NO_BOOT_DEVICE':
        return 'BIOS: SEM DISCO DE BOOT';
      case 'POST_SUCCESS':
        return 'MONITOR: POST OK ✓';
      default:
        return output;
    }
  }
}
