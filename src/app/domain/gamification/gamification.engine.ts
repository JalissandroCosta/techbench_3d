import {
  ChallengeStatus,
  PerformanceGrade,
  RankingEntry,
  RankingSortMode,
  SessionEvaluationInput,
  SessionEvaluationSummary,
  StoredPlayerProfile,
  TechnicianLevelInfo,
} from './gamification.models';

interface LevelThreshold {
  readonly level: number;
  readonly title: string;
  readonly minXp: number;
}

const LEVEL_THRESHOLDS: readonly LevelThreshold[] = [
  { level: 1, title: 'Aprendiz de Bancada', minXp: 0 },
  { level: 2, title: 'Técnico Montador', minXp: 400 },
  { level: 3, title: 'Especialista em Arquitetura', minXp: 1000 },
  { level: 4, title: 'Analista de Diagnóstico', minXp: 1800 },
  { level: 5, title: 'Engenheiro TechBench 3D', minXp: 2800 },
];

const BENCHMARK_RANKING: readonly {
  readonly name: string;
  readonly totalXp: number;
  readonly avgAccuracy: number;
  readonly bestAssemblySeconds: number;
}[] = [
  { name: 'Jalissandro Costa', totalXp: 3000, avgAccuracy: 100, bestAssemblySeconds: 58 },
  { name: 'Eng. Marina Silva', totalXp: 2450, avgAccuracy: 96, bestAssemblySeconds: 148 },
  { name: 'Téc. Lucas Ferreira', totalXp: 1620, avgAccuracy: 91, bestAssemblySeconds: 195 },
  { name: 'Ana Beatriz (Lab)', totalXp: 980, avgAccuracy: 88, bestAssemblySeconds: 242 },
  { name: 'Carlos Eduardo', totalXp: 420, avgAccuracy: 82, bestAssemblySeconds: 318 },
];

export function formatElapsedTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Calcula precisão, pontuação (XP) e conceito (S/A/B/C) para uma missão ou diagnóstico.
 * Domínio Headless: 100% determinístico e testável.
 */
export function calculateSessionEvaluation(
  input: SessionEvaluationInput
): SessionEvaluationSummary {
  const safeErrors = Math.max(0, input.errorsCount);
  const safeHints = Math.max(0, input.hintsUsedCount);
  const safeSeconds = Math.max(1, Math.floor(input.elapsedSeconds));

  const accuracyPenalty = safeErrors * 5 + safeHints * 6;
  const accuracyPercent = Math.max(20, Math.min(100, 100 - accuracyPenalty));

  const baseXp = input.mode === 'ASSEMBLY_MISSION' ? 350 : 280;
  const speedBonus = safeSeconds <= 180 ? 80 : safeSeconds <= 360 ? 40 : 10;
  const accuracyBonus = Math.round((accuracyPercent / 100) * 120);
  const scorePoints = Math.max(80, baseXp + speedBonus + accuracyBonus - safeErrors * 15 - safeHints * 20);

  let grade: PerformanceGrade = 'C';
  if (accuracyPercent >= 95 && safeHints === 0) {
    grade = 'S';
  } else if (accuracyPercent >= 85) {
    grade = 'A';
  } else if (accuracyPercent >= 70) {
    grade = 'B';
  }

  return {
    id: input.id,
    title: input.title,
    mode: input.mode,
    completedAtIso: input.completedAtIso ?? new Date().toISOString(),
    elapsedSeconds: safeSeconds,
    formattedTime: formatElapsedTime(safeSeconds),
    errorsCount: safeErrors,
    hintsUsedCount: safeHints,
    accuracyPercent,
    scorePoints,
    grade,
    masteredDomains: input.masteredDomains,
  };
}

export function resolveTechnicianLevel(totalXp: number): TechnicianLevelInfo {
  const safeXp = Math.max(0, totalXp);
  let current = LEVEL_THRESHOLDS[0];
  let next: LevelThreshold | null = LEVEL_THRESHOLDS[1] ?? null;

  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (safeXp >= LEVEL_THRESHOLDS[i].minXp) {
      current = LEVEL_THRESHOLDS[i];
      next = LEVEL_THRESHOLDS[i + 1] ?? null;
    }
  }

  if (!next) {
    return {
      level: current.level,
      title: current.title,
      minXp: current.minXp,
      nextLevelXp: null,
      progressPercent: 100,
    };
  }

  const span = next.minXp - current.minXp;
  const progressPercent = Math.min(100, Math.round(((safeXp - current.minXp) / span) * 100));

  return {
    level: current.level,
    title: current.title,
    minXp: current.minXp,
    nextLevelXp: next.minXp,
    progressPercent,
  };
}

