export type ConnectionKind = 'power' | 'data' | 'control';

/**
 * Taxonomia oficial de 4 classes de conectores (Seção 18 e 27):
 * energia | dados | expansão | refrigeração.
 */
export type ConnectorDomainClass = 'power' | 'data' | 'expansion' | 'cooling';

export type ConnectorNecessity = 'REQUIRED' | 'CONDITIONAL' | 'OPTIONAL_UNUSED';

export interface ConnectorAuditEntry {
  readonly id: string;
  readonly name: string;
  readonly domainClass: ConnectorDomainClass;
  readonly necessity: ConnectorNecessity;
  readonly origin: string;
  readonly possibleDestination: string;
  readonly functionSummary: string;
  readonly canRemainUnused: boolean;
  readonly whyUnusedIsAcceptable: string;
  readonly dependentComponents: readonly string[];
  readonly commonErrors: readonly string[];
}

export type ConnectorStandard =
  | 'ATX_24P'
  | 'CPU_4P'
  | 'SATA_POWER_15P'
  | 'SATA_DATA_7P'
  | 'PCIE_6P'
  | 'FAN_4P_PWM';

export type PortDirection = 'SOURCE' | 'SINK' | 'BIDIRECTIONAL';

export interface HardwarePortDefinition {
  readonly id: string;
  readonly deviceId: string;
  readonly deviceName: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly connector: ConnectorStandard;
  readonly direction: PortDirection;
  readonly kind: ConnectionKind;
  readonly requiredInstalledComponentId?: string;
}

export interface ConnectionEndpoint {
  readonly deviceId: string;
  readonly deviceName: string;
  readonly portId: string;
  readonly portLabel: string;
}

/**
 * Entidade de Conexão (Sprint 5):
 * Uma conexão não é apenas uma linha 3D — é uma entidade técnica completa
 * contendo Origem, Destino, Tipo, Conector, Compatibilidade e Função.
 */
export interface CableConnectionEntity {
  readonly id: string;
  readonly name: string;
  readonly source: ConnectionEndpoint;
  readonly target: ConnectionEndpoint;
  readonly kind: ConnectionKind;
  readonly connector: ConnectorStandard;
  readonly connectorLabel: string;
  readonly compatibilitySummary: string;
  readonly functionSummary: string;
  readonly voltagesOrSignals: readonly string[];
  readonly colorHex: string;
  readonly requiredForBoot: boolean;
}

export interface ConnectionBlueprint {
  readonly id: string;
  readonly name: string;
  readonly sourcePortId: string;
  readonly targetPortId: string;
  readonly kind: ConnectionKind;
  readonly connector: ConnectorStandard;
  readonly connectorLabel: string;
  readonly compatibilitySummary: string;
  readonly functionSummary: string;
  readonly voltagesOrSignals: readonly string[];
  readonly colorHex: string;
  readonly requiredForBoot: boolean;
}

export interface ConnectionValidationResult {
  readonly valid: boolean;
  readonly code: string;
  readonly title: string;
  readonly reason: string;
  readonly connection?: CableConnectionEntity;
}
