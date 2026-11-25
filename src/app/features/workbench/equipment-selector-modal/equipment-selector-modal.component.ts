import { Component, inject, signal } from '@angular/core';
import {
  CustomEquipmentConfig,
  CustomFormFactor,
  CustomRamGen,
  CustomSocketType,
  CustomStorageType,
} from '../../../domain/equipment/equipment.models';
import { DEFAULT_CUSTOM_CONFIG } from '../../../domain/equipment/equipment.registry';
import { WorkbenchFacade } from '../../../state/workbench.facade';

/**
 * Modal de Seleção e Criação de Equipamentos (Sprint 11):
 * PCWare IPM41-D3, Dell OptiPlex 3070, Servidor Rack 1U, Notebook 14" e Equipamento Personalizado.
 */
@Component({
  selector: 'app-equipment-selector-modal',
  standalone: true,
  template: `
    @if (facade.equipmentModalOpen()) {
      <div class="modal-backdrop" (click)="facade.closeEquipmentModal()">
        <div
          class="modal-shell"
          role="dialog"
          aria-modal="true"
          aria-label="Selecionar equipamento da bancada 3D"
          (click)="$event.stopPropagation()"
        >
          <header class="modal-header">
            <div>
              <span class="kicker">ARQUITETURA DE EQUIPAMENTOS</span>
              <h2 class="modal-title">Escolher Plataforma de Hardware 3D</h2>
            </div>
            <button
              type="button"
              class="close-btn"
              (click)="facade.closeEquipmentModal()"
              aria-label="Fechar seletor de equipamentos"
            >
              ✕
            </button>
          </header>

          <div class="modal-body">
            <div class="equip-grid">
              @for (eq of facade.builtinEquipments(); track eq.id) {
                <button
                  type="button"
                  class="equip-card"
                  [class.active]="facade.activeEquipment().id === eq.id"
                  [style.--eq-accent]="eq.accentColor"
                  (click)="selectBuiltin(eq.id)"
                >
                  <div class="equip-top">
                    <span class="equip-cat" [style.color]="eq.accentColor">{{ eq.categoryLabel }}</span>
                    @if (facade.activeEquipment().id === eq.id) {
                      <span class="active-pill">Ativo</span>
                    }
                  </div>
                  <strong class="equip-name">{{ eq.name }}</strong>
                  <span class="equip-arch">{{ eq.architectureTag }}</span>
                  <p class="equip-desc">{{ eq.description }}</p>
                  <div class="equip-tags">
                    @for (tag of eq.highlights; track tag) {
                      <span class="equip-tag">{{ tag }}</span>
                    }
                  </div>
                </button>
              }
            </div>

            <!-- Construtor de Equipamento Personalizado -->
            <section class="custom-builder">
              <div class="custom-header">
                <span class="kicker">EQUIPAMENTO PERSONALIZADO</span>
                <h3>Gerar Bancada Customizada em Tempo Real</h3>
              </div>

              <div class="custom-form">
                <label class="field span-2">
                  <span>Nome do Equipamento</span>
                  <input
                    type="text"
                    [value]="customConfig().name"
                    (input)="updateName($event)"
                    placeholder="Ex.: Workstation AM5 Lab"
                  />
                </label>

                <label class="field">
                  <span>Formato PCB</span>
                  <select [value]="customConfig().formFactor" (change)="updateFormFactor($event)">
                    <option value="ATX">ATX (305×244 mm)</option>
                    <option value="Micro-ATX">Micro-ATX (244×244 mm)</option>
                    <option value="Mini-ITX">Mini-ITX (170×170 mm)</option>
                  </select>
                </label>

                <label class="field">
                  <span>Socket CPU</span>
                  <select [value]="customConfig().socket" (change)="updateSocket($event)">
                    <option value="LGA775">LGA775</option>
                    <option value="LGA1151">LGA1151</option>
                    <option value="LGA1700">LGA1700</option>
                    <option value="AM5">AM5</option>
                  </select>
                </label>

                <label class="field">
                  <span>Memória RAM</span>
                  <select [value]="customConfig().ramGeneration" (change)="updateRamGen($event)">
                    <option value="DDR3">DDR3 (1.5V)</option>
                    <option value="DDR4">DDR4 (1.2V)</option>
                    <option value="DDR5">DDR5 (1.1V)</option>
                  </select>
                </label>

                <label class="field">
                  <span>Slots DIMM</span>
                  <select [value]="customConfig().dimmSlots" (change)="updateDimmSlots($event)">
                    <option value="2">2 Slots</option>
                    <option value="4">4 Slots</option>
                  </select>
                </label>

                <label class="field">
                  <span>Armazenamento</span>
                  <select [value]="customConfig().storageType" (change)="updateStorage($event)">
                    <option value="M.2 NVMe">M.2 NVMe</option>
                    <option value="SATA">SATA (4× Portas)</option>
                  </select>
                </label>

                <label class="field">
                  <span>Cor da PCB</span>
                  <select [value]="customConfig().pcbColorHex" (change)="updatePcbColor($event)">
                    <option value="#1e293b">Preto Fosco (Moderno)</option>
                    <option value="#133b6e">Azul Clássico</option>
                    <option value="#14532d">Verde Enterprise</option>
                    <option value="#7f1d1d">Vermelho Gaming</option>
                  </select>
                </label>
              </div>

              <button type="button" class="build-custom-btn" (click)="launchCustom()">
                Gerar e Carregar Equipamento Personalizado no 3D
              </button>
            </section>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .modal-backdrop {
      position: fixed;
      inset: 0;
      z-index: 55;
      background: rgba(2, 6, 23, 0.8);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-shell {
      width: min(760px, 100%);
      max-height: 90vh;
      background: #0f172a;
      border: 1px solid rgba(56, 189, 248, 0.35);
      border-radius: 10px;
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.65);
    }

    .modal-header {
      padding: 0.9rem 1.1rem;
      border-bottom: 1px solid rgba(148, 163, 184, 0.16);
      display: flex;
      align-items: center;
      justify-content: space-between;
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

    .modal-body {
      padding: 1rem 1.1rem 1.2rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .equip-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.65rem;
    }

    .equip-card {
      appearance: none;
      text-align: left;
      padding: 0.78rem 0.85rem;
      border-radius: 8px;
      background: rgba(30, 41, 59, 0.52);
      border: 1px solid rgba(148, 163, 184, 0.16);
      color: #e2e8f0;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.32rem;
    }

    .equip-card:hover {
      border-color: var(--eq-accent, #38bdf8);
      background: rgba(56, 189, 248, 0.08);
    }

    .equip-card.active {
      border-color: var(--eq-accent, #38bdf8);
      background: rgba(14, 165, 233, 0.14);
    }

    .equip-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.4rem;
    }

    .equip-cat {
      font-size: 0.64rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .active-pill {
      font-size: 0.62rem;
      font-weight: 700;
      padding: 0.1rem 0.42rem;
      border-radius: 999px;
      background: rgba(34, 197, 94, 0.2);
      color: #4ade80;
    }

    .equip-name {
      font-size: 0.9rem;
      color: #f8fafc;
    }

    .equip-arch {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.68rem;
      color: #94a3b8;
    }

    .equip-desc {
      margin: 0.15rem 0 0;
      font-size: 0.73rem;
      line-height: 1.42;
      color: #cbd5e1;
    }

    .equip-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.28rem;
      margin-top: 0.25rem;
    }

    .equip-tag {
      font-size: 0.64rem;
      padding: 0.12rem 0.38rem;
      border-radius: 4px;
      background: rgba(15, 23, 42, 0.8);
      color: #94a3b8;
    }

    .custom-builder {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid rgba(56, 189, 248, 0.28);
      border-radius: 8px;
      padding: 0.85rem 0.95rem;
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
    }

    .custom-header h3 {
      margin: 0.15rem 0 0;
      font-size: 0.92rem;
      color: #f8fafc;
    }

    .custom-form {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.55rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.22rem;
      font-size: 0.7rem;
      color: #94a3b8;
    }

    .field.span-2 {
      grid-column: span 2;
    }

    .field input,
    .field select {
      padding: 0.42rem 0.52rem;
      border-radius: 5px;
      border: 1px solid rgba(148, 163, 184, 0.25);
      background: #111827;
      color: #f8fafc;
      font-size: 0.76rem;
    }

    .build-custom-btn {
      appearance: none;
      width: 100%;
      padding: 0.58rem 0.9rem;
      border-radius: 6px;
      border: 1px solid rgba(56, 189, 248, 0.55);
      background: rgba(14, 165, 233, 0.22);
      color: #e0f2fe;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
    }

    .build-custom-btn:hover {
      background: rgba(14, 165, 233, 0.35);
    }

    @media (max-width: 640px) {
      .equip-grid,
      .custom-form {
        grid-template-columns: 1fr;
      }

      .field.span-2 {
        grid-column: span 1;
      }
    }
  `,
})
export class EquipmentSelectorModalComponent {
  protected readonly facade = inject(WorkbenchFacade);
  protected readonly customConfig = signal<CustomEquipmentConfig>(DEFAULT_CUSTOM_CONFIG);

