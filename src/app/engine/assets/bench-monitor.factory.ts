import * as THREE from 'three';
import { PostTestReport } from '../../domain/diagnostics/diagnostics.models';

/**
 * Mini Monitor 3D de Bancada com CanvasTexture dinâmica para exibir
 * o status real de POST / BIOS / Boot quando o computador é ligado.
 * Zero dependência de Angular.
 */
export class BenchMonitorController {
  readonly rootGroup = new THREE.Group();

  private readonly screenCanvas: HTMLCanvasElement;
  private readonly screenCtx: CanvasRenderingContext2D | null;
  private readonly screenTexture: THREE.CanvasTexture;
  private readonly ledMaterial: THREE.MeshStandardMaterial;

  constructor() {
    this.rootGroup.name = 'TECHBENCH_MINI_MONITOR';
    // Posicionado atrás da placa-mãe, levemente inclinado para o técnico
    this.rootGroup.position.set(-0.02, 0, -0.215);
    this.rootGroup.rotation.y = 0.08;

    this.screenCanvas = document.createElement('canvas');
    this.screenCanvas.width = 512;
    this.screenCanvas.height = 320;
    this.screenCtx = this.screenCanvas.getContext('2d');
    this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTexture.colorSpace = THREE.SRGBColorSpace;

    // Pedestal metálico
    const standMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.35,
    });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.008, 0.075), standMat);
    base.position.set(0, 0.004, 0);
    base.castShadow = true;
    base.receiveShadow = true;

    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.06, 0.014), standMat);
    neck.position.set(0, 0.036, -0.012);
    neck.castShadow = true;

    // Carcaça do mini monitor (22cm x 14cm)
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.35,
      roughness: 0.5,
    });
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.142, 0.014), bezelMat);
    housing.position.set(0, 0.115, 0);
    housing.castShadow = true;
    housing.receiveShadow = true;

    // Tela LCD emissiva com CanvasTexture
    const screenMat = new THREE.MeshBasicMaterial({ map: this.screenTexture });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.202, 0.124), screenMat);
    screen.position.set(0, 0.117, 0.0076);

    // LED de status na moldura inferior direita
    this.ledMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 0.3,
    });
    const powerLed = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.003, 0.002), this.ledMaterial);
    powerLed.position.set(0.088, 0.05, 0.0075);

    this.rootGroup.add(base, neck, housing, screen, powerLed);
    this.renderReport(null);
  }

  renderReport(report: PostTestReport | null): void {
    const ctx = this.screenCtx;
    if (!ctx) {
      return;
    }

    const w = this.screenCanvas.width;
    const h = this.screenCanvas.height;

    // Fundo escuro base
    ctx.fillStyle = '#070b12';
    ctx.fillRect(0, 0, w, h);

    if (!report || report.monitorOutput === 'NO_POWER') {
      this.setLed(0x334155, 0x000000, 0);
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TECHBENCH DISPLAY · STANDBY', w / 2, h / 2 - 10);
      ctx.fillStyle = '#475569';
      ctx.font = '15px monospace';
      ctx.fillText('Pressione [⏻ Power] para inicializar', w / 2, h / 2 + 22);
      this.screenTexture.needsUpdate = true;
      return;
    }

    if (report.monitorOutput === 'NO_SIGNAL') {
      this.setLed(0xf59e0b, 0xf59e0b, 0.9);
      ctx.fillStyle = '#0b1830';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(76, 96, w - 152, 124);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO SIGNAL', w / 2, 148);

      ctx.fillStyle = '#93c5fd';
      ctx.font = '15px monospace';
      ctx.fillText(`POST travado em: ${report.reachedStage}`, w / 2, 184);
      ctx.fillStyle = '#fde68a';
      ctx.font = '13px monospace';
      ctx.fillText(report.beepDescription, w / 2, 206);
      this.screenTexture.needsUpdate = true;
      return;
    }

    if (report.monitorOutput === 'THERMAL_SHUTDOWN') {
      this.setLed(0xef4444, 0xef4444, 1.0);
      ctx.fillStyle = '#2a0808';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('CPU OVER TEMPERATURE!', w / 2, 130);
      ctx.fillStyle = '#fecaca';
      ctx.font = '16px monospace';
      ctx.fillText(`Temperatura crítica: ${report.cpuTempC} °C`, w / 2, 166);
      ctx.font = '14px monospace';
      ctx.fillText('PC ligou, mas desligou por falta de resfriamento', w / 2, 198);
      ctx.fillStyle = '#fca5a5';
      ctx.font = '12.5px monospace';
      ctx.fillText('Conecte o Cooler + Pasta Térmica + cabo CPU_FAN', w / 2, 226);
      this.screenTexture.needsUpdate = true;
      return;
    }

    if (report.monitorOutput === 'BIOS_NO_BOOT_DEVICE') {
      this.setLed(0x22c55e, 0x22c55e, 0.85);
      ctx.fillStyle = '#060c14';
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 17px monospace';
      ctx.fillText('PCWare IPM41-D3 — AMI BIOS v1.04', 24, 38);
      ctx.fillStyle = '#86efac';
      ctx.font = '14px monospace';
      ctx.fillText('CPU : Intel Core 2 Duo E8400 @ 3.00GHz [OK]', 24, 78);
      ctx.fillText('DRAM: 4096 MB DDR3-1333 Dual-Rank      [OK]', 24, 104);
      ctx.fillText('VGA : PCIe x16 Display Adapter         [OK]', 24, 130);
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('SATA: Not Detected                     [FAIL]', 24, 156);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px monospace';
      ctx.fillText('Reboot and Select proper Boot device', 24, 214);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px monospace';
      ctx.fillText('Verifique Cabo SATA e Energia da Fonte no SSD ou HD.', 24, 242);
      this.screenTexture.needsUpdate = true;
      return;
    }

    // POST_SUCCESS — Boot concluído com sucesso!
    this.setLed(0x22c55e, 0x22c55e, 1.0);
    ctx.fillStyle = '#051410';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#0f2f26';
    ctx.fillRect(0, 0, w, 46);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('PCWare IPM41-D3 · BIOS POST OK', 22, 30);

    ctx.fillStyle = '#dcfce7';
    ctx.font = '14px monospace';
    ctx.fillText('✓ CPU : Intel Core 2 Duo E8400 @ 3.00GHz', 22, 74);
    ctx.fillText('✓ RAM : 4096 MB DDR3-1333 (VDD 1.50V)', 22, 98);
    ctx.fillText('✓ VGA : PCIe x16 Video Output Active', 22, 122);

    if (report.bootDriveType === 'DUAL_SSD_HDD') {
      ctx.fillStyle = '#67e8f9';
      ctx.fillText('✓ BOOT 1º: SSD 2.5" 240GB (SO · ~9s)', 22, 148);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('✓ INTERNO: HD 3.5" 500GB (Armazenamento)', 22, 172);
    } else if (report.bootDriveType === 'SSD') {
      ctx.fillStyle = '#67e8f9';
      ctx.fillText('✓ BOOT 1º: SSD 2.5" 240GB (SO · ~9s · 0.1ms)', 22, 148);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('• INTERNO: HD 3.5" 500GB (não conectado)', 22, 172);
    } else {
      ctx.fillStyle = '#fde68a';
      ctx.fillText('✓ BOOT   : HD 3.5" 500GB 7200RPM (~38s)', 22, 148);
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('• DICA   : Use o SSD 2.5" como Boot Primário', 22, 172);
    }

    if (report.overheatRisk) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`⚠ TEMP: CPU ${report.cpuTempC} °C · CPU_FAN PARADO (AQUECENDO!)`, 22, 196);
    } else {
      ctx.fillStyle = '#dcfce7';
      ctx.fillText(`✓ TEMP: CPU ${report.cpuTempC} °C · Fan PWM Normal`, 22, 196);
    }

    ctx.strokeStyle = report.bootDriveType === 'HDD' ? '#22c55e' : '#06b6d4';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 214, w - 40, 82);
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 17px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      report.bootDriveType === 'DUAL_SSD_HDD'
        ? '⚡ BOOT 1º: SSD (~9s) + HD INTERNO OK'
        : report.bootDriveType === 'SSD'
          ? '⚡ BOOT PRIMÁRIO VIA SSD (~9s)'
          : '✓ BOOT CONCLUÍDO VIA HD (~38s)',
      w / 2,
      246
    );
    ctx.fillStyle = '#bbf7d0';
    ctx.font = '12.5px monospace';
    ctx.fillText(
      report.bootDriveType === 'HDD'
        ? 'SSD sem partes móveis: latência 100x menor que HD mecânico'
        : 'SSD = Sistema Operacional rápido · HD = Armazenamento interno',
      w / 2,
      274
    );

    this.screenTexture.needsUpdate = true;
  }

  dispose(): void {
    this.screenTexture.dispose();
    this.rootGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          m.dispose();
        }
      }
    });
  }

  private setLed(colorHex: number, emissiveHex: number, intensity: number): void {
    this.ledMaterial.color.setHex(colorHex);
    this.ledMaterial.emissive.setHex(emissiveHex);
    this.ledMaterial.emissiveIntensity = intensity;
  }
}
