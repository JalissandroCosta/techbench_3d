import { Component, signal } from '@angular/core';

/**
 * Orientação amigável não bloqueante para smartphones em modo retrato (Seção 19).
 * Exibida apenas via media query (max-width: 767px) and (orientation: portrait).
 */
@Component({
  selector: 'app-mobile-orientation-banner',
  standalone: true,
  template: `
    @if (!dismissed()) {
      <div class="portrait-overlay" role="dialog" aria-label="Recomendação de orientação paisagem">
        <div class="portrait-card">
          <div class="rotate-icon" aria-hidden="true">📱 ↻</div>
          <h3>Modo paisagem recomendado</h3>
          <p>
            Para uma melhor experiência de montagem 3D, recomendamos utilizar o dispositivo em modo paisagem.
          </p>
          <button type="button" class="continue-btn" (click)="dismissed.set(true)">
            Continuar mesmo assim
          </button>
        </div>
      </div>
    }
  `,
  styles: `
    .portrait-overlay {
      display: none;
    }

    @media (max-width: 767px) and (orientation: portrait) {
      .portrait-overlay {
        position: fixed;
        inset: 0;
        z-index: 60;
        background: rgba(2, 6, 23, 0.84);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.25rem;
      }
    }

    .portrait-card {
      width: min(340px, 100%);
      background: #0f172a;
      border: 1px solid rgba(56, 189, 248, 0.45);
      border-radius: 12px;
      padding: 1.35rem 1.2rem;
      text-align: center;
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.7rem;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
    }

    .rotate-icon {
      font-size: 2rem;
      line-height: 1;
    }

    .portrait-card h3 {
      margin: 0;
      font-size: 1rem;
      color: #f8fafc;
    }

    .portrait-card p {
      margin: 0;
      font-size: 0.82rem;
      line-height: 1.5;
      color: #cbd5e1;
    }

    .continue-btn {
      appearance: none;
      width: 100%;
      margin-top: 0.25rem;
      padding: 0.62rem 1rem;
      border-radius: 8px;
      border: 1px solid rgba(56, 189, 248, 0.55);
      background: rgba(14, 165, 233, 0.22);
      color: #e0f2fe;
      font-size: 0.84rem;
      font-weight: 700;
      cursor: pointer;
    }
  `,
})
export class MobileOrientationBannerComponent {
  protected readonly dismissed = signal<boolean>(false);
}
