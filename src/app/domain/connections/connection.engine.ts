import { AssemblyState } from '../assembly/assembly.models';
import {
  CableConnectionEntity,
  ConnectionBlueprint,
  ConnectionValidationResult,
  HardwarePortDefinition,
} from './connection.models';

/**
 * Portas físicas disponíveis na bancada PCWare IPM41-D3 + Fonte ATX + HD Samsung + GPU + Cooler.
 * Domínio Headless: zero dependência de Angular ou Three.js.
 */
export const BENCH_HARDWARE_PORTS: readonly HardwarePortDefinition[] = [
  // Fonte ATX
  {
    id: 'psu-out-atx24',
    deviceId: 'component-psu-atx',
    deviceName: 'Fonte ATX 500W',
    label: 'Saída ATX 24 pinos',
    shortLabel: 'Fonte · ATX 24P',
    connector: 'ATX_24P',
    direction: 'SOURCE',
    kind: 'power',
  },
  {
    id: 'psu-out-cpu4',
    deviceId: 'component-psu-atx',
    deviceName: 'Fonte ATX 500W',
    label: 'Saída CPU Power 4 pinos (ATX12V)',
    shortLabel: 'Fonte · CPU 4P',
    connector: 'CPU_4P',
    direction: 'SOURCE',
    kind: 'power',
  },
  {
    id: 'psu-out-sata-power',
    deviceId: 'component-psu-atx',
    deviceName: 'Fonte ATX 500W',
    label: 'Energia HD (Fonte · 15 pinos)',
    shortLabel: 'Fonte · Energia HD',
    connector: 'SATA_POWER_15P',
    direction: 'SOURCE',
    kind: 'power',
  },
  {
    id: 'psu-out-ssd-power',
    deviceId: 'component-psu-atx',
    deviceName: 'Fonte ATX 500W',
    label: 'Energia SSD (Fonte · 15 pinos)',
    shortLabel: 'Fonte · Energia SSD',
    connector: 'SATA_POWER_15P',
    direction: 'SOURCE',
    kind: 'power',
  },
  {
    id: 'psu-out-pcie6',
    deviceId: 'component-psu-atx',
    deviceName: 'Fonte ATX 500W',
    label: 'Saída PCIe 6 pinos (GPU)',
    shortLabel: 'Fonte · PCIe 6P',
    connector: 'PCIE_6P',
    direction: 'SOURCE',
    kind: 'power',
  },

  // Placa-Mãe PCWare IPM41-D3
  {
    id: 'mb-in-atx24',
    deviceId: 'motherboard-ipm41-d3',
    deviceName: 'Placa-Mãe PCWare IPM41-D3',
    label: 'Entrada ATX 24 pinos',
    shortLabel: 'Placa-Mãe · ATX 24P',
    connector: 'ATX_24P',
    direction: 'SINK',
    kind: 'power',
  },
  {
    id: 'mb-in-cpu4',
    deviceId: 'motherboard-ipm41-d3',
    deviceName: 'Placa-Mãe PCWare IPM41-D3',
    label: 'Alimentação CPU 4 pinos (ATX12V)',
    shortLabel: 'Placa-Mãe · CPU 4P',
    connector: 'CPU_4P',
    direction: 'SINK',
    kind: 'power',
  },
  {
    id: 'mb-port-sata-data',
    deviceId: 'motherboard-ipm41-d3',
    deviceName: 'Placa-Mãe PCWare IPM41-D3',
    label: 'Porta SATA 1 (Cabo SATA · 7 pinos)',
    shortLabel: 'Placa-Mãe · SATA 1',
    connector: 'SATA_DATA_7P',
    direction: 'BIDIRECTIONAL',
    kind: 'data',
  },
  {
    id: 'mb-port-sata-2',
    deviceId: 'motherboard-ipm41-d3',
    deviceName: 'Placa-Mãe PCWare IPM41-D3',
    label: 'Porta SATA 2 (Cabo SATA · 7 pinos)',
    shortLabel: 'Placa-Mãe · SATA 2',
    connector: 'SATA_DATA_7P',
    direction: 'BIDIRECTIONAL',
    kind: 'data',
  },
  {
    id: 'mb-port-cpu-fan',
    deviceId: 'motherboard-ipm41-d3',
    deviceName: 'Placa-Mãe PCWare IPM41-D3',
    label: 'Header CPU_FAN (4 pinos PWM)',
    shortLabel: 'Placa-Mãe · CPU_FAN',
    connector: 'FAN_4P_PWM',
    direction: 'SOURCE',
    kind: 'control',
  },

  // HD Samsung 3.5"
  {
    id: 'hdd-in-sata-power',
    deviceId: 'component-hdd-samsung',
    deviceName: 'HD Samsung 500 GB',
    label: 'Entrada de Energia HD (15 pinos)',
    shortLabel: 'HD · Energia (15P)',
    connector: 'SATA_POWER_15P',
    direction: 'SINK',
    kind: 'power',
  },
  {
    id: 'hdd-port-sata-data',
    deviceId: 'component-hdd-samsung',
    deviceName: 'HD Samsung 500 GB',
    label: 'Porta Cabo SATA (7 pinos)',
    shortLabel: 'HD · Cabo SATA',
    connector: 'SATA_DATA_7P',
    direction: 'BIDIRECTIONAL',
    kind: 'data',
  },

  // SSD 2.5" SATA (240 GB)
  {
    id: 'ssd-in-power',
    deviceId: 'component-ssd-sata',
    deviceName: 'SSD 2.5" 240 GB',
    label: 'Entrada de Energia SSD (15 pinos)',
    shortLabel: 'SSD · Energia (15P)',
    connector: 'SATA_POWER_15P',
    direction: 'SINK',
    kind: 'power',
  },
  {
    id: 'ssd-port-sata',
    deviceId: 'component-ssd-sata',
    deviceName: 'SSD 2.5" 240 GB',
    label: 'Porta Cabo SATA (7 pinos)',
    shortLabel: 'SSD · Cabo SATA',
    connector: 'SATA_DATA_7P',
    direction: 'BIDIRECTIONAL',
    kind: 'data',
  },

  // GPU & Cooler (opcionais quando instalados)
  {
    id: 'gpu-in-pcie6',
    deviceId: 'component-gpu-pcie',
    deviceName: 'Placa de Vídeo PCIe x16',
    label: 'Alimentação Auxiliar PCIe 6 pinos',
    shortLabel: 'GPU · PCIe 6P',
    connector: 'PCIE_6P',
    direction: 'SINK',
    kind: 'power',
    requiredInstalledComponentId: 'component-gpu-pcie',
  },
  {
    id: 'cooler-in-fan',
    deviceId: 'component-cooler-lga775',
    deviceName: 'CPU Cooler LGA775',
    label: 'Cabo Ventoinha 4 pinos PWM',
    shortLabel: 'Cooler · FAN 4P',
    connector: 'FAN_4P_PWM',
    direction: 'SINK',
    kind: 'control',
    requiredInstalledComponentId: 'component-cooler-lga775',
  },
];

