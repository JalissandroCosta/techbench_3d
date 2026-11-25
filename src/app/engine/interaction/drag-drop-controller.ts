import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  AssemblyState,
  CompatibilityEvaluation,
  DragFeedbackState,
} from '../../domain/assembly/assembly.models';

interface Pose {
  readonly position: THREE.Vector3;
  readonly quaternion: THREE.Quaternion;
}

interface ActiveTween {
  readonly object: THREE.Object3D;
  readonly targetPos: THREE.Vector3;
  readonly targetQuat: THREE.Quaternion;
}

export interface DragDropCallbacks {
  readonly evaluatePlacement: (componentId: string, slotId: string) => CompatibilityEvaluation;
  readonly onAttemptInstall: (componentId: string, slotId: string) => CompatibilityEvaluation;
  readonly onAttemptRemove: (componentId: string) => boolean;
  readonly onDragFeedback: (feedback: DragFeedbackState | null) => void;
}

const DRAG_START_THRESHOLD_PX = 6;
const TOUCH_LONG_PRESS_MS = 260;
const TOUCH_MOVE_CANCEL_PX = 10;
const SNAP_PROXIMITY_RADIUS_M = 0.068;
const DRAG_PLANE_HEIGHT_M = 0.082;

const SNAP_ELIGIBLE_SLOTS: readonly string[] = [
  'motherboard-cpu-socket',
  'motherboard-dimm-1',
  'motherboard-dimm-2',
  'motherboard-pcie-x16',
  'motherboard-pci',
  'motherboard-sata',
  'motherboard-atx-24pin',
  'motherboard-cpu-power',
  'motherboard-fan',
];

/**
 * Controlador de Drag & Drop 3D, detecção de proximidade, rotação automática,
 * snap magnético, validação em tempo real e animação de encaixe (Sprint 4).
 * Zero dependência de Angular.
 */
