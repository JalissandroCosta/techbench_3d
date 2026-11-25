export type GraphicsQualityPreset = 'auto' | 'low' | 'medium' | 'high';
export type EffectiveGraphicsTier = 'low' | 'medium' | 'high';

export interface DeviceCapabilities {
  readonly isMobile: boolean;
  readonly devicePixelRatio: number;
  readonly hardwareConcurrency: number;
}

export interface ResolvedGraphicsSettings {
  readonly preset: GraphicsQualityPreset;
  readonly effectiveTier: EffectiveGraphicsTier;
  readonly label: string;
  readonly maxPixelRatio: number;
  readonly shadowsEnabled: boolean;
  readonly shadowMapSize: 512 | 1024;
}

const TIER_PROFILES: Record<
  EffectiveGraphicsTier,
  Omit<ResolvedGraphicsSettings, 'preset' | 'effectiveTier'>
> = {
  low: {
    label: 'Baixo',
    maxPixelRatio: 1,
    shadowsEnabled: false,
    shadowMapSize: 512,
  },
  medium: {
    label: 'Médio',
    maxPixelRatio: 1.5,
    shadowsEnabled: true,
    shadowMapSize: 512,
  },
  high: {
    label: 'Alto',
    maxPixelRatio: 2,
    shadowsEnabled: true,
    shadowMapSize: 1024,
  },
};

/**
 * Motor headless de Qualidade Gráfica Adaptativa (Seção 22).
 * Prioriza FPS estável, baixo consumo de VRAM e autonomia de bateria em dispositivos móveis.
 */
export function resolveGraphicsSettings(
  preset: GraphicsQualityPreset,
  caps: DeviceCapabilities
): ResolvedGraphicsSettings {
  let tier: EffectiveGraphicsTier;

  if (preset === 'auto') {
    if (caps.isMobile && caps.hardwareConcurrency <= 4) {
      tier = 'low';
    } else if (caps.isMobile) {
      tier = 'medium';
    } else {
      tier = 'high';
    }
  } else {
    tier = preset;
  }

  const profile = TIER_PROFILES[tier];
  const clampedDpr = Math.min(Math.max(caps.devicePixelRatio || 1, 1), profile.maxPixelRatio);

  return {
    preset,
    effectiveTier: tier,
    label: preset === 'auto' ? `Auto (${profile.label})` : profile.label,
    maxPixelRatio: clampedDpr,
    shadowsEnabled: profile.shadowsEnabled,
    shadowMapSize: profile.shadowMapSize,
  };
}
