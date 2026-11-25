import { AssemblyState } from '../assembly/assembly.models';
import { CableConnectionEntity } from '../connections/connection.models';
import {
  DiagnosticCaseDefinition,
  InvestigationArea,
  PostTestReport,
} from './diagnostics.models';

/**
 * 5 casos reais de troubleshooting em bancada na PCWare IPM41-D3 (Sprint 9).
 * O sistema monta o defeito propositalmente sem revelar a causa raiz até o usuário resolver.
 * Domínio Headless: zero dependência de Angular ou Three.js.
 */
export const DIAGNOSTIC_CASES: readonly DiagnosticCaseDefinition[] = [
  {
    id: 'case-no-video-cpu4p',
    title: 'Caso 1 — Liga, gira ventoinhas, mas sem vídeo',
    difficulty: 'Iniciante',
    customerComplaint:
      'O computador liga e as ventoinhas giram normalmente, mas o monitor permanece sem sinal e não há nenhum beep.',
    subtleHint:
      'Verifique a alimentação dedicada do VRM do processador (+12V / Vcore) usando o Modo Elétrico ou a aba Conexões.',
    initialAssembly: {
      installed: {
        'component-cpu-lga775': 'motherboard-cpu-socket',
        'component-cooler-lga775': 'motherboard-cpu-socket',
        'component-ram-ddr3': 'motherboard-dimm-1',
        'component-gpu-pcie': 'motherboard-pcie-x16',
      },
      thermalPasteApplied: true,
    },
    initialConnectionIds: [
      'conn-atx-24p',
      'conn-sata-power',
      'conn-sata-data',
      'conn-cpu-fan',
      'conn-gpu-pcie6',
      // Defeito oculto: falta 'conn-cpu-4p'
    ],
    rootCauseExplanation:
      'O cabo CPU Power (ATX12V 4 pinos) estava desconectado. Sem +12V dedicado ao VRM, a CPU fica sem Vcore e o POST trava antes mesmo de emitir beeps.',
  },
  {
    id: 'case-no-video-ram-missing',
    title: 'Caso 2 — Sem vídeo + 3 beeps longos',
    difficulty: 'Iniciante',
    customerComplaint:
      'Ao ligar a bancada, a energia chega na placa-mãe, mas não há vídeo e o speaker emite 3 beeps longos repetidos.',
    subtleHint:
      '3 beeps longos na plataforma Intel G41/AMI indicam falha na inicialização de memória. Inspecione os slots DIMM 1 e DIMM 2.',
    initialAssembly: {
      installed: {
        'component-cpu-lga775': 'motherboard-cpu-socket',
        'component-cooler-lga775': 'motherboard-cpu-socket',
        'component-gpu-pcie': 'motherboard-pcie-x16',
        // Defeito oculto: Memória DDR3 fora do slot (na manta ESD)
      },
      thermalPasteApplied: true,
    },
    initialConnectionIds: [
      'conn-atx-24p',
      'conn-cpu-4p',
      'conn-sata-power',
      'conn-sata-data',
      'conn-cpu-fan',
      'conn-gpu-pcie6',
    ],
    rootCauseExplanation:
      'Nenhum módulo DDR3 estava encaixado nos slots DIMM 1 / DIMM 2. Sem memória RAM detectada pelo controlador do Northbridge G41, o POST interrompe no estágio DRAM.',
  },
  {
    id: 'case-no-video-gpu-power',
    title: 'Caso 3 — Sem vídeo + 1 beep longo e 3 curtos',
    difficulty: 'Intermediário',
    customerComplaint:
      'O computador energiza e passa por CPU e RAM, mas não apresenta imagem no monitor e emite 1 beep longo + 3 curtos.',
    subtleHint:
      '1 beep longo + 3 curtos indica falha no subsistema de vídeo (VGA). Verifique se a GPU dedicada recebe toda a alimentação necessária.',
    initialAssembly: {
      installed: {
        'component-cpu-lga775': 'motherboard-cpu-socket',
        'component-cooler-lga775': 'motherboard-cpu-socket',
        'component-ram-ddr3': 'motherboard-dimm-1',
        'component-gpu-pcie': 'motherboard-pcie-x16',
      },
      thermalPasteApplied: true,
    },
    initialConnectionIds: [
      'conn-atx-24p',
      'conn-cpu-4p',
      'conn-sata-power',
      'conn-sata-data',
      'conn-cpu-fan',
      // Defeito oculto: falta 'conn-gpu-pcie6'
    ],
    rootCauseExplanation:
      'O cabo auxiliar PCIe 6 pinos da GPU estava desconectado. O slot PCIe x16 fornece apenas 75 W, insuficiente para inicializar a placa de vídeo dedicada.',
  },
  {
    id: 'case-no-boot-sata-data',
    title: 'Caso 4 — Entra na BIOS, mas não detecta HD',
    difficulty: 'Intermediário',
    customerComplaint:
      'O computador dá vídeo normalmente e exibe a BIOS, mas exibe "Reboot and Select proper Boot device" porque o HD não aparece.',
    subtleHint:
      'Um HD 3.5" SATA precisa de duas conexões distintas: energia (15P) e dados (7P). Inspecione o armazenamento na bancada.',
    initialAssembly: {
      installed: {
        'component-cpu-lga775': 'motherboard-cpu-socket',
        'component-cooler-lga775': 'motherboard-cpu-socket',
        'component-ram-ddr3': 'motherboard-dimm-1',
        'component-gpu-pcie': 'motherboard-pcie-x16',
      },
      thermalPasteApplied: true,
    },
    initialConnectionIds: [
      'conn-atx-24p',
      'conn-cpu-4p',
      'conn-sata-power',
      // Defeito oculto: falta 'conn-sata-data'
      'conn-cpu-fan',
      'conn-gpu-pcie6',
    ],
    rootCauseExplanation:
      'O HD Samsung recebia alimentação SATA Power (girava os pratos), mas estava sem o cabo SATA Data de 7 pinos ligado ao Southbridge ICH7 da placa-mãe.',
  },
  {
    id: 'case-thermal-shutdown',
    title: 'Caso 5 — Liga e desliga em segundos (Superaquecimento)',
    difficulty: 'Avançado',
    customerComplaint:
      'A bancada liga e inicia o carregamento, mas desliga abruptamente após poucos segundos com alerta térmico.',
    subtleHint:
      'Inspecione o conjunto térmico do processador (CPU + Pasta Térmica + Cooler). Lembre-se de que é preciso remover o cooler para acessar o IHS.',
    initialAssembly: {
      installed: {
        'component-cpu-lga775': 'motherboard-cpu-socket',
        'component-cooler-lga775': 'motherboard-cpu-socket',
        'component-ram-ddr3': 'motherboard-dimm-1',
        'component-gpu-pcie': 'motherboard-pcie-x16',
      },
      // Defeito oculto: cooler montado sem pasta térmica!
      thermalPasteApplied: false,
    },
    initialConnectionIds: [
      'conn-atx-24p',
      'conn-cpu-4p',
      'conn-sata-power',
      'conn-sata-data',
      'conn-cpu-fan',
      'conn-gpu-pcie6',
    ],
    rootCauseExplanation:
      'O CPU Cooler foi montado diretamente sobre a CPU sem pasta térmica. A alta resistência térmica fez o processador atingir >100 °C e disparar o desligamento de proteção.',
  },
];

