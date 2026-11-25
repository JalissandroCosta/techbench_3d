import * as THREE from 'three';
import { CableConnectionEntity } from '../../domain/connections/connection.models';

interface PortAnchorConfig {
  readonly position: readonly [number, number, number];
  readonly colorHex: number;
  readonly label: string;
}

const PORT_ANCHORS: Record<string, PortAnchorConfig> = {
  // Fonte ATX
  'psu-out-atx24': { position: [0.338, 0.044, -0.058], colorHex: 0xf43f5e, label: 'ATX 24P' },
  'psu-out-cpu4': { position: [0.338, 0.056, -0.105], colorHex: 0xf59e0b, label: 'CPU 4P' },
  'psu-out-sata-power': { position: [0.338, 0.032, -0.032], colorHex: 0xfb923c, label: 'HD 15P' },
  'psu-out-ssd-power': { position: [0.375, 0.032, -0.02], colorHex: 0xfacc15, label: 'SSD 15P' },
  'psu-out-pcie6': { position: [0.338, 0.048, -0.08], colorHex: 0x22c55e, label: 'PCIe 6P' },

  // Placa-Mãe PCWare IPM41-D3
  'mb-in-atx24': { position: [0.106, 0.039, -0.022], colorHex: 0xf43f5e, label: 'ATX 24P' },
  'mb-in-cpu4': { position: [-0.072, 0.039, -0.078], colorHex: 0xf59e0b, label: 'CPU 4P' },
  'mb-port-sata-data': { position: [0.095, 0.035, 0.064], colorHex: 0xdc2626, label: 'SATA 1' },
  'mb-port-sata-2': { position: [0.095, 0.035, 0.082], colorHex: 0x06b6d4, label: 'SATA 2' },
  'mb-port-cpu-fan': { position: [0.036, 0.034, -0.074], colorHex: 0x14b8a6, label: 'CPU_FAN' },

  // HD Samsung 3.5" (embaixo da placa-mãe, lado direito)
  'hdd-in-sata-power': { position: [0.132, 0.018, 0.165], colorHex: 0xfb923c, label: 'HD 15P' },
  'hdd-port-sata-data': { position: [0.132, 0.018, 0.205], colorHex: 0xdc2626, label: 'HD SATA' },

  // SSD 2.5" SATA (embaixo da placa-mãe, lado esquerdo)
  'ssd-in-power': { position: [-0.02, 0.014, 0.168], colorHex: 0xfacc15, label: 'SSD 15P' },
  'ssd-port-sata': { position: [-0.02, 0.014, 0.202], colorHex: 0x06b6d4, label: 'SSD SATA' },

  // GPU & Cooler (quando instalados)
  'gpu-in-pcie6': { position: [0.05, 0.112, 0.044], colorHex: 0x22c55e, label: 'GPU 6P' },
  'cooler-in-fan': { position: [0.012, 0.068, -0.032], colorHex: 0x14b8a6, label: 'FAN 4P' },
};

const COMPATIBLE_PORT_PAIR: Record<string, string> = {
  'psu-out-atx24': 'mb-in-atx24',
  'mb-in-atx24': 'psu-out-atx24',
  'psu-out-cpu4': 'mb-in-cpu4',
  'mb-in-cpu4': 'psu-out-cpu4',
  'psu-out-pcie6': 'gpu-in-pcie6',
  'gpu-in-pcie6': 'psu-out-pcie6',
  'psu-out-sata-power': 'hdd-in-sata-power',
  'hdd-in-sata-power': 'psu-out-sata-power',
  'psu-out-ssd-power': 'ssd-in-power',
  'ssd-in-power': 'psu-out-ssd-power',
  'hdd-port-sata-data': 'mb-port-sata-data',
  'mb-port-sata-data': 'hdd-port-sata-data',
  'ssd-port-sata': 'mb-port-sata-2',
  'mb-port-sata-2': 'ssd-port-sata',
  'mb-port-cpu-fan': 'cooler-in-fan',
  'cooler-in-fan': 'mb-port-cpu-fan',
};

/**
 * Renderizador 3D paramétrico de cabos (CatmullRomCurve3 + TubeGeometry)
 * e marcadores interativos de portas na bancada (Sprint 5).
 * Gerencia descarte determinístico de geometrias/materiais na GPU.
 * Zero dependência de Angular.
 */
