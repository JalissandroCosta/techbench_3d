export type CompatibilityStatus =
  | 'COMPATIBLE'
  | 'COMPATIBLE_WITH_WARNING'
  | 'INCOMPATIBLE';

export interface CompatibilityEvaluation {
  readonly status: CompatibilityStatus;
  readonly code: string;
  readonly title: string;
  readonly reason: string;
  readonly componentId: string;
  readonly targetSlotId: string;
}

export interface RemovalEvaluation {
  readonly allowed: boolean;
  readonly reason: string;
}

export interface AssemblyState {
  /** Mapeia componentId -> slotId onde o componente está instalado */
  readonly installed: Readonly<Record<string, string>>;
  /** Indica se a pasta térmica já foi aplicada sobre o IHS da CPU instalada */
  readonly thermalPasteApplied: boolean;
}

export interface DragFeedbackState {
  readonly draggingComponentId: string;
  readonly nearestSlotId: string | null;
  readonly evaluation: CompatibilityEvaluation | null;
}

export interface AssemblyNotification {
  readonly kind: 'success' | 'warning' | 'error';
  readonly title: string;
  readonly message: string;
  readonly timestamp: number;
}

export const INITIAL_ASSEMBLY_STATE: AssemblyState = {
  installed: {},
  thermalPasteApplied: false,
};