export class DragDropController {
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2();
  private readonly dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DRAG_PLANE_HEIGHT_M);
  private readonly planeHitPoint = new THREE.Vector3();

  private readonly draggableMeshes: THREE.Object3D[] = [];
  private readonly homePoses = new Map<string, Pose>();
  private readonly slotCenters = new Map<string, THREE.Vector3>();
  private readonly activeTweens = new Map<string, ActiveTween>();
  private readonly originalEmissive = new WeakMap<
    THREE.MeshStandardMaterial,
    { hex: number; intensity: number }
  >();

  private readonly snapRing: THREE.Mesh;
  private readonly thermalPasteDot: THREE.Mesh;

  private candidateId: string | null = null;
  private pointerDownPos: { x: number; y: number } | null = null;
  private activePointerId: number | null = null;
  private activePointerType: string = 'mouse';
  private readonly activeTouchIds = new Set<number>();
  private longPressTimer: ReturnType<typeof setTimeout> | null = null;
  private draggingId: string | null = null;
  private currentNearestSlotId: string | null = null;
  private currentEval: CompatibilityEvaluation | null = null;
  private pulseClock = 0;

  constructor(
    private readonly domElement: HTMLCanvasElement,
    private readonly camera: THREE.Camera,
    private readonly controls: OrbitControls,
    private readonly scene: THREE.Scene,
    private readonly componentTargets: Map<string, THREE.Object3D>,
    private readonly slotTargets: Map<string, THREE.Object3D>,
    private readonly callbacks: DragDropCallbacks
  ) {
    // Registra poses iniciais (manta ESD) e malhas arrastáveis
    for (const [id, root] of this.componentTargets.entries()) {
      this.homePoses.set(id, {
        position: root.position.clone(),
        quaternion: root.quaternion.clone(),
      });
      root.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          this.draggableMeshes.push(child);
          this.captureOriginalEmissive(child);
        }
      });
    }

    // Registra centros mundiais dos slots da placa-mãe para detecção de proximidade
    for (const slotId of SNAP_ELIGIBLE_SLOTS) {
      const slotObj = this.slotTargets.get(slotId);
      if (slotObj) {
        const box = new THREE.Box3().setFromObject(slotObj);
        const center = new THREE.Vector3();
        box.getCenter(center);
        this.slotCenters.set(slotId, center);
      }
    }

    // Anel visual de feedback magnético sobre o slot próximo
    this.snapRing = new THREE.Mesh(
      new THREE.RingGeometry(0.022, 0.03, 32),
      new THREE.MeshBasicMaterial({
        color: 0x22c55e,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
      })
    );
    this.snapRing.rotation.x = -Math.PI / 2;
    this.snapRing.visible = false;
    this.scene.add(this.snapRing);

    // Gota visual de pasta térmica aplicada sobre o IHS da CPU LGA775
    this.thermalPasteDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.0055, 16, 12),
      new THREE.MeshStandardMaterial({
        color: 0x9ca3af,
        metalness: 0.3,
        roughness: 0.45,
      })
    );
    this.thermalPasteDot.scale.set(1, 0.35, 1);
    this.thermalPasteDot.position.set(-0.012, 0.0345, -0.032);
    this.thermalPasteDot.visible = false;
    this.scene.add(this.thermalPasteDot);

    this.domElement.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
  }

  get isDragging(): boolean {
    return this.draggingId !== null;
  }

  /**
   * Sincroniza posições 3D quando o estado de montagem muda via UI (ex.: Remover ou Resetar).
   */
  syncAssemblyState(state: AssemblyState): void {
    this.thermalPasteDot.visible = state.thermalPasteApplied;

    for (const [componentId, root] of this.componentTargets.entries()) {
      if (componentId === this.draggingId) {
        continue;
      }
      const installedSlot = state.installed[componentId];
      if (installedSlot) {
        const pose = this.computeSeatedPose(componentId, installedSlot);
        this.startTween(componentId, root, pose.position, pose.quaternion);
      } else {
        const home = this.homePoses.get(componentId);
        if (home) {
          this.startTween(componentId, root, home.position, home.quaternion);
        }
      }
    }
  }

  update(dt: number): void {
    this.pulseClock += dt;

    if (this.snapRing.visible) {
      const pulse = 1 + Math.sin(this.pulseClock * 7) * 0.08;
      this.snapRing.scale.set(pulse, pulse, 1);
    }

    const alpha = 1 - Math.exp(-14 * dt);
    for (const [id, tween] of this.activeTweens.entries()) {
      tween.object.position.lerp(tween.targetPos, alpha);
      tween.object.quaternion.slerp(tween.targetQuat, alpha);

      if (
        tween.object.position.distanceTo(tween.targetPos) < 0.0008 &&
        tween.object.quaternion.angleTo(tween.targetQuat) < 0.01
      ) {
        tween.object.position.copy(tween.targetPos);
        tween.object.quaternion.copy(tween.targetQuat);
        this.activeTweens.delete(id);
      }
    }
  }

  dispose(): void {
    this.clearLongPressTimer();
    this.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    window.removeEventListener('pointermove', this.handlePointerMove);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointercancel', this.handlePointerUp);

    this.snapRing.geometry.dispose();
    (this.snapRing.material as THREE.Material).dispose();
    this.scene.remove(this.snapRing);

    this.thermalPasteDot.geometry.dispose();
    (this.thermalPasteDot.material as THREE.Material).dispose();
    this.scene.remove(this.thermalPasteDot);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') {
      this.activeTouchIds.add(event.pointerId);
      // Multi-touch (pinch-to-zoom com 2 dedos): cancela arrasto e libera OrbitControls
      if (this.activeTouchIds.size > 1) {
        this.cancelTouchDragForPinch();
        return;
      }
    } else if (event.button !== 0) {
      return;
    }

    const hitId = this.raycastComponent(event);
    if (!hitId) {
      return;
    }

    this.candidateId = hitId;
    this.activePointerId = event.pointerId;
    this.activePointerType = event.pointerType;
    this.pointerDownPos = { x: event.clientX, y: event.clientY };

    if (event.pointerType === 'touch') {
      this.clearLongPressTimer();
      this.longPressTimer = setTimeout(() => {
        if (this.candidateId === hitId && this.activeTouchIds.size === 1) {
          this.beginDrag(hitId);
          if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(18);
          }
        }
      }, TOUCH_LONG_PRESS_MS);
    }
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (this.activePointerId !== null && event.pointerId !== this.activePointerId) {
      return;
    }
    if (!this.candidateId && !this.draggingId) {
      return;
    }

    if (!this.draggingId && this.candidateId && this.pointerDownPos) {
      const dist = Math.hypot(
        event.clientX - this.pointerDownPos.x,
        event.clientY - this.pointerDownPos.y
      );
      if (this.activePointerType === 'touch') {
        // No touch, mover antes do long-press significa orbitar a câmera
        if (dist > TOUCH_MOVE_CANCEL_PX) {
          this.clearLongPressTimer();
          this.candidateId = null;
          this.pointerDownPos = null;
        }
        return;
      }
      if (dist < DRAG_START_THRESHOLD_PX) {
        return;
      }
      this.beginDrag(this.candidateId);
    }

    if (!this.draggingId) {
      return;
    }

    const draggedObj = this.componentTargets.get(this.draggingId);
    if (!draggedObj) {
      return;
    }

    const worldHit = this.projectPointerToDragPlane(event);
    if (!worldHit) {
      return;
    }

    // Detecção de proximidade com os slots da placa-mãe
    const nearestSlotId = this.findNearestSlot(worldHit);
    this.currentNearestSlotId = nearestSlotId;

    if (nearestSlotId) {
      const evaluation = this.callbacks.evaluatePlacement(this.draggingId, nearestSlotId);
      this.currentEval = evaluation;

      const previewPose = this.computePreviewPose(this.draggingId, nearestSlotId, evaluation.status !== 'INCOMPATIBLE');
      draggedObj.position.lerp(previewPose.position, 0.35);
      draggedObj.quaternion.slerp(previewPose.quaternion, 0.35);

      const feedbackColor =
        evaluation.status === 'COMPATIBLE'
          ? 0x22c55e
          : evaluation.status === 'COMPATIBLE_WITH_WARNING'
            ? 0xf59e0b
            : 0xef4444;

      this.applyDragTint(draggedObj, feedbackColor, 0.5);
      this.showSnapRing(nearestSlotId, feedbackColor);

      this.callbacks.onDragFeedback({
        draggingComponentId: this.draggingId,
        nearestSlotId,
        evaluation,
      });
    } else {
      this.currentEval = null;
      const home = this.homePoses.get(this.draggingId);
      draggedObj.position.set(worldHit.x, DRAG_PLANE_HEIGHT_M, worldHit.z);
      if (home) {
        draggedObj.quaternion.slerp(home.quaternion, 0.2);
      }
      this.applyDragTint(draggedObj, 0x38bdf8, 0.25);
      this.snapRing.visible = false;

      this.callbacks.onDragFeedback({
        draggingComponentId: this.draggingId,
        nearestSlotId: null,
        evaluation: null,
      });
    }
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.pointerType === 'touch') {
      this.activeTouchIds.delete(event.pointerId);
    }
    this.clearLongPressTimer();

    const activeId = this.draggingId;
    this.candidateId = null;
    this.pointerDownPos = null;
    this.activePointerId = null;

    if (!activeId) {
      return;
    }

    const draggedObj = this.componentTargets.get(activeId);
    this.draggingId = null;
    this.controls.enabled = true;
    this.domElement.style.cursor = 'grab';
    this.snapRing.visible = false;

    if (draggedObj) {
      this.restoreEmissive(draggedObj);
    }

    const targetSlot = this.currentNearestSlotId;
    this.currentNearestSlotId = null;
    this.currentEval = null;
    this.callbacks.onDragFeedback(null);

    if (targetSlot && draggedObj) {
      const result = this.callbacks.onAttemptInstall(activeId, targetSlot);
      if (result.status !== 'INCOMPATIBLE') {
        if (activeId === 'component-thermal-paste') {
          // Aplica pasta no IHS e devolve seringa suavemente à manta ESD
          this.thermalPasteDot.visible = true;
          const home = this.homePoses.get(activeId);
          if (home) {
            this.startTween(activeId, draggedObj, home.position, home.quaternion);
          }
        } else {
          const seated = this.computeSeatedPose(activeId, targetSlot);
          this.startTween(activeId, draggedObj, seated.position, seated.quaternion);
        }
        return;
      }
    } else if (draggedObj && draggedObj.position.x > 0.16) {
      // Soltou de volta sobre a manta ESD → tenta remover se estava instalado
      this.callbacks.onAttemptRemove(activeId);
    }

    // Se recusado ou solto no vazio, retorna à pose válida (manta ESD ou slot anterior via sync)
    if (draggedObj) {
      const home = this.homePoses.get(activeId);
      if (home) {
        this.startTween(activeId, draggedObj, home.position, home.quaternion);
      }
    }
  };

  private clearLongPressTimer(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private cancelTouchDragForPinch(): void {
    this.clearLongPressTimer();
    const activeId = this.draggingId;
    this.candidateId = null;
    this.pointerDownPos = null;
    this.activePointerId = null;
    this.draggingId = null;
    this.controls.enabled = true;
    this.snapRing.visible = false;
    this.callbacks.onDragFeedback(null);

    if (activeId) {
      const obj = this.componentTargets.get(activeId);
      if (obj) {
        this.restoreEmissive(obj);
        const home = this.homePoses.get(activeId);
        if (home) {
          this.startTween(activeId, obj, home.position, home.quaternion);
        }
      }
    }
  }

  private beginDrag(componentId: string): void {
    this.draggingId = componentId;
    this.activeTweens.delete(componentId);
    this.controls.enabled = false;
    this.domElement.style.cursor = 'grabbing';
    this.callbacks.onDragFeedback({
      draggingComponentId: componentId,
      nearestSlotId: null,
      evaluation: null,
    });
  }

  private raycastComponent(event: PointerEvent): string | null {
    const rect = this.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return null;
    }
    this.pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.draggableMeshes, false);
    for (const hit of hits) {
      const id = hit.object.userData['targetId'];
      if (typeof id === 'string' && this.componentTargets.has(id)) {
        return id;
      }
    }
    return null;
  }

  private projectPointerToDragPlane(event: PointerEvent): THREE.Vector3 | null {
    const rect = this.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return null;
    }
    this.pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    return this.raycaster.ray.intersectPlane(this.dragPlane, this.planeHitPoint);
  }

  private findNearestSlot(worldPoint: THREE.Vector3): string | null {
    let bestId: string | null = null;
    let bestDist = SNAP_PROXIMITY_RADIUS_M;

    for (const [slotId, center] of this.slotCenters.entries()) {
      const horizDist = Math.hypot(worldPoint.x - center.x, worldPoint.z - center.z);
      if (horizDist < bestDist) {
        bestDist = horizDist;
        bestId = slotId;
      }
    }
    return bestId;
  }

  private computeSeatedPose(componentId: string, slotId: string): Pose {
    const euler = new THREE.Euler(0, 0, 0);
    const pos = new THREE.Vector3();
    const center = this.slotCenters.get(slotId) ?? new THREE.Vector3();

    if (componentId === 'component-cpu-lga775') {
      pos.set(-0.012, 0.0298, -0.032);
    } else if (componentId === 'component-cooler-lga775') {
      pos.set(-0.012, 0.0345, -0.032);
    } else if (componentId === 'component-ram-ddr3') {
      const x = slotId === 'motherboard-dimm-1' ? 0.068 : 0.08;
      pos.set(x, 0.044, -0.022);
      euler.set(0, 0, Math.PI / 2); // Rotação automática vertical (contatos dourados para baixo)
    } else if (componentId === 'component-gpu-pcie') {
      pos.set(-0.017, 0.077, 0.026);
      euler.set(Math.PI / 2, 0, 0); // Rotação automática vertical (conector PCIe x16 para baixo)
    } else if (componentId === 'component-cable-sata') {
      pos.set(0.105, 0.036, 0.064);
    } else if (componentId === 'component-cable-power') {
      pos.set(center.x, 0.042, center.z);
    } else {
      pos.set(center.x, 0.045, center.z);
    }

    return {
      position: pos,
      quaternion: new THREE.Quaternion().setFromEuler(euler),
    };
  }

  private computePreviewPose(componentId: string, slotId: string, isCompatible: boolean): Pose {
    if (componentId === 'component-thermal-paste') {
      const center = this.slotCenters.get(slotId) ?? new THREE.Vector3(-0.012, 0.03, -0.032);
      return {
        position: new THREE.Vector3(center.x + 0.018, 0.066, center.z),
        quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.PI / 4)),
      };
    }

    if (isCompatible) {
      const seated = this.computeSeatedPose(componentId, slotId);
      return {
        position: seated.position.clone().add(new THREE.Vector3(0, 0.02, 0)),
        quaternion: seated.quaternion,
      };
    }

    const center = this.slotCenters.get(slotId) ?? new THREE.Vector3();
    const home = this.homePoses.get(componentId);
    return {
      position: new THREE.Vector3(center.x, DRAG_PLANE_HEIGHT_M, center.z),
      quaternion: home ? home.quaternion.clone() : new THREE.Quaternion(),
    };
  }

  private showSnapRing(slotId: string, colorHex: number): void {
    const center = this.slotCenters.get(slotId);
    if (!center) {
      this.snapRing.visible = false;
      return;
    }
    this.snapRing.position.set(center.x, 0.031, center.z);
    (this.snapRing.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    this.snapRing.visible = true;
  }

  private startTween(
    id: string,
    object: THREE.Object3D,
    targetPos: THREE.Vector3,
    targetQuat: THREE.Quaternion
  ): void {
    this.activeTweens.set(id, {
      object,
      targetPos: targetPos.clone(),
      targetQuat: targetQuat.clone(),
    });
  }

  private captureOriginalEmissive(mesh: THREE.Mesh): void {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of materials) {
      if (mat instanceof THREE.MeshStandardMaterial && !this.originalEmissive.has(mat)) {
        this.originalEmissive.set(mat, {
          hex: mat.emissive.getHex(),
          intensity: mat.emissiveIntensity,
        });
      }
    }
  }

  private applyDragTint(root: THREE.Object3D, hex: number, intensity: number): void {
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) {
        return;
      }
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of materials) {
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.emissive.setHex(hex);
          mat.emissiveIntensity = intensity;
        }
      }
    });
  }

  private restoreEmissive(root: THREE.Object3D): void {
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) {
        return;
      }
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of materials) {
        if (mat instanceof THREE.MeshStandardMaterial) {
          const orig = this.originalEmissive.get(mat);
          if (orig) {
            mat.emissive.setHex(orig.hex);
            mat.emissiveIntensity = orig.intensity;
          }
        }
      }
    });
  }
}
