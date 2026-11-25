import { AssemblyState } from '../assembly/assembly.models';

export type PostStage =
  | 'OFF'
  | 'PSU_CHECK'
  | 'CPU_INIT'
  | 'DRAM_INIT'
  | 'VGA_INIT'
  | 'BOOT_CHECK'
  | 'POST_OK';

export type MonitorOutputState =
  | 'NO_POWER'
  | 'NO_SIGNAL'
  | 'THERMAL_SHUTDOWN'
  | 'BIOS_NO_BOOT_DEVICE'
  | 'POST_SUCCESS';

export type InvestigationArea =
  | 'power'
  | 'cpu'
  | 'ram'
  | 'gpu'
  | 'storage';

export interface PostTestReport {
  readonly passed: boolean;
  readonly reachedStage: PostStage;
  readonly monitorOutput: MonitorOutputState;
  readonly fansSpinning: boolean;
  readonly beepDescription: string;
  readonly observableSymptom: string;
  readonly stageStatuses: readonly {
    readonly stage: 'PSU' | 'CPU' | 'DRAM' | 'VGA' | 'BOOT';
    readonly status: 'OK' | 'FAIL' | 'PENDING';
  }[];
  readonly cpuTempC: number;
  readonly bootDriveType?: 'SSD' | 'HDD' | 'DUAL_SSD_HDD';
  readonly estimatedBootSeconds?: number;
  readonly overheatRisk?: boolean;
  readonly coolingWarning?: string;
}

export interface DiagnosticCaseDefinition {
  readonly id: string;
  readonly title: string;
  readonly difficulty: 'Iniciante' | 'Intermediário' | 'Avançado';
  readonly customerComplaint: string;
  readonly subtleHint: string;
  readonly initialAssembly: AssemblyState;
  readonly initialConnectionIds: readonly string[];
  readonly rootCauseExplanation: string;
}

export interface InspectionLogEntry {
  readonly id: number;
  readonly area: InvestigationArea;
  readonly areaLabel: string;
  readonly reading: string;
  readonly status: 'normal' | 'suspect' | 'critical';
}