export function findDiagnosticCaseById(id: string | null): DiagnosticCaseDefinition | null {
  if (!id) {
    return null;
  }
  return DIAGNOSTIC_CASES.find((c) => c.id === id) ?? null;
}

/**
 * Executa a simulação realista de Power-On Self-Test (POST) sobre o estado atual da bancada.
 */
export function evaluateSystemPost(
  assembly: AssemblyState,
  connections: readonly CableConnectionEntity[]
): PostTestReport {
  const connected = new Set(connections.map((c) => c.id));

  const hasAtx24 = connected.has('conn-atx-24p');
  const hasCpu4 = connected.has('conn-cpu-4p');
  const hasCpuFan = connected.has('conn-cpu-fan');
  const hasHddPower = connected.has('conn-sata-power');
  const hasHddData = connected.has('conn-sata-data');
  const hasSsdPower = connected.has('conn-ssd-power');
  const hasSsdData = connected.has('conn-ssd-data');
  const hasGpu6Pin = connected.has('conn-gpu-pcie6');

  const hddBootReady = hasHddPower && hasHddData;
  const ssdBootReady = hasSsdPower && hasSsdData;

  const hasCpu = assembly.installed['component-cpu-lga775'] === 'motherboard-cpu-socket';
  const hasCooler = assembly.installed['component-cooler-lga775'] === 'motherboard-cpu-socket';
  const hasRam =
    assembly.installed['component-ram-ddr3'] === 'motherboard-dimm-1' ||
    assembly.installed['component-ram-ddr3'] === 'motherboard-dimm-2';
  const hasGpu = assembly.installed['component-gpu-pcie'] === 'motherboard-pcie-x16';

  // Estágio 0: PSU / ATX 24P
  if (!hasAtx24) {
    return {
      passed: false,
      reachedStage: 'PSU_CHECK',
      monitorOutput: 'NO_POWER',
      fansSpinning: false,
      beepDescription: 'Silêncio total (sem energia +5VSB)',
      observableSymptom:
        'A bancada não reage ao botão Power: ventoinhas paradas e nenhum sinal elétrico na placa-mãe.',
      stageStatuses: [
        { stage: 'PSU', status: 'FAIL' },
        { stage: 'CPU', status: 'PENDING' },
        { stage: 'DRAM', status: 'PENDING' },
        { stage: 'VGA', status: 'PENDING' },
        { stage: 'BOOT', status: 'PENDING' },
      ],
      cpuTempC: 25,
    };
  }

  // Estágio 1: CPU & VRM & Proteção Térmica
  if (!hasCpu || !hasCpu4) {
    return {
      passed: false,
      reachedStage: 'CPU_INIT',
      monitorOutput: 'NO_SIGNAL',
      fansSpinning: true,
      beepDescription: 'Nenhum beep (CPU não inicializou)',
      observableSymptom:
        'O computador liga e as ventoinhas giram, mas não apresenta vídeo e não emite nenhum código de beep.',
      stageStatuses: [
        { stage: 'PSU', status: 'OK' },
        { stage: 'CPU', status: 'FAIL' },
        { stage: 'DRAM', status: 'PENDING' },
        { stage: 'VGA', status: 'PENDING' },
        { stage: 'BOOT', status: 'PENDING' },
      ],
      cpuTempC: 28,
    };
  }

  if (!hasCooler || !assembly.thermalPasteApplied) {
    return {
      passed: false,
      reachedStage: 'CPU_INIT',
      monitorOutput: 'THERMAL_SHUTDOWN',
      fansSpinning: false,
      beepDescription: 'Desarme térmico abrupto (T > 100 °C)',
      observableSymptom:
        'O computador chegou a ligar, mas sem o Cooler / pasta térmica a CPU ultrapassou 100 °C em segundos e desligou automaticamente por proteção térmica (THERMTRIP#).',
      stageStatuses: [
        { stage: 'PSU', status: 'OK' },
        { stage: 'CPU', status: 'FAIL' },
        { stage: 'DRAM', status: 'PENDING' },
        { stage: 'VGA', status: 'PENDING' },
        { stage: 'BOOT', status: 'PENDING' },
      ],
      cpuTempC: 104,
    };
  }

  // Estágio 2: DRAM
  if (!hasRam) {
    return {
      passed: false,
      reachedStage: 'DRAM_INIT',
      monitorOutput: 'NO_SIGNAL',
      fansSpinning: true,
      beepDescription: '3 beeps longos (Falha DRAM)',
      observableSymptom:
        'A bancada energiza e gira as ventoinhas, mas não exibe vídeo e o speaker emite 3 beeps longos.',
      stageStatuses: [
        { stage: 'PSU', status: 'OK' },
        { stage: 'CPU', status: 'OK' },
        { stage: 'DRAM', status: 'FAIL' },
        { stage: 'VGA', status: 'PENDING' },
        { stage: 'BOOT', status: 'PENDING' },
      ],
      cpuTempC: 42,
    };
  }

  // Estágio 3: VGA (GPU dedicada exige PCIe 6P auxiliar)
  if (hasGpu && !hasGpu6Pin) {
    return {
      passed: false,
      reachedStage: 'VGA_INIT',
      monitorOutput: 'NO_SIGNAL',
      fansSpinning: true,
      beepDescription: '1 beep longo + 3 curtos (Falha VGA)',
      observableSymptom:
        'O computador liga e passa por CPU/RAM, mas o monitor fica sem sinal com 1 beep longo + 3 curtos.',
      stageStatuses: [
        { stage: 'PSU', status: 'OK' },
        { stage: 'CPU', status: 'OK' },
        { stage: 'DRAM', status: 'OK' },
        { stage: 'VGA', status: 'FAIL' },
        { stage: 'BOOT', status: 'PENDING' },
      ],
      cpuTempC: 44,
    };
  }

  // Estágio 4: BOOT / Armazenamento (HD 3.5" ou SSD 2.5" precisam de Cabo SATA + Energia da Fonte)
  if (!hddBootReady && !ssdBootReady) {
    return {
      passed: false,
      reachedStage: 'BOOT_CHECK',
      monitorOutput: 'BIOS_NO_BOOT_DEVICE',
      fansSpinning: true,
      beepDescription: '1 beep curto (POST OK, mas sem disco de boot)',
      observableSymptom:
        'O computador dá vídeo na BIOS normalmente, mas exibe "Reboot and Select proper Boot device" (nenhum SSD ou HD detectado com Cabo SATA + Energia).',
      stageStatuses: [
        { stage: 'PSU', status: 'OK' },
        { stage: 'CPU', status: 'OK' },
        { stage: 'DRAM', status: 'OK' },
        { stage: 'VGA', status: 'OK' },
        { stage: 'BOOT', status: 'FAIL' },
      ],
      cpuTempC: 46,
    };
  }

  // POST 100% aprovado — diferencia boot via SSD (ultrarrápido), HD mecânico ou ambos!
  const bootDriveType: 'SSD' | 'HDD' | 'DUAL_SSD_HDD' =
    ssdBootReady && hddBootReady ? 'DUAL_SSD_HDD' : ssdBootReady ? 'SSD' : 'HDD';
  const estimatedBootSeconds = ssdBootReady ? 9 : 38;
  const bootSummary =
    bootDriveType === 'DUAL_SSD_HDD'
      ? '✓ POST OK! SSD 2.5" definido como Boot Primário do SO (~9s · 0,1 ms) + HD 3.5" 500 GB como Armazenamento Interno de arquivos!'
      : bootDriveType === 'SSD'
        ? '✓ POST OK! Boot Primário ultrarrápido pelo SSD 2.5" (~9s · ~270 MB/s · latência 0,1 ms — até 4× mais rápido que HD mecânico!).'
        : '✓ POST OK! Boot pelo HD mecânico 7200 RPM (~38s · ~120 MB/s · latência 14 ms). Dica: conecte o SSD 2.5" como Boot Primário e use o HD como Armazenamento Interno!';

  const coolingWarning = !hasCpuFan
    ? '⚠ Cabo CPU_FAN desconectado! O PC ligou, mas com a ventoinha parada a CPU vai aquecer e desligar por proteção térmica.'
    : undefined;

  return {
    passed: true,
    reachedStage: 'POST_OK',
    monitorOutput: 'POST_SUCCESS',
    fansSpinning: hasCpuFan,
    beepDescription: '1 beep curto (POST OK)',
    observableSymptom: coolingWarning ? `${bootSummary} ${coolingWarning}` : bootSummary,
    stageStatuses: [
      { stage: 'PSU', status: 'OK' },
      { stage: 'CPU', status: 'OK' },
      { stage: 'DRAM', status: 'OK' },
      { stage: 'VGA', status: 'OK' },
      { stage: 'BOOT', status: 'OK' },
    ],
    cpuTempC: hasCpuFan ? 43 : 58,
    bootDriveType,
    estimatedBootSeconds,
    overheatRisk: !hasCpuFan,
    coolingWarning,
  };
}

