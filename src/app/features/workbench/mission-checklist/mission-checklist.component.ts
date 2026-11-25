import { Component, inject, signal } from '@angular/core';
import { AssemblyMissionStep } from '../../../domain/mission/assembly-mission.models';
import { WorkbenchFacade } from '../../../state/workbench.facade';

/**
 * Widget flutuante do Modo Montagem ("Missão: Monte o computador") na cena 3D.
 * Destaca visualmente o item atualmente selecionado pelo usuário (ex.: RAM) e
 * acompanha a conclusão de todos os 9 itens + botão rápido de ligar o monitor 3D.
 */
@Component({
  selector: 'app-mission-checklist',
  standalone: true,
  template: `
    @let report = facade.missionReport();
    <section
      class="mission-card"
      [class.completed]="report.isCompleted"
      [class.collapsed]="collapsed()"
      aria-label="Missão de montagem do computador"
    >
      <header class="mission-header">
        <div class="mission-title-wrap">
          <span class="mission-kicker">MISSÃO</span>
          <strong class="mission-title">{{ report.title }}</strong>
        </div>
        <div class="mission-header-right">
          <span class="mission-counter" [class.done]="report.isCompleted">
            {{ report.completedCount }}/{{ report.totalCount }}
          </span>
          <button
            type="button"
            class="collapse-btn"
            (click)="collapsed.set(!collapsed())"
            [attr.aria-expanded]="!collapsed()"
          >
            {{ collapsed() ? '▾' : '▴' }}
          </button>
        </div>
      </header>

      <div class="progress-track" aria-hidden="true">
        <div
          class="progress-fill"
          [class.done]="report.isCompleted"
          [style.width.%]="report.progressPercent"
        ></div>
      </div>

      @if (!collapsed()) {
        @if (report.isCompleted) {
          <div class="completion-banner">
            <div class="completion-title">✓ Montagem concluída!</div>
            <p class="completion-desc">
              Todos os 10 passos essenciais da <strong>PCWare IPM41-D3</strong> foram instalados e conectados.
            </p>
            @if (report.engineeringNotes.length > 0) {
              <ul class="eng-notes">
                @for (note of report.engineeringNotes; track note) {
                  <li>{{ note }}</li>
                }
              </ul>
            }
            <div class="completion-actions">
              <button type="button" class="boot-btn" (click)="facade.runPowerPostTest()">
                ⏻ Ligar PC (Ver Boot no Monitor)
              </button>
              <button type="button" class="reset-mission-btn" (click)="facade.resetAssembly()">
                Montar Novamente
              </button>
            </div>
          </div>
        } @else if (report.nextRecommendedStep; as next) {
          <div class="next-step-hint">
            <span class="next-label">Próximo passo:</span>
            <span>{{ next.hint }}</span>
          </div>
        }

        <ul class="checklist">
          @for (step of report.steps; track step.id) {
            <li>
              <button
                type="button"
                class="step-row"
                [class.done]="step.completed"
                [class.selected]="isStepSelected(step)"
                [attr.aria-pressed]="isStepSelected(step)"
                (click)="onStepClick(step)"
                [title]="step.hint"
              >
                <span class="step-label">{{ step.label }}</span>
                @if (isStepSelected(step)) {
                  <span class="selected-pill">ATIVO</span>
                }
                @if (step.warningNote) {
                  <span class="step-warn" [title]="step.warningNote">⚠</span>
                }
                <span class="step-icon">{{ step.completed ? '✓' : '✕' }}</span>
              </button>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    .mission-card {
      width: 248px;
      background: rgba(15, 23, 42, 0.88);
      border: 1px solid rgba(148, 163, 184, 0.24);
      border-radius: 8px;
      backdrop-filter: blur(10px);
      padding: 0.65rem 0.75rem;
      color: #e2e8f0;
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.42);
      pointer-events: auto;
    }

    .mission-card.completed {
      border-color: rgba(34, 197, 94, 0.68);
      background: rgba(6, 52, 40, 0.9);
    }

    .mission-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.45rem;
    }

    .mission-title-wrap {
      display: flex;
      flex-direction: column;
      gap: 0.05rem;
    }

    .mission-kicker {
      font-size: 0.58rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #38bdf8;
    }

    .mission-title {
      font-size: 0.8rem;
      color: #f8fafc;
    }

    .mission-header-right {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .mission-counter {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.12rem 0.42rem;
      border-radius: 999px;
      background: rgba(56, 189, 248, 0.16);
      color: #7dd3fc;
    }

    .mission-counter.done {
      background: rgba(34, 197, 94, 0.25);
      color: #4ade80;
    }

    .collapse-btn {
      appearance: none;
      border: 1px solid rgba(148, 163, 184, 0.22);
      background: rgba(30, 41, 59, 0.7);
      color: #cbd5e1;
      width: 22px;
      height: 22px;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .progress-track {
      height: 4px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.2);
      overflow: hidden;
      margin-bottom: 0.55rem;
    }

    .progress-fill {
      height: 100%;
      background: #38bdf8;
      transition: width 0.25s ease;
    }

    .progress-fill.done {
      background: #22c55e;
    }

    .next-step-hint {
      font-size: 0.7rem;
      line-height: 1.38;
      color: #cbd5e1;
      background: rgba(30, 41, 59, 0.72);
      border-left: 2px solid #38bdf8;
      border-radius: 4px;
      padding: 0.38rem 0.5rem;
      margin-bottom: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.12rem;
    }

    .next-label {
      font-size: 0.62rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #38bdf8;
    }

    .completion-banner {
      background: rgba(22, 163, 74, 0.2);
      border: 1px solid rgba(74, 222, 128, 0.45);
      border-radius: 6px;
      padding: 0.55rem 0.6rem;
      margin-bottom: 0.55rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .completion-title {
      font-size: 0.84rem;
      font-weight: 800;
      color: #4ade80;
    }

    .completion-desc {
      margin: 0;
      font-size: 0.71rem;
      line-height: 1.4;
      color: #dcfce7;
    }

    .eng-notes {
      margin: 0;
      padding-left: 1rem;
      font-size: 0.67rem;
      line-height: 1.35;
      color: #fde68a;
      display: flex;
      flex-direction: column;
      gap: 0.22rem;
    }

    .completion-actions {
      display: flex;
      flex-direction: column;
      gap: 0.32rem;
    }

    .boot-btn {
      appearance: none;
      width: 100%;
      padding: 0.42rem 0.6rem;
      border-radius: 4px;
      border: 1px solid rgba(56, 189, 248, 0.65);
      background: rgba(14, 165, 233, 0.28);
      color: #e0f2fe;
      font-size: 0.72rem;
      font-weight: 700;
      cursor: pointer;
    }

    .reset-mission-btn {
      appearance: none;
      width: 100%;
      padding: 0.36rem 0.6rem;
      border-radius: 4px;
      border: 1px solid rgba(74, 222, 128, 0.45);
      background: rgba(34, 197, 94, 0.2);
      color: #ecfdf5;
      font-size: 0.71rem;
      font-weight: 700;
      cursor: pointer;
    }

    .checklist {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.24rem;
    }

    .step-row {
      appearance: none;
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.5rem;
      border-radius: 4px;
      border: 1px solid rgba(148, 163, 184, 0.14);
      background: rgba(30, 41, 59, 0.48);
      color: #cbd5e1;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.72rem;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s ease, border-color 0.15s ease;
    }

    .step-row:hover {
      border-color: rgba(56, 189, 248, 0.45);
      background: rgba(56, 189, 248, 0.1);
    }

    .step-row.done {
      background: rgba(22, 163, 74, 0.16);
      border-color: rgba(34, 197, 94, 0.38);
      color: #dcfce7;
    }

    .step-row.selected {
      background: rgba(14, 165, 233, 0.25);
      border-color: #38bdf8;
      color: #f8fafc;
      box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.35);
    }

    .step-label {
      flex: 1;
      font-weight: 600;
    }

    .selected-pill {
      font-size: 0.58rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      padding: 0.08rem 0.32rem;
      border-radius: 3px;
      background: #0284c7;
      color: #f0f9ff;
    }

    .step-warn {
      color: #fbbf24;
      font-size: 0.75rem;
    }

    .step-icon {
      font-weight: 800;
      color: #f87171;
    }

    .step-row.done .step-icon {
      color: #4ade80;
    }

    @media (max-width: 767px), (max-height: 540px) and (orientation: landscape) {
      .mission-card {
        width: 210px;
        max-height: calc(100dvh - 110px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .checklist {
        overflow-y: auto;
        max-height: 44dvh;
        padding-right: 0.15rem;
      }
    }
  `,
})
export class MissionChecklistComponent {
  protected readonly facade = inject(WorkbenchFacade);
  protected readonly collapsed = signal<boolean>(false);
  protected readonly activeStepId = signal<string | null>(null);

  protected isStepSelected(step: AssemblyMissionStep): boolean {
    return (
      this.activeStepId() === step.id ||
      this.facade.selectedTargetId() === step.focusTargetId
    );
  }

  protected onStepClick(step: AssemblyMissionStep): void {
    this.activeStepId.set(step.id);
    if (step.actionKind === 'connect-cable') {
      this.facade.setActiveTab('connections');
      this.facade.requestCameraPreset('overview');
    } else {
      this.facade.selectFromPanel(step.focusTargetId);
    }
  }
}