export class CableRenderer {
  private readonly cablesRoot = new THREE.Group();
  private readonly portMarkersRoot = new THREE.Group();
  private readonly cableGroups = new Map<string, THREE.Group>();
  private readonly cableCurves = new Map<string, THREE.CatmullRomCurve3>();
  private readonly portMarkerMeshes = new Map<string, THREE.Mesh>();
  private readonly portLabelSprites = new Map<string, THREE.Sprite>();
  private guideLine: THREE.Line | null = null;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2();
  private cableModeActive = false;
  private pendingPortId: string | null = null;
  private matchingTargetPortId: string | null = null;
  private pulseClock = 0;
  private lastPortClickTimestamp = 0;

  constructor(
    private readonly domElement: HTMLCanvasElement,
    private readonly camera: THREE.Camera,
    private readonly scene: THREE.Scene,
    private readonly interactiveTargets: Map<string, THREE.Object3D>,
    private readonly onPortClicked: (portId: string) => void
  ) {
    this.cablesRoot.name = 'CABLES_ROOT';
    this.portMarkersRoot.name = 'PORT_MARKERS_ROOT';
    this.portMarkersRoot.visible = false;

    this.scene.add(this.cablesRoot);
    this.scene.add(this.portMarkersRoot);

    this.buildPortMarkers();
    this.domElement.addEventListener('pointerup', this.handlePortClick);
  }

  setCableMode(active: boolean, pendingPortId: string | null): void {
    this.cableModeActive = active;
    this.pendingPortId = pendingPortId;
    this.matchingTargetPortId = pendingPortId ? (COMPATIBLE_PORT_PAIR[pendingPortId] ?? null) : null;
    this.portMarkersRoot.visible = active;

    this.clearGuideLine();

    for (const [portId, mesh] of this.portMarkerMeshes.entries()) {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const cfg = PORT_ANCHORS[portId];
      if (portId === pendingPortId) {
        mat.color.setHex(0x38bdf8);
        mat.emissive.setHex(0x38bdf8);
        mat.emissiveIntensity = 1.0;
        mat.opacity = 1;
        mat.transparent = false;
      } else if (portId === this.matchingTargetPortId) {
        // Sinaliza fortemente em verde esmeralda a porta de destino compatível!
        mat.color.setHex(0x22c55e);
        mat.emissive.setHex(0x22c55e);
        mat.emissiveIntensity = 1.15;
        mat.opacity = 1;
        mat.transparent = false;
      } else if (cfg) {
        mat.color.setHex(cfg.colorHex);
        mat.emissive.setHex(cfg.colorHex);
        mat.emissiveIntensity = pendingPortId ? 0.15 : 0.55;
        mat.transparent = Boolean(pendingPortId);
        mat.opacity = pendingPortId ? 0.35 : 1;
      }
    }

    if (active && pendingPortId && this.matchingTargetPortId) {
      this.buildGuideLine(pendingPortId, this.matchingTargetPortId);
    }
  }

  getCableCurve(connectionId: string): THREE.CatmullRomCurve3 | null {
    return this.cableCurves.get(connectionId) ?? null;
  }

  syncConnections(connections: readonly CableConnectionEntity[]): void {
    const nextIds = new Set(connections.map((c) => c.id));

    // Remove cabos desconectados liberando memória GPU
    for (const [id, group] of this.cableGroups.entries()) {
      if (!nextIds.has(id)) {
        this.disposeGroup(group);
        this.cablesRoot.remove(group);
        this.cableGroups.delete(id);
        this.cableCurves.delete(id);
        this.interactiveTargets.delete(id);
      }
    }

    // Cria cabos recém-conectados
    for (const conn of connections) {
      if (!this.cableGroups.has(conn.id)) {
        const group = this.buildCableGroup(conn);
        this.cablesRoot.add(group);
        this.cableGroups.set(conn.id, group);
        this.interactiveTargets.set(conn.id, group);
      }
    }
  }

