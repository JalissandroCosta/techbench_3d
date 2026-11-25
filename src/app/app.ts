import { Component, inject, signal } from '@angular/core';
import { EquipmentSelectorModalComponent } from './features/workbench/equipment-selector-modal/equipment-selector-modal.component';
import { EvaluationModalComponent } from './features/workbench/evaluation-modal/evaluation-modal.component';
import { InspectorSidebarComponent } from './features/workbench/inspector-sidebar/inspector-sidebar.component';
import { MobileOrientationBannerComponent } from './features/workbench/mobile-orientation-banner/mobile-orientation-banner.component';
import { Viewport3DComponent } from './features/workbench/viewport-3d/viewport-3d.component';
import { WelcomeModalComponent } from './features/workbench/welcome-modal/welcome-modal.component';
import { VisitCounterService } from './state/visit-counter.service';
import { WorkbenchFacade } from './state/workbench.facade';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Viewport3DComponent,
    InspectorSidebarComponent,
    EvaluationModalComponent,
    EquipmentSelectorModalComponent,
    MobileOrientationBannerComponent,
    WelcomeModalComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly facade = inject(WorkbenchFacade);
  protected readonly visits = inject(VisitCounterService);
  protected readonly mobileSheetOpen = signal<boolean>(false);

  protected toggleMobileSheet(): void {
    this.mobileSheetOpen.update((open) => !open);
  }
}
