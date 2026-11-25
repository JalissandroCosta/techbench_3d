import {
  CompatibilityEvaluation,
  DragFeedbackState,
} from '../../domain/assembly/assembly.models';

export type EngineCameraPreset = 'overview' | 'top' | 'front' | 'isometric' | 'parts';

export interface EngineTelemetrySnapshot {
  readonly fps: number;
  readonly drawCalls: number;
  readonly triangles: number;
}

export interface EngineCameraPose {
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}

export interface SceneManagerCallbacks {
  readonly onSelectTarget: (targetId: string | null) => void;
  readonly onHoverTarget: (targetId: string | null) => void;
  readonly onTelemetry: (snapshot: EngineTelemetrySnapshot) => void;
  readonly evaluatePlacement: (componentId: string, slotId: string) => CompatibilityEvaluation;
  readonly onAttemptInstall: (componentId: string, slotId: string) => CompatibilityEvaluation;
  readonly onAttemptRemove: (componentId: string) => boolean;
  readonly onDragFeedback: (feedback: DragFeedbackState | null) => void;
  readonly onPortClicked: (portId: string) => void;
}
