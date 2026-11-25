import { Component, computed, inject } from '@angular/core';
import { HardwareRegionType, InspectableHardwareObject } from '../../../domain/models/hardware.models';
import { CatalogFilter, WorkbenchFacade } from '../../../state/workbench.facade';
import { ConnectionsTabComponent } from '../connections-tab/connections-tab.component';
import { DiagnosticsPanelComponent } from '../diagnostics-panel/diagnostics-panel.component';
import { ElectricalTabComponent } from '../electrical-tab/electrical-tab.component';
import { TechnicalInfoPanelComponent } from '../technical-info-panel/technical-info-panel.component';

interface RegionGroup {
  readonly type: HardwareRegionType;
  readonly title: string;
  readonly items: readonly InspectableHardwareObject[];
}

const REGION_TYPE_LABELS: Record<HardwareRegionType, string> = {
  motherboard: 'Placa-Mãe Base',
  'cpu-socket': 'Socket de Processador',
  'memory-slot': 'Slots de Memória',
  'expansion-slot': 'Slots de Expansão',
  'storage-connector': 'Armazenamento',
  'power-connector': 'Conectores de Energia',
  'fan-header': 'Refrigeração (FAN)',
  chipset: 'Chipset',
  'cmos-battery': 'BIOS / CMOS',
};

const GROUP_ORDER: readonly HardwareRegionType[] = [
  'motherboard',
  'cpu-socket',
  'memory-slot',
  'expansion-slot',
  'storage-connector',
  'power-connector',
  'fan-header',
  'chipset',
  'cmos-battery',
];

/**
 * Orquestrador limpo das 5 abas do painel lateral/bottom-sheet (refatorado na Etapa 5).
 */
