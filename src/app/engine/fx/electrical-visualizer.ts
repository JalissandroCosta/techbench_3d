import * as THREE from 'three';
import { ElectricalOverlayAnalysis } from '../../domain/electrical/electrical.models';

interface MaterialSnapshot {
  readonly colorHex: number;
  readonly emissiveHex: number;
  readonly emissiveIntensity: number;
}

interface EnergyPulse {
  readonly mesh: THREE.Mesh;
  readonly curve: THREE.CatmullRomCurve3;
  readonly offset: number;
}

/**
 * Visualizador 3D do Modo Elétrico (Sprint 6):
 * - Escurece componentes não relacionados à linha de tensão selecionada;
 * - Aplica brilho emissivo pulsante na cor ATX da linha (+12V, +5V, +3.3V, +5VSB, Vcore, 1.5V);
 * - Anima pulsos de energia percorrendo os cabos conectados dessa linha.
 * Zero dependência de Angular.
 */
export class ElectricalVisualizer {
  private readonly pulsesRoot = new THREE.Group();
  private readonly snapshots = new WeakMap<THREE.MeshStandardMaterial, MaterialSnapshot>();
  private readonly activePulses: EnergyPulse[] = [];
  private readonly highlightedMaterials: THREE.MeshStandardMaterial[] = [];

  private active = false;
  private currentColorHex = 0xeab308;
  private clock = 0;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly interactiveTargets: Map<string, THREE.Object3D>,
    private readonly getCableCurve: (connectionId: string) => THREE.CatmullRomCurve3 | null
  ) {
    this.pulsesRoot.name = 'ELECTRICAL_PULSES_ROOT';
    this.scene.add(this.pulsesRoot);
  }

  applyOverlay(active: boolean, analysis: ElectricalOverlayAnalysis | null): void {
    this.restoreAll();
    this.clearPulses();

    this.active = active && analysis !== null;
    if (!this.active || !analysis) {
      return;
    }

    const railColor = new THREE.Color(analysis.rail.colorHex);
    this.currentColorHex = railColor.getHex();

    const highlightedIds = new Set<string>([
      ...analysis.rail.relatedTargetIds,
      ...analysis.activeConnectionIds,
    ]);

    for (const [id, root] of this.interactiveTargets.entries()) {
      const isRelated = highlightedIds.has(id);

      root.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) {
          return;
        }
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of mats) {
          if (!(mat instanceof THREE.MeshStandardMaterial)) {
            continue;
          }
          if (!this.snapshots.has(mat)) {
            this.snapshots.set(mat, {
              colorHex: mat.color.getHex(),
              emissiveHex: mat.emissive.getHex(),
              emissiveIntensity: mat.emissiveIntensity,
            });
          }

          const snap = this.snapshots.get(mat)!;
          if (isRelated) {
            mat.color.setHex(snap.colorHex);
            mat.emissive.setHex(this.currentColorHex);
            mat.emissiveIntensity = 0.52;
            this.highlightedMaterials.push(mat);
          } else {
            mat.color.setHex(snap.colorHex).multiplyScalar(0.36);
            mat.emissive.setHex(0x000000);
            mat.emissiveIntensity = 0;
          }
        }
      });
    }

    // Cria pulsos animados percorrendo cada cabo conectado que pertence a esta linha
    const pulseGeo = new THREE.SphereGeometry(0.0062, 12, 10);
    for (const connId of analysis.activeConnectionIds) {
      const curve = this.getCableCurve(connId);
      if (!curve) {
        continue;
      }
      for (const offset of [0, 0.33, 0.66]) {
        const pulseMat = new THREE.MeshBasicMaterial({ color: this.currentColorHex });
        const mesh = new THREE.Mesh(pulseGeo.clone(), pulseMat);
        mesh.position.copy(curve.getPointAt(offset));
        this.pulsesRoot.add(mesh);
        this.activePulses.push({ mesh, curve, offset });
      }
    }
    pulseGeo.dispose();
  }

  update(dt: number): void {
    if (!this.active) {
      return;
    }
    this.clock += dt;

    // Pulso suave no emissivo dos componentes da linha selecionada
    const intensity = 0.42 + Math.sin(this.clock * 4.5) * 0.14;
    for (const mat of this.highlightedMaterials) {
      mat.emissiveIntensity = intensity;
    }

    // Movimento contínuo dos pulsos elétricos ao longo dos cabos conectados
    for (const pulse of this.activePulses) {
      const t = (pulse.offset + this.clock * 0.45) % 1;
      pulse.mesh.position.copy(pulse.curve.getPointAt(t));
    }
  }

  dispose(): void {
    this.restoreAll();
    this.clearPulses();
    this.scene.remove(this.pulsesRoot);
  }

  private restoreAll(): void {
    this.highlightedMaterials.length = 0;
    for (const root of this.interactiveTargets.values()) {
      root.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) {
          return;
        }
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of mats) {
          if (!(mat instanceof THREE.MeshStandardMaterial)) {
            continue;
          }
          const snap = this.snapshots.get(mat);
          if (snap) {
            mat.color.setHex(snap.colorHex);
            mat.emissive.setHex(snap.emissiveHex);
            mat.emissiveIntensity = snap.emissiveIntensity;
          }
        }
      });
    }
  }

  private clearPulses(): void {
    for (const pulse of this.activePulses) {
      pulse.mesh.geometry.dispose();
      (pulse.mesh.material as THREE.Material).dispose();
      this.pulsesRoot.remove(pulse.mesh);
    }
    this.activePulses.length = 0;
  }
}
