import * as THREE from 'three';
import { CustomEquipmentConfig, EquipmentProfile } from '../../domain/equipment/equipment.models';
import { buildBenchComponentsTray } from './bench-components.factory';
import { buildIpm41D3TechBench } from './ipm41-d3.factory';

export interface EquipmentSceneBuildResult {
  readonly roots: readonly THREE.Group[];
  readonly anchorGroups: readonly THREE.Group[];
  readonly motherboardTargets: Map<string, THREE.Object3D>;
  readonly componentTargets: Map<string, THREE.Object3D>;
  readonly mergedTargets: Map<string, THREE.Object3D>;
}

/**
 * Dispatcher 3D Multi-Equipamentos (Sprint 11):
 * Constrói o modelo 3D específico para PCWare IPM41-D3, Dell OptiPlex 3070,
 * Servidor Rack 1U, Notebook 14" ou Equipamento Personalizado.
 * Zero dependência de Angular.
 */
export function buildEquipmentScene(profile: EquipmentProfile): EquipmentSceneBuildResult {
  if (profile.supportsFullAssembly) {
    const mbBench = buildIpm41D3TechBench();
    const partsTray = buildBenchComponentsTray();
    const mergedTargets = new Map<string, THREE.Object3D>([
      ...mbBench.interactiveTargets.entries(),
      ...partsTray.interactiveTargets.entries(),
    ]);
    return {
      roots: [mbBench.rootGroup, partsTray.rootGroup],
      anchorGroups: [mbBench.anchorsGroup, partsTray.anchorsGroup],
      motherboardTargets: mbBench.interactiveTargets,
      componentTargets: partsTray.interactiveTargets,
      mergedTargets,
    };
  }

  if (profile.id === 'equip-dell-optiplex-3070') {
    return buildDellOptiplex3070Scene();
  }
  if (profile.id === 'equip-server-rack-1u') {
    return buildServerRack1UScene();
  }
  if (profile.id === 'equip-notebook-14') {
    return buildNotebook14Scene();
  }
  return buildCustomEquipmentScene(
    profile.customConfig ?? {
      name: profile.name,
      formFactor: 'ATX',
      socket: 'LGA1700',
      ramGeneration: 'DDR5',
      dimmSlots: 4,
      storageType: 'M.2 NVMe',
      pcbColorHex: '#1e293b',
    }
  );
}

function createSceneHelper(): {
  root: THREE.Group;
  anchors: THREE.Group;
  targets: Map<string, THREE.Object3D>;
  register: (id: string, obj: THREE.Object3D) => void;
  addAnchor: (pos: [number, number, number], colorHex: number) => void;
} {
  const root = new THREE.Group();
  const anchors = new THREE.Group();
  anchors.visible = false;
  root.add(anchors);
  const targets = new Map<string, THREE.Object3D>();

  const register = (id: string, obj: THREE.Object3D): void => {
    obj.userData['targetId'] = id;
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData['targetId'] = id;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    targets.set(id, obj);
  };

  const addAnchor = (pos: [number, number, number], colorHex: number): void => {
    const marker = new THREE.Group();
    marker.position.set(pos[0], pos[1], pos[2]);
    const pin = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.005, 0),
      new THREE.MeshBasicMaterial({ color: colorHex })
    );
    pin.position.y = 0.012;
    marker.add(pin, new THREE.AxesHelper(0.016));
    anchors.add(marker);
  };

  return { root, anchors, targets, register, addAnchor };
}

function wrapSingleRoot(
  root: THREE.Group,
  anchors: THREE.Group,
  targets: Map<string, THREE.Object3D>
): EquipmentSceneBuildResult {
  return {
    roots: [root],
    anchorGroups: [anchors],
    motherboardTargets: targets,
    componentTargets: new Map<string, THREE.Object3D>(),
    mergedTargets: new Map<string, THREE.Object3D>(targets),
  };
}

