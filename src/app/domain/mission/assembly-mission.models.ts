export type MissionStepId =
  | 'mission-cpu'
  | 'mission-thermal-paste'
  | 'mission-ram'
  | 'mission-cooler'
  | 'mission-gpu'
  | 'mission-atx'
  | 'mission-cpu-power'
  | 'mission-ssd'
  | 'mission-hdd'
  | 'mission-sata-data';

export type MissionStepActionKind = 'drag-component' | 'connect-cable';

export interface AssemblyMissionStep {
  readonly id: MissionStepId;
  readonly label: string;
  readonly completed: boolean;
  readonly completedMessage: string;
  readonly hint: string;
  readonly actionKind: MissionStepActionKind;
  readonly focusTargetId: string;
  readonly warningNote?: string;
}

export interface AssemblyMissionReport {
  readonly title: string;
  readonly steps: readonly AssemblyMissionStep[];
  readonly completedCount: number;
  readonly totalCount: number;
  readonly progressPercent: number;
  readonly isCompleted: boolean;
  readonly nextRecommendedStep: AssemblyMissionStep | null;
  readonly engineeringNotes: readonly string[];
}