/**
 * Ferramentas de investigação técnica (simulam medições de multímetro e inspeção física
 * sem entregar a solução pronta).
 */
export function inspectWorkbenchArea(
  area: InvestigationArea,
  assembly: AssemblyState,
  connections: readonly CableConnectionEntity[]
): { readonly areaLabel: string; readonly reading: string; readonly status: 'normal' | 'suspect' | 'critical' } {
  const connected = new Set(connections.map((c) => c.id));

  switch (area) {
    case 'power': {
      const atx = connected.has('conn-atx-24p');
      const cpu4 = connected.has('conn-cpu-4p');
      if (!atx) {
        return {
          areaLabel: 'Alimentação (Multímetro)',
          reading: 'ATX 24P aberto: +5VSB = 0.00 V na placa-mãe. Nenhuma tensão primária presente.',
          status: 'critical',
        };
      }
      if (!cpu4) {
        return {
          areaLabel: 'Alimentação (Multímetro)',
          reading: 'ATX 24P OK (+5VSB = 5.04 V, +3.3V = 3.31 V), porém entrada CPU 4P / VRM mede 0.00 V (Vcore ausente).',
          status: 'critical',
        };
      }
      return {
        areaLabel: 'Alimentação (Multímetro)',
        reading: 'Linhas estáveis: +12V = 12.06 V · +5V = 5.02 V · +3.3V = 3.31 V · Vcore presente.',
        status: 'normal',
      };
    }

    case 'cpu': {
      const hasCpu = assembly.installed['component-cpu-lga775'] === 'motherboard-cpu-socket';
      const hasCooler = assembly.installed['component-cooler-lga775'] === 'motherboard-cpu-socket';
      if (!hasCpu) {
        return {
          areaLabel: 'CPU & Térmica',
          reading: 'Socket LGA775 vazio — nenhum processador instalado.',
          status: 'critical',
        };
      }
      if (!hasCooler) {
        return {
          areaLabel: 'CPU & Térmica',
          reading: 'CPU LGA775 instalada, porém sem dissipador/cooler montado. Risco térmico imediato.',
          status: 'critical',
        };
      }
      if (!assembly.thermalPasteApplied) {
        return {
          areaLabel: 'CPU & Térmica',
          reading: 'CPU e Cooler montados, mas sensor térmico indica subida abrupta (>98 °C) — suspeita de contato térmico seco (sem pasta térmica).',
          status: 'critical',
        };
      }
      return {
        areaLabel: 'CPU & Térmica',
        reading: 'CPU LGA775 travada, pasta térmica aplicada e Cooler fixado (temperatura estável ~43 °C).',
        status: 'normal',
      };
    }

    case 'ram': {
      const ramSlot = assembly.installed['component-ram-ddr3'];
      if (!ramSlot) {
        return {
          areaLabel: 'Memória RAM (DIMM)',
          reading: 'Slots DIMM 1 e DIMM 2 vazios. Tensão 1.5V presente no barramento, mas nenhum módulo respondendo via SPD.',
          status: 'critical',
        };
      }
      return {
        areaLabel: 'Memória RAM (DIMM)',
        reading: `Módulo DDR3 4 GB detectado e travado em ${ramSlot === 'motherboard-dimm-1' ? 'DIMM 1' : 'DIMM 2'} (VDD = 1.50 V).`,
        status: 'normal',
      };
    }

    case 'gpu': {
      const hasGpu = assembly.installed['component-gpu-pcie'] === 'motherboard-pcie-x16';
      const hasGpu6 = connected.has('conn-gpu-pcie6');
      if (!hasGpu) {
        return {
          areaLabel: 'Vídeo (GPU / PCIe x16)',
          reading: 'Slot PCIe x16 vazio — sistema utilizará vídeo onboard Intel GMA X4500 do Northbridge G41.',
          status: 'suspect',
        };
      }
      if (!hasGpu6) {
        return {
          areaLabel: 'Vídeo (GPU / PCIe x16)',
          reading: 'GPU encaixada no PCIe x16 (75 W do slot), mas conector auxiliar PCIe 6 pinos está aberto (0 V na entrada auxiliar).',
          status: 'critical',
        };
      }
      return {
        areaLabel: 'Vídeo (GPU / PCIe x16)',
        reading: 'GPU dedicada encaixada em PCIe x16 com alimentação auxiliar PCIe 6P (+12V) presente.',
        status: 'normal',
      };
    }

    case 'storage': {
      const hddPwr = connected.has('conn-sata-power');
      const hddData = connected.has('conn-sata-data');
      const ssdPwr = connected.has('conn-ssd-power');
      const ssdData = connected.has('conn-ssd-data');

      const hddOk = hddPwr && hddData;
      const ssdOk = ssdPwr && ssdData;

      if (ssdOk && hddOk) {
        return {
          areaLabel: 'Armazenamento (SSD 2.5" + HD 3.5")',
          reading: 'SSD 240 GB (Boot ~9s) e HD Samsung 500 GB (Dados) energizados e com Cabo SATA ativo.',
          status: 'normal',
        };
      }
      if (ssdOk) {
        return {
          areaLabel: 'Armazenamento (SSD 2.5" SATA)',
          reading: 'SSD 2.5" 240 GB energizado (+5V) e com Cabo SATA ativo na controladora ICH7 (Boot rápido ~9s).',
          status: 'normal',
        };
      }
      if (hddOk) {
        return {
          areaLabel: 'Armazenamento (HD Samsung 3.5")',
          reading: 'HD Samsung 500 GB energizado (+12V/+5V) e com Cabo SATA ativo na controladora ICH7 (Boot ~38s).',
          status: 'normal',
        };
      }
      if ((hddData || ssdData) && !(hddPwr || ssdPwr)) {
        return {
          areaLabel: 'Armazenamento (HD / SSD)',
          reading: 'Cabo SATA conectado, mas falta o cabo de Energia da Fonte (15P) na unidade.',
          status: 'critical',
        };
      }
      if ((hddPwr || ssdPwr) && !(hddData || ssdData)) {
        return {
          areaLabel: 'Armazenamento (HD / SSD)',
          reading: 'Unidade energizada pela fonte, mas a placa-mãe não recebe sinal de dados (Cabo SATA 7P ausente).',
          status: 'critical',
        };
      }
      return {
        areaLabel: 'Armazenamento (HD / SSD)',
        reading: 'Nenhum disco (SSD 2.5" ou HD 3.5") está com Energia da Fonte e Cabo SATA conectados.',
        status: 'critical',
      };
    }
  }
}
