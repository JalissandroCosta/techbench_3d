import { describe, expect, it } from 'vitest';
import {
  buildLocalRanking,
  calculateSessionEvaluation,
  evaluateChallenges,
  formatElapsedTime,
  isCertificateEligible,
  resolveTechnicianLevel,
} from './gamification.engine';

describe('gamification.engine — Avaliação, Níveis, Desafios e Ranking (Sprint 10)', () => {
  it('formata tempo corretamente em mm:ss e calcula precisão/nota coerentes', () => {
    expect(formatElapsedTime(512)).toBe('08:32');
    expect(formatElapsedTime(5)).toBe('00:05');

    const perfect = calculateSessionEvaluation({
      id: 'eval-1',
      title: 'Monte o computador',
      mode: 'ASSEMBLY_MISSION',
      elapsedSeconds: 120,
      errorsCount: 0,
      hintsUsedCount: 0,
      masteredDomains: ['CPU', 'RAM', 'ATX', 'SATA', 'GPU'],
    });
    expect(perfect.accuracyPercent).toBe(100);
    expect(perfect.grade).toBe('S');
    expect(perfect.scorePoints).toBeGreaterThan(450);

    const withMistakes = calculateSessionEvaluation({
      id: 'eval-2',
      title: 'Monte o computador',
      mode: 'ASSEMBLY_MISSION',
      elapsedSeconds: 512,
      errorsCount: 2,
      hintsUsedCount: 1,
      masteredDomains: ['RAM', 'SATA', 'ATX', 'GPU'],
    });
    expect(withMistakes.formattedTime).toBe('08:32');
    expect(withMistakes.accuracyPercent).toBe(84);
    expect(withMistakes.grade).toBe('B');
  });

  it('resolve níveis de carreira e desbloqueia desafios e certificado', () => {
    expect(resolveTechnicianLevel(0).level).toBe(1);
    expect(resolveTechnicianLevel(450).level).toBe(2);
    expect(resolveTechnicianLevel(3000).level).toBe(5);
    expect(resolveTechnicianLevel(3000).nextLevelXp).toBeNull();

    const buildEval = calculateSessionEvaluation({
      id: 'e1',
      title: 'Monte o computador',
      mode: 'ASSEMBLY_MISSION',
      elapsedSeconds: 150,
      errorsCount: 0,
      hintsUsedCount: 0,
      masteredDomains: ['CPU', 'RAM', 'ATX', 'SATA', 'GPU'],
    });
    const diagEval = calculateSessionEvaluation({
      id: 'e2',
      title: 'Caso 1 — Sem vídeo',
      mode: 'DIAGNOSTIC_CASE',
      elapsedSeconds: 95,
      errorsCount: 0,
      hintsUsedCount: 0,
      masteredDomains: ['Diagnóstico POST', 'VRM +12V'],
    });

    const history = [buildEval, diagEval];
    expect(isCertificateEligible(history)).toBe(true);

    const challenges = evaluateChallenges(history);
    expect(challenges.find((c) => c.id === 'ch-first-build')?.unlocked).toBe(true);
    expect(challenges.find((c) => c.id === 'ch-zero-error-build')?.unlocked).toBe(true);
    expect(challenges.find((c) => c.id === 'ch-no-hint-diag')?.unlocked).toBe(true);

    const ranking = buildLocalRanking('Aluno Teste', 1200, history, 'xp');
    expect(ranking.some((r) => r.isCurrentUser && r.name === 'Aluno Teste')).toBe(true);
    expect(ranking[0].totalXp).toBeGreaterThanOrEqual(ranking[ranking.length - 1].totalXp);

    const speedRanking = buildLocalRanking('Aluno Veloz', 400, [
      calculateSessionEvaluation({
        id: 'fast-1',
        title: 'Monte o computador',
        mode: 'ASSEMBLY_MISSION',
        elapsedSeconds: 45,
        errorsCount: 0,
        hintsUsedCount: 0,
        masteredDomains: ['CPU', 'RAM'],
      }),
    ], 'speed');
    expect(speedRanking[0].name).toBe('Aluno Veloz');
    expect(speedRanking[0].formattedBestTime).toBe('00:45');
  });
});
