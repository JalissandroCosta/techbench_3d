import { Injectable, signal } from '@angular/core';
import { PostTestReport } from '../domain/diagnostics/diagnostics.models';

export interface BeepPulse {
  readonly durationMs: number;
  readonly pauseAfterMs: number;
  readonly frequencyHz: number;
  readonly kind: 'short' | 'long';
}

/**
 * Sintetizador de Buzzer Piezoelétrico (Speaker PC / AMI BIOS) via Web Audio API.
 * Zero assets externos — gera bips fiéis aos códigos reais de POST da PCWare IPM41-D3.
 * Seguro em ambientes headless/jsdom (testes unitários).
 */
@Injectable({ providedIn: 'root' })
export class PostBuzzerService {
  readonly muted = signal<boolean>(false);
  readonly isBeeping = signal<boolean>(false);
  readonly activePatternLabel = signal<string | null>(null);

  private audioCtx: AudioContext | null = null;
  private activeTimeouts: ReturnType<typeof setTimeout>[] = [];

  toggleMute(): void {
    this.muted.update((m) => !m);
    if (this.muted()) {
      this.stop();
    }
  }

  /**
   * Mapeia o resultado do POST para a sequência real de pulsos AMI BIOS.
   */
  resolvePattern(report: PostTestReport): { readonly label: string; readonly pulses: readonly BeepPulse[] } {
    if (report.monitorOutput === 'NO_POWER' || report.reachedStage === 'PSU_CHECK') {
      return { label: 'Silêncio (sem energia)', pulses: [] };
    }

    if (report.monitorOutput === 'THERMAL_SHUTDOWN') {
      return {
        label: 'Alarme térmico (4 bips rápidos)',
        pulses: [
          { durationMs: 90, pauseAfterMs: 70, frequencyHz: 1180, kind: 'short' },
          { durationMs: 90, pauseAfterMs: 70, frequencyHz: 860, kind: 'short' },
          { durationMs: 90, pauseAfterMs: 70, frequencyHz: 1180, kind: 'short' },
          { durationMs: 90, pauseAfterMs: 70, frequencyHz: 860, kind: 'short' },
        ],
      };
    }

    if (report.reachedStage === 'CPU_INIT') {
      // Sem CPU ou sem CPU Power 4P (Vcore): BIOS não executa, logo speaker fica mudo
      return { label: 'Silêncio (CPU / Vcore ausente)', pulses: [] };
    }

    if (report.reachedStage === 'DRAM_INIT') {
      // 3 bips longos (AMI BIOS — Falha de Memória RAM)
      return {
        label: '3 bips longos (— — —)',
        pulses: [
          { durationMs: 420, pauseAfterMs: 220, frequencyHz: 920, kind: 'long' },
          { durationMs: 420, pauseAfterMs: 220, frequencyHz: 920, kind: 'long' },
          { durationMs: 420, pauseAfterMs: 180, frequencyHz: 920, kind: 'long' },
        ],
      };
    }

    if (report.reachedStage === 'VGA_INIT') {
      // 1 bip longo + 3 curtos (AMI BIOS — Falha de Vídeo / GPU)
      return {
        label: '1 longo + 3 curtos (— · · ·)',
        pulses: [
          { durationMs: 460, pauseAfterMs: 220, frequencyHz: 920, kind: 'long' },
          { durationMs: 115, pauseAfterMs: 120, frequencyHz: 920, kind: 'short' },
          { durationMs: 115, pauseAfterMs: 120, frequencyHz: 920, kind: 'short' },
          { durationMs: 115, pauseAfterMs: 120, frequencyHz: 920, kind: 'short' },
        ],
      };
    }

    // POST_OK ou BIOS_NO_BOOT_DEVICE: 1 bip curto padrão de POST aprovado
    return {
      label: '1 bip curto (· POST OK)',
      pulses: [{ durationMs: 115, pauseAfterMs: 100, frequencyHz: 980, kind: 'short' }],
    };
  }

  playPostReport(report: PostTestReport): void {
    this.stop();
    const { label, pulses } = this.resolvePattern(report);
    this.activePatternLabel.set(label);

    if (pulses.length === 0) {
      return;
    }

    this.playSequence(pulses);
  }

  playSafetyAlertBeep(): void {
    this.stop();
    this.activePatternLabel.set('Alerta de segurança elétrica');
    this.playSequence([
      { durationMs: 110, pauseAfterMs: 80, frequencyHz: 520, kind: 'short' },
      { durationMs: 140, pauseAfterMs: 80, frequencyHz: 390, kind: 'short' },
    ]);
  }

  stop(): void {
    for (const t of this.activeTimeouts) {
      clearTimeout(t);
    }
    this.activeTimeouts = [];
    this.isBeeping.set(false);
  }

  private playSequence(pulses: readonly BeepPulse[]): void {
    let offsetMs = 0;

    for (const pulse of pulses) {
      const startTimer = setTimeout(() => {
        this.isBeeping.set(true);
        if (!this.muted()) {
          this.emitTone(pulse.frequencyHz, pulse.durationMs);
        }
      }, offsetMs);

      const endTimer = setTimeout(() => {
        this.isBeeping.set(false);
      }, offsetMs + pulse.durationMs);

      this.activeTimeouts.push(startTimer, endTimer);
      offsetMs += pulse.durationMs + pulse.pauseAfterMs;
    }
  }

  private emitTone(frequencyHz: number, durationMs: number): void {
    try {
      const Ctor =
        typeof window !== 'undefined'
          ? (window.AudioContext ??
              (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
          : undefined;
      if (!Ctor) {
        return;
      }

      if (!this.audioCtx) {
        this.audioCtx = new Ctor();
      }
      if (this.audioCtx.state === 'suspended') {
        void this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Onda quadrada suavizada lembra fielmente o buzzer piezoelétrico de placa-mãe
      osc.type = 'square';
      osc.frequency.setValueAtTime(frequencyHz, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.09, now + 0.008);
      gain.gain.setValueAtTime(0.09, now + Math.max(0.01, durationMs / 1000 - 0.012));
      gain.gain.linearRampToValueAtTime(0.0001, now + durationMs / 1000);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + durationMs / 1000 + 0.015);
    } catch {
      // Ignora em ambientes sem suporte a Web Audio API
    }
  }
}
