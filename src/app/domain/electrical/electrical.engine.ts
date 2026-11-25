import { AssemblyState } from '../assembly/assembly.models';
import { CableConnectionEntity } from '../connections/connection.models';
import {
  ElectricalOverlayAnalysis,
  EvaluatedElectricalBranch,
  VoltageRailDefinition,
  VoltageRailId,
} from './electrical.models';

/**
 * Mapa elétrico oficial da bancada PCWare IPM41-D3 (ATX12V + Reguladores Secundários).
 * Domínio Headless: zero dependência de Angular ou Three.js.
 */
export const VOLTAGE_RAILS: readonly VoltageRailDefinition[] = [
  {
    id: '+12V',
    label: '+12V',
    title: 'Linha Principal +12V (Alta Potência)',
    atxWireColor: 'Amarelo (ATX12V)',
    colorHex: '#eab308',
    tolerance: '11.40 V – 12.60 V (±5%)',
    stage: 'PRIMARY_PSU',
    summary:
      'Linha de maior demanda energética do PC. Alimenta o VRM do processador, motores (HD e ventoinhas) e a placa de vídeo dedicada.',
    diagnosticTip:
      'Quedas abaixo de 11.4V sob carga causam reinícios súbitos, desligamento da GPU ou cliques no motor do HD Samsung.',
    relatedTargetIds: [
      'component-psu-atx',
      'motherboard-cpu-power',
      'motherboard-cpu-socket',
      'component-cpu-lga775',
      'motherboard-fan',
      'component-cooler-lga775',
      'component-hdd-samsung',
      'motherboard-pcie-x16',
      'component-gpu-pcie',
      'motherboard-atx-24pin',
    ],
    relatedConnectionIds: [
      'conn-cpu-4p',
      'conn-atx-24p',
      'conn-sata-power',
      'conn-gpu-pcie6',
      'conn-cpu-fan',
    ],
    branches: [
      {
        id: 'b-12v-vrm',
        label: 'CPU VRM',
        role: 'Entrada ATX12V 4P → MOSFETs → Vcore da CPU',
        targetObjectId: 'motherboard-cpu-power',
        requiredConnectionId: 'conn-cpu-4p',
      },
      {
        id: 'b-12v-cooler',
        label: 'Cooler',
        role: 'Motor da ventoinha via header CPU_FAN (+12V)',
        targetObjectId: 'motherboard-fan',
        requiredConnectionId: 'conn-cpu-fan',
      },
      {
        id: 'b-12v-hdd',
        label: 'HD Samsung',
        role: 'Motor spindle 7200 RPM e atuador via SATA Power',
        targetObjectId: 'component-hdd-samsung',
        requiredConnectionId: 'conn-sata-power',
      },
      {
        id: 'b-12v-gpu',
        label: 'GPU',
        role: 'Slot PCIe x16 (até 66 W) + Conector Auxiliar PCIe 6P',
        targetObjectId: 'motherboard-pcie-x16',
        requiredConnectionId: 'conn-atx-24p',
      },
    ],
  },
  {
    id: '+5V',
    label: '+5V',
    title: 'Linha +5V (Lógica, Discos e Periféricos)',
    atxWireColor: 'Vermelho (ATX12V)',
    colorHex: '#ef4444',
    tolerance: '4.75 V – 5.25 V (±5%)',
    stage: 'PRIMARY_PSU',
    summary:
      'Alimenta a eletrônica lógica do HD Samsung, portas USB 2.0, barramento PCI legado 32-bit e reguladores internos da placa-mãe.',
    diagnosticTip:
      'Curto em portas USB frontais ou no diodo TVS de 5V do HD desarma a proteção SCP da fonte imediatamente ao ligar.',
    relatedTargetIds: [
      'component-psu-atx',
      'motherboard-atx-24pin',
      'component-hdd-samsung',
      'motherboard-pci',
      'motherboard-southbridge-ich7',
      'motherboard-fan',
    ],
    relatedConnectionIds: ['conn-atx-24p', 'conn-sata-power'],
    branches: [
      {
        id: 'b-5v-hdd',
        label: 'HD Samsung (Placa Lógica)',
        role: 'Controladora e cache do disco via SATA Power (+5V)',
        targetObjectId: 'component-hdd-samsung',
        requiredConnectionId: 'conn-sata-power',
      },
      {
        id: 'b-5v-pci',
        label: 'Slots PCI Legados',
        role: 'Barramento 32-bit alimentado via ATX 24P',
        targetObjectId: 'motherboard-pci',
        requiredConnectionId: 'conn-atx-24p',
      },
      {
        id: 'b-5v-ich7',
        label: 'Southbridge ICH7 / USB 2.0',
        role: 'Alimentação das portas USB e periféricos I/O',
        targetObjectId: 'motherboard-southbridge-ich7',
        requiredConnectionId: 'conn-atx-24p',
      },
      {
        id: 'b-5v-atx24',
        label: 'Entrada ATX 24P',
        role: 'Distribuição primária de +5V na PCB',
        targetObjectId: 'motherboard-atx-24pin',
        requiredConnectionId: 'conn-atx-24p',
      },
    ],
  },
  {
    id: '+3.3V',
    label: '+3.3V',
    title: 'Linha +3.3V (Chipsets, I/O e Barramentos)',
    atxWireColor: 'Laranja (ATX12V)',
    colorHex: '#f97316',
    tolerance: '3.14 V – 3.47 V (±5%)',
    stage: 'PRIMARY_PSU',
    summary:
      'Fornece tensão de I/O para os chipsets Intel G41 e ICH7, sinalização PCI/PCIe, leitura SPD dos módulos DDR3 e circuitos de controle.',
    diagnosticTip:
      'Falha na linha +3.3V impede leitura do chip SPD da memória RAM e trava o POST antes mesmo de inicializar o vídeo.',
    relatedTargetIds: [
      'component-psu-atx',
      'motherboard-atx-24pin',
      'motherboard-northbridge-g41',
      'motherboard-southbridge-ich7',
      'motherboard-pcie-x16',
      'motherboard-pci',
      'motherboard-dimm-1',
      'motherboard-dimm-2',
      'component-ram-ddr3',
    ],
    relatedConnectionIds: ['conn-atx-24p', 'conn-sata-power'],
    branches: [
      {
        id: 'b-3v3-g41',
        label: 'Northbridge Intel G41',
        role: 'Circuitos de interface e I/O do chipset',
        targetObjectId: 'motherboard-northbridge-g41',
        requiredConnectionId: 'conn-atx-24p',
      },
      {
        id: 'b-3v3-ich7',
        label: 'Southbridge Intel ICH7',
        role: 'Lógica de controle SATA, BIOS e barramentos',
        targetObjectId: 'motherboard-southbridge-ich7',
        requiredConnectionId: 'conn-atx-24p',
      },
      {
        id: 'b-3v3-pcie',
        label: 'PCIe x16 & PCI',
        role: 'Alimentação auxiliar de 3.3V nos slots de expansão',
        targetObjectId: 'motherboard-pcie-x16',
        requiredConnectionId: 'conn-atx-24p',
      },
      {
        id: 'b-3v3-dimm',
        label: 'DIMM 1 / DIMM 2 (SPD)',
        role: 'Alimentação do chip EEPROM SPD da memória DDR3',
        targetObjectId: 'motherboard-dimm-1',
        requiredConnectionId: 'conn-atx-24p',
      },
    ],
  },
  {
    id: '+5VSB',
    label: '+5VSB',
    title: 'Linha +5VSB (Standby Sempre Ativa)',
    atxWireColor: 'Roxo (Pino 9 do ATX 24P)',
    colorHex: '#a855f7',
    tolerance: '4.75 V – 5.25 V (±5%)',
    stage: 'PRIMARY_PSU',
    summary:
      'Permanece ativa mesmo com o PC desligado (basta a chave da fonte estar ligada). Alimenta o circuito do botão Power (PS_ON#) e o standby do ICH7.',
    diagnosticTip:
      'Se a bancada não reage ao botão Power, o primeiro teste no multímetro é verificar se há +5VSB no pino 9 (fio roxo) do ATX 24P.',
    relatedTargetIds: [
      'component-psu-atx',
      'motherboard-atx-24pin',
      'motherboard-southbridge-ich7',
      'motherboard-cmos-battery',
    ],
    relatedConnectionIds: ['conn-atx-24p'],
    branches: [
      {
        id: 'b-5vsb-atx',
        label: 'ATX 24P (Pino 9 · PS_ON#)',
        role: 'Energia de standby que habilita o acionamento da fonte',
        targetObjectId: 'motherboard-atx-24pin',
        requiredConnectionId: 'conn-atx-24p',
      },
      {
        id: 'b-5vsb-ich7',
        label: 'Southbridge ICH7 (ACPI)',
        role: 'Monitora o botão Power e estados de suspensão S3/S5',
        targetObjectId: 'motherboard-southbridge-ich7',
        requiredConnectionId: 'conn-atx-24p',
      },
      {
        id: 'b-5vsb-cmos',
        label: 'Circuito RTC / Bateria CMOS',
        role: 'Substituído pela CR2032 (3V) quando fora da tomada',
        targetObjectId: 'motherboard-cmos-battery',
      },
    ],
  },
  {
    id: 'VCORE',
    label: 'Vcore',
    title: 'Vcore (~1.1V – 1.35V · Gerado pelo VRM)',
    atxWireColor: 'Trilha Interna PCB (Rebaixada de +12V)',
    colorHex: '#38bdf8',
    tolerance: '0.85 V – 1.36 V (Dinâmico por VID)',
    stage: 'SECONDARY_VRM',
    summary:
      'Tensão secundária gerada pelo circuito VRM da placa-mãe rebaixando +12V (do cabo CPU 4P) para alimentar o núcleo do processador com alta corrente.',
    diagnosticTip:
      'Se o cabo CPU 4P estiver desconectado ou um MOSFET de alta do VRM entrar em curto, não haverá Vcore e a CPU permanecerá fria sem dar vídeo.',
    relatedTargetIds: [
      'motherboard-cpu-power',
      'motherboard-cpu-socket',
      'component-cpu-lga775',
    ],
    relatedConnectionIds: ['conn-cpu-4p'],
    branches: [
      {
        id: 'b-vcore-in',
        label: 'Entrada CPU Power 4P (+12V)',
        role: 'Fornece corrente primária aos MOSFETs do VRM',
        targetObjectId: 'motherboard-cpu-power',
        requiredConnectionId: 'conn-cpu-4p',
      },
      {
        id: 'b-vcore-socket',
        label: 'Socket LGA775 / CPU',
        role: 'Recebe Vcore filtrado pelas bobinas e capacitores',
        targetObjectId: 'motherboard-cpu-socket',
        requiredConnectionId: 'conn-cpu-4p',
      },
    ],
  },
  {
    id: 'DDR3_1V5',
    label: '1.5V DDR3',
    title: 'VDD Memória (+1.5V DDR3 · Regulador Local)',
    atxWireColor: 'Trilha Interna PCB (Regulador DIMM)',
    colorHex: '#22c55e',
    tolerance: '1.425 V – 1.575 V (±5%)',
    stage: 'SECONDARY_VRM',
    summary:
      'Tensão dedicada gerada na placa-mãe para alimentar os chips DRAM nos slots DIMM 1 e DIMM 2, além da interface de memória no Northbridge G41.',
    diagnosticTip:
      'Ausência de 1.5V no regulador de memória impede o POST no estágio DRAM (3 beeps longos). DDR2 usava 1.8V e DDR4 usa 1.2V.',
    relatedTargetIds: [
      'motherboard-atx-24pin',
      'motherboard-dimm-1',
      'motherboard-dimm-2',
      'component-ram-ddr3',
      'motherboard-northbridge-g41',
    ],
    relatedConnectionIds: ['conn-atx-24p'],
    branches: [
      {
        id: 'b-ddr3-dimm1',
        label: 'Slot DIMM 1 (Canal A)',
        role: 'Alimentação +1.5V VDD + 0.75V VTT do módulo DDR3',
        targetObjectId: 'motherboard-dimm-1',
        requiredConnectionId: 'conn-atx-24p',
      },
      {
        id: 'b-ddr3-dimm2',
        label: 'Slot DIMM 2 (Canal B)',
        role: 'Alimentação +1.5V VDD para modo Dual-Channel',
        targetObjectId: 'motherboard-dimm-2',
        requiredConnectionId: 'conn-atx-24p',
      },
      {
        id: 'b-ddr3-imc',
        label: 'Northbridge G41 (IMC)',
        role: 'Controlador de memória integrado no G41',
        targetObjectId: 'motherboard-northbridge-g41',
        requiredConnectionId: 'conn-atx-24p',
      },
    ],
  },
];

