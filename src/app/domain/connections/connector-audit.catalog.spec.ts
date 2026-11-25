import { describe, expect, it } from 'vitest';
import {
  BENCH_CONNECTOR_AUDIT,
  getConnectorsByDomainClass,
  getUnusedAllowedConnectors,
} from './connector-audit.catalog';

describe('connector-audit.catalog — Auditoria Física (Seção 18 & 27)', () => {
  it('diferencia explicitamente as 4 classes: energia, dados, expansão e refrigeração', () => {
    expect(getConnectorsByDomainClass('power').length).toBeGreaterThanOrEqual(5);
    expect(getConnectorsByDomainClass('data').length).toBeGreaterThanOrEqual(2);
    expect(getConnectorsByDomainClass('expansion').length).toBeGreaterThanOrEqual(2);
    expect(getConnectorsByDomainClass('cooling').length).toBeGreaterThanOrEqual(2);
  });

  it('ensina que Conector disponível ≠ Conector necessário com justificativa técnica', () => {
    const unusedAllowed = getUnusedAllowedConnectors();
    expect(unusedAllowed.length).toBeGreaterThanOrEqual(5);

    const ids = unusedAllowed.map((c) => c.id);
    expect(ids).toContain('audit-molex-4p');
    expect(ids).toContain('audit-sata-data-extra');
    expect(ids).toContain('audit-pci-legacy');
    expect(ids).toContain('audit-sys-fan');

    for (const entry of BENCH_CONNECTOR_AUDIT) {
      expect(entry.whyUnusedIsAcceptable.trim().length).toBeGreaterThan(15);
    }
  });
});
