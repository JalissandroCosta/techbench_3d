import { Component, inject, signal } from '@angular/core';
import { VisitCounterService } from '../../../state/visit-counter.service';
import { WorkbenchFacade } from '../../../state/workbench.facade';

/**
 * Card de Boas-Vindas & Criação de Usuário Técnico (Onboarding).
 * Apresenta a imersão do TechBench 3D e permite criar/trocar o perfil salvo
 * no ranking de velocidade de montagem e pontuação.
 */
@Component({
  selector: 'app-welcome-modal',
  standalone: true,
  template: `
    @if (facade.welcomeModalOpen()) {
      <div class="welcome-backdrop" role="dialog" aria-modal="true" aria-label="Boas-vindas ao TechBench 3D">
        <div class="welcome-card">
          <div class="welcome-hero">
            <span class="hero-kicker">◆ TECHBENCH 3D · SIMULADOR DE HARDWARE</span>
            <h1>Bem-vindo à Bancada Interativa 3D</h1>
            <p class="hero-lead">
              Explore, monte e diagnostique computadores reais em 3D direto no navegador — sem risco de queimar peças, com regras reais de engenharia de hardware e eletrônica.
            </p>
          </div>

          <section class="academic-box" aria-label="Informações acadêmicas do projeto">
            <div class="academic-grid">
              <div><span class="ac-label">Curso</span><strong>Sistemas de Informação</strong></div>
              <div><span class="ac-label">Turma</span><strong>SIS261N01</strong></div>
              <div class="span-2">
                <span class="ac-label">Disciplina</span>
                <strong>Arquitetura e Organização de Computadores</strong>
              </div>
              <div class="span-2">
                <span class="ac-label">Professor</span>
                <strong>Nathaniel Simch de Morais</strong>
              </div>
              <div class="span-2">
                <span class="ac-label">Equipe (Alunos)</span>
                <strong>Jalissandro Costa · Breno · Emilly · Manuella Sales</strong>
              </div>
              @if (visits.visitCount(); as totalVisits) {
                <div class="span-2">
                  <span class="ac-label">Acessos na página</span>
                  <strong>👁 {{ totalVisits }} visitas registradas</strong>
                </div>
              }
            </div>
          </section>

          <div class="pillars-grid">
            <div class="pillar">
              <span class="pillar-icon">🧩</span>
              <strong>Montagem 3D Real</strong>
              <span>Encaixe CPU, Pasta Térmica, Cooler, RAM DDR3, GPU e cabos com validação de compatibilidade.</span>
            </div>
            <div class="pillar">
              <span class="pillar-icon">⚡</span>
              <strong>Elétrica & Monitor Boot</strong>
              <span>Visualize linhas +12V, +5V, +3.3V e Vcore em 3D e veja o POST real no mini monitor da bancada.</span>
            </div>
            <div class="pillar">
              <span class="pillar-icon">🔧</span>
              <strong>Diagnóstico & Ranking</strong>
              <span>Investigue 5 defeitos ocultos, meça sua velocidade de montagem e dispute o topo do ranking.</span>
            </div>
          </div>

          <form class="user-form" (submit)="onSubmit($event)">
            <label class="user-label" for="techbench-username">
              Crie seu usuário técnico para salvar <strong>pontuação</strong> e <strong>velocidade de montagem</strong> no ranking:
            </label>
            <div class="input-row">
              <input
                id="techbench-username"
                type="text"
                maxlength="28"
                [value]="draftName()"
                (input)="onNameInput($event)"
                placeholder="Ex.: Gabriel (Lab), Ana Téc..."
                autocomplete="off"
              />
              <button type="submit" class="start-btn">
                Começar na Bancada →
              </button>
            </div>
          </form>

          @if (facade.savedProfiles().length > 0) {
            <div class="saved-users">
              <span class="saved-label">Ou selecione um técnico salvo neste dispositivo:</span>
              <div class="saved-pills">
                @for (p of facade.savedProfiles(); track p.name) {
                  <button
                    type="button"
                    class="saved-pill"
                    (click)="selectExisting(p.name)"
                  >
                    👤 {{ p.name }} · {{ p.totalXp }} XP
                  </button>
                }
              </div>
            </div>
          }

          <div class="welcome-footer">
            <span class="tip">💡 Dica: no celular, use em modo paisagem para melhor imersão 3D.</span>
            <button type="button" class="guest-btn" (click)="enterAsGuest()">
              Entrar como Visitante
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .welcome-backdrop {
      position: fixed;
      inset: 0;
      z-index: 70;
      background: rgba(2, 6, 23, 0.84);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .welcome-card {
      width: min(640px, 100%);
      max-height: 92dvh;
      overflow-y: auto;
      background: linear-gradient(160deg, #0f172a 0%, #111827 100%);
      border: 1px solid rgba(56, 189, 248, 0.42);
      border-radius: 12px;
      padding: 1.35rem 1.4rem;
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 1.05rem;
      box-shadow: 0 28px 70px rgba(0, 0, 0, 0.72);
    }

    .hero-kicker {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: #38bdf8;
    }

    .welcome-hero h1 {
      margin: 0.25rem 0 0.45rem;
      font-size: 1.35rem;
      color: #f8fafc;
      line-height: 1.25;
    }

    .hero-lead {
      margin: 0;
      font-size: 0.84rem;
      line-height: 1.5;
      color: #cbd5e1;
    }

    .academic-box {
      background: rgba(15, 23, 42, 0.75);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-left: 3px solid #38bdf8;
      border-radius: 8px;
      padding: 0.68rem 0.82rem;
    }

    .academic-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.42rem 0.75rem;
      font-size: 0.74rem;
      color: #e2e8f0;
    }

    .academic-grid .span-2 {
      grid-column: span 2;
    }

    .ac-label {
      display: block;
      font-size: 0.61rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #38bdf8;
      font-weight: 700;
    }

    .pillars-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.6rem;
    }

    .pillar {
      background: rgba(30, 41, 59, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-radius: 8px;
      padding: 0.7rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.73rem;
      line-height: 1.4;
      color: #94a3b8;
    }

    .pillar-icon {
      font-size: 1.2rem;
    }

    .pillar strong {
      color: #f8fafc;
      font-size: 0.79rem;
    }

    .user-form {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
      background: rgba(14, 165, 233, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.28);
      border-radius: 8px;
      padding: 0.8rem 0.9rem;
    }

    .user-label {
      font-size: 0.78rem;
      color: #e0f2fe;
    }

    .input-row {
      display: flex;
      gap: 0.5rem;
    }

    .input-row input {
      flex: 1;
      min-width: 0;
      padding: 0.55rem 0.75rem;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.32);
      background: #0b0f17;
      color: #f8fafc;
      font-size: 0.86rem;
    }

    .input-row input:focus {
      outline: none;
      border-color: #38bdf8;
    }

    .start-btn {
      appearance: none;
      padding: 0.55rem 1rem;
      border-radius: 6px;
      border: 1px solid rgba(56, 189, 248, 0.7);
      background: linear-gradient(135deg, #0284c7, #0ea5e9);
      color: #f8fafc;
      font-size: 0.83rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }

    .start-btn:hover {
      filter: brightness(1.1);
    }

    .saved-users {
      display: flex;
      flex-direction: column;
      gap: 0.38rem;
    }

    .saved-label {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    .saved-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.38rem;
    }

    .saved-pill {
      appearance: none;
      padding: 0.3rem 0.6rem;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.25);
      background: rgba(30, 41, 59, 0.75);
      color: #e2e8f0;
      font-size: 0.73rem;
      font-weight: 600;
      cursor: pointer;
    }

    .saved-pill:hover {
      border-color: #38bdf8;
      color: #38bdf8;
    }

    .welcome-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding-top: 0.45rem;
      border-top: 1px solid rgba(148, 163, 184, 0.14);
      flex-wrap: wrap;
    }

    .tip {
      font-size: 0.72rem;
      color: #94a3b8;
    }

    .guest-btn {
      appearance: none;
      border: none;
      background: transparent;
      color: #94a3b8;
      font-size: 0.76rem;
      text-decoration: underline;
      cursor: pointer;
    }

    .guest-btn:hover {
      color: #f8fafc;
    }

    @media (max-width: 640px) {
      .pillars-grid {
        grid-template-columns: 1fr;
      }

      .input-row {
        flex-direction: column;
      }
    }
  `,
})
export class WelcomeModalComponent {
  protected readonly facade = inject(WorkbenchFacade);
  protected readonly visits = inject(VisitCounterService);
  protected readonly draftName = signal<string>('');

  protected onNameInput(event: Event): void {
    this.draftName.set((event.target as HTMLInputElement).value);
  }

  protected onSubmit(event: Event): void {
    event.preventDefault();
    this.facade.completeOnboarding(this.draftName());
  }

  protected selectExisting(name: string): void {
    this.facade.completeOnboarding(name);
  }

  protected enterAsGuest(): void {
    this.facade.completeOnboarding('Visitante TechBench');
  }
}