  protected selectBuiltin(id: string): void {
    this.facade.selectEquipment(id);
    this.facade.closeEquipmentModal();
  }

  protected updateName(event: Event): void {
    const name = (event.target as HTMLInputElement).value;
    this.customConfig.update((c) => ({ ...c, name }));
  }

  protected updateFormFactor(event: Event): void {
    const formFactor = (event.target as HTMLSelectElement).value as CustomFormFactor;
    this.customConfig.update((c) => ({ ...c, formFactor }));
  }

  protected updateSocket(event: Event): void {
    const socket = (event.target as HTMLSelectElement).value as CustomSocketType;
    this.customConfig.update((c) => ({ ...c, socket }));
  }

  protected updateRamGen(event: Event): void {
    const ramGeneration = (event.target as HTMLSelectElement).value as CustomRamGen;
    this.customConfig.update((c) => ({ ...c, ramGeneration }));
  }

  protected updateDimmSlots(event: Event): void {
    const dimmSlots = Number((event.target as HTMLSelectElement).value) === 2 ? 2 : 4;
    this.customConfig.update((c) => ({ ...c, dimmSlots }));
  }

  protected updateStorage(event: Event): void {
    const storageType = (event.target as HTMLSelectElement).value as CustomStorageType;
    this.customConfig.update((c) => ({ ...c, storageType }));
  }

  protected updatePcbColor(event: Event): void {
    const pcbColorHex = (event.target as HTMLSelectElement).value;
    this.customConfig.update((c) => ({ ...c, pcbColorHex }));
  }

  protected launchCustom(): void {
    this.facade.applyCustomEquipment(this.customConfig());
    this.facade.closeEquipmentModal();
  }
}
