import { AssemblyState } from '../assembly/assembly.models';
import { CableConnectionEntity } from '../connections/connection.models';
import {
  AssemblyMissionReport,
  AssemblyMissionStep,
} from './assembly-mission.models';

/**
 * Avalia o progresso da Missão "Monte o computador" (Sprint 8) a partir do estado
 * real de peças montadas e cabos conectados.
 * Domínio Headless: zero dependência de Angular ou Three.js.
 */
export function evaluateAssemblyMission(
  assembly: AssemblyState,
  connections: readonly CableConnectionEntity[]
): AssemblyMissionReport {
  const connectedIds = new Set(connections.map((c) => c.id));

  const cpuInstalled = assembly.installed['component-cpu-lga775'] === 'motherboard-cpu-socket';
  const ramSlot = assembly.installed['component-ram-ddr3'];
  const ramInstalled = ramSlot === 'motherboard-dimm-1' || ramSlot === 'motherboard-dimm-2';
  const coolerInstalled =
    assembly.installed['component-cooler-lga775'] === 'motherboard-cpu-socket';
  const gpuInstalled = assembly.installed['component-gpu-pcie'] === 'motherboard-pcie-x16';

  const atxConnected = connectedIds.has('conn-atx-24p');
  const cpuPowerConnected = connectedIds.has('conn-cpu-4p');
  const hddDataConnected = connectedIds.has('conn-sata-data');
  const hddPowerConnected = connectedIds.has('conn-sata-power');
  const ssdDataConnected = connectedIds.has('conn-ssd-data');
  const ssdPowerConnected = connectedIds.has('conn-ssd-power');

  const sataDataConnected = hddDataConnected || ssdDataConnected;
  const ssdReady = ssdDataConnected && ssdPowerConnected;
  const hddReady = hddDataConnected && hddPowerConnected;

  const steps: AssemblyMissionStep[] = [
    {
      id: 'mission-cpu',
      label: 'CPU',
      completed: cpuInstalled,
      completedMessage: '✓ CPU instalada',
      hint: 'Arraste a CPU LGA775 da manta ESD até o CPU SOCKET.',
      actionKind: 'drag-component',
      focusTargetId: 'component-cpu-lga775',
    },
    {
      id: 'mission-thermal-paste',
      label: 'Pasta Térmica',
      completed: assembly.thermalPasteApplied,
      completedMessage: '✓ Pasta térmica aplicada',
      hint: 'Com a CPU no socket, arraste a seringa de Pasta Térmica até o CPU SOCKET.',
      actionKind: 'drag-component',
      focusTargetId: 'component-thermal-paste',
    },
    {
      id: 'mission-ram',
      label: 'RAM',
      completed: ramInstalled,
      completedMessage: '✓ Memória instalada',
      hint: 'Arraste a Memória DDR3 até o slot DIMM 1 ou DIMM 2.',
      actionKind: 'drag-component',
      focusTargetId: 'component-ram-ddr3',
    },
    {
      id: 'mission-cooler',
      label: 'Cooler',
      completed: coolerInstalled,
      completedMessage: '✓ Cooler instalado',
      hint: 'Após instalar a CPU (e pasta térmica), arraste o Cooler sobre o CPU SOCKET.',
      actionKind: 'drag-component',
      focusTargetId: 'component-cooler-lga775',
      warningNote:
        coolerInstalled && !assembly.thermalPasteApplied
          ? 'Sem pasta térmica aplicada'
          : undefined,
    },
    {
      id: 'mission-gpu',
      label: 'GPU',
      completed: gpuInstalled,
      completedMessage: '✓ GPU instalada',
      hint: 'Arraste a Placa de Vídeo dedicada até o slot PCIe x16.',
      actionKind: 'drag-component',
      focusTargetId: 'component-gpu-pcie',
    },
    {
      id: 'mission-atx',
      label: 'ATX',
      completed: atxConnected,
      completedMessage: '✓ ATX conectado',
      hint: 'Na aba Conexões, conecte Fonte → ATX 24P → Placa-Mãe.',
      actionKind: 'connect-cable',
      focusTargetId: 'motherboard-atx-24pin',
    },
    {
      id: 'mission-cpu-power',
      label: 'CPU POWER',
      completed: cpuPowerConnected,
      completedMessage: '✓ CPU Power conectado',
      hint: 'Na aba Conexões, conecte Fonte → CPU 4P → Alimentação CPU.',
      actionKind: 'connect-cable',
      focusTargetId: 'motherboard-cpu-power',
    },
    {
      id: 'mission-ssd',
      label: 'SSD (Boot)',
      completed: ssdReady,
      completedMessage: '✓ SSD 2.5" conectado como Boot Primário',
      hint: 'Conecte o SSD 2.5" (Cabo SATA + alimentação da fonte) para o Boot Primário do Sistema Operacional (~9s).',
      actionKind: 'connect-cable',
      focusTargetId: 'component-ssd-sata',
    },
    {
      id: 'mission-hdd',
      label: 'HD (Armaz.)',
      completed: hddReady,
      completedMessage: '✓ HD 3.5" conectado como Armazenamento Interno',
      hint: 'Conecte o HD Samsung 500 GB (Cabo SATA + alimentação da fonte) como Armazenamento Interno de arquivos.',
      actionKind: 'connect-cable',
      focusTargetId: 'component-hdd-samsung',
    },
    {
      id: 'mission-sata-data',
      label: 'Cabo SATA',
      completed: sataDataConnected,
      completedMessage: '✓ Cabo SATA conectado à Placa-Mãe',
      hint: 'Na aba Conexões, ligue o Cabo SATA entre o SSD / HD e as portas SATA da Placa-Mãe.',
      actionKind: 'connect-cable',
      focusTargetId: 'motherboard-sata',
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const isCompleted = completedCount === totalCount;

  // Ordem recomendada realista de engenharia: CPU -> Pasta Térmica -> Cooler -> RAM -> GPU -> ATX -> CPU 4P -> SSD (Boot) -> HD (Armaz.) -> Cabo SATA
  const recommendedOrder: readonly AssemblyMissionStep['id'][] = [
    'mission-cpu',
    'mission-thermal-paste',
    'mission-cooler',
    'mission-ram',
    'mission-gpu',
    'mission-atx',
    'mission-cpu-power',
    'mission-ssd',
    'mission-hdd',
    'mission-sata-data',
  ];
  const nextRecommendedStep =
    recommendedOrder
      .map((id) => steps.find((s) => s.id === id))
      .find((step): step is AssemblyMissionStep => Boolean(step && !step.completed)) ?? null;

  const engineeringNotes: string[] = [];
  if (coolerInstalled && !assembly.thermalPasteApplied) {
    engineeringNotes.push(
      'Dica de engenharia: o Cooler foi montado sem pasta térmica — aplique pasta no IHS da CPU para evitar superaquecimento.'
    );
  }
  if (coolerInstalled && !connectedIds.has('conn-cpu-fan')) {
    engineeringNotes.push(
      'Opcional recomendado: conecte o cabo CPU_FAN (4 pinos PWM) na aba Conexões.'
    );
  }
  if (gpuInstalled && !connectedIds.has('conn-gpu-pcie6')) {
    engineeringNotes.push(
      'Opcional recomendado: conecte o cabo auxiliar PCIe 6P da Fonte na GPU dedicada.'
    );
  }

  return {
    title: 'Monte o computador',
    steps,
    completedCount,
    totalCount,
    progressPercent,
    isCompleted,
    nextRecommendedStep,
    engineeringNotes,
  };
}