function buildDellOptiplex3070Scene(): EquipmentSceneBuildResult {
  const { root, anchors, targets, register, addAnchor } = createSceneHelper();
  root.name = 'DELL_OPTIPLEX_3070_ROOT';

  // Chassi SFF cinza escuro
  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(0.27, 0.008, 0.27),
    new THREE.MeshStandardMaterial({ color: 0x1e2430, metalness: 0.6, roughness: 0.45 })
  );
  tray.position.set(0, 0.01, 0);
  tray.receiveShadow = true;
  root.add(tray);

  const pcbY = 0.022;
  const mbGroup = new THREE.Group();
  const pcbMat = new THREE.MeshStandardMaterial({ color: 0x14452f, metalness: 0.2, roughness: 0.55 });
  const mainPcb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.002, 0.21), pcbMat);
  mainPcb.position.set(0, pcbY, 0);
  // Extensão frontal proprietária Dell (USB + botão Power soldados na PCB)
  const frontArm = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.002, 0.045), pcbMat);
  frontArm.position.set(-0.075, pcbY, 0.125);
  mbGroup.add(mainPcb, frontArm);
  root.add(mbGroup);
  register('dell-mb-3070', mbGroup);
  addAnchor([0, pcbY, 0], 0x22c55e);

  // Socket LGA1151
  const cpuGroup = new THREE.Group();
  cpuGroup.position.set(-0.02, pcbY + 0.003, -0.025);
  const cpuBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.005, 0.045),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 })
  );
  cpuGroup.add(cpuBase);
  root.add(cpuGroup);
  register('dell-cpu-lga1151', cpuGroup);
  addAnchor([-0.02, pcbY + 0.008, -0.025], 0xf59e0b);

  // 2x DIMM DDR4
  const dimmGroup = new THREE.Group();
  for (const x of [0.055, 0.068]) {
    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.006, 0.009, 0.132),
      new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.2, roughness: 0.6 })
    );
    slot.position.set(x, pcbY + 0.005, -0.02);
    dimmGroup.add(slot);
  }
  root.add(dimmGroup);
  register('dell-dimm-ddr4', dimmGroup);
  addAnchor([0.06, pcbY + 0.01, -0.02], 0xa855f7);

  // M.2 NVMe
  const m2Group = new THREE.Group();
  const m2Pad = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.003, 0.022),
    new THREE.MeshStandardMaterial({ color: 0x0f766e, metalness: 0.35, roughness: 0.45 })
  );
  m2Pad.position.set(0.015, pcbY + 0.0025, 0.042);
  m2Group.add(m2Pad);
  root.add(m2Group);
  register('dell-m2-nvme', m2Group);
  addAnchor([0.015, pcbY + 0.005, 0.042], 0x14b8a6);

  // Dell Power 6-pin proprietário
  const pwrGroup = new THREE.Group();
  const pwr6 = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.013, 0.022),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.1, roughness: 0.5 })
  );
  pwr6.position.set(0.092, pcbY + 0.007, -0.045);
  pwrGroup.add(pwr6);
  root.add(pwrGroup);
  register('dell-power-6pin', pwrGroup);
  addAnchor([0.092, pcbY + 0.014, -0.045], 0xef4444);

  return wrapSingleRoot(root, anchors, targets);
}

function buildServerRack1UScene(): EquipmentSceneBuildResult {
  const { root, anchors, targets, register, addAnchor } = createSceneHelper();
  root.name = 'SERVER_RACK_1U_ROOT';

  const chassisGroup = new THREE.Group();
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.78, roughness: 0.32 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.006, 0.3), steelMat);
  base.position.y = 0.01;
  const srvPcb = new THREE.Mesh(
    new THREE.BoxGeometry(0.39, 0.002, 0.26),
    new THREE.MeshStandardMaterial({ color: 0x115e38, metalness: 0.22, roughness: 0.5 })
  );
  srvPcb.position.y = 0.016;
  chassisGroup.add(base, srvPcb);
  root.add(chassisGroup);
  register('srv-chassis-1u', chassisGroup);
  addAnchor([0, 0.018, 0], 0x0ea5e9);

  // Dual Xeon Heatsinks
  const dualCpuGroup = new THREE.Group();
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.85, roughness: 0.28 });
  for (const x of [-0.07, 0.07]) {
    const sink = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.026, 0.085), copperMat);
    sink.position.set(x, 0.03, 0.01);
    dualCpuGroup.add(sink);
  }
  root.add(dualCpuGroup);
  register('srv-dual-cpu', dualCpuGroup);
  addAnchor([0, 0.045, 0.01], 0xf59e0b);

  // 8x DDR4 ECC Slots
  const eccGroup = new THREE.Group();
  const dimmMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.25, roughness: 0.55 });
  for (const x of [-0.145, -0.133, -0.012, 0.012, 0.133, 0.145, -0.121, 0.121]) {
    const slot = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.014, 0.125), dimmMat);
    slot.position.set(x, 0.024, 0.01);
    eccGroup.add(slot);
  }
  root.add(eccGroup);
  register('srv-dimm-ecc', eccGroup);
  addAnchor([0.133, 0.032, 0.01], 0xa855f7);

  // 2x Fontes Redundantes Hot-Swap (traseira direita)
  const psuGroup = new THREE.Group();
  const psuMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6, roughness: 0.4 });
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.3, roughness: 0.4 });
  for (const x of [0.095, 0.16]) {
    const psu = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.036, 0.11), psuMat);
    psu.position.set(x, 0.032, -0.095);
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.01), handleMat);
    handle.position.set(x, 0.032, -0.152);
    psuGroup.add(psu, handle);
  }
  root.add(psuGroup);
  register('srv-redundant-psu', psuGroup);
  addAnchor([0.128, 0.052, -0.095], 0xef4444);

  // Parede de 4 Fans 40mm
  const fanWallGroup = new THREE.Group();
  const fanMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.2, roughness: 0.6 });
  for (let i = 0; i < 4; i++) {
    const fan = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.036, 0.028), fanMat);
    fan.position.set(-0.11 + i * 0.073, 0.032, 0.095);
    fanWallGroup.add(fan);
  }
  root.add(fanWallGroup);
  register('srv-fan-wall', fanWallGroup);
  addAnchor([0, 0.052, 0.095], 0x14b8a6);

  return wrapSingleRoot(root, anchors, targets);
}

