import { Component, inject } from '@angular/core';
import { WorkbenchFacade } from '../../../state/workbench.facade';

/**
 * Aba dedicada de Conexões e Auditoria de Conectores Livres (extraída na Etapa 5).
 */
@Component({
  selector: 'app-connections-tab',
  standalone: true,
  template: `
    <div class="connections-view">
      <div class="cable-mode-banner">
        <strong>Modo Cabeamento Manual Ativo</strong>
        <p>
          Clique nas <strong>esferas sinalizadas na Fonte, Placa-Mãe, SSD ou HD</strong> (Origem → Destino verde destacado) para ligar manualmente, ou use os botões abaixo.
        </p>
        @if (facade.pendingSourcePort(); as pending) {
          <div class="pending-port-pill">
            Origem ativa: <strong>{{ pending.shortLabel }}</strong> · Clique no destino destacado em verde no 3D!
          </div>
        }
      </div>

      <section class="group-section">
        <div class="group-header-row">
          <h3 class="group-title">
            Conexões Essenciais ({{ facade.coreConnectionsCompletedCount() }}/4)
          </h3>
          @if (facade.connections().length > 0) {
            <button type="button" class="mini-reset-btn" (click)="facade.resetAssembly()">
              Limpar
            </button>
          }
        </div>

        <div class="connection-cards">
          @for (bp of facade.connectionBlueprints(); track bp.id) {
            <div class="conn-card" [class.connected]="facade.isBlueprintConnected(bp.id)">
              <div class="conn-card-top">
                <span class="conn-dot" [style.background]="bp.colorHex"></span>
                <div class="conn-title-wrap">
                  <span class="conn-name">{{ bp.name }}</span>
                  <span class="conn-sub">
                    {{ bp.kind === 'power' ? 'Energia' : bp.kind === 'data' ? 'Dados' : 'Controle' }}
                    · {{ bp.connectorLabel }}
                  </span>
                </div>
              </div>

              <div class="conn-actions">
                @if (facade.isBlueprintConnected(bp.id)) {
                  <button
                    type="button"
                    class="conn-btn inspect"
                    (click)="facade.selectConnection(bp.id)"
                  >
                    Inspecionar
                  </button>
                  <button
                    type="button"
                    class="conn-btn disconnect"
                    (click)="facade.disconnectCable(bp.id)"
                  >
                    Desconectar
                  </button>
                } @else {
                  <button
                    type="button"
                    class="conn-btn guide"
                    (click)="facade.handlePortClick(bp.sourcePortId)"
                    title="Destacar Origem e Destino no 3D para conectar manualmente"
                  >
                    Sinalizar 3D
                  </button>
                  <button
                    type="button"
                    class="conn-btn connect"
                    (click)="facade.connectPorts(bp.sourcePortId, bp.targetPortId)"
                  >
                    Conectar
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </section>

      <section class="group-section">
        <h3 class="group-title">⚡ Especificações das Saídas da Fonte ATX</h3>
        <p class="unused-intro">
          Cada saída da fonte possui <strong>pinagem, tensões e chaveamento físico próprios</strong> para evitar erros na energização:
        </p>
        <div class="psu-spec-list">
          @for (spec of facade.psuConnectorSpecs(); track spec.id) {
            <div class="psu-spec-card" [style.border-left-color]="spec.colorHex">
              <div class="psu-spec-top">
                <strong>{{ spec.name }}</strong>
                <span class="psu-spec-badge" [style.color]="spec.colorHex">{{ spec.badge }}</span>
              </div>
              <div class="psu-spec-row"><span>Tensões:</span> {{ spec.voltages }}</div>
              <div class="psu-spec-row"><span>Potência:</span> {{ spec.maxWattage }}</div>
              <div class="psu-spec-row"><span>Pinagem:</span> {{ spec.pinoutSummary }}</div>
              <div class="psu-spec-row"><span>Diferença física:</span> {{ spec.physicalDifference }}</div>
              <div class="psu-spec-warn">⚠ {{ spec.criticalWarning }}</div>
            </div>
          }
        </div>
      </section>

      <section class="group-section">
        <h3 class="group-title">Conectores Disponíveis sem Uso (Normal)</h3>
        <p class="unused-intro">
          <strong>Conector disponível ≠ Conector necessário.</strong> Os itens abaixo podem permanecer livres sem impedir o funcionamento:
        </p>
        <div class="unused-list">
          @for (item of facade.unusedAllowedConnectors(); track item.id) {
            <div class="unused-card">
              <div class="unused-top">
                <strong>{{ item.name }}</strong>
                <span class="unused-class">{{ item.domainClass }}</span>
              </div>
              <p>{{ item.whyUnusedIsAcceptable }}</p>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    .cable-mode-banner {
      background: rgba(14, 165, 233, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 6px;
      padding: 0.65rem 0.75rem;
      margin-bottom: 0.9rem;
      font-size: 0.75rem;
      line-height: 1.45;
      color: #cbd5e1;
    }

    .cable-mode-banner strong {
      color: #38bdf8;
    }

    .cable-mode-banner p {
      margin: 0.25rem 0 0;
    }

    .pending-port-pill {
      margin-top: 0.45rem;
      padding: 0.3rem 0.5rem;
      border-radius: 4px;
      background: rgba(56, 189, 248, 0.2);
      color: #e0f2fe;
      font-size: 0.72rem;
    }

    .group-section {
      margin-bottom: 1rem;
    }

    .group-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.45rem;
    }

    .group-title {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
      margin: 0 0 0.4rem;
    }

    .group-header-row .group-title {
      margin: 0;
    }

    .mini-reset-btn {
      appearance: none;
      border: 1px solid rgba(248, 113, 113, 0.35);
      background: rgba(127, 29, 29, 0.25);
      color: #fecaca;
      font-size: 0.66rem;
      font-weight: 600;
      padding: 0.14rem 0.45rem;
      border-radius: 4px;
      cursor: pointer;
    }

    .connection-cards {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .conn-card {
      background: rgba(30, 41, 59, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.14);
      border-radius: 6px;
      padding: 0.6rem 0.7rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .conn-card.connected {
      border-color: rgba(34, 197, 94, 0.48);
      background: rgba(6, 78, 59, 0.22);
    }

    .conn-card-top {
      display: flex;
      align-items: center;
      gap: 0.55rem;
    }

    .conn-dot {
      width: 9px;
      height: 9px;
      border-radius: 999px;
      flex-shrink: 0;
    }

    .conn-title-wrap {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .conn-name {
      font-size: 0.79rem;
      font-weight: 600;
      color: #f8fafc;
    }

    .conn-sub {
      font-size: 0.68rem;
      color: #94a3b8;
    }

    .conn-actions {
      display: flex;
      gap: 0.4rem;
    }

    .conn-btn {
      appearance: none;
      flex: 1;
      padding: 0.35rem 0.55rem;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
    }

    .conn-btn.connect {
      background: rgba(14, 165, 233, 0.2);
      border-color: rgba(56, 189, 248, 0.45);
      color: #e0f2fe;
    }

    .conn-btn.guide {
      background: rgba(245, 158, 11, 0.16);
      border-color: rgba(251, 191, 36, 0.42);
      color: #fde68a;
    }

    .psu-spec-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .psu-spec-card {
      background: rgba(15, 23, 42, 0.72);
      border: 1px solid rgba(148, 163, 184, 0.16);
      border-left: 3px solid #38bdf8;
      border-radius: 6px;
      padding: 0.55rem 0.65rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.7rem;
      line-height: 1.4;
      color: #cbd5e1;
    }

    .psu-spec-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
    }

    .psu-spec-top strong {
      color: #f8fafc;
      font-size: 0.75rem;
    }

    .psu-spec-badge {
      font-size: 0.64rem;
      font-weight: 700;
      text-transform: uppercase;
    }

    .psu-spec-row span {
      color: #94a3b8;
      font-weight: 600;
    }

    .psu-spec-warn {
      margin-top: 0.15rem;
      padding: 0.28rem 0.42rem;
      border-radius: 4px;
      background: rgba(127, 29, 29, 0.28);
      border: 1px solid rgba(248, 113, 113, 0.28);
      color: #fecaca;
      font-size: 0.68rem;
    }

    .conn-btn.inspect {
      background: rgba(34, 197, 94, 0.2);
      border-color: rgba(34, 197, 94, 0.45);
      color: #dcfce7;
    }

    .conn-btn.disconnect {
      background: rgba(220, 38, 38, 0.18);
      border-color: rgba(248, 113, 113, 0.4);
      color: #fecaca;
    }

    .unused-intro {
      margin: 0 0 0.5rem;
      font-size: 0.72rem;
      line-height: 1.4;
      color: #94a3b8;
    }

    .unused-list {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .unused-card {
      padding: 0.5rem 0.6rem;
      border-radius: 6px;
      background: rgba(15, 23, 42, 0.65);
      border: 1px dashed rgba(148, 163, 184, 0.22);
      font-size: 0.72rem;
      color: #cbd5e1;
    }

    .unused-card p {
      margin: 0.22rem 0 0;
      line-height: 1.38;
      color: #94a3b8;
    }

    .unused-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
    }

    .unused-class {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.62rem;
      text-transform: uppercase;
      padding: 0.1rem 0.35rem;
      border-radius: 4px;
      background: rgba(56, 189, 248, 0.14);
      color: #7dd3fc;
    }
  `,
})
export class ConnectionsTabComponent {
  protected readonly facade = inject(WorkbenchFacade);
}