  update(dt: number): void {
    if (!this.cableModeActive) {
      return;
    }
    this.pulseClock += dt;
    const scale = 1 + Math.sin(this.pulseClock * 6) * 0.15;
    for (const [portId, mesh] of this.portMarkerMeshes.entries()) {
      const s =
        portId === this.pendingPortId
          ? scale * 1.3
          : portId === this.matchingTargetPortId
            ? scale * 1.45
            : scale;
      mesh.scale.setScalar(s);
    }
  }

  dispose(): void {
    this.domElement.removeEventListener('pointerup', this.handlePortClick);
    this.clearGuideLine();
    for (const group of this.cableGroups.values()) {
      this.disposeGroup(group);
    }
    this.cableGroups.clear();

    for (const mesh of this.portMarkerMeshes.values()) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
    this.portMarkerMeshes.clear();

    for (const sprite of this.portLabelSprites.values()) {
      const mat = sprite.material as THREE.SpriteMaterial;
      mat.map?.dispose();
      mat.dispose();
    }
    this.portLabelSprites.clear();

    this.scene.remove(this.cablesRoot);
    this.scene.remove(this.portMarkersRoot);
  }

  private buildPortMarkers(): void {
    const sphereGeo = new THREE.SphereGeometry(0.009, 16, 12);
    for (const [portId, cfg] of Object.entries(PORT_ANCHORS)) {
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.colorHex,
        emissive: cfg.colorHex,
        emissiveIntensity: 0.55,
        roughness: 0.3,
        metalness: 0.2,
      });
      const marker = new THREE.Mesh(sphereGeo.clone(), mat);
      marker.name = `PORT_MARKER_${portId}`;
      marker.position.set(cfg.position[0], cfg.position[1] + 0.009, cfg.position[2]);
      marker.userData['portId'] = portId;
      this.portMarkersRoot.add(marker);
      this.portMarkerMeshes.set(portId, marker);

