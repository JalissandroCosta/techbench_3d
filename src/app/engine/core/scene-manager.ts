import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AssemblyState } from '../../domain/assembly/assembly.models';
import { CableConnectionEntity } from '../../domain/connections/connection.models';
import { PostTestReport } from '../../domain/diagnostics/diagnostics.models';
import { ElectricalOverlayAnalysis } from '../../domain/electrical/electrical.models';
import { EquipmentProfile } from '../../domain/equipment/equipment.models';
import { ResolvedGraphicsSettings } from '../../domain/graphics/graphics-quality.engine';
import { BenchMonitorController } from '../assets/bench-monitor.factory';
import { buildEquipmentScene } from '../assets/equipment-scene.factory';
import { CableRenderer } from '../cables/cable-renderer';
import { ElectricalVisualizer } from '../fx/electrical-visualizer';
import { DragDropController } from '../interaction/drag-drop-controller';
import { SelectionController } from '../interaction/selection-controller';
import {
  EngineCameraPose,
  EngineCameraPreset,
  SceneManagerCallbacks,
} from './engine.types';

const BENCH_CAMERA_PRESETS: Record<EngineCameraPreset, EngineCameraPose> = {
  overview: { position: [0.16, 0.42, 0.54], target: [0.14, 0.025, 0.0] },
  top: { position: [0.14, 0.62, 0.04], target: [0.14, 0.024, 0.0] },
  front: { position: [0.14, 0.16, 0.52], target: [0.14, 0.03, 0.0] },
  isometric: { position: [-0.24, 0.34, 0.36], target: [0.06, 0.025, 0.0] },
  parts: { position: [0.34, 0.32, 0.36], target: [0.33, 0.025, 0.02] },
};

const CENTERED_CAMERA_PRESETS: Record<EngineCameraPreset, EngineCameraPose> = {
  overview: { position: [0.28, 0.32, 0.36], target: [0, 0.025, 0] },
  top: { position: [0, 0.48, 0.04], target: [0, 0.025, 0] },
  front: { position: [0, 0.14, 0.42], target: [0, 0.025, 0] },
  isometric: { position: [-0.28, 0.3, 0.32], target: [0, 0.025, 0] },
  parts: { position: [0.28, 0.32, 0.36], target: [0, 0.025, 0] },
};

/**
 * Gerenciador isolado da cena Three.js com suporte multi-equipamentos (Sprint 11).
 * Realiza troca dinâmica de equipamento com descarte determinístico de memória GPU.
 * Zero dependência de Angular.
 */
export class SceneManager {
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly controls: OrbitControls;
  private keyLight: THREE.DirectionalLight | null = null;

  private selectionController: SelectionController | null = null;
  private dragDropController: DragDropController | null = null;
  private cableRenderer: CableRenderer | null = null;
  private electricalVisualizer: ElectricalVisualizer | null = null;
  private benchMonitor: BenchMonitorController | null = null;
  private componentTargets = new Map<string, THREE.Object3D>();

  private interactiveRoots: THREE.Group[] = [];
  private anchorGroups: THREE.Group[] = [];
  private activeSupportsFullAssembly = true;
  private loadedEquipmentId: string | null = null;

  private animationFrameId: number | null = null;
  private disposed = false;
  private lastFrameTime = performance.now();
  private telemetryAccumTime = 0;
  private telemetryFrames = 0;

