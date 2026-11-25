import { TestBed } from '@angular/core/testing';
import { INITIAL_ASSEMBLY_STATE } from '../domain/assembly/assembly.models';
import { evaluateSystemPost } from '../domain/diagnostics/diagnostics.engine';
import { PostBuzzerService } from './post-buzzer.service';

describe('PostBuzzerService — Códigos de Bip AMI BIOS (Speaker)', () => {
  let service: PostBuzzerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostBuzzerService);
  });

  it('gera silêncio total quando não há energia ATX 24P (NO_POWER)', () => {
    const report = evaluateSystemPost(INITIAL_ASSEMBLY_STATE, []);
    const pattern = service.resolvePattern(report);
    expect(pattern.pulses.length).toBe(0);
  });

  it('gera 3 bips longos para falha DRAM (RAM ausente)', () => {
    const pattern = service.resolvePattern({
      passed: false,
      reachedStage: 'DRAM_INIT',
      monitorOutput: 'NO_SIGNAL',
      fansSpinning: true,
      beepDescription: '3 beeps longos',
      observableSymptom: '',
      stageStatuses: [],
      cpuTempC: 42,
    });
    expect(pattern.pulses.length).toBe(3);
    expect(pattern.pulses.every((p) => p.kind === 'long')).toBe(true);
  });

  it('gera 1 bip longo + 3 curtos para falha VGA (GPU sem PCIe 6P)', () => {
    const pattern = service.resolvePattern({
      passed: false,
      reachedStage: 'VGA_INIT',
      monitorOutput: 'NO_SIGNAL',
      fansSpinning: true,
      beepDescription: '1 beep longo + 3 curtos',
      observableSymptom: '',
      stageStatuses: [],
      cpuTempC: 44,
    });
    expect(pattern.pulses.map((p) => p.kind)).toEqual(['long', 'short', 'short', 'short']);
  });

  it('gera 1 bip curto para POST OK', () => {
    const pattern = service.resolvePattern({
      passed: true,
      reachedStage: 'POST_OK',
      monitorOutput: 'POST_SUCCESS',
      fansSpinning: true,
      beepDescription: '1 beep curto',
      observableSymptom: '',
      stageStatuses: [],
      cpuTempC: 43,
    });
    expect(pattern.pulses.map((p) => p.kind)).toEqual(['short']);
  });
});