export function findVoltageRailById(id: VoltageRailId): VoltageRailDefinition {
  return VOLTAGE_RAILS.find((r) => r.id === id) ?? VOLTAGE_RAILS[0];
}

/**
 * Cruza a linha elétrica selecionada com o estado real dos cabos conectados
 * para indicar quais ramos já estão energizáveis e quais cabos ainda faltam.
 */
export function evaluateElectricalOverlay(
  railId: VoltageRailId,
  _assemblyState: AssemblyState,
  connections: readonly CableConnectionEntity[]
): ElectricalOverlayAnalysis {
  const rail = findVoltageRailById(railId);
  const connectedIds = new Set(connections.map((c) => c.id));

  const activeConnectionIds = rail.relatedConnectionIds.filter((id) => connectedIds.has(id));
  const missingConnectionIds = rail.relatedConnectionIds.filter((id) => !connectedIds.has(id));

  const branches: EvaluatedElectricalBranch[] = rail.branches.map((branch) => {
    if (!branch.requiredConnectionId) {
      return {
        branch,
        energized: true,
        statusLabel: 'Ativo (Bateria / Local)',
      };
    }
    const isConnected = connectedIds.has(branch.requiredConnectionId);
    return {
      branch,
      energized: isConnected,
      statusLabel: isConnected ? 'Cabo conectado' : 'Cabo desconectado',
    };
  });

  return {
    rail,
    branches,
    activeConnectionIds,
    missingConnectionIds,
  };
}
