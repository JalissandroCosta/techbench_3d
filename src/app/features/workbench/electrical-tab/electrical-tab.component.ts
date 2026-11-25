import { Component, inject } from '@angular/core';
import { WorkbenchFacade } from '../../../state/workbench.facade';

/**
 * Aba dedicada do Sistema Elétrico e Linhas de Tensão (extraída na Etapa 5).
 */
@Component({
  selector: 'app-electrical-tab',
  standalone: true,
  template: `
    @let analysis = facade.electricalAnalysis();
    <div class="electrical-view">
      <div class="electric-toggle-box" [class.active]="facade.electricalModeActive()">
        <div class="electric-toggle-text">
          <strong>Modo Visualização Elétrica</strong>
          <span>Destaca na cena 3D os componentes e cabos da linha de tensão selecionada.</span>
        </div>
        <button
          type="button"
          class="action-btn"
          [class.secondary]="!facade.electricalModeActive()"
          (click)="facade.toggleElectricalMode()"
        >
          {{ facade.electricalModeActive() ? '⚡ Ativo (Desativar)' : 'Ativar Visualização' }}
        </button>
      </div>

      <section class="info-section">
        <h3>Selecionar Linha de Tensão</h3>
        <div class="rail-grid">
          @for (rail of facade.voltageRails(); track rail.id) {
            <button
              type="button"
              class="rail-card"
              [class.selected]="facade.selectedVoltageRail() === rail.id"
              [style.--rail-color]="rail.colorHex"
              (click)="facade.selectVoltageRail(rail.id)"
            >
              <span class="rail-card-dot" [style.background]="rail.colorHex"></span>
              <span class="rail-card-label">{{ rail.label }}</span>
              <span class="rail-card-stage">
                {{ rail.stage === 'PRIMARY_PSU' ? 'Fonte ATX' : 'VRM / PCB' }}
              </span>
            </button>
          }
        </div>
      </section>

      <section class="info-section">
        <div class="rail-detail-header">
          <span
            class="zone-badge"
            [style.border-color]="analysis.rail.colorHex"
            [style.color]="analysis.rail.colorHex"
          >
            {{ analysis.rail.atxWireColor }}
          </span>
          <span class="tolerance-tag">{{ analysis.rail.tolerance }}</span>
        </div>
        <h2 class="info-title">{{ analysis.rail.title }}</h2>
        <p class="note-box">{{ analysis.rail.summary }}</p>
      </section>

      <section class="info-section">
        <h3>Distribuição na Bancada ({{ analysis.rail.label }})</h3>
        <div class="tree-box">
          <div class="tree-root" [style.color]="analysis.rail.colorHex">
            ⚡ {{ analysis.rail.label }}
          </div>
          <div class="tree-branches">
            @for (item of analysis.branches; track item.branch.id) {
              <button
                type="button"
                class="tree-branch-btn"
                [class.energized]="item.energized"
                (click)="facade.selectFromPanel(item.branch.targetObjectId)"
              >
                <span class="branch-connector">├─</span>
                <div class="branch-meta">
                  <div class="branch-top">
                    <strong>{{ item.branch.label }}</strong>
                    <span class="branch-status" [class.on]="item.energized">
                      {{ item.energized ? '⚡ ' + item.statusLabel : '○ ' + item.statusLabel }}
                    </span>
                  </div>
                  <span class="branch-role">{{ item.branch.role }}</span>
                </div>
              </button>
            }
          </div>
        </div>
      </section>

      <section class="info-section">
        <h3>Diagnóstico & Bancada</h3>
        <p class="note-box diag-tip">{{ analysis.rail.diagnosticTip }}</p>
      </section>
    </div>
  `,
  styles: `
    .electric-toggle-box {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      padding: 0.7rem 0.78rem;
      border-radius: 6px;
      background: rgba(30, 41, 59, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.18);
      margin-bottom: 0.95rem;
    }

    .electric-toggle-box.active {
      background: rgba(234, 179, 8, 0.12);
      border-color: rgba(234, 179, 8, 0.55);
    }

    .electric-toggle-text {
      display: flex;
      flex-direction: column;
      gap: 0.18rem;
      font-size: 0.74rem;
      color: #cbd5e1;
    }

    .electric-toggle-text strong {
      color: #f8fafc;
      font-size: 0.8rem;
    }

    .info-section {
      margin-bottom: 0.9rem;
    }

    .info-section h3 {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
      margin: 0 0 0.4rem;
    }

    .rail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.4rem;
    }

    .rail-card {
      appearance: none;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.18rem;
      padding: 0.5rem 0.6rem;
      border-radius: 6px;
      background: rgba(30, 41, 59, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.16);
      color: #e2e8f0;
      cursor: pointer;
      text-align: left;
    }

    .rail-card.selected {
      border-color: var(--rail-color, #eab308);
      background: rgba(255, 255, 255, 0.08);
    }

    .rail-card-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
    }

    .rail-card-label {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.84rem;
      font-weight: 700;
    }

    .rail-card-stage {
      font-size: 0.65rem;
      color: #94a3b8;
    }

    .rail-detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
      margin-bottom: 0.4rem;
      flex-wrap: wrap;
    }

    .zone-badge {
      display: inline-block;
      font-size: 0.66rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.16rem 0.48rem;
      border-radius: 4px;
      border: 1px solid;
    }

    .tolerance-tag {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.66rem;
      color: #94a3b8;
    }

    .info-title {
      font-size: 0.98rem;
      font-weight: 700;
      margin: 0 0 0.45rem;
      color: #f8fafc;
    }

    .note-box {
      margin: 0;
      font-size: 0.78rem;
      line-height: 1.48;
      color: #cbd5e1;
      background: rgba(30, 41, 59, 0.45);
      border: 1px solid rgba(148, 163, 184, 0.12);
      border-radius: 6px;
      padding: 0.58rem 0.7rem;
    }

    .diag-tip {
      border-left: 3px solid #eab308;
    }

    .tree-box {
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 6px;
      padding: 0.65rem;
    }

    .tree-root {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.88rem;
      font-weight: 800;
      margin-bottom: 0.45rem;
    }

    .tree-branches {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .tree-branch-btn {
      appearance: none;
      width: 100%;
      display: flex;
      align-items: flex-start;
      gap: 0.45rem;
      padding: 0.45rem 0.5rem;
      border-radius: 5px;
      background: rgba(30, 41, 59, 0.48);
      border: 1px solid rgba(148, 163, 184, 0.12);
      color: #e2e8f0;
      text-align: left;
      cursor: pointer;
    }

    .tree-branch-btn.energized {
      border-left: 3px solid #22c55e;
    }

    .branch-connector {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #64748b;
      font-size: 0.78rem;
      flex-shrink: 0;
    }

    .branch-meta {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .branch-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
      font-size: 0.76rem;
    }

    .branch-status {
      font-size: 0.64rem;
      color: #94a3b8;
      white-space: nowrap;
    }

    .branch-status.on {
      color: #4ade80;
      font-weight: 600;
    }

    .branch-role {
      font-size: 0.69rem;
      color: #94a3b8;
      line-height: 1.35;
    }

    .action-btn {
      appearance: none;
      width: 100%;
      padding: 0.52rem 0.8rem;
      border-radius: 6px;
      border: 1px solid rgba(56, 189, 248, 0.5);
      background: rgba(14, 165, 233, 0.2);
      color: #e0f2fe;
      font-size: 0.79rem;
      font-weight: 600;
      cursor: pointer;
    }

    .action-btn.secondary {
      border-color: rgba(148, 163, 184, 0.25);
      background: rgba(30, 41, 59, 0.6);
      color: #cbd5e1;
    }
  `,
})
export class ElectricalTabComponent {
  protected readonly facade = inject(WorkbenchFacade);
}
