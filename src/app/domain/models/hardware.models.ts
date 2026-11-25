export type ComponentCategory =
  | 'BENCH'
  | 'MOTHERBOARD'
  | 'CPU'
  | 'CPU_COOLER'
  | 'THERMAL_PASTE'
  | 'RAM'
  | 'GPU'
  | 'STORAGE'
  | 'PSU'
  | 'CABLE';

export type HardwareRegionType =
  | 'motherboard'
  | 'cpu-socket'
  | 'memory-slot'
  | 'expansion-slot'
  | 'storage-connector'
  | 'power-connector'
  | 'fan-header'
  | 'chipset'
  | 'cmos-battery';

export type BenchComponentType =
  | 'cpu'
  | 'ram-ddr3'
  | 'cpu-cooler'
  | 'thermal-paste'
  | 'gpu'
  | 'hdd-sata'
  | 'psu-atx'
  | 'cable-sata'
  | 'cable-power';

export interface HardwareSpecPair {
  readonly label: string;
  readonly value: string;
}

export interface CameraFocusTarget {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}

/**
 * Região interativa da placa-mãe (Sprint 2).
 */
export interface InspectableHardwareObject {
  readonly entityKind: 'motherboard-region';
  readonly id: string;
  readonly type: HardwareRegionType;
  readonly name: string;
  readonly shortLabel: string;
  readonly category: ComponentCategory;
  readonly anchorName: string;
  readonly accentColor: string;
  readonly cameraFocus: CameraFocusTarget;
  readonly specs: readonly HardwareSpecPair[];
  readonly functionSummary: string;
  readonly locationDescription: string;
  readonly purpose: string;
  readonly relatedVoltages: readonly string[];
  readonly connectedComponent: string;
  readonly physicalIdentification: string;
  readonly commonConnectionErrors: readonly string[];
}

export interface ComponentPowerProfile {
  readonly voltages: readonly string[];
  readonly consumption: string;
  readonly source: string;
}

/**
 * Componente físico da bancada 3D (Sprint 3) com os 10 blocos técnicos obrigatórios:
 * Identificação, Descrição, Função, Características, Compatibilidade,
 * Conectores, Alimentação, Conexões, Cuidados e Problemas comuns.
 */
export interface BenchComponentObject {
  readonly entityKind: 'bench-component';
  readonly id: string;
  readonly type: BenchComponentType;
  readonly name: string;
  readonly shortLabel: string;
  readonly categoryLabel: string;
  readonly modelCode: string;
  readonly category: ComponentCategory;
  readonly anchorName: string;
  readonly accentColor: string;
  readonly cameraFocus: CameraFocusTarget;

  // 10 blocos técnicos obrigatórios (Sprint 3)
  readonly description: string;
  readonly functionSummary: string;
  readonly characteristics: readonly HardwareSpecPair[];
  readonly compatibility: readonly string[];
  readonly connectors: readonly string[];
  readonly powerInfo: ComponentPowerProfile;
  readonly connections: readonly string[];
  readonly precautions: readonly string[];
  readonly commonProblems: readonly string[];
}

export type SelectableWorkbenchItem = InspectableHardwareObject | BenchComponentObject;
