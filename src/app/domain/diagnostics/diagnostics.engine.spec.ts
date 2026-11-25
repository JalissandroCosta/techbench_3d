import { describe, expect, it } from 'vitest';
import { INITIAL_ASSEMBLY_STATE } from '../assembly/assembly.models';
import { applyPlacement } from '../assembly/compatibility.engine';
import {
  BENCH_CONNECTION_BLUEPRINTS,
  evaluatePortConnection,
} from '../connections/connection.engine';
import { CableConnectionEntity } from '../connections/connection.models';
import {
  DIAGNOSTIC_CASES,
  evaluateSystemPost,
  findDiagnosticCaseById,
  inspectWorkbenchArea,
} from './diagnostics.engine';

function buildConnectionsFromIds(
  ids: readonly string[],
  assembly = INITIAL_ASSEMBLY_STATE
): CableConnectionEntity[] {
  const result: CableConnectionEntity[] = [];
  for (const id of ids) {
    const bp = BENCH_CONNECTION_BLUEPRINTS.find((b) => b.id === id);
    if (!bp) continue;
    const ev = evaluatePortConnection(bp.sourcePortId, bp.targetPortId, assembly, result);
    if (ev.valid && ev.connection) {
      result.push(ev.connection);
    }
  }
  return result;
}

describe('diagnostics.engine — Laboratório de Troubleshooting & POST (Sprint 9)', () => {
  it('falha no estágio correto para cada um dos 5 casos de defeito injetado', () => {
    expect(DIAGNOSTIC_CASES.length).toBe(5);

    const c1 = findDiagnosticCaseById('case-no-video-cpu4p')!;
    const p1 = evaluateSystemPost(c1.initialAssembly, buildConnectionsFromIds(c1.initialConnectionIds, c1.initialAssembly));
    expect(p1.passed).toBe(false);
    expect(p1.reachedStage).toBe('CPU_INIT');
    expect(p1.fansSpinning).toBe(true);
    expect(p1.monitorOutput).toBe('NO_SIGNAL');

    const c2 = findDiagnosticCaseById('case-no-video-ram-missing')!;
    const p2 = evaluateSystemPost(c2.initialAssembly, buildConnectionsFromIds(c2.initialConnectionIds, c2.initialAssembly));
    expect(p2.passed).toBe(false);
    expect(p2.reachedStage).toBe('DRAM_INIT');
    expect(p2.beepDescription).toContain('3 beeps');

    const c3 = findDiagnosticCaseById('case-no-video-gpu-power')!;
    const p3 = evaluateSystemPost(c3.initialAssembly, buildConnectionsFromIds(c3.initialConnectionIds, c3.initialAssembly));
    expect(p3.passed).toBe(false);
    expect(p3.reachedStage).toBe('VGA_INIT');

    const c4 = findDiagnosticCaseById('case-no-boot-sata-data')!;
    const p4 = evaluateSystemPost(c4.initialAssembly, buildConnectionsFromIds(c4.initialConnectionIds, c4.initialAssembly));
    expect(p4.passed).toBe(false);
    expect(p4.reachedStage).toBe('BOOT_CHECK');
    expect(p4.monitorOutput).toBe('BIOS_NO_BOOT_DEVICE');

    const c5 = findDiagnosticCaseById('case-thermal-shutdown')!;
    const p5 = evaluateSystemPost(c5.initialAssembly, buildConnectionsFromIds(c5.initialConnectionIds, c5.initialAssembly));
    expect(p5.passed).toBe(false);
    expect(p5.monitorOutput).toBe('THERMAL_SHUTDOWN');
    expect(p5.cpuTempC).toBeGreaterThan(100);
  });

  it('aprova o POST quando o usuário corrige o defeito do Caso 1 conectando CPU 4P', () => {
    const c1 = findDiagnosticCaseById('case-no-video-cpu4p')!;
    const fixedConns = buildConnectionsFromIds(
      [...c1.initialConnectionIds, 'conn-cpu-4p'],
      c1.initialAssembly
    );
    const post = evaluateSystemPost(c1.initialAssembly, fixedConns);
    expect(post.passed).toBe(true);
    expect(post.reachedStage).toBe('POST_OK');
    expect(post.monitorOutput).toBe('POST_SUCCESS');
  });

  it('fornece medições realistas de investigação por subsistema', () => {
    const c4 = findDiagnosticCaseById('case-no-boot-sata-data')!;
    const conns = buildConnectionsFromIds(c4.initialConnectionIds, c4.initialAssembly);

    const powerReading = inspectWorkbenchArea('power', c4.initialAssembly, conns);
    expect(powerReading.status).toBe('normal');

    const storageReading = inspectWorkbenchArea('storage', c4.initialAssembly, conns);
    expect(storageReading.status).toBe('critical');
    expect(storageReading.reading).toContain('7P');

    // Caso de pasta térmica ausente
    const c5 = findDiagnosticCaseById('case-thermal-shutdown')!;
    const cpuReading = inspectWorkbenchArea('cpu', c5.initialAssembly, buildConnectionsFromIds(c5.initialConnectionIds, c5.initialAssembly));
    expect(cpuReading.status).toBe('critical');
    expect(cpuReading.reading).toContain('pasta');

    // Corrige aplicando pasta
    const withPaste = applyPlacement('component-thermal-paste', 'motherboard-cpu-socket', c5.initialAssembly);
    expect(inspectWorkbenchArea('cpu', withPaste, conns).status).toBe('normal');
  });
});
