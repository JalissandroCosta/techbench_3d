import { Component, inject, signal } from '@angular/core';
import { WorkbenchFacade } from '../../../state/workbench.facade';

type ModalTab = 'report' | 'challenges' | 'ranking' | 'certificate';

/**
 * Modal de Gamificação e Avaliação Técnica (Sprint 10):
 * Relatório de Missão Concluída, Níveis/XP, Desafios, Ranking, Histórico e Certificado Interno.
 */
@Component({
  selector: 'app-evaluation-modal',
  standalone: true,
  template: `
    @if (facade.evaluationModalOpen()) {
      <div class="modal-backdrop" (click)="facade.closeEvaluationModal()">
        <div
          class="modal-shell"
          role="dialog"
          aria-modal="true"
          aria-label="Avaliação e Progresso TechBench 3D"
          (click)="$event.stopPropagation()"
        >
          <header class="modal-header">
            <div class="header-left">
              <span class="kicker">TECHBENCH 3D · AVALIAÇÃO TÉCNICA</span>
              <h2 class="modal-title">
                Nível {{ facade.technicianLevel().level }} — {{ facade.technicianLevel().title }}
              </h2>
            </div>
            <div class="header-right">
              <span class="xp-badge">{{ facade.totalXp() }} XP</span>
              <button
                type="button"
                class="close-btn"
                (click)="facade.closeEvaluationModal()"
                aria-label="Fechar painel de avaliação"
              >
                ✕
              </button>
            </div>
          </header>

          <!-- Barra de Progresso de Nível -->
          <div class="level-bar-wrap">
            <div class="level-track">
              <div
                class="level-fill"
                [style.width.%]="facade.technicianLevel().progressPercent"
              ></div>
            </div>
            <span class="level-meta">
              @if (facade.technicianLevel().nextLevelXp; as nextXp) {
                {{ facade.totalXp() }} / {{ nextXp }} XP para o próximo nível
              } @else {
                Nível máximo atingido!
              }
            </span>
          </div>

          <nav class="modal-tabs" role="tablist">
            <button
              type="button"
              class="mtab-btn"
              [class.active]="activeTab() === 'report'"
              (click)="activeTab.set('report')"
            >
              Relatório
            </button>
            <button
              type="button"
              class="mtab-btn"
              [class.active]="activeTab() === 'challenges'"
              (click)="activeTab.set('challenges')"
            >
              Desafios
            </button>
            <button
              type="button"
              class="mtab-btn"
              [class.active]="activeTab() === 'ranking'"
              (click)="activeTab.set('ranking')"
            >
              Ranking & Histórico
            </button>
            <button
              type="button"
              class="mtab-btn"
              [class.active]="activeTab() === 'certificate'"
              (click)="activeTab.set('certificate')"
            >
              Certificado
            </button>
          </nav>

          <div class="modal-body">
            @if (activeTab() === 'report') {
              @if (facade.latestEvaluation(); as latest) {
                <section class="report-card">
                  <div class="report-top">
                    <div>
                      <span class="completed-kicker">MISSÃO CONCLUÍDA</span>
                      <h3>{{ latest.title }}</h3>
                    </div>
                    <span class="grade-circle" [attr.data-grade]="latest.grade">
                      {{ latest.grade }}
                    </span>
                  </div>

                  <div class="metrics-grid">
                    <div class="metric-box">
                      <span class="metric-label">Tempo</span>
                      <strong class="metric-val">{{ latest.formattedTime }}</strong>
                    </div>
                    <div class="metric-box">
                      <span class="metric-label">Erros</span>
                      <strong class="metric-val">{{ latest.errorsCount }}</strong>
                    </div>
                    <div class="metric-box">
                      <span class="metric-label">Dicas utilizadas</span>
                      <strong class="metric-val">{{ latest.hintsUsedCount }}</strong>
                    </div>
                    <div class="metric-box highlight">
                      <span class="metric-label">Precisão</span>
                      <strong class="metric-val">{{ latest.accuracyPercent }}%</strong>
                    </div>
                  </div>

                  <div class="domains-box">
                    <span class="domains-title">Você demonstrou domínio de:</span>
                    <div class="domains-grid">
                      @for (d of latest.masteredDomains; track d) {
                        <span class="domain-chip">✓ {{ d }}</span>
                      }
                    </div>
                  </div>

                  <div class="xp-earned">
                    Pontuação obtida: <strong>+{{ latest.scorePoints }} XP</strong>
                  </div>
                </section>
              } @else {
                <div class="empty-eval">
                  <p>
                    Nenhuma missão concluída ainda nesta bancada.
                  </p>
                  <p class="sub">
                    Complete os 9 itens da missão <strong>Monte o computador</strong> ou resolva um caso na aba <strong>Diagnóstico</strong> para gerar seu relatório de precisão e XP!
                  </p>
                </div>
              }
            } @else if (activeTab() === 'challenges') {
              <div class="challenges-list">
                @for (ch of facade.challenges(); track ch.id) {
                  <div class="challenge-card" [class.unlocked]="ch.unlocked">
                    <div class="ch-icon">{{ ch.unlocked ? '🏆' : '🔒' }}</div>
                    <div class="ch-meta">
                      <div class="ch-top">
                        <strong>{{ ch.title }}</strong>
                        <span class="ch-xp">+{{ ch.xpReward }} XP</span>
                      </div>
                      <p>{{ ch.description }}</p>
                    </div>
                  </div>
                }
              </div>
            } @else if (activeTab() === 'ranking') {
              <section class="rank-section">
                <div class="hist-header">
                  <h4>Ranking da Bancada</h4>
                  <div class="sort-toggle" role="group" aria-label="Ordenar ranking">
                    <button
                      type="button"
                      class="sort-btn"
                      [class.active]="facade.rankingSortMode() === 'speed'"
                      (click)="facade.setRankingSortMode('speed')"
                    >
                      ⏱ Velocidade
                    </button>
                    <button
                      type="button"
                      class="sort-btn"
                      [class.active]="facade.rankingSortMode() === 'xp'"
                      (click)="facade.setRankingSortMode('xp')"
                    >
                      🏆 Pontuação
                    </button>
                  </div>
                </div>
                <div class="rank-table">
                  @for (row of facade.ranking(); track row.name) {
                    <div class="rank-row" [class.me]="row.isCurrentUser">
                      <span class="rank-pos">#{{ row.rank }}</span>
                      <div class="rank-user">
                        <strong>{{ row.name }}</strong>
                        <span>{{ row.levelTitle }}</span>
                      </div>
                      <span class="rank-time" title="Melhor tempo de montagem">
                        ⏱ {{ row.formattedBestTime }}
                      </span>
                      <span class="rank-acc">{{ row.avgAccuracy }}%</span>
                      <span class="rank-xp">{{ row.totalXp }} XP</span>
                    </div>
                  }
                </div>
                <button
                  type="button"
                  class="switch-user-btn"
                  (click)="facade.closeEvaluationModal(); facade.openWelcomeModal()"
                >
                  👤 Trocar / Criar Novo Usuário para Competir
                </button>
              </section>

              <section class="rank-section">
                <div class="hist-header">
                  <h4>Histórico de Sessões ({{ facade.evaluationHistory().length }})</h4>
                  @if (facade.evaluationHistory().length > 0) {
                    <button
                      type="button"
                      class="clear-btn"
                      (click)="facade.clearGamificationHistory()"
                    >
                      Limpar Histórico
                    </button>
                  }
                </div>
                @if (facade.evaluationHistory().length === 0) {
                  <p class="empty-sub">Nenhuma sessão registrada ainda.</p>
                } @else {
                  <div class="history-list">
                    @for (item of facade.evaluationHistory(); track item.id) {
                      <div class="hist-row">
                        <div class="hist-main">
                          <strong>{{ item.title }}</strong>
                          <span>
                            Tempo {{ item.formattedTime }} · Erros {{ item.errorsCount }} · Dicas {{ item.hintsUsedCount }}
                          </span>
                        </div>
                        <span class="hist-acc">{{ item.accuracyPercent }}% ({{ item.grade }})</span>
                      </div>
                    }
                  </div>
                }
              </section>
            } @else {
              <section class="cert-section">
                <label class="name-field">
                  <span>Nome do Técnico no Certificado:</span>
                  <input
                    type="text"
                    [value]="facade.playerName()"
                    (input)="onNameInput($event)"
                    placeholder="Seu nome completo"
                  />
                </label>

                <div class="certificate-card" [class.locked]="!facade.certificateEligible()">
                  <div class="cert-border">
                    <span class="cert-kicker">TECHBENCH 3D · CERTIFICADO INTERNO</span>
                    <h3 class="cert-heading">Proficiência em Hardware & Diagnóstico</h3>
                    <p class="cert-body">
                      Certificamos que <strong>{{ facade.playerName() || 'Técnico TechBench' }}</strong>
                      concluiu os módulos práticos de montagem 3D, arquitetura elétrica e troubleshooting
                      na plataforma <strong>PCWare IPM41-D3</strong>.
                    </p>

                    <div class="cert-stats">
                      <span>Nível: <strong>{{ facade.technicianLevel().title }}</strong></span>
                      <span>XP Acumulado: <strong>{{ facade.totalXp() }} XP</strong></span>
                    </div>

                    @if (facade.masteredDomains().length > 0) {
                      <div class="domains-grid center">
                        @for (d of facade.masteredDomains(); track d) {
                          <span class="domain-chip">✓ {{ d }}</span>
                        }
                      </div>
                    }

                    @if (!facade.certificateEligible()) {
                      <div class="cert-lock-note">
                        🔒 Para desbloquear o selo oficial, conclua pelo menos <strong>1 Montagem Completa</strong> e <strong>1 Caso de Diagnóstico</strong>.
                      </div>
                    } @else {
                      <div class="cert-verified">
                        ✓ Certificado Interno Validado · Código TB3D-{{ facade.totalXp() }}
                      </div>
                    }
                  </div>
                </div>

                @if (facade.certificateEligible()) {
                  <button type="button" class="print-btn" (click)="printCertificate()">
                    Imprimir / Salvar Certificado (PDF)
                  </button>
                }
              </section>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 50;
      background: rgba(2, 6, 23, 0.78);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-shell {
      width: min(640px, 100%);
      max-height: 88vh;
      background: #0f172a;
      border: 1px solid rgba(56, 189, 248, 0.32);
      border-radius: 10px;
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
    }

    .modal-header {
      padding: 0.9rem 1.1rem 0.6rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .kicker {
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #38bdf8;
    }

    .modal-title {
      margin: 0.15rem 0 0;
      font-size: 1.05rem;
      color: #f8fafc;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .xp-badge {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.78rem;
      font-weight: 700;
      color: #fde047;
      background: rgba(234, 179, 8, 0.16);
      border: 1px solid rgba(234, 179, 8, 0.45);
      padding: 0.22rem 0.55rem;
      border-radius: 999px;
    }

    .close-btn {
      appearance: none;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.25);
      background: rgba(30, 41, 59, 0.7);
      color: #cbd5e1;
      cursor: pointer;
    }

    .level-bar-wrap {
      padding: 0 1.1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.28rem;
    }

    .level-track {
      height: 6px;
      border-radius: 999px;
      background: rgba(148, 163, 184, 0.2);
      overflow: hidden;
    }

    .level-fill {
      height: 100%;
      background: linear-gradient(90deg, #38bdf8, #22c55e);
    }

    .level-meta {
      font-size: 0.7rem;
      color: #94a3b8;
    }

    .modal-tabs {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      border-top: 1px solid rgba(148, 163, 184, 0.16);
      border-bottom: 1px solid rgba(148, 163, 184, 0.16);
      background: #111827;
    }

    .mtab-btn {
      appearance: none;
      border: none;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: #94a3b8;
      font-size: 0.76rem;
      font-weight: 600;
      padding: 0.65rem 0.4rem;
      cursor: pointer;
    }

    .mtab-btn.active {
      color: #38bdf8;
      border-bottom-color: #38bdf8;
      background: rgba(14, 165, 233, 0.08);
    }

    .modal-body {
      padding: 1rem 1.1rem 1.2rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .report-card {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(34, 197, 94, 0.45);
      border-radius: 8px;
      padding: 0.95rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .report-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .completed-kicker {
      font-size: 0.66rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      color: #4ade80;
    }

    .report-top h3 {
      margin: 0.15rem 0 0;
      font-size: 1rem;
      color: #f8fafc;
    }

    .grade-circle {
      width: 44px;
      height: 44px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 900;
      border: 2px solid #22c55e;
      color: #4ade80;
      background: rgba(34, 197, 94, 0.14);
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
    }

    .metric-box {
      background: rgba(30, 41, 59, 0.65);
      border: 1px solid rgba(148, 163, 184, 0.15);
      border-radius: 6px;
      padding: 0.5rem 0.6rem;
      display: flex;
      flex-direction: column;
      gap: 0.18rem;
    }

    .metric-box.highlight {
      border-color: rgba(56, 189, 248, 0.5);
      background: rgba(14, 165, 233, 0.15);
    }

    .metric-label {
      font-size: 0.66rem;
      color: #94a3b8;
    }

    .metric-val {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.98rem;
      color: #f8fafc;
    }

    .domains-box {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .domains-title {
      font-size: 0.76rem;
      color: #cbd5e1;
      font-weight: 600;
    }

    .domains-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .domains-grid.center {
      justify-content: center;
    }

    .domain-chip {
      font-size: 0.72rem;
      font-weight: 700;
      color: #86efac;
      background: rgba(22, 163, 74, 0.18);
      border: 1px solid rgba(74, 222, 128, 0.4);
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
    }

    .xp-earned {
      font-size: 0.8rem;
      color: #fde68a;
      text-align: right;
    }

    .empty-eval {
      text-align: center;
      padding: 1.5rem 1rem;
      color: #cbd5e1;
      font-size: 0.85rem;
    }

    .empty-eval .sub {
      color: #94a3b8;
      font-size: 0.78rem;
    }

    .challenges-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .challenge-card {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.65rem 0.78rem;
      border-radius: 6px;
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(148, 163, 184, 0.14);
      opacity: 0.7;
    }

    .challenge-card.unlocked {
      opacity: 1;
      border-color: rgba(234, 179, 8, 0.55);
      background: rgba(234, 179, 8, 0.1);
    }

    .ch-icon {
      font-size: 1.3rem;
    }

    .ch-meta {
      flex: 1;
    }

    .ch-top {
      display: flex;
      justify-content: space-between;
      font-size: 0.82rem;
      color: #f8fafc;
    }

    .ch-xp {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.72rem;
      color: #fde047;
    }

    .ch-meta p {
      margin: 0.2rem 0 0;
      font-size: 0.73rem;
      color: #94a3b8;
    }

    .rank-section h4 {
      margin: 0 0 0.5rem;
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #94a3b8;
    }

    .rank-table,
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .rank-row,
    .hist-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.65rem;
      padding: 0.5rem 0.68rem;
      border-radius: 6px;
      background: rgba(30, 41, 59, 0.52);
      border: 1px solid rgba(148, 163, 184, 0.12);
      font-size: 0.78rem;
    }

    .rank-row.me {
      border-color: #38bdf8;
      background: rgba(14, 165, 233, 0.16);
    }

    .rank-pos {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 800;
      color: #38bdf8;
      width: 28px;
    }

    .rank-user,
    .hist-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .rank-user span,
    .hist-main span {
      font-size: 0.68rem;
      color: #94a3b8;
    }

    .rank-acc,
    .hist-acc {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.75rem;
      color: #86efac;
    }

    .rank-time {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.74rem;
      color: #7dd3fc;
      white-space: nowrap;
    }

    .sort-toggle {
      display: inline-flex;
      gap: 0.2rem;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 5px;
      padding: 0.14rem;
    }

    .sort-btn {
      appearance: none;
      border: none;
      background: transparent;
      color: #94a3b8;
      font-size: 0.67rem;
      font-weight: 600;
      padding: 0.22rem 0.48rem;
      border-radius: 4px;
      cursor: pointer;
    }

    .sort-btn.active {
      background: rgba(14, 165, 233, 0.25);
      color: #38bdf8;
    }

    .switch-user-btn {
      appearance: none;
      margin-top: 0.55rem;
      width: 100%;
      padding: 0.45rem 0.7rem;
      border-radius: 6px;
      border: 1px dashed rgba(56, 189, 248, 0.4);
      background: rgba(14, 165, 233, 0.08);
      color: #7dd3fc;
      font-size: 0.74rem;
      font-weight: 600;
      cursor: pointer;
    }

    .rank-xp {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 700;
      color: #fde047;
    }

    .hist-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .clear-btn {
      appearance: none;
      border: 1px solid rgba(248, 113, 113, 0.35);
      background: rgba(127, 29, 29, 0.25);
      color: #fecaca;
      font-size: 0.66rem;
      padding: 0.18rem 0.45rem;
      border-radius: 4px;
      cursor: pointer;
    }

    .empty-sub {
      margin: 0;
      font-size: 0.76rem;
      color: #94a3b8;
    }

    .cert-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .name-field {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      font-size: 0.74rem;
      color: #94a3b8;
    }

    .name-field input {
      padding: 0.48rem 0.65rem;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.25);
      background: #111827;
      color: #f8fafc;
      font-size: 0.82rem;
    }

    .certificate-card {
      padding: 0.45rem;
      border-radius: 8px;
      background: linear-gradient(135deg, #1e293b, #0f172a);
      border: 2px solid #eab308;
    }

    .certificate-card.locked {
      border-color: rgba(148, 163, 184, 0.3);
      opacity: 0.82;
    }

    .cert-border {
      border: 1px dashed rgba(234, 179, 8, 0.45);
      border-radius: 6px;
      padding: 1rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .cert-kicker {
      font-size: 0.64rem;
      font-weight: 800;
      letter-spacing: 0.12em;
      color: #fde047;
    }

    .cert-heading {
      margin: 0;
      font-size: 1.1rem;
      color: #f8fafc;
    }

    .cert-body {
      margin: 0;
      font-size: 0.8rem;
      line-height: 1.5;
      color: #cbd5e1;
    }

    .cert-stats {
      display: flex;
      justify-content: center;
      gap: 1.25rem;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .cert-lock-note {
      font-size: 0.73rem;
      color: #fde68a;
      background: rgba(120, 53, 15, 0.35);
      padding: 0.45rem 0.6rem;
      border-radius: 5px;
    }

    .cert-verified {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.72rem;
      color: #4ade80;
    }

    .print-btn {
      appearance: none;
      width: 100%;
      padding: 0.6rem 0.9rem;
      border-radius: 6px;
      border: 1px solid rgba(56, 189, 248, 0.55);
      background: rgba(14, 165, 233, 0.22);
      color: #e0f2fe;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
    }

    @media (max-width: 560px) {
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `,
})
export class EvaluationModalComponent {
  protected readonly facade = inject(WorkbenchFacade);
  protected readonly activeTab = signal<ModalTab>('report');

  protected onNameInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.facade.setPlayerName(value);
  }

  protected printCertificate(): void {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      window.print();
    }
  }
}
