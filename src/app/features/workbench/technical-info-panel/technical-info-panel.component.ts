import { Component, computed, effect, input, output, signal } from '@angular/core';
import {
  TechnicalDossier,
  TechnicalInfoTab,
} from '../../../domain/education/technical-info.models';

interface SubTabDef {
  readonly id: TechnicalInfoTab;
  readonly label: string;
}

const TECHNICAL_SUBTABS: readonly SubTabDef[] = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'function', label: 'Função' },
  { id: 'specs', label: 'Especificações' },
  { id: 'installation', label: 'Instalação' },
  { id: 'connections', label: 'Conexões' },
  { id: 'power', label: 'Alimentação' },
  { id: 'compatibility', label: 'Compatibilidade' },
  { id: 'diagnostics', label: 'Diagnóstico' },
];

/**
 * Painel Educacional de Informações Técnicas com 8 sub-abas estruturadas (Sprint 7).
 * Funciona de forma unificada para peças da bancada, regiões da placa-mãe e conexões.
 */
@Component({
  selector: 'app-technical-info-panel',
  standalone: true,
  template: `
    @let d = dossier();
    <div class="dossier-view">
      <div class="dossier-header">
        <div class="badge-row">
          <span
            class="zone-badge"
            [style.border-color]="d.accentColor"
            [style.color]="d.accentColor"
          >
            {{ d.badgeLabel }}
          </span>
          <button
            type="button"
            class="mode-chip-btn"
            (click)="toggleReadAll()"
            title="Alternar entre navegação por abas e leitura completa"
          >
            {{ readAllMode() ? 'Ver por Abas' : 'Ler Tudo' }}
          </button>
        </div>
        <h2 class="dossier-title">{{ d.title }}</h2>
        <p class="dossier-sub">{{ d.subtitle }}</p>
      </div>

      @if (!readAllMode()) {
        <nav class="subtab-grid" aria-label="Seções técnicas do componente">
          @for (tab of subTabs; track tab.id) {
            <button
              type="button"
              class="subtab-btn"
              [class.active]="activeTab() === tab.id"
              [style.--accent]="d.accentColor"
              (click)="activeTab.set(tab.id)"
            >
              {{ tab.label }}
            </button>
          }
        </nav>
      }

      <div class="dossier-content">
        @if (showSection('overview')) {
          <section class="edu-block">
            <h3 class="section-heading">Visão geral</h3>
            <div class="qa-card">
              <span class="qa-label">O que é?</span>
              <p>{{ d.whatIsIt }}</p>
            </div>
            <div class="qa-card context">
              <span class="qa-label">Por que existe? (Contexto de engenharia)</span>
              <p>{{ d.whyItExists }}</p>
            </div>
          </section>
        }

        @if (showSection('function')) {
          <section class="edu-block">
            <h3 class="section-heading">Função</h3>
            <div class="qa-card">
              <span class="qa-label">Qual sua função? (Para iniciantes)</span>
              <p>{{ d.beginnerFunction }}</p>
            </div>
            <div class="qa-card tech">
              <span class="qa-label">Como funciona? (Explicação técnica)</span>
              <p>{{ d.howItWorks }}</p>
            </div>
          </section>
        }

        @if (showSection('specs')) {
          <section class="edu-block">
            <h3 class="section-heading">Especificações</h3>
            <dl class="specs-grid">
              @for (spec of d.specs; track spec.label) {
                <div class="spec-row">
                  <dt>{{ spec.label }}</dt>
                  <dd>{{ spec.value }}</dd>
                </div>
              }
            </dl>
            <div class="qa-card">
              <span class="qa-label">Identificação física</span>
              <p>{{ d.physicalIdentification }}</p>
            </div>
          </section>
        }

        @if (showSection('installation')) {
          <section class="edu-block">
            <h3 class="section-heading">Instalação</h3>
            <div class="qa-card">
              <span class="qa-label">Guia de instalação / posicionamento</span>
              <p>{{ d.installationGuide }}</p>
            </div>
            <div class="list-card caution">
              <span class="qa-label">Cuidados obrigatórios</span>
              <ul>
                @for (tip of d.precautions; track tip) {
                  <li>{{ tip }}</li>
                }
              </ul>
            </div>
          </section>
        }

        @if (showSection('connections')) {
          <section class="edu-block">
            <h3 class="section-heading">Conexões</h3>
            <div class="qa-card">
              <span class="qa-label">Como é conectado?</span>
              <p>{{ d.howItConnects }}</p>
            </div>
            <div class="list-card connection">
              <span class="qa-label">Relações na bancada</span>
              <ul>
                @for (link of d.connectionLinks; track link) {
                  <li>{{ link }}</li>
                }
              </ul>
            </div>
            @if (d.connectors.length > 0) {
              <div class="list-card">
                <span class="qa-label">Conectores físicos</span>
                <ul>
                  @for (c of d.connectors; track c) {
                    <li>{{ c }}</li>
                  }
                </ul>
              </div>
            }
          </section>
        }

        @if (showSection('power')) {
          <section class="edu-block">
            <h3 class="section-heading">Alimentação</h3>
            <div class="voltage-chips">
              @for (v of d.voltages; track v) {
                <span class="voltage-chip">{{ v }}</span>
              }
            </div>
            <div class="qa-card">
              <span class="qa-label">Consumo / Regime elétrico</span>
              <p>{{ d.powerConsumption }}</p>
            </div>
            <div class="qa-card">
              <span class="qa-label">Origem da alimentação</span>
              <p>{{ d.powerSource }}</p>
            </div>
          </section>
        }

        @if (showSection('compatibility')) {
          <section class="edu-block">
            <h3 class="section-heading">Compatibilidade</h3>
            <div class="list-card">
              <span class="qa-label">Requisitos técnicos (PCWare IPM41-D3)</span>
              <ul>
                @for (rule of d.compatibilityRules; track rule) {
                  <li>{{ rule }}</li>
                }
              </ul>
            </div>
          </section>
        }

        @if (showSection('diagnostics')) {
          <section class="edu-block">
            <h3 class="section-heading">Diagnóstico</h3>
            <div class="qa-card danger-card">
              <span class="qa-label">O que acontece se estiver errado?</span>
              <p>{{ d.whatHappensIfWrong }}</p>
            </div>
            <div class="list-card danger">
              <span class="qa-label">Problemas comuns e erros de conexão</span>
              <ul>
                @for (fault of d.commonFaults; track fault) {
                  <li>{{ fault }}</li>
                }
              </ul>
            </div>
          </section>
        }
      </div>

      <div class="dossier-actions">
        @if (canRemove()) {
          <button type="button" class="action-btn danger" (click)="removeRequested.emit()">
            {{ d.entityType === 'cable-connection' ? 'Desconectar Cabo' : 'Remover da Placa-Mãe' }}
          </button>
        }
        @if (d.entityType !== 'cable-connection') {
          <button type="button" class="action-btn" (click)="focusRequested.emit()">
            Focar Câmera no 3D
          </button>
        }
        <button type="button" class="action-btn secondary" (click)="backRequested.emit()">
          Voltar à Lista
        </button>
      </div>
    </div>
  `,
  styles: `
    .dossier-view {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .dossier-header {
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgba(148, 163, 184, 0.14);
    }

    .badge-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.4rem;
    }

    .zone-badge {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.16rem 0.48rem;
      border-radius: 4px;
      border: 1px solid;
    }

    .mode-chip-btn {
      appearance: none;
      border: 1px solid rgba(148, 163, 184, 0.25);
      background: rgba(30, 41, 59, 0.7);
      color: #cbd5e1;
      font-size: 0.66rem;
      font-weight: 600;
      padding: 0.18rem 0.48rem;
      border-radius: 4px;
      cursor: pointer;
    }

    .mode-chip-btn:hover {
      border-color: rgba(56, 189, 248, 0.5);
      color: #f8fafc;
    }

    .dossier-title {
      font-size: 1.02rem;
      font-weight: 700;
      margin: 0 0 0.25rem;
      color: #f8fafc;
    }

    .dossier-sub {
      margin: 0;
      font-size: 0.7rem;
      color: #94a3b8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .subtab-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.3rem;
    }

    .subtab-btn {
      appearance: none;
      border: 1px solid rgba(148, 163, 184, 0.14);
      background: rgba(15, 23, 42, 0.72);
      color: #94a3b8;
      font-size: 0.73rem;
      font-weight: 600;
      padding: 0.42rem 0.5rem;
      border-radius: 5px;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
    }

    .subtab-btn:hover {
      color: #e2e8f0;
      border-color: rgba(148, 163, 184, 0.35);
    }

    .subtab-btn.active {
      background: rgba(14, 165, 233, 0.16);
      border-color: var(--accent, #38bdf8);
      color: #f8fafc;
    }

    .dossier-content {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
    }

    .edu-block {
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
    }

    .section-heading {
      margin: 0;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #38bdf8;
    }

    .qa-card,
    .list-card {
      background: rgba(30, 41, 59, 0.48);
      border: 1px solid rgba(148, 163, 184, 0.14);
      border-radius: 6px;
      padding: 0.6rem 0.72rem;
      display: flex;
      flex-direction: column;
      gap: 0.28rem;
    }

    .qa-card.context {
      border-left: 3px solid #38bdf8;
    }

    .qa-card.tech {
      border-left: 3px solid #a855f7;
    }

    .qa-card.danger-card,
    .list-card.danger {
      background: rgba(127, 29, 29, 0.2);
      border-color: rgba(248, 113, 113, 0.28);
      border-left: 3px solid #ef4444;
    }

    .list-card.caution {
      background: rgba(245, 158, 11, 0.1);
      border-color: rgba(245, 158, 11, 0.26);
      border-left: 3px solid #f59e0b;
    }

    .list-card.connection {
      background: rgba(14, 165, 233, 0.1);
      border-color: rgba(56, 189, 248, 0.25);
      border-left: 3px solid #38bdf8;
    }

    .qa-label {
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #94a3b8;
    }

    .qa-card p {
      margin: 0;
      font-size: 0.79rem;
      line-height: 1.5;
      color: #e2e8f0;
    }

    .list-card ul {
      margin: 0.1rem 0 0;
      padding-left: 1.15rem;
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.77rem;
      line-height: 1.45;
      color: #e2e8f0;
    }

    .specs-grid {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.36rem;
      background: rgba(15, 23, 42, 0.65);
      border: 1px solid rgba(148, 163, 184, 0.14);
      border-radius: 6px;
      padding: 0.6rem 0.72rem;
    }

    .spec-row {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      font-size: 0.76rem;
      border-bottom: 1px dashed rgba(148, 163, 184, 0.12);
      padding-bottom: 0.28rem;
    }

    .spec-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .spec-row dt {
      color: #94a3b8;
      flex-shrink: 0;
    }

    .spec-row dd {
      margin: 0;
      color: #f8fafc;
      font-weight: 500;
      text-align: right;
    }

    .voltage-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.32rem;
    }

    .voltage-chip {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.7rem;
      font-weight: 600;
      color: #fde68a;
      background: rgba(245, 158, 11, 0.14);
      border: 1px solid rgba(245, 158, 11, 0.38);
      padding: 0.18rem 0.45rem;
      border-radius: 4px;
    }

    .dossier-actions {
      display: flex;
      flex-direction: column;
      gap: 0.42rem;
      padding-top: 0.5rem;
      border-top: 1px solid rgba(148, 163, 184, 0.14);
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

    .action-btn.danger {
      border-color: rgba(248, 113, 113, 0.55);
      background: rgba(220, 38, 38, 0.22);
      color: #fecaca;
    }
  `,
})
export class TechnicalInfoPanelComponent {
  readonly dossier = input.required<TechnicalDossier>();
  readonly canRemove = input<boolean>(false);

  readonly focusRequested = output<void>();
  readonly removeRequested = output<void>();
  readonly backRequested = output<void>();

  protected readonly subTabs = TECHNICAL_SUBTABS;
  protected readonly activeTab = signal<TechnicalInfoTab>('overview');
  protected readonly readAllMode = signal<boolean>(false);

  private readonly dossierId = computed(() => this.dossier().id);

  constructor() {
    // Ao trocar de componente selecionado, volta para a aba "Visão geral"
    effect(() => {
      this.dossierId();
      this.activeTab.set('overview');
    });
  }

  protected showSection(tab: TechnicalInfoTab): boolean {
    return this.readAllMode() || this.activeTab() === tab;
  }

  protected toggleReadAll(): void {
    this.readAllMode.update((v) => !v);
  }
}