function buildNotebook14Scene(): EquipmentSceneBuildResult {
  const { root, anchors, targets, register, addAnchor } = createSceneHelper();
  root.name = 'NOTEBOOK_14_ROOT';

  const baseGroup = new THREE.Group();
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(0.31, 0.008, 0.21),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.72, roughness: 0.35 })
  );
  shell.position.y = 0.008;
  const nbPcb = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.002, 0.11),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.25, roughness: 0.55 })
  );
  nbPcb.position.set(0, 0.014, -0.038);
  baseGroup.add(shell, nbPcb);
  root.add(baseGroup);
  register('nb-chassis-14', baseGroup);
  addAnchor([0, 0.016, -0.038], 0x6366f1);

  // CPU BGA + Heatpipe de Cobre + Blower Fan
  const coolingGroup = new THREE.Group();
  const copperMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.22 });
  const cpuPlate = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.005, 0.032), copperMat);
  cpuPlate.position.set(-0.02, 0.018, -0.038);
  const heatpipe = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.0035, 0.01), copperMat);
  heatpipe.position.set(-0.068, 0.019, -0.048);
  const blower = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, 0.008, 24),
    new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.2, roughness: 0.6 })
  );
  blower.position.set(-0.105, 0.019, -0.055);
  coolingGroup.add(cpuPlate, heatpipe, blower);
  root.add(coolingGroup);
  register('nb-cpu-heatpipe', coolingGroup);
  addAnchor([-0.04, 0.024, -0.045], 0xf97316);

  // 2x SO-DIMM DDR4 horizontais
  const sodimmGroup = new THREE.Group();
  const sodimmMat = new THREE.MeshStandardMaterial({ color: 0x15803d, metalness: 0.2, roughness: 0.55 });
  for (const z of [-0.055, -0.02]) {
    const stick = new THREE.Mesh(new THREE.BoxGeometry(0.067, 0.003, 0.028), sodimmMat);
    stick.position.set(0.055, 0.017, z);
    sodimmGroup.add(stick);
  }
  root.add(sodimmGroup);
  register('nb-sodimm', sodimmGroup);
  addAnchor([0.055, 0.021, -0.038], 0xa855f7);

  // SSD M.2 NVMe
  const m2Group = new THREE.Group();
  const ssd = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.003, 0.075),
    new THREE.MeshStandardMaterial({ color: 0x0d9488, metalness: 0.35, roughness: 0.45 })
  );
  ssd.position.set(0.115, 0.017, -0.035);
  m2Group.add(ssd);
  root.add(m2Group);
  register('nb-m2-ssd', m2Group);
  addAnchor([0.115, 0.021, -0.035], 0x14b8a6);

  // Bateria Interna Li-Ion (parte frontal)
  const battGroup = new THREE.Group();
  const batt = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.009, 0.068),
    new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.15, roughness: 0.65 })
  );
  batt.position.set(0, 0.017, 0.062);
  battGroup.add(batt);
  root.add(battGroup);
  register('nb-battery', battGroup);
  addAnchor([0, 0.024, 0.062], 0x22c55e);

  return wrapSingleRoot(root, anchors, targets);
}