@Component({
  selector: 'app-inspector-sidebar',
  standalone: true,
  imports: [
    TechnicalInfoPanelComponent,
    DiagnosticsPanelComponent,
    ConnectionsTabComponent,
    ElectricalTabComponent,
  ],
  template: `
    <aside class="sidebar" aria-label="Painel de componentes, conexões, elétrico, diagnóstico e informações">
      <div class="tabs tabs-5" role="tablist">
        <button
          type="button"
          role="tab"
          class="tab-btn"
          [class.active]="facade.activeTab() === 'components'"
          [attr.aria-selected]="facade.activeTab() === 'components'"
          (click)="facade.setActiveTab('components')"
        >
          Componentes
        </button>
        <button
          type="button"
          role="tab"
          class="tab-btn"
          [class.active]="facade.activeTab() === 'connections'"
          [attr.aria-selected]="facade.activeTab() === 'connections'"
          (click)="facade.setActiveTab('connections')"
        >
          Conexões
        </button>
        <button
          type="button"
          role="tab"
          class="tab-btn"
          [class.active]="facade.activeTab() === 'electrical'"
          [attr.aria-selected]="facade.activeTab() === 'electrical'"
          (click)="facade.setActiveTab('electrical')"
        >
          Elétrico
        </button>
        <button
          type="button"
          role="tab"
          class="tab-btn"
          [class.active]="facade.activeTab() === 'diagnostics'"
          [attr.aria-selected]="facade.activeTab() === 'diagnostics'"
          (click)="facade.setActiveTab('diagnostics')"
        >
          Diagnóstico
        </button>
        <button
          type="button"
          role="tab"
          class="tab-btn"
          [class.active]="facade.activeTab() === 'info'"
          [attr.aria-selected]="facade.activeTab() === 'info'"
          (click)="facade.setActiveTab('info')"
        >
          Informações
        </button>
      </div>

      <div class="panel-body">
        @if (facade.activeTab() === 'components') {
          <div class="components-list">
            @if (facade.benchComponents().length > 0) {
              <div class="filter-bar" role="group" aria-label="Filtrar catálogo">
                @for (f of filters; track f.id) {
                  <button
                    type="button"
                    class="filter-btn"
                    [class.active]="facade.catalogFilter() === f.id"
                    (click)="facade.setCatalogFilter(f.id)"
                  >
                    {{ f.label }}
                  </button>
                }
              </div>
            }

            @if (
              facade.benchComponents().length > 0 &&
              (facade.catalogFilter() === 'bench-components' || facade.catalogFilter() === 'all')
            ) {
              <section class="group-section">
                <div class="group-header-row">
                  <h3 class="group-title">
                    Peças da Bancada ESD ({{ facade.installedCount() }} montadas)
                  </h3>
                  @if (facade.installedCount() > 0) {
                    <button
                      type="button"
                      class="mini-reset-btn"
                      (click)="facade.resetAssembly()"
                    >
                      Resetar
                    </button>
                  }
                </div>
                <div class="group-items">
                  @for (comp of facade.benchComponents(); track comp.id) {
                    <button
                      type="button"
                      class="component-item"
                      [class.selected]="facade.selectedTargetId() === comp.id"
                      [class.hovered]="facade.hoveredTargetId() === comp.id"
                      (click)="facade.selectFromPanel(comp.id)"
                    >
                      <span class="accent-bar" [style.background]="comp.accentColor"></span>
                      <span class="item-meta">
                        <span class="item-name">{{ comp.shortLabel }}</span>
                        <code class="item-id">{{ comp.categoryLabel }}</code>
                      </span>
                      @if (facade.isComponentInstalled(comp.id)) {
                        <span class="installed-pill">✓</span>
                      }
                    </button>
                  }
                </div>
              </section>
            }

            @if (
              facade.benchComponents().length === 0 ||
              facade.catalogFilter() === 'motherboard-regions' ||
              facade.catalogFilter() === 'all'
            ) {
              @for (group of groupedRegions(); track group.type) {
                <section class="group-section">
                  <h3 class="group-title">{{ group.title }}</h3>
                  <div class="group-items">
                    @for (item of group.items; track item.id) {
                      <button
                        type="button"
                        class="component-item"
                        [class.selected]="facade.selectedTargetId() === item.id"
                        [class.hovered]="facade.hoveredTargetId() === item.id"
                        (click)="facade.selectFromPanel(item.id)"
                      >
                        <span class="accent-bar" [style.background]="item.accentColor"></span>
                        <span class="item-meta">
                          <span class="item-name">{{ item.shortLabel }}</span>
                          <code class="item-id">{{ item.id }}</code>
                        </span>
                      </button>
                    }
                  </div>
                </section>
              }
            }
          </div>
        } @else if (facade.activeTab() === 'connections') {
          <app-connections-tab />
        } @else if (facade.activeTab() === 'electrical') {
          <app-electrical-tab />
        } @else if (facade.activeTab() === 'diagnostics') {
          <app-diagnostics-panel />
        } @else {
          @if (facade.selectedDossier(); as dossier) {
            <app-technical-info-panel
              [dossier]="dossier"
              [canRemove]="canRemoveSelected(dossier.id, dossier.entityType)"
              (focusRequested)="facade.selectFromPanel(dossier.id)"
              (removeRequested)="handleRemoveSelected(dossier.id, dossier.entityType)"
              (backRequested)="
                facade.setActiveTab(
                  dossier.entityType === 'cable-connection' ? 'connections' : 'components'
                )
              "
            />
          } @else {
            <div class="empty-state">
              <p class="empty-title">Nenhum item selecionado</p>
              <p class="empty-desc">
                Toque ou clique em qualquer peça, região da placa-mãe ou cabo conectado na cena 3D para abrir o dossiê técnico completo.
              </p>
              <button
                type="button"
                class="action-btn"
                (click)="facade.setActiveTab('components')"
              >
                Abrir Lista de Componentes
              </button>
            </div>
          }
        }
      </div>
    </aside>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #111827;
      border-left: 1px solid rgba(148, 163, 184, 0.16);
      color: #e2e8f0;
    }

    .tabs {
      display: grid;
      border-bottom: 1px solid rgba(148, 163, 184, 0.16);
      background: #0f172a;
      flex-shrink: 0;
    }

    .tabs-5 {
      grid-template-columns: repeat(5, 1fr);
    }

    .tab-btn {
      appearance: none;
      border: none;
      border-bottom: 2px solid transparent;
      background: transparent;
      color: #94a3b8;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 0.72rem 0.15rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .tab-btn:hover {
      color: #e2e8f0;
      background: rgba(148, 163, 184, 0.06);
    }

    .tab-btn.active {
      color: #38bdf8;
      border-bottom-color: #38bdf8;
      background: rgba(14, 165, 233, 0.08);
    }

    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: 0.9rem 1rem;
    }

    .filter-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.3rem;
      margin-bottom: 0.95rem;
      background: rgba(15, 23, 42, 0.7);
      padding: 0.22rem;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.14);
    }

    .filter-btn {
      appearance: none;
      border: 1px solid transparent;
      background: transparent;
      color: #94a3b8;
      font-size: 0.72rem;
      font-weight: 600;
      padding: 0.35rem 0.4rem;
      border-radius: 4px;
      cursor: pointer;
    }

    .filter-btn.active {
      background: rgba(14, 165, 233, 0.2);
      border-color: rgba(56, 189, 248, 0.45);
      color: #38bdf8;
    }

    .group-section {
      margin-bottom: 1rem;
    }

    .group-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.4rem;
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

    .group-items {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .component-item {
      appearance: none;
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.5rem 0.65rem;
      border-radius: 6px;
      background: rgba(30, 41, 59, 0.55);
      border: 1px solid rgba(148, 163, 184, 0.12);
      color: #e2e8f0;
      text-align: left;
      cursor: pointer;
    }

    .component-item:hover,
    .component-item.hovered {
      background: rgba(56, 189, 248, 0.1);
      border-color: rgba(56, 189, 248, 0.35);
    }

    .component-item.selected {
      background: rgba(14, 165, 233, 0.18);
      border-color: #38bdf8;
    }

    .accent-bar {
      width: 4px;
      height: 26px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .item-meta {
      display: flex;
      flex-direction: column;
      min-width: 0;
      gap: 0.12rem;
    }

    .item-name {
      font-size: 0.82rem;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-id {
      font-size: 0.65rem;
      color: #94a3b8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    .installed-pill {
      margin-left: auto;
      font-size: 0.72rem;
      font-weight: 700;
      color: #4ade80;
      background: rgba(34, 197, 94, 0.16);
      border: 1px solid rgba(34, 197, 94, 0.45);
      border-radius: 999px;
      padding: 0.08rem 0.42rem;
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

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.65rem;
      padding: 1rem 0.25rem;
    }

    .empty-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: #f8fafc;
    }

    .empty-desc {
      margin: 0;
      font-size: 0.8rem;
      line-height: 1.5;
      color: #94a3b8;
    }
  `,
})
export class InspectorSidebarComponent {
  protected readonly facade = inject(WorkbenchFacade);

  protected readonly filters: readonly { id: CatalogFilter; label: string }[] = [
    { id: 'bench-components', label: 'Peças (9)' },
    { id: 'motherboard-regions', label: 'Placa-Mãe' },
    { id: 'all', label: 'Todos' },
  ];

  protected readonly groupedRegions = computed<readonly RegionGroup[]>(() => {
    const all = this.facade.motherboardRegions();
    return GROUP_ORDER.map((type) => ({
      type,
      title: REGION_TYPE_LABELS[type],
      items: all.filter((item) => item.type === type),
    })).filter((group) => group.items.length > 0);
  });

  protected canRemoveSelected(
    id: string,
    entityType: 'bench-component' | 'motherboard-region' | 'cable-connection'
  ): boolean {
    if (entityType === 'cable-connection') {
      return true;
    }
    if (entityType === 'bench-component') {
      return Boolean(this.facade.getInstalledSlotId(id));
    }
    return false;
  }

  protected handleRemoveSelected(
    id: string,
    entityType: 'bench-component' | 'motherboard-region' | 'cable-connection'
  ): void {
    if (entityType === 'cable-connection') {
      this.facade.disconnectCable(id);
    } else if (entityType === 'bench-component') {
      this.facade.attemptRemove(id);
    }
  }
}