/**
 * Catálogo das conexões válidas da bancada (os 4 cabos principais da Sprint 5 + 2 auxiliares).
 */
export const BENCH_CONNECTION_BLUEPRINTS: readonly ConnectionBlueprint[] = [
  {
    id: 'conn-atx-24p',
    name: 'ATX 24P (Fonte → Placa-Mãe)',
    sourcePortId: 'psu-out-atx24',
    targetPortId: 'mb-in-atx24',
    kind: 'power',
    connector: 'ATX_24P',
    connectorLabel: 'ATX 24 pinos (20+4)',
    compatibilitySummary: 'Compatível: Padrão ATX12V 24P entre Fonte ATX e PCWare IPM41-D3.',
    functionSummary:
      'Fornece alimentação principal (+12V, +5V, +3.3V), standby (+5VSB) e sinais de controle PS_ON# / PWR_OK para ligar a placa-mãe.',
    voltagesOrSignals: ['+12V', '+5V', '+3.3V', '-12V', '+5VSB', 'PS_ON#', 'PWR_OK'],
    colorHex: '#f43f5e',
    requiredForBoot: true,
  },
  {
    id: 'conn-cpu-4p',
    name: 'CPU 4P (Fonte → Alimentação CPU)',
    sourcePortId: 'psu-out-cpu4',
    targetPortId: 'mb-in-cpu4',
    kind: 'power',
    connector: 'CPU_4P',
    connectorLabel: 'ATX12V 4 pinos (P4)',
    compatibilitySummary: 'Compatível: Conector P4 4 pinos (+12V dedicado ao VRM da CPU LGA775).',
    functionSummary:
      'Alimenta diretamente os estágios de potência do VRM que convertem +12V em Vcore (~1.1V–1.35V) para o processador.',
    voltagesOrSignals: ['+12V (2× Amarelo)', 'GND (2× Preto)'],
    colorHex: '#f59e0b',
    requiredForBoot: true,
  },
  {
    id: 'conn-sata-power',
    name: 'Fonte → HD 3.5" (Alimentação 15P)',
    sourcePortId: 'psu-out-sata-power',
    targetPortId: 'hdd-in-sata-power',
    kind: 'power',
    connector: 'SATA_POWER_15P',
    connectorLabel: 'Alimentação de Disco 15 pinos (Fonte)',
    compatibilitySummary: 'Compatível: Alimentação 15 pinos da Fonte ATX para HD 3.5" (Armazenamento Interno).',
    functionSummary:
      'Alimenta o motor dos pratos magnéticos (+12V) e a placa lógica controladora (+5V) do HD Samsung.',
    voltagesOrSignals: ['+12V (Motor)', '+5V (Lógica)', '+3.3V', 'GND'],
    colorHex: '#fb923c',
    requiredForBoot: true,
  },
  {
    id: 'conn-sata-data',
    name: 'Cabo SATA (HD 3.5" ↔ Placa-Mãe)',
    sourcePortId: 'hdd-port-sata-data',
    targetPortId: 'mb-port-sata-data',
    kind: 'data',
    connector: 'SATA_DATA_7P',
    connectorLabel: 'Cabo SATA 7 pinos (Dados)',
    compatibilitySummary: 'Compatível: Interface SATA II (3.0 Gbps) entre HD Samsung (Armazenamento Interno) e Placa-Mãe.',
    functionSummary:
      'Transporta sinais seriais diferenciais de dados (TX/RX) entre o HD de armazenamento interno e a controladora SATA.',
    voltagesOrSignals: ['TX+ / TX−', 'RX+ / RX−', '3× GND (Sem alimentação elétrica)'],
    colorHex: '#dc2626',
    requiredForBoot: true,
  },
  {
    id: 'conn-ssd-power',
    name: 'Fonte → SSD 2.5" (Alimentação 15P)',
    sourcePortId: 'psu-out-ssd-power',
    targetPortId: 'ssd-in-power',
    kind: 'power',
    connector: 'SATA_POWER_15P',
    connectorLabel: 'Alimentação de Disco 15 pinos (Fonte)',
    compatibilitySummary: 'Compatível: Alimentação 15 pinos da Fonte ATX para SSD 2.5" (Boot Primário · +5V).',
    functionSummary:
      'Fornece energia elétrica (+5V) para a controladora e os chips de memória NAND Flash do SSD 2.5" (~1,5 W, sem motor mecânico).',
    voltagesOrSignals: ['+5V (Controladora + NAND)', 'GND'],
    colorHex: '#f59e0b',
    requiredForBoot: false,
  },
  {
    id: 'conn-ssd-data',
    name: 'Cabo SATA (SSD 2.5" ↔ Placa-Mãe)',
    sourcePortId: 'ssd-port-sata',
    targetPortId: 'mb-port-sata-2',
    kind: 'data',
    connector: 'SATA_DATA_7P',
    connectorLabel: 'Cabo SATA 7 pinos (Dados)',
    compatibilitySummary: 'Compatível: SSD 2.5" (Boot Primário) conectado via Cabo SATA à placa-mãe.',
    functionSummary:
      'Conecta o SSD 2.5" como unidade de Boot Primário do Sistema Operacional (~9s vs ~38s no HD mecânico).',
    voltagesOrSignals: ['TX+ / TX−', 'RX+ / RX−', '3× GND (Sem alimentação elétrica)'],
    colorHex: '#06b6d4',
    requiredForBoot: false,
  },
  {
    id: 'conn-cpu-fan',
    name: 'CPU_FAN (Placa-Mãe → Cooler CPU)',
    sourcePortId: 'mb-port-cpu-fan',
    targetPortId: 'cooler-in-fan',
    kind: 'control',
    connector: 'FAN_4P_PWM',
    connectorLabel: '4 pinos PWM',
    compatibilitySummary: 'Compatível: Controle PWM + leitura de tacômetro (RPM) no header CPU_FAN.',
    functionSummary:
      'Alimenta a ventoinha do CPU Cooler em +12V e ajusta dinamicamente sua velocidade conforme a temperatura da CPU.',
    voltagesOrSignals: ['+12V', 'GND', 'SENSE (RPM)', 'PWM'],
    colorHex: '#14b8a6',
    requiredForBoot: false,
  },
  {
    id: 'conn-gpu-pcie6',
    name: 'PCIe 6P (Fonte → Placa de Vídeo)',
    sourcePortId: 'psu-out-pcie6',
    targetPortId: 'gpu-in-pcie6',
    kind: 'power',
    connector: 'PCIE_6P',
    connectorLabel: 'PCIe 6 pinos Auxiliar',
    compatibilitySummary: 'Compatível: Alimentação auxiliar +12V (até 75 W extras) para GPU dedicada.',
    functionSummary:
      'Complementa os 75 W do slot PCIe x16, permitindo que a GPU inicialize no estágio VGA e opere sob carga.',
    voltagesOrSignals: ['+12V (até 75 W)', 'GND', 'SENSE'],
    colorHex: '#22c55e',
    requiredForBoot: false,
  },
];

