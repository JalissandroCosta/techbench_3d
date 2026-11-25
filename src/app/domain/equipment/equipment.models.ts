import {
  BenchComponentObject,
  InspectableHardwareObject,
} from '../models/hardware.models';

export type EquipmentCategory =
  | 'desktop-bench'
  | 'sff-corporate'
  | 'server'
  | 'notebook'
  | 'custom';

export type CustomFormFactor = 'ATX' | 'Micro-ATX' | 'Mini-ITX';
export type CustomSocketType = 'LGA775' | 'LGA1151' | 'LGA1700' | 'AM5';
export type CustomRamGen = 'DDR3' | 'DDR4' | 'DDR5';
export type CustomStorageType = 'SATA' | 'M.2 NVMe';

export interface CustomEquipmentConfig {
  readonly name: string;
  readonly formFactor: CustomFormFactor;
  readonly socket: CustomSocketType;
  readonly ramGeneration: CustomRamGen;
  readonly dimmSlots: 2 | 4;
  readonly storageType: CustomStorageType;
  readonly pcbColorHex: string;
}

export interface EquipmentProfile {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly category: EquipmentCategory;
  readonly categoryLabel: string;
  readonly formFactor: string;
  readonly architectureTag: string;
  readonly description: string;
  readonly highlights: readonly string[];
  readonly accentColor: string;
  readonly supportsFullAssembly: boolean;
  readonly regions: readonly InspectableHardwareObject[];
  readonly components: readonly BenchComponentObject[];
  readonly customConfig?: CustomEquipmentConfig;
}
