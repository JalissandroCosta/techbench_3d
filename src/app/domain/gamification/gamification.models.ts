export type EvaluationMode = 'ASSEMBLY_MISSION' | 'DIAGNOSTIC_CASE';

export type PerformanceGrade = 'S' | 'A' | 'B' | 'C';

export interface SessionEvaluationInput {
  readonly id: string;
  readonly title: string;
  readonly mode: EvaluationMode;
  readonly elapsedSeconds: number;
  readonly errorsCount: number;
  readonly hintsUsedCount: number;
  readonly masteredDomains: readonly string[];
  readonly completedAtIso?: string;
}

export interface SessionEvaluationSummary {
  readonly id: string;
  readonly title: string;
  readonly mode: EvaluationMode;
  readonly completedAtIso: string;
  readonly elapsedSeconds: number;
  readonly formattedTime: string;
  readonly errorsCount: number;
  readonly hintsUsedCount: number;
  readonly accuracyPercent: number;
  readonly scorePoints: number;
  readonly grade: PerformanceGrade;
  readonly masteredDomains: readonly string[];
}

export interface TechnicianLevelInfo {
  readonly level: number;
  readonly title: string;
  readonly minXp: number;
  readonly nextLevelXp: number | null;
  readonly progressPercent: number;
}

export interface ChallengeStatus {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly xpReward: number;
  readonly unlocked: boolean;
}

export type RankingSortMode = 'xp' | 'speed';

export interface StoredPlayerProfile {
  readonly name: string;
  readonly totalXp: number;
  readonly bestAssemblySeconds: number | null;
  readonly avgAccuracy: number;
  readonly completedCount: number;
}

export interface RankingEntry {
  readonly rank: number;
  readonly name: string;
  readonly levelTitle: string;
  readonly totalXp: number;
  readonly avgAccuracy: number;
  readonly bestAssemblySeconds: number | null;
  readonly formattedBestTime: string;
  readonly isCurrentUser: boolean;
}

export interface PersistedGamificationData {
  readonly playerName: string;
  readonly hasOnboarded?: boolean;
  readonly totalXp: number;
  readonly history: readonly SessionEvaluationSummary[];
  readonly profiles?: readonly StoredPlayerProfile[];
}
