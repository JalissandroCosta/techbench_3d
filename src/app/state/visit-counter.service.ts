import { Injectable, signal } from '@angular/core';

/**
 * Contador global de acessos na própria página para deploy estático (GitHub Pages).
 * Usa a API pública serverless Abacus (CORS + JSON, sem cadastro) com proteção
 * contra F5 repetido via sessionStorage e fallback silencioso offline/testes.
 */
@Injectable({ providedIn: 'root' })
export class VisitCounterService {
  private readonly namespace = 'techbench3d-sis261n01';
  private readonly key = 'visits';
  private readonly sessionFlag = 'techbench3d.visit.counted.v1';

  readonly visitCount = signal<number | null>(null);

  constructor() {
    void this.loadVisitCount();
  }

  private async loadVisitCount(): Promise<void> {
    try {
      if (typeof window === 'undefined' || typeof fetch === 'undefined') {
        return;
      }

      const host = window.location?.hostname ?? '';
      // Evita chamadas externas em testes unitários (jsdom)
      if (!host || host === 'localhost' && window.navigator?.userAgent?.includes('jsdom')) {
        return;
      }

      const alreadyCounted =
        typeof sessionStorage !== 'undefined' && sessionStorage.getItem(this.sessionFlag) === '1';

      // Em produção (GitHub Pages), incrementa 1x por sessão; em localhost apenas consulta
      const shouldIncrement = !alreadyCounted && host !== 'localhost' && host !== '127.0.0.1';
      const endpoint = shouldIncrement
        ? `https://abacus.jasoncameron.dev/hit/${this.namespace}/${this.key}`
        : `https://abacus.jasoncameron.dev/get/${this.namespace}/${this.key}`;

      const response = await fetch(endpoint, { method: 'GET' });
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { value?: unknown };
      if (typeof data.value === 'number' && Number.isFinite(data.value)) {
        this.visitCount.set(data.value);
        if (shouldIncrement && typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(this.sessionFlag, '1');
        }
      }
    } catch {
      // Silencioso quando offline ou bloqueado por extensão de privacidade
    }
  }
}
