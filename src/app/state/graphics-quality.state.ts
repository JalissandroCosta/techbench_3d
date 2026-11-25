import { Injectable, computed, signal } from '@angular/core';
import {
  DeviceCapabilities,
  GraphicsQualityPreset,
  ResolvedGraphicsSettings,
  resolveGraphicsSettings,
} from '../domain/graphics/graphics-quality.engine';

const PRESET_CYCLE: readonly GraphicsQualityPreset[] = ['auto', 'low', 'medium', 'high'];

@Injectable({ providedIn: 'root' })
export class GraphicsQualityStateService {
  readonly preset = signal<GraphicsQualityPreset>('auto');

  private readonly capabilities: DeviceCapabilities = this.detectCapabilities();

  readonly resolvedSettings = computed<ResolvedGraphicsSettings>(() =>
    resolveGraphicsSettings(this.preset(), this.capabilities)
  );

  setPreset(preset: GraphicsQualityPreset): void {
    this.preset.set(preset);
  }

  cyclePreset(): void {
    const idx = PRESET_CYCLE.indexOf(this.preset());
    const next = PRESET_CYCLE[(idx + 1) % PRESET_CYCLE.length];
    this.preset.set(next);
  }

  private detectCapabilities(): DeviceCapabilities {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return { isMobile: false, devicePixelRatio: 1, hardwareConcurrency: 4 };
    }
    const coarsePointer =
      typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    const narrowScreen = window.innerWidth <= 900;
    return {
      isMobile: coarsePointer || narrowScreen,
      devicePixelRatio: window.devicePixelRatio || 1,
      hardwareConcurrency: navigator.hardwareConcurrency || 4,
    };
  }
}