export function findPortById(portId: string | null): HardwarePortDefinition | null {
  if (!portId) {
    return null;
  }
  return BENCH_HARDWARE_PORTS.find((p) => p.id === portId) ?? null;
}

export function findBlueprintById(id: string | null): ConnectionBlueprint | null {
  if (!id) {
    return null;
  }
  return BENCH_CONNECTION_BLUEPRINTS.find((b) => b.id === id) ?? null;
}

/**
 * Valida a tentativa de conectar duas portas físicas na bancada e retorna a
 * entidade CableConnectionEntity completa quando válida.
 */
export function evaluatePortConnection(
  portAId: string,
  portBId: string,
  assemblyState: AssemblyState,
  existingConnections: readonly CableConnectionEntity[]
): ConnectionValidationResult {
  const portA = findPortById(portAId);
  const portB = findPortById(portBId);

  if (!portA || !portB) {
    return {
      valid: false,
      code: 'UNKNOWN_PORT',
      title: 'Porta inválida',
      reason: 'Uma das portas selecionadas não existe na bancada.',
    };
  }

  if (portA.id === portB.id) {
    return {
      valid: false,
      code: 'SAME_PORT',
      title: 'Mesma porta selecionada',
      reason: 'Selecione uma porta de destino diferente da origem.',
    };
  }

  if (portA.deviceId === portB.deviceId) {
    return {
      valid: false,
      code: 'SAME_DEVICE',
      title: 'Loop no mesmo dispositivo',
      reason: `Não é possível conectar duas portas do mesmo dispositivo (${portA.deviceName}).`,
    };
  }

  // Verifica se algum dispositivo dependente precisa estar instalado primeiro
  for (const port of [portA, portB]) {
    if (
      port.requiredInstalledComponentId &&
      !assemblyState.installed[port.requiredInstalledComponentId]
    ) {
      return {
        valid: false,
        code: 'COMPONENT_NOT_INSTALLED',
        title: `${port.deviceName} não instalado`,
        reason: `Encaixe ${port.deviceName} na placa-mãe antes de conectar o cabo ${port.label}.`,
      };
    }
  }

  // Verifica se alguma das portas já está ocupada
  const occupied = existingConnections.find(
    (c) =>
      c.source.portId === portA.id ||
      c.target.portId === portA.id ||
      c.source.portId === portB.id ||
      c.target.portId === portB.id
  );
  if (occupied) {
    return {
      valid: false,
      code: 'PORT_OCCUPIED',
      title: 'Porta já conectada',
      reason: `Uma das portas já está em uso pela conexão "${occupied.name}".`,
    };
  }

  // Validação específica de incompatibilidades clássicas de hardware
  if (portA.connector !== portB.connector) {
    const pair = new Set([portA.connector, portB.connector]);

    if (pair.has('PCIE_6P') && pair.has('CPU_4P')) {
      return {
        valid: false,
        code: 'PCIE_VS_CPU_KEYING',
        title: 'Perigo: PCIe ≠ CPU Power',
        reason:
          'Conectores PCIe (GPU) e CPU Power (ATX12V) possuem polaridade +12V/GND invertida e chaveamento físico diferente!',
      };
    }

    if (pair.has('SATA_POWER_15P') && pair.has('SATA_DATA_7P')) {
      return {
        valid: false,
        code: 'SATA_POWER_VS_DATA',
        title: 'Incompatível: SATA Power ≠ SATA Data',
        reason:
          'SATA Power (15 pinos, energia) não encaixa em SATA Data (7 pinos, dados). Conecte SATA Power da Fonte na entrada de energia do HD.',
      };
    }

    return {
      valid: false,
      code: 'CONNECTOR_MISMATCH',
      title: 'Conectores incompatíveis',
      reason: `${portA.shortLabel} (${portA.connector}) não é compatível com ${portB.shortLabel} (${portB.connector}).`,
    };
  }

  if (portA.direction === 'SOURCE' && portB.direction === 'SOURCE') {
    return {
      valid: false,
      code: 'SOURCE_TO_SOURCE',
      title: 'Duas saídas de energia',
      reason: 'Não é permitido conectar duas portas de saída (SOURCE) entre si.',
    };
  }

  if (portA.direction === 'SINK' && portB.direction === 'SINK') {
    return {
      valid: false,
      code: 'SINK_TO_SINK',
      title: 'Duas entradas sem fonte',
      reason: 'Ambas as portas são entradas (SINK); uma ponta deve ser origem.',
    };
  }

  const blueprint = BENCH_CONNECTION_BLUEPRINTS.find(
    (bp) =>
      (bp.sourcePortId === portA.id && bp.targetPortId === portB.id) ||
      (bp.sourcePortId === portB.id && bp.targetPortId === portA.id)
  );

  if (!blueprint) {
    return {
      valid: false,
      code: 'UNSUPPORTED_ROUTE',
      title: 'Rota não suportada',
      reason: 'Esta combinação de portas não forma uma conexão válida nesta bancada.',
    };
  }

  const sourcePort = findPortById(blueprint.sourcePortId)!;
  const targetPort = findPortById(blueprint.targetPortId)!;

  const entity: CableConnectionEntity = {
    id: blueprint.id,
    name: blueprint.name,
    source: {
      deviceId: sourcePort.deviceId,
      deviceName: sourcePort.deviceName,
      portId: sourcePort.id,
      portLabel: sourcePort.label,
    },
    target: {
      deviceId: targetPort.deviceId,
      deviceName: targetPort.deviceName,
      portId: targetPort.id,
      portLabel: targetPort.label,
    },
    kind: blueprint.kind,
    connector: blueprint.connector,
    connectorLabel: blueprint.connectorLabel,
    compatibilitySummary: blueprint.compatibilitySummary,
    functionSummary: blueprint.functionSummary,
    voltagesOrSignals: blueprint.voltagesOrSignals,
    colorHex: blueprint.colorHex,
    requiredForBoot: blueprint.requiredForBoot,
  };

  return {
    valid: true,
    code: 'CONNECTION_VALID',
    title: `Conectado: ${entity.name}`,
    reason: entity.compatibilitySummary,
    connection: entity,
  };
}
