import { describe, expect, it } from 'vitest';
import { resolveGraphicsSettings } from './graphics-quality.engine';

describe('graphics-quality.engine — Performance 3D Mobile (Seção 22)', () => {
  it('seleciona automaticamente perfil Baixo em smartphones com <= 4 núcleos', () => {
    const res = resolveGraphicsSettings('auto', {
      isMobile: true,
      devicePixelRatio: 3,
      hardwareConcurrency: 4,
    });
    expect(res.effectiveTier).toBe('low');
    expect(res.shadowsEnabled).toBe(false);
    expect(res.maxPixelRatio).toBe(1);
  });

  it('seleciona Médio em mobile moderno e Alto em desktop no modo Auto', () => {
    const mobileModern = resolveGraphicsSettings('auto', {
      isMobile: true,
      devicePixelRatio: 3,
      hardwareConcurrency: 8,
    });
    expect(mobileModern.effectiveTier).toBe('medium');
    expect(mobileModern.maxPixelRatio).toBe(1.5);

    const desktop = resolveGraphicsSettings('auto', {
      isMobile: false,
      devicePixelRatio: 2,
      hardwareConcurrency: 8,
    });
    expect(desktop.effectiveTier).toBe('high');
    expect(desktop.shadowsEnabled).toBe(true);
    expect(desktop.shadowMapSize).toBe(1024);
  });

  it('respeita override manual (low / medium / high)', () => {
    const manualLow = resolveGraphicsSettings('low', {
      isMobile: false,
      devicePixelRatio: 2,
      hardwareConcurrency: 16,
    });
    expect(manualLow.effectiveTier).toBe('low');
    expect(manualLow.shadowsEnabled).toBe(false);
  });
});
