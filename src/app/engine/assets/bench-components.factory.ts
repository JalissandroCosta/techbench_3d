import * as THREE from 'three';

export interface BenchComponentsBuildResult {
  readonly rootGroup: THREE.Group;
  readonly anchorsGroup: THREE.Group;
  readonly interactiveTargets: Map<string, THREE.Object3D>;
}

/**
 * Fábrica 3D (Sprint 3) dos 9 componentes físicos da bancada organizados sobre
 * uma manta antiestática (ESD Mat) ao lado da PCWare IPM41-D3.
 *
 * Escala métrica real (1 unidade = 1 metro), Y-up, +Z frente.
 * Zero dependência de Angular.
 */
export function buildBenchComponentsTray(): BenchComponentsBuildResult {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'TECHBENCH_COMPONENTS_TRAY';

  const anchorsGroup = new THREE.Group();
  anchorsGroup.name = 'COMPONENTS_ANCHORS_DEBUG_GROUP';
  anchorsGroup.visible = false;
  rootGroup.add(anchorsGroup);

  const interactiveTargets = new Map<string, THREE.Object3D>();

  const registerTarget = (targetId: string, obj: THREE.Object3D): void => {
    obj.userData['targetId'] = targetId;
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData['targetId'] = targetId;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    interactiveTargets.set(targetId, obj);
  };

  const addAnchor = (
    parent: THREE.Object3D,
    anchorName: string,
    position: [number, number, number],
    colorHex: number
  ): void => {
    const anchor = new THREE.Object3D();
    anchor.name = anchorName;
    anchor.position.set(position[0], position[1], position[2]);
    parent.add(anchor);

    const marker = new THREE.Group();
    marker.name = `MARKER_${anchorName}`;
    const worldPos = new THREE.Vector3();
    parent.updateMatrixWorld(true);
    anchor.getWorldPosition(worldPos);
    marker.position.copy(worldPos);

    const pin = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.005, 0),
      new THREE.MeshBasicMaterial({ color: colorHex })
    );
    pin.position.y = 0.012;
    marker.add(pin);
    marker.add(new THREE.AxesHelper(0.016));
    anchorsGroup.add(marker);
  };

  // =========================================================================
  // Manta Antiestática (ESD Mat) ao lado direito da bancada (x: +0.165 .. +0.495)
  // =========================================================================
  const matTopY = 0.004;
  const esdMat = new THREE.Mesh(
    new THREE.BoxGeometry(0.33, 0.004, 0.34),
    new THREE.MeshStandardMaterial({ color: 0x162436, metalness: 0.08, roughness: 0.85 })
  );
  esdMat.name = 'MESH_ESD_MAT';
  esdMat.position.set(0.33, 0.002, 0.01);
  esdMat.receiveShadow = true;
  rootGroup.add(esdMat);

  // Base dedicada de armazenamento logo embaixo (à frente) da placa-mãe para SSD 2.5" + HD 3.5"
  const storageBayMat = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.004, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x132030, metalness: 0.15, roughness: 0.82 })
  );
  storageBayMat.name = 'MESH_STORAGE_BAY_MAT';
  storageBayMat.position.set(0.005, 0.002, 0.185);
  storageBayMat.receiveShadow = true;
  rootGroup.add(storageBayMat);

  // =========================================================================
  // 1. CPU LGA775 (component-cpu-lga775) — 37.5mm x 37.5mm
  // =========================================================================
  const cpuGroup = new THREE.Group();
  cpuGroup.name = 'component-cpu-lga775';
  cpuGroup.position.set(0.21, matTopY, -0.07);
  rootGroup.add(cpuGroup);

  const cpuPcb = new THREE.Mesh(
    new THREE.BoxGeometry(0.0375, 0.0018, 0.0375),
    new THREE.MeshStandardMaterial({ color: 0x15803d, metalness: 0.25, roughness: 0.55 })
  );
  cpuPcb.position.y = 0.0009;
  cpuGroup.add(cpuPcb);

  const cpuIhs = new THREE.Mesh(
    new THREE.BoxGeometry(0.031, 0.0026, 0.031),
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.88, roughness: 0.24 })
  );
  cpuIhs.position.y = 0.0031;
  cpuGroup.add(cpuIhs);

  // Triângulo dourado do pino 1
  const pin1Mark = new THREE.Mesh(
    new THREE.BoxGeometry(0.004, 0.002, 0.004),
    new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.7, roughness: 0.3 })
  );
  pin1Mark.position.set(-0.015, 0.0011, 0.015);
  cpuGroup.add(pin1Mark);

  registerTarget('component-cpu-lga775', cpuGroup);
  addAnchor(cpuGroup, 'ANCHOR_BENCH_COMP_CPU', [0, 0.005, 0], 0xf59e0b);

  // =========================================================================
  // 2. Memória RAM DDR3 (component-ram-ddr3) — 133mm x 30mm
  // =========================================================================
  const ramGroup = new THREE.Group();
  ramGroup.name = 'component-ram-ddr3';
  ramGroup.position.set(0.29, matTopY, -0.055);
  rootGroup.add(ramGroup);

  const ramPcb = new THREE.Mesh(
    new THREE.BoxGeometry(0.03, 0.0016, 0.133),
    new THREE.MeshStandardMaterial({ color: 0x166534, metalness: 0.22, roughness: 0.55 })
  );
  ramPcb.position.y = 0.0008;
  ramGroup.add(ramPcb);

  // Borda de contatos dourados
  const goldEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.0045, 0.0018, 0.128),
    new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.28 })
  );
  goldEdge.position.set(-0.013, 0.0009, 0);
  ramGroup.add(goldEdge);

  // 8 chips DRAM na face superior
  const chipMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.15,
    roughness: 0.5,
  });
  for (let i = 0; i < 8; i++) {
    const chip = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.0012, 0.009), chipMat);
    chip.position.set(0.003, 0.0022, -0.052 + i * 0.0148);
    ramGroup.add(chip);
  }

  registerTarget('component-ram-ddr3', ramGroup);
  addAnchor(ramGroup, 'ANCHOR_BENCH_COMP_RAM', [0, 0.004, 0], 0xa855f7);

  // =========================================================================
  // 3. CPU Cooler LGA775 (component-cooler-lga775)
  // =========================================================================
  const coolerGroup = new THREE.Group();
  coolerGroup.name = 'component-cooler-lga775';
  coolerGroup.position.set(0.215, matTopY, 0.025);
  rootGroup.add(coolerGroup);

  const heatsink = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.038, 0.028, 24),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.3 })
  );
  heatsink.position.y = 0.014;
  coolerGroup.add(heatsink);

  const fanShroud = new THREE.Mesh(
    new THREE.CylinderGeometry(0.043, 0.043, 0.016, 24),
    new THREE.MeshStandardMaterial({ color: 0x181c24, metalness: 0.2, roughness: 0.6 })
  );
  fanShroud.position.y = 0.036;
  coolerGroup.add(fanShroud);

  const fanHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.018, 16),
    new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.4, roughness: 0.35 })
  );
  fanHub.position.y = 0.037;
  coolerGroup.add(fanHub);

  // 4 pés push-pin LGA775
  const pinFootMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.1,
    roughness: 0.5,
  });
  for (const [px, pz] of [
    [-0.036, -0.036],
    [0.036, -0.036],
    [-0.036, 0.036],
    [0.036, 0.036],
  ]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.026, 8), pinFootMat);
    leg.position.set(px, 0.013, pz);
    coolerGroup.add(leg);
  }

  registerTarget('component-cooler-lga775', coolerGroup);
  addAnchor(coolerGroup, 'ANCHOR_BENCH_COMP_COOLER', [0, 0.046, 0], 0x06b6d4);

  // =========================================================================
  // 4. Pasta Térmica — Seringa (component-thermal-paste)
  // =========================================================================
  const pasteGroup = new THREE.Group();
  pasteGroup.name = 'component-thermal-paste';
  pasteGroup.position.set(0.305, matTopY + 0.007, 0.025);
  pasteGroup.rotation.z = Math.PI / 2;
  pasteGroup.rotation.y = 0.25;
  rootGroup.add(pasteGroup);

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0065, 0.0065, 0.062, 16),
    new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.25, roughness: 0.4 })
  );
  pasteGroup.add(barrel);

  const plunger = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0042, 0.0042, 0.032, 12),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.15, roughness: 0.5 })
  );
  plunger.position.y = 0.042;
  pasteGroup.add(plunger);

  const nozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0022, 0.004, 0.016, 12),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.1, roughness: 0.6 })
  );
  nozzle.position.y = -0.038;
  pasteGroup.add(nozzle);

  registerTarget('component-thermal-paste', pasteGroup);
  addAnchor(pasteGroup, 'ANCHOR_BENCH_COMP_PASTE', [0, 0, 0], 0x94a3b8);

  // =========================================================================
  // 5. Placa de Vídeo PCIe x16 (component-gpu-pcie) — 175mm x 95mm
  // =========================================================================
  const gpuGroup = new THREE.Group();
  gpuGroup.name = 'component-gpu-pcie';
  gpuGroup.position.set(0.27, matTopY, 0.105);
  rootGroup.add(gpuGroup);

  const gpuShroud = new THREE.Mesh(
    new THREE.BoxGeometry(0.165, 0.026, 0.088),
    new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.4, roughness: 0.45 })
  );
  gpuShroud.position.y = 0.013;
  gpuGroup.add(gpuShroud);

  const gpuAccent = new THREE.Mesh(
    new THREE.BoxGeometry(0.155, 0.0025, 0.008),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.3, roughness: 0.4 })
  );
  gpuAccent.position.set(0, 0.0265, 0.036);
  gpuGroup.add(gpuAccent);

  const gpuFan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.004, 24),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.25, roughness: 0.5 })
  );
  gpuFan.position.set(0.01, 0.027, -0.002);
  gpuGroup.add(gpuFan);

  // Espelho metálico traseiro I/O da GPU
  const gpuBracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.003, 0.028, 0.098),
    new THREE.MeshStandardMaterial({ color: 0xb8c2cc, metalness: 0.85, roughness: 0.25 })
  );
  gpuBracket.position.set(-0.084, 0.014, 0.002);
  gpuGroup.add(gpuBracket);

  // Borda PCIe x16 dourada
  const gpuPcieEdge = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.002, 0.008),
    new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.3 })
  );
  gpuPcieEdge.position.set(-0.025, 0.005, -0.047);
  gpuGroup.add(gpuPcieEdge);

  // Conector auxiliar PCIe 6 pinos
  const gpu6Pin = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.011, 0.01),
    new THREE.MeshStandardMaterial({ color: 0x0b0f17, metalness: 0.15, roughness: 0.6 })
  );
  gpu6Pin.position.set(0.068, 0.022, 0.043);
  gpuGroup.add(gpu6Pin);

  registerTarget('component-gpu-pcie', gpuGroup);
  addAnchor(gpuGroup, 'ANCHOR_BENCH_COMP_GPU', [0, 0.028, 0], 0x22c55e);

  // =========================================================================
  // 6. HD Samsung 3.5" SATA II (component-hdd-samsung) — Armazenamento Interno (embaixo da placa-mãe, direita)
  // =========================================================================
  const hddGroup = new THREE.Group();
  hddGroup.name = 'component-hdd-samsung';
  hddGroup.position.set(0.068, matTopY, 0.185);
  hddGroup.rotation.y = Math.PI / 2;
  rootGroup.add(hddGroup);

  const hddBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.098, 0.024, 0.138),
    new THREE.MeshStandardMaterial({ color: 0x1e2430, metalness: 0.6, roughness: 0.4 })
  );
  hddBody.position.y = 0.012;
  hddGroup.add(hddBody);

  const hddLid = new THREE.Mesh(
    new THREE.BoxGeometry(0.092, 0.002, 0.13),
    new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.82, roughness: 0.28 })
  );
  hddLid.position.y = 0.0245;
  hddGroup.add(hddLid);

  // Etiqueta técnica azul Samsung
  const hddLabel = new THREE.Mesh(
    new THREE.BoxGeometry(0.066, 0.0008, 0.068),
    new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.1, roughness: 0.6 })
  );
  hddLabel.position.set(0, 0.0256, -0.01);
  hddGroup.add(hddLabel);

  registerTarget('component-hdd-samsung', hddGroup);
  addAnchor(hddGroup, 'ANCHOR_BENCH_COMP_HDD', [0, 0.026, 0], 0x3b82f6);

  // =========================================================================
  // 6B. SSD 2.5" 240 GB SATA III (component-ssd-sata) — Boot Primário (embaixo da placa-mãe, esquerda)
  // =========================================================================
  const ssdGroup = new THREE.Group();
  ssdGroup.name = 'component-ssd-sata';
  ssdGroup.position.set(-0.068, matTopY, 0.185);
  ssdGroup.rotation.y = Math.PI / 2;
  rootGroup.add(ssdGroup);

  const ssdBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.007, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.55, roughness: 0.35 })
  );
  ssdBody.position.y = 0.0035;
  ssdGroup.add(ssdBody);

  // Faixa ciano superior para identificação visual rápida (SSD 2.5")
  const ssdAccent = new THREE.Mesh(
    new THREE.BoxGeometry(0.062, 0.0008, 0.088),
    new THREE.MeshStandardMaterial({ color: 0x0891b2, metalness: 0.3, roughness: 0.4 })
  );
  ssdAccent.position.y = 0.0074;
  ssdGroup.add(ssdAccent);

  const ssdBadge = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.0009, 0.036),
    new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.2, roughness: 0.5 })
  );
  ssdBadge.position.set(0, 0.0078, -0.008);
  ssdGroup.add(ssdBadge);

  registerTarget('component-ssd-sata', ssdGroup);
  addAnchor(ssdGroup, 'ANCHOR_BENCH_COMP_SSD', [0, 0.01, 0], 0x06b6d4);

  // =========================================================================
  // 7. Fonte ATX 500W (component-psu-atx) — 150mm x 140mm x 86mm (compactada proporcional)
  // =========================================================================
  const psuGroup = new THREE.Group();
  psuGroup.name = 'component-psu-atx';
  psuGroup.position.set(0.405, matTopY, -0.085);
  rootGroup.add(psuGroup);

  const psuChassis = new THREE.Mesh(
    new THREE.BoxGeometry(0.132, 0.076, 0.122),
    new THREE.MeshStandardMaterial({ color: 0x1a1f29, metalness: 0.55, roughness: 0.45 })
  );
  psuChassis.position.y = 0.038;
  psuGroup.add(psuChassis);

  // Grade da ventoinha superior 120mm
  const psuGrill = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.048, 0.003, 24),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.35 })
  );
  psuGrill.position.y = 0.077;
  psuGroup.add(psuGrill);

  // Chave traseira I/O vermelha
  const psuSwitch = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.014, 0.012),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.15, roughness: 0.45 })
  );
  psuSwitch.position.set(0.067, 0.032, -0.025);
  psuGroup.add(psuSwitch);

  // Entrada IEC C14
  const psuIec = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.018, 0.024),
    new THREE.MeshStandardMaterial({ color: 0x0b0f17, metalness: 0.1, roughness: 0.7 })
  );
  psuIec.position.set(0.067, 0.032, 0.018);
  psuGroup.add(psuIec);

  // Etiqueta lateral técnica
  const psuSticker = new THREE.Mesh(
    new THREE.BoxGeometry(0.078, 0.044, 0.001),
    new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.15, roughness: 0.55 })
  );
  psuSticker.position.set(0, 0.038, 0.0615);
  psuGroup.add(psuSticker);

  registerTarget('component-psu-atx', psuGroup);
  addAnchor(psuGroup, 'ANCHOR_BENCH_COMP_PSU', [0, 0.078, 0], 0xef4444);

  // =========================================================================
  // 8. Cabo SATA Dados 7 pinos (component-cable-sata)
  // =========================================================================
  const sataCableGroup = new THREE.Group();
  sataCableGroup.name = 'component-cable-sata';
  sataCableGroup.position.set(0.385, matTopY + 0.005, 0.148);
  rootGroup.add(sataCableGroup);

  const sataCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.025, 0, -0.02),
    new THREE.Vector3(-0.01, 0.005, 0.01),
    new THREE.Vector3(0.015, 0.004, 0.022),
    new THREE.Vector3(0.022, 0, -0.012),
  ]);
  const sataTube = new THREE.Mesh(
    new THREE.TubeGeometry(sataCurve, 24, 0.0032, 8, false),
    new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.12, roughness: 0.48 })
  );
  sataCableGroup.add(sataTube);

  const plugBlackMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.15,
    roughness: 0.6,
  });
  const sataPlugA = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.006, 0.016), plugBlackMat);
  sataPlugA.position.set(-0.025, 0, -0.024);
  const sataPlugB = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.006, 0.016), plugBlackMat);
  sataPlugB.position.set(0.022, 0, -0.016);
  sataCableGroup.add(sataPlugA, sataPlugB);

  registerTarget('component-cable-sata', sataCableGroup);
  addAnchor(sataCableGroup, 'ANCHOR_BENCH_COMP_CABLE_SATA', [0, 0.01, 0], 0xdc2626);

  // =========================================================================
  // 8B. Cabo SATA 2 (SSD 2.5") — 7 pinos ciano (component-cable-sata-ssd)
  // =========================================================================
  const sataSsdCableGroup = new THREE.Group();
  sataSsdCableGroup.name = 'component-cable-sata-ssd';
  sataSsdCableGroup.position.set(0.315, matTopY + 0.005, 0.148);
  rootGroup.add(sataSsdCableGroup);

  const sataSsdCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.025, 0, -0.02),
    new THREE.Vector3(-0.01, 0.005, 0.01),
    new THREE.Vector3(0.015, 0.004, 0.022),
    new THREE.Vector3(0.022, 0, -0.012),
  ]);
  const sataSsdTube = new THREE.Mesh(
    new THREE.TubeGeometry(sataSsdCurve, 24, 0.0032, 8, false),
    new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.12, roughness: 0.48 })
  );
  sataSsdCableGroup.add(sataSsdTube);

  const sataSsdPlugA = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.006, 0.016), plugBlackMat);
  sataSsdPlugA.position.set(-0.025, 0, -0.024);
  const sataSsdPlugB = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.006, 0.016), plugBlackMat);
  sataSsdPlugB.position.set(0.022, 0, -0.016);
  sataSsdCableGroup.add(sataSsdPlugA, sataSsdPlugB);

  registerTarget('component-cable-sata-ssd', sataSsdCableGroup);
  addAnchor(sataSsdCableGroup, 'ANCHOR_BENCH_COMP_CABLE_SATA_SSD', [0, 0.01, 0], 0x06b6d4);

  return {
    rootGroup,
    anchorsGroup,
    interactiveTargets,
  };
}
