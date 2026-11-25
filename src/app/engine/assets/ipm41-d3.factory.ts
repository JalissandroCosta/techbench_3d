import * as THREE from 'three';

export interface GreyboxBenchBuildResult {
  readonly rootGroup: THREE.Group;
  readonly anchorsGroup: THREE.Group;
  readonly interactiveTargets: Map<string, THREE.Object3D>;
}

/**
 * Fábrica 3D (Sprint 2) da placa-mãe PCWare IPM41-D3 (Micro-ATX: 0.244m x 0.195m)
 * montada em bancada aberta TechBench.
 *
 * Padrão Sprint 0:
 * - 1 unidade Three.js = 1 metro
 * - Y-up, +Z frente
 * - Regiões interativas identificáveis via userData['targetId'] alinhadas ao domínio
 * Zero dependência de Angular.
 */
export function buildIpm41D3TechBench(): GreyboxBenchBuildResult {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'TECHBENCH_IPM41_D3_ROOT';

  const anchorsGroup = new THREE.Group();
  anchorsGroup.name = 'ANCHORS_DEBUG_GROUP';
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
  ): THREE.Object3D => {
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

    const axes = new THREE.AxesHelper(0.016);
    marker.add(axes);

    anchorsGroup.add(marker);
    return anchor;
  };

  // =========================================================================
  // 1. Bancada Aberta TechBench (Chassi Alumínio + 6 Standoffs Micro-ATX)
  // =========================================================================
  const benchGroup = new THREE.Group();
  benchGroup.name = 'MESH_TECHBENCH_FRAME';
  rootGroup.add(benchGroup);

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1e2430,
    metalness: 0.65,
    roughness: 0.42,
  });
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.006, 0.25), frameMat);
  tray.position.set(0, 0.012, 0);
  tray.castShadow = true;
  tray.receiveShadow = true;
  benchGroup.add(tray);

  const railMat = new THREE.MeshStandardMaterial({
    color: 0x2b3445,
    metalness: 0.75,
    roughness: 0.35,
  });
  for (const xSide of [-0.145, 0.145]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.012, 0.25), railMat);
    rail.position.set(xSide, 0.015, 0);
    rail.castShadow = true;
    rail.receiveShadow = true;
    benchGroup.add(rail);
  }

  const footMat = new THREE.MeshStandardMaterial({
    color: 0x0f1218,
    metalness: 0.1,
    roughness: 0.85,
  });
  for (const [fx, fz] of [
    [-0.13, -0.105],
    [0.13, -0.105],
    [-0.13, 0.105],
    [0.13, 0.105],
  ]) {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.013, 0.009, 16), footMat);
    foot.position.set(fx, 0.0045, fz);
    foot.castShadow = true;
    benchGroup.add(foot);
  }

  const standoffMat = new THREE.MeshStandardMaterial({
    color: 0xc59b38,
    metalness: 0.85,
    roughness: 0.28,
  });
  const standoffGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.008, 6);
  for (const sx of [-0.108, 0, 0.108]) {
    for (const sz of [-0.084, 0.084]) {
      const standoff = new THREE.Mesh(standoffGeo, standoffMat);
      standoff.position.set(sx, 0.019, sz);
      standoff.castShadow = true;
      benchGroup.add(standoff);
    }
  }

  // =========================================================================
  // 2. PCB Micro-ATX — PCWare IPM41-D3 (0.244m x 0.195m, PCB azul clássico)
  // =========================================================================
  const pcbTopY = 0.025;
  const mbGroup = new THREE.Group();
  mbGroup.name = 'motherboard-ipm41-d3';
  rootGroup.add(mbGroup);

  const pcbMat = new THREE.MeshStandardMaterial({
    color: 0x133b6e,
    metalness: 0.22,
    roughness: 0.52,
  });
  const pcbMesh = new THREE.Mesh(new THREE.BoxGeometry(0.244, 0.002, 0.195), pcbMat);
  pcbMesh.name = 'MESH_PCB_IPM41_D3';
  pcbMesh.position.set(0, 0.024, 0);
  mbGroup.add(pcbMesh);

  // Painel Traseiro I/O (PS/2, VGA, USB, LAN, Áudio) na borda esquerda (contexto espacial)
  const ioMetalMat = new THREE.MeshStandardMaterial({
    color: 0x9aa5b1,
    metalness: 0.82,
    roughness: 0.3,
  });
  const ioBlocks: readonly { z: number; len: number; h: number }[] = [
    { z: -0.068, len: 0.018, h: 0.022 }, // PS/2
    { z: -0.042, len: 0.024, h: 0.016 }, // VGA + Serial
    { z: -0.014, len: 0.022, h: 0.018 }, // USB + LAN
    { z: 0.012, len: 0.02, h: 0.016 },   // Audio 3x P2
  ];
  for (const blk of ioBlocks) {
    const ioMesh = new THREE.Mesh(new THREE.BoxGeometry(0.018, blk.h, blk.len), ioMetalMat);
    ioMesh.position.set(-0.114, pcbTopY + blk.h / 2, blk.z);
    mbGroup.add(ioMesh);
  }

  // Capacitores eletrolíticos & bobinas do VRM ao redor do socket LGA775 (detalhe realista)
  const capMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    metalness: 0.45,
    roughness: 0.4,
  });
  const capTopMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.85,
    roughness: 0.25,
  });
  const chokeMat = new THREE.MeshStandardMaterial({
    color: 0x374151,
    metalness: 0.55,
    roughness: 0.5,
  });
  for (let i = 0; i < 4; i++) {
    const zPos = -0.052 + i * 0.014;
    const choke = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.007, 0.009), chokeMat);
    choke.position.set(-0.052, pcbTopY + 0.0035, zPos);
    mbGroup.add(choke);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.011, 12), capMat);
    cap.position.set(-0.064, pcbTopY + 0.0055, zPos);
    mbGroup.add(cap);

    const capTop = new THREE.Mesh(new THREE.CylinderGeometry(0.0032, 0.0032, 0.0006, 12), capTopMat);
    capTop.position.set(-0.064, pcbTopY + 0.0112, zPos);
    mbGroup.add(capTop);
  }

  // Slot PCIe x1 secundário (detalhe visual da IPM41-D3 acima do PCIe x16)
  const pcieX1 = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.007, 0.007),
    new THREE.MeshStandardMaterial({ color: 0x181c24, metalness: 0.2, roughness: 0.65 })
  );
  pcieX1.position.set(-0.072, pcbTopY + 0.0035, 0.008);
  mbGroup.add(pcieX1);

  registerTarget('motherboard-ipm41-d3', mbGroup);
  addAnchor(mbGroup, 'ANCHOR_BENCH_MB_01', [0, pcbTopY, 0], 0x38bdf8);

  // =========================================================================
  // 3. CPU SOCKET — LGA775 (motherboard-cpu-socket)
  // =========================================================================
  const cpuSocketGroup = new THREE.Group();
  cpuSocketGroup.name = 'motherboard-cpu-socket';
  cpuSocketGroup.position.set(-0.012, pcbTopY, -0.032);
  rootGroup.add(cpuSocketGroup);

  const socketBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.004, 0.044),
    new THREE.MeshStandardMaterial({ color: 0x262b33, metalness: 0.2, roughness: 0.65 })
  );
  socketBase.position.y = 0.002;
  cpuSocketGroup.add(socketBase);

  const pinField = new THREE.Mesh(
    new THREE.BoxGeometry(0.034, 0.0012, 0.034),
    new THREE.MeshStandardMaterial({ color: 0xb08d3c, metalness: 0.78, roughness: 0.35 })
  );
  pinField.position.y = 0.0044;
  cpuSocketGroup.add(pinField);

  const ilmMat = new THREE.MeshStandardMaterial({
    color: 0xc2ccd6,
    metalness: 0.85,
    roughness: 0.24,
  });
  const ilmTop = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.0024, 0.0045), ilmMat);
  ilmTop.position.set(0, 0.0055, -0.02);
  const ilmBottom = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.0024, 0.0045), ilmMat);
  ilmBottom.position.set(0, 0.0055, 0.02);
  const ilmLeft = new THREE.Mesh(new THREE.BoxGeometry(0.0045, 0.0024, 0.044), ilmMat);
  ilmLeft.position.set(-0.019, 0.0055, 0);
  const ilmRight = new THREE.Mesh(new THREE.BoxGeometry(0.0045, 0.0024, 0.044), ilmMat);
  ilmRight.position.set(0.019, 0.0055, 0);
  const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.0011, 0.0011, 0.052, 8), ilmMat);
  lever.rotation.x = Math.PI / 2;
  lever.position.set(0.025, 0.005, 0.002);
  cpuSocketGroup.add(ilmTop, ilmBottom, ilmLeft, ilmRight, lever);

  registerTarget('motherboard-cpu-socket', cpuSocketGroup);
  addAnchor(cpuSocketGroup, 'ANCHOR_SLOT_CPU_01', [0, 0.005, 0], 0xf59e0b);

  // =========================================================================
  // 4. DIMM 1 & DIMM 2 — 2x DDR3 (motherboard-dimm-1, motherboard-dimm-2)
  // =========================================================================
  const dimmDefs: readonly { id: string; anchor: string; x: number; color: number }[] = [
    { id: 'motherboard-dimm-1', anchor: 'ANCHOR_SLOT_DIMM_1', x: 0.068, color: 0x1d4ed8 },
    { id: 'motherboard-dimm-2', anchor: 'ANCHOR_SLOT_DIMM_2', x: 0.08, color: 0x1e293b },
  ];

  for (const dimm of dimmDefs) {
    const dimmGroup = new THREE.Group();
    dimmGroup.name = dimm.id;
    dimmGroup.position.set(dimm.x, pcbTopY, -0.022);
    rootGroup.add(dimmGroup);

    const slotBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.006, 0.0085, 0.132),
      new THREE.MeshStandardMaterial({ color: dimm.color, metalness: 0.18, roughness: 0.55 })
    );
    slotBody.position.y = 0.00425;
    dimmGroup.add(slotBody);

    // Canal central + chanfro DDR3 deslocado
    const slotGroove = new THREE.Mesh(
      new THREE.BoxGeometry(0.0022, 0.0088, 0.126),
      new THREE.MeshStandardMaterial({ color: 0x0b0f17, metalness: 0.1, roughness: 0.8 })
    );
    slotGroove.position.y = 0.0045;
    dimmGroup.add(slotGroove);

    const notch = new THREE.Mesh(
      new THREE.BoxGeometry(0.003, 0.0088, 0.003),
      new THREE.MeshStandardMaterial({ color: dimm.color, metalness: 0.15, roughness: 0.55 })
    );
    notch.position.set(0, 0.0045, 0.012);
    dimmGroup.add(notch);

    const latchMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.1,
      roughness: 0.5,
    });
    for (const zEnd of [-0.069, 0.069]) {
      const latch = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.011, 0.006), latchMat);
      latch.position.set(0, 0.0055, zEnd);
      dimmGroup.add(latch);
    }

    registerTarget(dimm.id, dimmGroup);
    addAnchor(dimmGroup, dimm.anchor, [0, 0.0085, 0], 0xc084fc);
  }

  // =========================================================================
  // 5. PCIe x16 (motherboard-pcie-x16)
  // =========================================================================
  const pcieGroup = new THREE.Group();
  pcieGroup.name = 'motherboard-pcie-x16';
  pcieGroup.position.set(-0.042, pcbTopY, 0.026);
  rootGroup.add(pcieGroup);

  const pcieBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.089, 0.008, 0.0085),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.2, roughness: 0.55 })
  );
  pcieBody.position.y = 0.004;
  pcieGroup.add(pcieBody);

  const pcieStripe = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.0084, 0.0032),
    new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.25, roughness: 0.45 })
  );
  pcieStripe.position.y = 0.0042;
  pcieGroup.add(pcieStripe);

  const pcieLatch = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.01, 0.011),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.1, roughness: 0.5 })
  );
  pcieLatch.position.set(0.049, 0.005, 0);
  pcieGroup.add(pcieLatch);

  registerTarget('motherboard-pcie-x16', pcieGroup);
  addAnchor(pcieGroup, 'ANCHOR_SLOT_PCIE_X16', [0, 0.008, 0], 0x22c55e);

  // =========================================================================
  // 6. Slots PCI Legados 32-bit (2x brancos — motherboard-pci)
  // =========================================================================
  const pciGroup = new THREE.Group();
  pciGroup.name = 'motherboard-pci';
  rootGroup.add(pciGroup);

  const pciWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xe5e7eb,
    metalness: 0.1,
    roughness: 0.55,
  });
  const pciInnerMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    metalness: 0.15,
    roughness: 0.8,
  });

  for (const zPci of [0.056, 0.076]) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.0075, 0.008), pciWhiteMat);
    body.position.set(-0.042, pcbTopY + 0.00375, zPci);
    pciGroup.add(body);

    const inner = new THREE.Mesh(new THREE.BoxGeometry(0.081, 0.0078, 0.003), pciInnerMat);
    inner.position.set(-0.042, pcbTopY + 0.0039, zPci);
    pciGroup.add(inner);
  }

  registerTarget('motherboard-pci', pciGroup);
  addAnchor(pciGroup, 'ANCHOR_SLOT_PCI_01', [-0.042, pcbTopY + 0.008, 0.066], 0xe2e8f0);

  // =========================================================================
  // 7. Portas SATA II — Bloco 4x Vermelho/Laranja (motherboard-sata)
  // =========================================================================
  const sataGroup = new THREE.Group();
  sataGroup.name = 'motherboard-sata';
  sataGroup.position.set(0.095, pcbTopY, 0.064);
  rootGroup.add(sataGroup);

  const sataMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    metalness: 0.18,
    roughness: 0.45,
  });
  const sataInnerMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.1,
    roughness: 0.8,
  });

  const sataOffsets: readonly [number, number][] = [
    [-0.009, -0.008],
    [0.009, -0.008],
    [-0.009, 0.008],
    [0.009, 0.008],
  ];
  for (const [sx, sz] of sataOffsets) {
    const port = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.009, 0.008), sataMat);
    port.position.set(sx, 0.0045, sz);
    sataGroup.add(port);

    const cavity = new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.0093, 0.0035), sataInnerMat);
    cavity.position.set(sx, 0.0046, sz);
    sataGroup.add(cavity);
  }

  registerTarget('motherboard-sata', sataGroup);
  addAnchor(sataGroup, 'ANCHOR_PORT_SATA_01', [0, 0.009, 0], 0xef4444);

  // =========================================================================
  // 8. ATX 24 pinos (motherboard-atx-24pin)
  // =========================================================================
  const atx24Group = new THREE.Group();
  atx24Group.name = 'motherboard-atx-24pin';
  atx24Group.position.set(0.106, pcbTopY, -0.022);
  rootGroup.add(atx24Group);

  const atx24Body = new THREE.Mesh(
    new THREE.BoxGeometry(0.011, 0.013, 0.052),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.1, roughness: 0.5 })
  );
  atx24Body.position.y = 0.0065;
  atx24Group.add(atx24Body);

  const atx24Pins = new THREE.Mesh(
    new THREE.BoxGeometry(0.007, 0.0134, 0.048),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.3, roughness: 0.6 })
  );
  atx24Pins.position.y = 0.0066;
  atx24Group.add(atx24Pins);

  registerTarget('motherboard-atx-24pin', atx24Group);
  addAnchor(atx24Group, 'ANCHOR_PORT_ATX_24PIN', [0, 0.013, 0], 0xf43f5e);

  // =========================================================================
  // 9. CPU Power — ATX12V 4 pinos (motherboard-cpu-power)
  // =========================================================================
  const cpuPowerGroup = new THREE.Group();
  cpuPowerGroup.name = 'motherboard-cpu-power';
  cpuPowerGroup.position.set(-0.072, pcbTopY, -0.078);
  rootGroup.add(cpuPowerGroup);

  const cpuPowerBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.011, 0.013, 0.011),
    new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.1, roughness: 0.5 })
  );
  cpuPowerBody.position.y = 0.0065;
  cpuPowerGroup.add(cpuPowerBody);

  const cpuPowerPins = new THREE.Mesh(
    new THREE.BoxGeometry(0.007, 0.0134, 0.007),
    new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.3, roughness: 0.6 })
  );
  cpuPowerPins.position.y = 0.0066;
  cpuPowerGroup.add(cpuPowerPins);

  registerTarget('motherboard-cpu-power', cpuPowerGroup);
  addAnchor(cpuPowerGroup, 'ANCHOR_PORT_CPU_4PIN', [0, 0.013, 0], 0xfb923c);

  // =========================================================================
  // 10. CPU_FAN — 4 pinos PWM (motherboard-fan)
  // =========================================================================
  const fanGroup = new THREE.Group();
  fanGroup.name = 'motherboard-fan';
  fanGroup.position.set(0.036, pcbTopY, -0.074);
  rootGroup.add(fanGroup);

  const fanBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.003, 0.0055),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.1, roughness: 0.5 })
  );
  fanBase.position.y = 0.0015;
  fanGroup.add(fanBase);

  const fanGuide = new THREE.Mesh(
    new THREE.BoxGeometry(0.009, 0.0085, 0.0014),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.1, roughness: 0.5 })
  );
  fanGuide.position.set(-0.001, 0.00425, -0.0022);
  fanGroup.add(fanGuide);

  const pinMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    metalness: 0.85,
    roughness: 0.25,
  });
  for (let i = 0; i < 4; i++) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.00045, 0.00045, 0.007, 6), pinMat);
    pin.position.set(-0.0038 + i * 0.0025, 0.0045, 0.0006);
    fanGroup.add(pin);
  }

  registerTarget('motherboard-fan', fanGroup);
  addAnchor(fanGroup, 'ANCHOR_PORT_CPU_FAN', [0, 0.0085, 0], 0x14b8a6);

  // =========================================================================
  // 11. Northbridge Intel G41 — Dissipador de Alumínio (motherboard-northbridge-g41)
  // =========================================================================
  const nbGroup = new THREE.Group();
  nbGroup.name = 'motherboard-northbridge-g41';
  nbGroup.position.set(-0.012, pcbTopY, 0.008);
  rootGroup.add(nbGroup);

  const aluminumMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.82,
    roughness: 0.3,
  });
  const nbBase = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.005, 0.036), aluminumMat);
  nbBase.position.y = 0.0025;
  nbGroup.add(nbBase);

  for (let i = 0; i < 6; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.012, 0.0022), aluminumMat);
    fin.position.set(0, 0.01, -0.015 + i * 0.006);
    nbGroup.add(fin);
  }

  registerTarget('motherboard-northbridge-g41', nbGroup);
  addAnchor(nbGroup, 'ANCHOR_SUBSYS_NORTHBRIDGE', [0, 0.016, 0], 0x0ea5e9);

  // =========================================================================
  // 12. Southbridge Intel ICH7 (motherboard-southbridge-ich7)
  // =========================================================================
  const sbGroup = new THREE.Group();
  sbGroup.name = 'motherboard-southbridge-ich7';
  sbGroup.position.set(0.048, pcbTopY, 0.056);
  rootGroup.add(sbGroup);

  const sbSink = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, 0.007, 0.032),
    new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.78, roughness: 0.35 })
  );
  sbSink.position.y = 0.0035;
  sbGroup.add(sbSink);

  registerTarget('motherboard-southbridge-ich7', sbGroup);
  addAnchor(sbGroup, 'ANCHOR_SUBSYS_SOUTHBRIDGE', [0, 0.008, 0], 0x0284c7);

  // =========================================================================
  // 13. Bateria CMOS CR2032 3V (motherboard-cmos-battery)
  // =========================================================================
  const cmosGroup = new THREE.Group();
  cmosGroup.name = 'motherboard-cmos-battery';
  cmosGroup.position.set(0.015, pcbTopY, 0.058);
  rootGroup.add(cmosGroup);

  const holder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0115, 0.0115, 0.0035, 24),
    new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.15, roughness: 0.65 })
  );
  holder.position.y = 0.00175;
  cmosGroup.add(holder);

  const coin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, 0.01, 0.0032, 24),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.18 })
  );
  coin.position.y = 0.0032;
  cmosGroup.add(coin);

  registerTarget('motherboard-cmos-battery', cmosGroup);
  addAnchor(cmosGroup, 'ANCHOR_CMOS_BATTERY', [0, 0.005, 0], 0xcbd5e1);

  return {
    rootGroup,
    anchorsGroup,
    interactiveTargets,
  };
}
