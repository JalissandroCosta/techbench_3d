import * as THREE from 'three';

interface OriginalEmissiveState {
  readonly emissiveHex: number;
  readonly emissiveIntensity: number;
}

export interface SelectionControllerCallbacks {
  readonly onSelect: (targetId: string | null) => void;
  readonly onHover: (targetId: string | null) => void;
}

const CLICK_DRAG_THRESHOLD_PX = 5;

/**
 * Controla Raycasting seletivo, hover e destaque visual de objetos na cena 3D.
 * Distingue arrasto de câmera (OrbitControls) de clique real via limiar de pixels.
 * Zero dependência de Angular.
 */
export class SelectionController {
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2();
  private readonly interactiveMeshes: THREE.Object3D[] = [];
  private readonly originalEmissive = new WeakMap<
    THREE.MeshStandardMaterial,
    OriginalEmissiveState
  >();

  private hoveredTargetId: string | null = null;
  private selectedTargetId: string | null = null;
  private pointerDownPos: { x: number; y: number } | null = null;

  constructor(
    private readonly domElement: HTMLCanvasElement,
    private readonly camera: THREE.Camera,
    private readonly targets: Map<string, THREE.Object3D>,
    private readonly callbacks: SelectionControllerCallbacks
  ) {
    this.rebuildPickList();
    this.domElement.addEventListener('pointermove', this.handlePointerMove);
    this.domElement.addEventListener('pointerdown', this.handlePointerDown);
    this.domElement.addEventListener('pointerup', this.handlePointerUp);
    this.domElement.addEventListener('pointerleave', this.handlePointerLeave);
  }

  setSelectedTarget(targetId: string | null): void {
    if (this.selectedTargetId === targetId) {
      return;
    }
    const previousId = this.selectedTargetId;
    this.selectedTargetId = targetId;

    if (previousId) {
      this.refreshTargetVisual(previousId);
    }
    if (targetId) {
      this.refreshTargetVisual(targetId);
    }
  }

  refreshTargets(): void {
    this.rebuildPickList();
  }

  dispose(): void {
    this.domElement.removeEventListener('pointermove', this.handlePointerMove);
    this.domElement.removeEventListener('pointerdown', this.handlePointerDown);
    this.domElement.removeEventListener('pointerup', this.handlePointerUp);
    this.domElement.removeEventListener('pointerleave', this.handlePointerLeave);
    this.domElement.style.cursor = 'default';
  }

  private rebuildPickList(): void {
    this.interactiveMeshes.length = 0;
    for (const root of this.targets.values()) {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          this.interactiveMeshes.push(obj);
          this.captureOriginalEmissive(obj);
        }
      });
    }
  }

  private captureOriginalEmissive(mesh: THREE.Mesh): void {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const mat of materials) {
      if (mat instanceof THREE.MeshStandardMaterial && !this.originalEmissive.has(mat)) {
        this.originalEmissive.set(mat, {
          emissiveHex: mat.emissive.getHex(),
          emissiveIntensity: mat.emissiveIntensity,
        });
      }
    }
  }

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const hitId = this.raycastTargetId(event);
    if (hitId !== this.hoveredTargetId) {
      const previousHover = this.hoveredTargetId;
      this.hoveredTargetId = hitId;
      if (previousHover) {
        this.refreshTargetVisual(previousHover);
      }
      if (hitId) {
        this.refreshTargetVisual(hitId);
      }
      this.domElement.style.cursor = hitId ? 'pointer' : 'grab';
      this.callbacks.onHover(hitId);
    }
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) {
      return;
    }
    this.pointerDownPos = { x: event.clientX, y: event.clientY };
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    if (event.button !== 0 || !this.pointerDownPos) {
      return;
    }
    const dx = event.clientX - this.pointerDownPos.x;
    const dy = event.clientY - this.pointerDownPos.y;
    this.pointerDownPos = null;

    if (Math.hypot(dx, dy) > CLICK_DRAG_THRESHOLD_PX) {
      return;
    }

    const hitId = this.raycastTargetId(event);
    this.setSelectedTarget(hitId);
    this.callbacks.onSelect(hitId);
  };

  private readonly handlePointerLeave = (): void => {
    this.pointerDownPos = null;
    if (this.hoveredTargetId) {
      const prev = this.hoveredTargetId;
      this.hoveredTargetId = null;
      this.refreshTargetVisual(prev);
      this.callbacks.onHover(null);
    }
    this.domElement.style.cursor = 'default';
  };

  private raycastTargetId(event: PointerEvent): string | null {
    const rect = this.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return null;
    }

    this.pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const intersections = this.raycaster.intersectObjects(this.interactiveMeshes, false);
    if (intersections.length === 0) {
      return null;
    }

    for (const hit of intersections) {
      const targetId = this.resolveTargetId(hit.object);
      if (targetId) {
        return targetId;
      }
    }
    return null;
  }

  private resolveTargetId(object: THREE.Object3D | null): string | null {
    let current: THREE.Object3D | null = object;
    while (current) {
      const id = current.userData['targetId'];
      if (typeof id === 'string' && this.targets.has(id)) {
        return id;
      }
      current = current.parent;
    }
    return null;
  }

  private refreshTargetVisual(targetId: string): void {
    const root = this.targets.get(targetId);
    if (!root) {
      return;
    }

    const isSelected = targetId === this.selectedTargetId;
    const isHovered = targetId === this.hoveredTargetId;

    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) {
        return;
      }
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of materials) {
        if (!(mat instanceof THREE.MeshStandardMaterial)) {
          continue;
        }
        const original = this.originalEmissive.get(mat);
        if (!original) {
          continue;
        }

        if (isSelected) {
          mat.emissive.setHex(0x0ea5e9);
          mat.emissiveIntensity = 0.45;
        } else if (isHovered) {
          mat.emissive.setHex(0x38bdf8);
          mat.emissiveIntensity = 0.24;
        } else {
          mat.emissive.setHex(original.emissiveHex);
          mat.emissiveIntensity = original.emissiveIntensity;
        }
      }
    });
  }
}
