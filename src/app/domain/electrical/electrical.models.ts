export type VoltageRailId =
  | '+12V'
  | '+5V'
  | '+3.3V'
  | '+5VSB'
  | 'VCORE'
  | 'DDR3_1V5';

export interface ElectricalBranchNode {
  readonly id: string;
  readonly label: string;
  readonly role: string;
  readonly targetObjectId: string;
  readonly requiredConnectionId?: string;
}

export interface VoltageRailDefinition {
  readonly id: VoltageRailId;
  readonly label: string;
  readonly title: string;
  readonly atxWireColor: string;
  readonly colorHex: string;
  readonly tolerance: string;
  readonly stage: 'PRIMARY_PSU' | 'SECONDARY_VRM';
  readonly summary: string;
  readonly diagnosticTip: string;
  readonly relatedTargetIds: readonly string[];
  readonly relatedConnectionIds: readonly string[];
  readonly branches: readonly ElectricalBranchNode[];
}

export interface EvaluatedElectricalBranch {
  readonly branch: ElectricalBranchNode;
  readonly energized: boolean;
  readonly statusLabel: string;
}

export interface ElectricalOverlayAnalysis {
  readonly rail: VoltageRailDefinition;
  readonly branches: readonly EvaluatedElectricalBranch[];
  readonly activeConnectionIds: readonly string[];
  readonly missingConnectionIds: readonly string[];
}