function buildCustomEquipmentScene(config: CustomEquipmentConfig): EquipmentSceneBuildResult {
  const { root, anchors, targets, register, addAnchor } = createSceneHelper();
  root.name = 'CUSTOM_EQUIPMENT_ROOT';

  const width = config.formFactor === 'Mini-ITX' ? 0.17 : 0.244;
  const depth =
    config.formFactor === 'ATX' ? 0.305 : config.formFactor === 'Micro-ATX' ? 0.244 : 0.17;

  const tray = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.04, 0.006, depth + 0.04),
    new THREE.MeshStandardMaterial({ color: 0x1e2430, metalness: 0.65, roughness: 0.4 })
  );
  tray.position.y = 0.012;
  tray.receiveShadow = true;
  root.add(tray);

  const pcbY = 0.024;
  const mbGroup = new THREE.Group();
  const pcb = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.002, depth),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(config.pcbColorHex),
      metalness: 0.25,
      roughness: 0.52,
    })
  );
  pcb.position.y = pcbY;
  mbGroup.add(pcb);
  root.add(mbGroup);
  register('custom-mb-pcb', mbGroup);
  addAnchor([0, pcbY + 0.002, 0], 0x38bdf8);

  // Socket CPU
  const cpuGroup = new THREE.Group();
  const cpuBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.046, 0.006, 0.046),
    new THREE.MeshStandardMaterial({ color: 0xc2ccd6, metalness: 0.85, roughness: 0.25 })
  );
  cpuBox.position.set(-0.015, pcbY + 0.004, -depth * 0.18);
  cpuGroup.add(cpuBox);
  root.add(cpuGroup);
  register('custom-cpu-socket', cpuGroup);
  addAnchor([-0.015, pcbY + 0.008, -depth * 0.18], 0xf59e0b);

  // Slots DIMM (2 ou 4 conforme escolha)
  const dimmGroup = new THREE.Group();
  const dimmStartX = width * 0.2;
  for (let i = 0; i < config.dimmSlots; i++) {
    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.0055, 0.0085, 0.118),
      new THREE.MeshStandardMaterial({
        color: i % 2 === 1 ? 0x4b5563 : 0x1e293b,
        metalness: 0.2,
        roughness: 0.55,
      })
    );
    slot.position.set(dimmStartX + i * 0.01, pcbY + 0.005, -depth * 0.12);
    dimmGroup.add(slot);
  }
  root.add(dimmGroup);
  register('custom-dimm-bank', dimmGroup);
  addAnchor([dimmStartX + 0.01, pcbY + 0.01, -depth * 0.12], 0xa855f7);

  // Armazenamento (M.2 NVMe ou SATA)
  const storageGroup = new THREE.Group();
  if (config.storageType === 'M.2 NVMe') {
    const m2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.078, 0.003, 0.022),
      new THREE.MeshStandardMaterial({ color: 0x0d9488, metalness: 0.35, roughness: 0.45 })
    );
    m2.position.set(0, pcbY + 0.003, depth * 0.18);
    storageGroup.add(m2);
  } else {
    for (let i = 0; i < 4; i++) {
      const sata = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.009, 0.008),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.2, roughness: 0.5 })
      );
      sata.position.set(width * 0.32, pcbY + 0.0055, depth * 0.16 + i * 0.012);
      storageGroup.add(sata);
    }
  }
  root.add(storageGroup);
  register('custom-storage', storageGroup);
  addAnchor([0, pcbY + 0.006, depth * 0.18], 0x14b8a6);

  // ATX 24P
  const atxGroup = new THREE.Group();
  const atx = new THREE.Mesh(
    new THREE.BoxGeometry(0.011, 0.013, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.1, roughness: 0.5 })
  );
  atx.position.set(width * 0.44, pcbY + 0.007, -depth * 0.08);
  atxGroup.add(atx);
  root.add(atxGroup);
  register('custom-atx24', atxGroup);
  addAnchor([width * 0.44, pcbY + 0.014, -depth * 0.08], 0xf43f5e);

  return wrapSingleRoot(root, anchors, targets);
}