      const labelSprite = this.createPortLabelSprite(cfg.label, cfg.colorHex);
      if (labelSprite) {
        labelSprite.position.set(cfg.position[0], cfg.position[1] + 0.028, cfg.position[2]);
        this.portMarkersRoot.add(labelSprite);
        this.portLabelSprites.set(portId, labelSprite);
      }
    }
    sphereGeo.dispose();
  }

  private createPortLabelSprite(text: string, colorHex: number): THREE.Sprite | null {
    if (typeof document === 'undefined') {
      return null;
    }
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 44;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }
    const hexStr = `#${colorHex.toString(16).padStart(6, '0')}`;
    ctx.fillStyle = 'rgba(7, 11, 20, 0.88)';
    ctx.fillRect(2, 2, 156, 40);
    ctx.strokeStyle = hexStr;
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 156, 40);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 80, 23);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.044, 0.012, 1);
    sprite.renderOrder = 20;
    return sprite;
  }

  private buildGuideLine(sourceId: string, targetId: string): void {
    const a = PORT_ANCHORS[sourceId];
    const b = PORT_ANCHORS[targetId];
    if (!a || !b) {
      return;
    }
    const start = new THREE.Vector3(a.position[0], a.position[1] + 0.012, a.position[2]);
    const end = new THREE.Vector3(b.position[0], b.position[1] + 0.012, b.position[2]);
    const mid = start.clone().lerp(end, 0.5);
    mid.y = Math.max(start.y, end.y) + 0.055;
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const points = curve.getPoints(28);
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineDashedMaterial({
      color: 0x22c55e,
      dashSize: 0.012,
      gapSize: 0.008,
    });
    const line = new THREE.Line(geo, mat);
    line.computeLineDistances();
    line.name = 'CABLE_GUIDE_LINE';
    this.portMarkersRoot.add(line);
    this.guideLine = line;
  }

  private clearGuideLine(): void {
    if (!this.guideLine) {
      return;
    }
    this.portMarkersRoot.remove(this.guideLine);
    this.guideLine.geometry.dispose();
    (this.guideLine.material as THREE.Material).dispose();
    this.guideLine = null;
  }

  wasPortClickedRecently(): boolean {
    return performance.now() - this.lastPortClickTimestamp < 80;
  }

  private readonly handlePortClick = (event: PointerEvent): void => {
    if (!this.cableModeActive || event.button !== 0) {
      return;
    }
    const rect = this.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      return;
    }
    this.pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects([...this.portMarkerMeshes.values()], false);
    if (hits.length > 0) {
      const portId = hits[0].object.userData['portId'];
      if (typeof portId === 'string') {
        this.lastPortClickTimestamp = performance.now();
        this.onPortClicked(portId);
      }
    }
  };

  private buildCableGroup(conn: CableConnectionEntity): THREE.Group {
    const group = new THREE.Group();
    group.name = conn.id;
    group.userData['targetId'] = conn.id;

    const startCfg = PORT_ANCHORS[conn.source.portId];
    const endCfg = PORT_ANCHORS[conn.target.portId];
    const start = new THREE.Vector3(...(startCfg?.position ?? [0.3, 0.05, 0]));
    const end = new THREE.Vector3(...(endCfg?.position ?? [0, 0.04, 0]));

    const points = this.computeWaypoints(conn.id, start, end);
    const curve = new THREE.CatmullRomCurve3(points);
    this.cableCurves.set(conn.id, curve);

    const radius =
      conn.connector === 'ATX_24P'
        ? 0.0052
        : conn.connector === 'CPU_4P' || conn.connector === 'PCIE_6P'
          ? 0.0034
          : conn.connector === 'FAN_4P_PWM'
            ? 0.0018
            : 0.0028;

    const tubeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(conn.colorHex),
      metalness: 0.15,
      roughness: 0.48,
    });
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, radius, 10, false), tubeMat);
    tube.castShadow = true;
    tube.receiveShadow = true;
    tube.userData['targetId'] = conn.id;
    group.add(tube);

    // Plugues nas duas pontas do cabo
    const plugMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.2,
      roughness: 0.55,
    });
    const plugSize = conn.connector === 'ATX_24P' ? [0.012, 0.012, 0.046] : [0.011, 0.01, 0.012];
    const plugStart = new THREE.Mesh(
      new THREE.BoxGeometry(plugSize[0], plugSize[1], plugSize[2]),
      plugMat
    );
    plugStart.position.copy(start);
    plugStart.userData['targetId'] = conn.id;

    const plugEnd = new THREE.Mesh(
      new THREE.BoxGeometry(plugSize[0], plugSize[1], plugSize[2]),
      plugMat.clone()
    );
    plugEnd.position.copy(end);
    plugEnd.userData['targetId'] = conn.id;

    group.add(plugStart, plugEnd);
    return group;
  }

  private computeWaypoints(
    connectionId: string,
    start: THREE.Vector3,
    end: THREE.Vector3
  ): THREE.Vector3[] {
    if (connectionId === 'conn-cpu-4p') {
      // Contorna a borda superior da placa-mãe para não atravessar RAM nem Cooler
      return [
        start,
        new THREE.Vector3(0.24, 0.075, -0.125),
        new THREE.Vector3(0.06, 0.075, -0.125),
        new THREE.Vector3(-0.072, 0.072, -0.105),
        end,
      ];
    }

    if (connectionId === 'conn-atx-24p') {
      return [
        start,
        new THREE.Vector3(0.24, 0.068, -0.045),
        new THREE.Vector3(0.155, 0.065, -0.025),
        end,
      ];
    }

    if (connectionId === 'conn-sata-data') {
      return [
        start,
        new THREE.Vector3(0.155, 0.032, 0.155),
        new THREE.Vector3(0.135, 0.042, 0.105),
        end,
      ];
    }

    if (connectionId === 'conn-ssd-data') {
      return [
        start,
        new THREE.Vector3(0.04, 0.034, 0.138),
        new THREE.Vector3(0.095, 0.042, 0.112),
        end,
      ];
    }

    if (connectionId === 'conn-sata-power' || connectionId === 'conn-ssd-power') {
      return [
        start,
        new THREE.Vector3(0.24, 0.042, 0.095),
        new THREE.Vector3(0.17, 0.038, 0.155),
        end,
      ];
    }

    const mid = start.clone().lerp(end, 0.5);
    mid.y = Math.max(start.y, end.y) + 0.035;
    return [start, mid, end];
  }

  private disposeGroup(group: THREE.Group): void {
    group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          m.dispose();
        }
      }
    });
  }
}