export function evaluateChallenges(
  history: readonly SessionEvaluationSummary[]
): readonly ChallengeStatus[] {
  const assemblies = history.filter((h) => h.mode === 'ASSEMBLY_MISSION');
  const diagnostics = history.filter((h) => h.mode === 'DIAGNOSTIC_CASE');
  const uniqueDiagIds = new Set(diagnostics.map((d) => d.title));

  return [
    {
      id: 'ch-first-build',
      title: 'Primeira Montagem Completa',
      description: 'Conclua todos os 9 itens da Missão "Monte o computador".',
      xpReward: 100,
      unlocked: assemblies.length >= 1,
    },
    {
      id: 'ch-zero-error-build',
      title: 'Montagem Cirúrgica (0 Erros)',
      description: 'Finalize uma montagem completa sem nenhuma tentativa incompatível.',
      xpReward: 150,
      unlocked: assemblies.some((a) => a.errorsCount === 0),
    },
    {
      id: 'ch-first-diag',
      title: 'Caçador de Defeitos',
      description: 'Resolva seu primeiro caso no Laboratório de Diagnóstico.',
      xpReward: 120,
      unlocked: diagnostics.length >= 1,
    },
    {
      id: 'ch-no-hint-diag',
      title: 'Instinto de Engenheiro',
      description: 'Resolva um caso de diagnóstico sem utilizar nenhuma dica técnica.',
      xpReward: 160,
      unlocked: diagnostics.some((d) => d.hintsUsedCount === 0),
    },
    {
      id: 'ch-diag-master',
      title: 'Mestre do Troubleshooting',
      description: 'Resolva pelo menos 3 casos diferentes de defeito na PCWare IPM41-D3.',
      xpReward: 250,
      unlocked: uniqueDiagIds.size >= 3,
    },
  ];
}

export function getBestAssemblySeconds(
  history: readonly SessionEvaluationSummary[]
): number | null {
  const assemblies = history.filter((h) => h.mode === 'ASSEMBLY_MISSION');
  if (assemblies.length === 0) {
    return null;
  }
  return Math.min(...assemblies.map((a) => a.elapsedSeconds));
}

export function buildLocalRanking(
  playerName: string,
  totalXp: number,
  history: readonly SessionEvaluationSummary[],
  sortBy: RankingSortMode = 'xp',
  savedProfiles: readonly StoredPlayerProfile[] = []
): readonly RankingEntry[] {
  const normalizedCurrent = playerName.trim() || 'Você (Técnico)';
  const avgAccuracy =
    history.length > 0
      ? Math.round(history.reduce((acc, h) => acc + h.accuracyPercent, 0) / history.length)
      : 0;
  const currentBest = getBestAssemblySeconds(history);

  const byName = new Map<
    string,
    {
      name: string;
      totalXp: number;
      avgAccuracy: number;
      bestAssemblySeconds: number | null;
      isCurrentUser: boolean;
    }
  >();

  for (const b of BENCHMARK_RANKING) {
    byName.set(b.name.toLowerCase(), {
      name: b.name,
      totalXp: b.totalXp,
      avgAccuracy: b.avgAccuracy,
      bestAssemblySeconds: b.bestAssemblySeconds,
      isCurrentUser: false,
    });
  }

  for (const p of savedProfiles) {
    byName.set(p.name.toLowerCase(), {
      name: p.name,
      totalXp: p.totalXp,
      avgAccuracy: p.avgAccuracy,
      bestAssemblySeconds: p.bestAssemblySeconds,
      isCurrentUser: false,
    });
  }

  byName.set(normalizedCurrent.toLowerCase(), {
    name: normalizedCurrent,
    totalXp,
    avgAccuracy,
    bestAssemblySeconds: currentBest,
    isCurrentUser: true,
  });

  const combined = [...byName.values()].sort((a, b) => {
    if (sortBy === 'speed') {
      const aTime = a.bestAssemblySeconds ?? Number.POSITIVE_INFINITY;
      const bTime = b.bestAssemblySeconds ?? Number.POSITIVE_INFINITY;
      if (aTime !== bTime) {
        return aTime - bTime;
      }
      return b.totalXp - a.totalXp;
    }
    return b.totalXp - a.totalXp;
  });

  return combined.map((item, idx) => ({
    rank: idx + 1,
    name: item.name,
    levelTitle: resolveTechnicianLevel(item.totalXp).title,
    totalXp: item.totalXp,
    avgAccuracy: item.avgAccuracy,
    bestAssemblySeconds: item.bestAssemblySeconds,
    formattedBestTime:
      item.bestAssemblySeconds !== null ? formatElapsedTime(item.bestAssemblySeconds) : '--:--',
    isCurrentUser: item.isCurrentUser,
  }));
}

export function isCertificateEligible(history: readonly SessionEvaluationSummary[]): boolean {
  const hasAssembly = history.some((h) => h.mode === 'ASSEMBLY_MISSION');
  const hasDiagnostic = history.some((h) => h.mode === 'DIAGNOSTIC_CASE');
  return hasAssembly && hasDiagnostic;
}

export function collectMasteredDomains(
  history: readonly SessionEvaluationSummary[]
): readonly string[] {
  const set = new Set<string>();
  for (const item of history) {
    for (const domain of item.masteredDomains) {
      set.add(domain);
    }
  }
  return [...set];
}
