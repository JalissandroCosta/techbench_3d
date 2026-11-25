import { TestBed } from '@angular/core/testing';
import { WorkbenchFacade } from './workbench.facade';

describe('WorkbenchFacade — Trava de Segurança Elétrica (Power ON/OFF)', () => {
  let facade: WorkbenchFacade;

  function buildCompleteSystem(f: WorkbenchFacade): void {
    f.attemptInstall('component-cpu-lga775', 'motherboard-cpu-socket');
    f.attemptInstall('component-thermal-paste', 'motherboard-cpu-socket');
    f.attemptInstall('component-ram-ddr3', 'motherboard-dimm-1');
    f.attemptInstall('component-cooler-lga775', 'motherboard-cpu-socket');
    f.attemptInstall('component-gpu-pcie', 'motherboard-pcie-x16');
    f.connectPorts('psu-out-atx24', 'mb-in-atx24');
    f.connectPorts('psu-out-cpu4', 'mb-in-cpu4');
    f.connectPorts('hdd-port-sata-data', 'mb-port-sata-data');
    f.connectPorts('psu-out-sata-power', 'hdd-in-sata-power');
    f.connectPorts('mb-port-cpu-fan', 'cooler-in-fan');
    f.connectPorts('psu-out-pcie6', 'gpu-in-pcie6');
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    facade = TestBed.inject(WorkbenchFacade);
    facade.resetAssembly();
  });

  it('mantém a bancada desligada quando não há alimentação ATX 24P (NO_POWER)', () => {
    const report = facade.runPowerPostTest();
    expect(report.monitorOutput).toBe('NO_POWER');
    expect(facade.isPoweredOn()).toBe(false);
  });

  it('bloqueia desconexão de cabo e remoção de peças enquanto o PC está ligado e exibe alerta de perigo', () => {
    buildCompleteSystem(facade);

    const report = facade.runPowerPostTest();
    expect(report.passed).toBe(true);
    expect(facade.isPoweredOn()).toBe(true);

    const beforeConnections = facade.connections().length;
    const beforeErrors = facade.sessionErrorsCount();

    // Tenta desconectar o cabo ATX 24P com o PC ligado
    facade.disconnectCable('conn-atx-24p');
    expect(facade.connections().length).toBe(beforeConnections);
    expect(facade.powerSafetyAlert()).not.toBeNull();
    expect(facade.sessionErrorsCount()).toBe(beforeErrors + 1);

    // Tenta remover a RAM com o PC ligado
    const removed = facade.attemptRemove('component-ram-ddr3');
    expect(removed).toBe(false);
    expect(facade.isComponentInstalled('component-ram-ddr3')).toBe(true);
  });

  it('ao desligar (powerOff), apaga o monitor (lastPostReport = null) e libera manutenção segura', () => {
    buildCompleteSystem(facade);
    facade.runPowerPostTest();
    expect(facade.isPoweredOn()).toBe(true);
    expect(facade.lastPostReport()?.passed).toBe(true);

    facade.powerOff();
    expect(facade.isPoweredOn()).toBe(false);
    expect(facade.lastPostReport()).toBeNull();
    expect(facade.powerSafetyAlert()).toBeNull();

    // Agora pode desconectar o cabo com segurança
    facade.disconnectCable('conn-atx-24p');
    expect(facade.isBlueprintConnected('conn-atx-24p')).toBe(false);
  });
});