  private transitionGoal: {
    position: THREE.Vector3;
    target: THREE.Vector3;
  } | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly callbacks: SceneManagerCallbacks,
    initialEquipment: EquipmentProfile
  ) {
    this.scene.background = new THREE.Color(0x0b0f17);
    this.scene.fog = new THREE.Fog(0x0b0f17, 1.8, 3.8);

    const width = Math.max(canvas.clientWidth, 1);
    const height = Math.max(canvas.clientHeight, 1);

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.01, 10);
    const initialPose = BENCH_CAMERA_PRESETS.overview;
    this.camera.position.set(...initialPose.position);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 0.14;
    this.controls.maxDistance = 1.5;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    this.controls.target.set(...initialPose.target);
    this.controls.addEventListener('start', this.cancelCameraTransition);

    this.setupLighting();
    this.setupEnvironmentFloor();
    this.loadEquipment(initialEquipment);
    this.startRenderLoop();
  }

  loadEquipment(profile: EquipmentProfile): void {
    if (this.disposed || this.loadedEquipmentId === profile.id) {
      return;
    }

    this.disposeEquipmentLayer();
    this.loadedEquipmentId = profile.id;
    this.activeSupportsFullAssembly = profile.supportsFullAssembly;

    const built = buildEquipmentScene(profile);
    this.interactiveRoots = [...built.roots];
    this.anchorGroups = [...built.anchorGroups];
    this.componentTargets = built.componentTargets;

    for (const root of this.interactiveRoots) {
      this.scene.add(root);
    }

    if (profile.supportsFullAssembly) {
      this.benchMonitor = new BenchMonitorController();
      this.scene.add(this.benchMonitor.rootGroup);
      this.dragDropController = new DragDropController(
        this.canvas,
        this.camera,
        this.controls,
        this.scene,
        built.componentTargets,
        built.motherboardTargets,
        {
          evaluatePlacement: (cid, sid) => this.callbacks.evaluatePlacement(cid, sid),
          onAttemptInstall: (cid, sid) => this.callbacks.onAttemptInstall(cid, sid),
          onAttemptRemove: (cid) => this.callbacks.onAttemptRemove(cid),
          onDragFeedback: (fb) => this.callbacks.onDragFeedback(fb),
        }
      );

      this.cableRenderer = new CableRenderer(
        this.canvas,
        this.camera,
        this.scene,
        built.mergedTargets,
        (portId) => this.callbacks.onPortClicked(portId)
      );

      this.electricalVisualizer = new ElectricalVisualizer(
        this.scene,
        built.mergedTargets,
        (connId) => this.cableRenderer?.getCableCurve(connId) ?? null
      );
    }

    this.selectionController = new SelectionController(
      this.canvas,
      this.camera,
      built.mergedTargets,
      {
        onSelect: (id) => {
          if (
            !this.dragDropController?.isDragging &&
            !this.cableRenderer?.wasPortClickedRecently()
          ) {
            this.callbacks.onSelectTarget(id);
          }
        },
        onHover: (id) => {
          if (!this.dragDropController?.isDragging) {
            this.callbacks.onHoverTarget(id);
          }
        },
      }
    );

    this.setCameraPreset('overview');
  }

  resize(width: number, height: number): void {
    if (this.disposed || width <= 0 || height <= 0) {
      return;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  setSelectedTarget(targetId: string | null): void {
    this.selectionController?.setSelectedTarget(targetId);
  }

  syncAssemblyState(state: AssemblyState): void {
    this.dragDropController?.syncAssemblyState(state);
  }

  syncConnections(connections: readonly CableConnectionEntity[]): void {
    this.cableRenderer?.syncConnections(connections);

    // Oculta os cabos soltos na manta ESD quando já estão conectados na bancada
    const connectedIds = new Set(connections.map((c) => c.id));
    const looseSata = this.componentTargets.get('component-cable-sata');
    if (looseSata) {
      looseSata.visible = !connectedIds.has('conn-sata-data');
    }
    const looseSataSsd = this.componentTargets.get('component-cable-sata-ssd');
    if (looseSataSsd) {
      looseSataSsd.visible = !connectedIds.has('conn-ssd-data');
    }

    this.selectionController?.refreshTargets();
  }

  updateMonitorPost(report: PostTestReport | null): void {
    this.benchMonitor?.renderReport(report);
  }

  setCableMode(active: boolean, pendingPortId: string | null): void {
    this.cableRenderer?.setCableMode(active, pendingPortId);
  }

  setElectricalOverlay(active: boolean, analysis: ElectricalOverlayAnalysis | null): void {
    this.electricalVisualizer?.applyOverlay(active, analysis);
  }

  setCameraPreset(preset: EngineCameraPreset): void {
    const map = this.activeSupportsFullAssembly ? BENCH_CAMERA_PRESETS : CENTERED_CAMERA_PRESETS;
    this.focusCamera(map[preset]);
  }

  focusCamera(pose: EngineCameraPose): void {
    this.transitionGoal = {
      position: new THREE.Vector3(...pose.position),
      target: new THREE.Vector3(...pose.target),
    };
  }

  setShowAnchors(visible: boolean): void {
    for (const group of this.anchorGroups) {
      group.visible = visible;
    }
  }

  setWireframe(enabled: boolean): void {
    for (const root of this.interactiveRoots) {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of materials) {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.wireframe = enabled;
            }
          }
        }
      });
    }
  }

  applyGraphicsSettings(settings: ResolvedGraphicsSettings): void {
    if (this.disposed) {
      return;
    }
    this.renderer.setPixelRatio(settings.maxPixelRatio);
    this.renderer.shadowMap.enabled = settings.shadowsEnabled;
    this.renderer.shadowMap.needsUpdate = true;

    if (this.keyLight) {
      this.keyLight.castShadow = settings.shadowsEnabled;
      if (this.keyLight.shadow.mapSize.x !== settings.shadowMapSize) {
        this.keyLight.shadow.mapSize.set(settings.shadowMapSize, settings.shadowMapSize);
        this.keyLight.shadow.map?.dispose();
        this.keyLight.shadow.map = null;
      }
    }
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.controls.removeEventListener('start', this.cancelCameraTransition);
    this.controls.dispose();
    this.disposeEquipmentLayer();

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of materials) {
          mat.dispose();
        }
      }
    });

    this.renderer.dispose();
  }

  private disposeEquipmentLayer(): void {
    this.electricalVisualizer?.dispose();
    this.electricalVisualizer = null;

    this.cableRenderer?.dispose();
    this.cableRenderer = null;

    this.dragDropController?.dispose();
    this.dragDropController = null;

    this.selectionController?.dispose();
    this.selectionController = null;

    if (this.benchMonitor) {
      this.scene.remove(this.benchMonitor.rootGroup);
      this.benchMonitor.dispose();
      this.benchMonitor = null;
    }
    this.componentTargets.clear();

    for (const root of this.interactiveRoots) {
      root.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const mat of materials) {
            mat.dispose();
          }
        }
      });
      this.scene.remove(root);
    }
    this.interactiveRoots = [];
    this.anchorGroups = [];
  }

  private setupLighting(): void {
    const hemi = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.95);
    this.scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    this.keyLight = keyLight;
    keyLight.position.set(0.55, 0.85, 0.45);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.1;
    keyLight.shadow.camera.far = 2.6;
    const d = 0.6;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x7dd3fc, 0.75);
    rimLight.position.set(-0.5, 0.45, -0.45);
    this.scene.add(rimLight);
  }

  private setupEnvironmentFloor(): void {
    const grid = new THREE.GridHelper(2.0, 40, 0x1e3a5f, 0x162032);
    grid.position.set(0.08, 0.0005, 0);
    this.scene.add(grid);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(3.6, 3.6),
      new THREE.MeshStandardMaterial({
        color: 0x0d131f,
        metalness: 0.1,
        roughness: 0.9,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
  }

  private readonly cancelCameraTransition = (): void => {
    this.transitionGoal = null;
  };

  private startRenderLoop(): void {
    const tick = (now: number): void => {
      if (this.disposed) {
        return;
      }
      this.animationFrameId = requestAnimationFrame(tick);

      const dt = Math.min((now - this.lastFrameTime) / 1000, 0.05);
      this.lastFrameTime = now;

      if (this.transitionGoal) {
        const lerpAlpha = 1 - Math.exp(-8 * dt);
        this.camera.position.lerp(this.transitionGoal.position, lerpAlpha);
        this.controls.target.lerp(this.transitionGoal.target, lerpAlpha);

        if (
          this.camera.position.distanceTo(this.transitionGoal.position) < 0.002 &&
          this.controls.target.distanceTo(this.transitionGoal.target) < 0.002
        ) {
          this.camera.position.copy(this.transitionGoal.position);
          this.controls.target.copy(this.transitionGoal.target);
          this.transitionGoal = null;
        }
      }

      this.dragDropController?.update(dt);
      this.cableRenderer?.update(dt);
      this.electricalVisualizer?.update(dt);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);

      this.telemetryAccumTime += dt;
      this.telemetryFrames += 1;
      if (this.telemetryAccumTime >= 0.25) {
        const fps = Math.round(this.telemetryFrames / this.telemetryAccumTime);
        this.callbacks.onTelemetry({
          fps,
          drawCalls: this.renderer.info.render.calls,
          triangles: this.renderer.info.render.triangles,
        });
        this.telemetryAccumTime = 0;
        this.telemetryFrames = 0;
      }
    };

    this.animationFrameId = requestAnimationFrame(tick);
  }
}
