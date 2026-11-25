import { findBenchComponentById } from '../catalog/bench-components.catalog';
import { findInspectableObjectById } from '../catalog/motherboard.catalog';
import {
  AssemblyState,
  CompatibilityEvaluation,
  RemovalEvaluation,
} from './assembly.models';

/**
 * Motor de Compatibilidade e Regras de Montagem (Headless — TS Puro).
 * Valida regras físicas, elétricas e de ordem lógica de montagem na PCWare IPM41-D3.
 */
export function evaluatePlacement(
  componentId: string,
  targetSlotId: string,
  state: AssemblyState
): CompatibilityEvaluation {
  const component = findBenchComponentById(componentId);
  const slot = findInspectableObjectById(targetSlotId);

  if (!component || !slot) {
    return {
      status: 'INCOMPATIBLE',
      code: 'UNKNOWN_ENTITY',
      title: 'Destino inválido',
      reason: 'Componente ou região de encaixe não reconhecida pelo sistema.',
      componentId,
      targetSlotId,
    };
  }

  // Verifica se o mesmo componente já está instalado nesse mesmo slot
  if (state.installed[componentId] === targetSlotId) {
    return {
      status: 'COMPATIBLE',
      code: 'ALREADY_IN_SLOT',
      title: `${component.shortLabel} já instalado aqui`,
      reason: 'O componente já está corretamente posicionado neste encaixe.',
      componentId,
      targetSlotId,
    };
  }

  // Função auxiliar para verificar se algum outro componente ocupa um slot exclusivo
  const occupantId = Object.entries(state.installed).find(
    ([cid, sid]) => sid === targetSlotId && cid !== componentId
  )?.[0];

  const isCpuInstalled = state.installed['component-cpu-lga775'] === 'motherboard-cpu-socket';

  switch (component.type) {
    case 'cpu': {
      if (targetSlotId === 'motherboard-cpu-socket') {
        if (occupantId && occupantId !== 'component-cooler-lga775') {
          return incompatible(
            componentId,
            targetSlotId,
            'SLOT_OCCUPIED',
            'Socket CPU ocupado',
            'Já existe um processador instalado no socket LGA775.'
          );
        }
        return compatible(
          componentId,
          targetSlotId,
          'CPU_LGA775_MATCH',
          'Compatível: LGA775 → Socket LGA775',
          'Processador Intel Core 2 Duo LGA775 compatível com o socket e FSB da PCWare IPM41-D3.'
        );
      }
      return incompatible(
        componentId,
        targetSlotId,
        'WRONG_SLOT_FOR_CPU',
        'Instalação recusada',
        `A CPU LGA775 encaixa exclusivamente no CPU SOCKET (não em ${slot.shortLabel}).`
      );
    }

    case 'thermal-paste': {
      if (targetSlotId === 'motherboard-cpu-socket') {
        if (!isCpuInstalled) {
          return incompatible(
            componentId,
            targetSlotId,
            'CPU_REQUIRED_FOR_PASTE',
            'Instale a CPU primeiro',
            'Nunca aplique pasta térmica diretamente nos pinos do socket LGA775! Instale o processador antes.'
          );
        }
        if (state.installed['component-cooler-lga775'] === 'motherboard-cpu-socket') {
          return incompatible(
            componentId,
            targetSlotId,
            'COOLER_BLOCKS_PASTE',
            'Cooler bloqueando acesso',
            'Remova o CPU Cooler para acessar o IHS do processador e aplicar pasta térmica.'
          );
        }
        if (state.thermalPasteApplied) {
          return compatibleWithWarning(
            componentId,
            targetSlotId,
            'PASTE_ALREADY_APPLIED',
            'Pasta térmica já aplicada',
            'A CPU já possui pasta térmica. Reaplicar em excesso pode transbordar sobre o socket.'
          );
        }
        return compatible(
          componentId,
          targetSlotId,
          'PASTE_READY',
          'Compatível: Aplicar pasta no IHS da CPU',
          'Aplica uma gota controlada de pasta térmica não condutiva no centro do IHS da CPU.'
        );
      }
      return incompatible(
        componentId,
        targetSlotId,
        'WRONG_TARGET_FOR_PASTE',
        'Destino incorreto para pasta térmica',
        `A pasta térmica deve ser aplicada sobre a CPU instalada no CPU SOCKET (não em ${slot.shortLabel}).`
      );
    }

    case 'cpu-cooler': {
      if (targetSlotId === 'motherboard-cpu-socket') {
        if (!isCpuInstalled) {
          return incompatible(
            componentId,
            targetSlotId,
            'CPU_REQUIRED_FOR_COOLER',
            'CPU ausente no socket',
            'Instale o processador LGA775 no socket antes de fixar o CPU Cooler.'
          );
        }
        if (!state.thermalPasteApplied) {
          return compatibleWithWarning(
            componentId,
            targetSlotId,
            'COOLER_WITHOUT_PASTE',
            'Atenção: Sem pasta térmica!',
            'O cooler encaixa na furação LGA775, mas sem pasta térmica a CPU sofrerá superaquecimento severo.'
          );
        }
        return compatible(
          componentId,
          targetSlotId,
          'COOLER_LGA775_MATCH',
          'Compatível: Cooler LGA775 → CPU',
          'Furação 72×72 mm compatível com LGA775 e interface térmica pronta sobre a CPU.'
        );
      }
      return incompatible(
        componentId,
        targetSlotId,
        'WRONG_SLOT_FOR_COOLER',
        'Instalação recusada',
        `O CPU Cooler deve ser montado sobre o CPU SOCKET (não em ${slot.shortLabel}).`
      );
    }

    case 'ram-ddr3': {
      if (targetSlotId === 'motherboard-dimm-1' || targetSlotId === 'motherboard-dimm-2') {
        if (occupantId) {
          return incompatible(
            componentId,
            targetSlotId,
            'DIMM_OCCUPIED',
            'Slot DIMM ocupado',
            `${slot.shortLabel} já possui um módulo de memória instalado.`
          );
        }
        return compatible(
          componentId,
          targetSlotId,
          'RAM_DDR3_MATCH',
          `Compatível: DDR3 → ${slot.shortLabel}`,
          'Módulo DDR3 240 pinos (1.5V) compatível com a chave física e o controlador do Northbridge G41.'
        );
      }
      return incompatible(
        componentId,
        targetSlotId,
        'WRONG_SLOT_FOR_RAM',
        'Slot incompatível para RAM DDR3',
        `Memória DDR3 (240 pinos) não encaixa em ${slot.shortLabel}. Utilize DIMM 1 ou DIMM 2.`
      );
    }

    case 'gpu': {
      if (targetSlotId === 'motherboard-pcie-x16') {
        if (occupantId) {
          return incompatible(
            componentId,
            targetSlotId,
            'PCIE_OCCUPIED',
            'Slot PCIe x16 ocupado',
            'Já existe uma placa instalada no slot PCIe x16.'
          );
        }
        return compatible(
          componentId,
          targetSlotId,
          'GPU_PCIE_MATCH',
          'Compatível: GPU → PCIe x16',
          'Interface PCI Express x16 compatível (16 lanes ligadas ao Northbridge Intel G41).'
        );
      }
      if (targetSlotId === 'motherboard-pci') {
        return incompatible(
          componentId,
          targetSlotId,
          'GPU_ON_LEGACY_PCI',
          'Incompatível: PCIe x16 ≠ PCI legado',
          'Uma placa de vídeo PCI Express x16 é física e eletricamente incompatível com o barramento PCI legado 32-bit.'
        );
      }
      return incompatible(
        componentId,
        targetSlotId,
        'WRONG_SLOT_FOR_GPU',
        'Slot incompatível para GPU',
        `A placa de vídeo dedicada deve ser instalada exclusivamente no slot PCIe x16 (não em ${slot.shortLabel}).`
      );
    }

    case 'cable-sata': {
      if (targetSlotId === 'motherboard-sata') {
        return compatible(
          componentId,
          targetSlotId,
          'SATA_CABLE_MATCH',
          'Compatível: Cabo SATA → Porta SATA II',
          'Conector chaveado em "L" de 7 pinos compatível com o banco SATA II da PCWare IPM41-D3.'
        );
      }
      return incompatible(
        componentId,
        targetSlotId,
        'WRONG_PORT_FOR_SATA',
        'Conector incompatível',
        `O cabo de dados SATA 7 pinos conecta-se exclusivamente nas portas SATA (não em ${slot.shortLabel}).`
      );
    }

    case 'cable-power': {
      if (targetSlotId === 'motherboard-atx-24pin' || targetSlotId === 'motherboard-cpu-power') {
        return compatible(
          componentId,
          targetSlotId,
          'POWER_CABLE_MATCH',
          `Compatível: Alimentação → ${slot.shortLabel}`,
          `Conexão de alimentação da fonte ATX compatível com ${slot.name}.`
        );
      }
      return incompatible(
        componentId,
        targetSlotId,
        'WRONG_PORT_FOR_POWER',
        'Conector de energia incompatível',
        `Conecte cabos de alimentação da fonte apenas em ATX 24P ou CPU POWER (não em ${slot.shortLabel}).`
      );
    }

    case 'hdd-sata': {
      return incompatible(
        componentId,
        targetSlotId,
        'HDD_NEEDS_CABLE',
        'HD não encaixa direto na placa-mãe',
        'O HD Samsung 3.5" permanece apoiado na bancada e comunica-se com a placa-mãe através do Cabo SATA (7P) + SATA Power da fonte.'
      );
    }

    case 'psu-atx': {
      return incompatible(
        componentId,
        targetSlotId,
        'PSU_NEEDS_CABLES',
        'Fonte não encaixa sobre a PCB',
        'A Fonte ATX permanece ao lado da placa-mãe na bancada e entrega energia através dos cabos ATX 24P e CPU Power 4P.'
      );
    }
  }
}

export function evaluateRemoval(
  componentId: string,
  state: AssemblyState
): RemovalEvaluation {
  if (!state.installed[componentId]) {
    return { allowed: false, reason: 'O componente não está instalado na placa-mãe.' };
  }

  if (
    componentId === 'component-cpu-lga775' &&
    state.installed['component-cooler-lga775'] === 'motherboard-cpu-socket'
  ) {
    return {
      allowed: false,
      reason: 'Remova o CPU Cooler antes de destravar e retirar o processador do socket LGA775.',
    };
  }

  return { allowed: true, reason: 'Remoção segura autorizada.' };
}

export function applyPlacement(
  componentId: string,
  targetSlotId: string,
  state: AssemblyState
): AssemblyState {
  if (componentId === 'component-thermal-paste') {
    return {
      ...state,
      thermalPasteApplied: true,
    };
  }
  return {
    ...state,
    installed: {
      ...state.installed,
      [componentId]: targetSlotId,
    },
  };
}

export function applyRemoval(componentId: string, state: AssemblyState): AssemblyState {
  const nextInstalled = { ...state.installed };
  delete nextInstalled[componentId];

  // Ao remover a CPU, a pasta térmica aplicada sobre ela também é limpa
  const thermalPasteApplied =
    componentId === 'component-cpu-lga775' ? false : state.thermalPasteApplied;

  return {
    installed: nextInstalled,
    thermalPasteApplied,
  };
}

function compatible(
  componentId: string,
  targetSlotId: string,
  code: string,
  title: string,
  reason: string
): CompatibilityEvaluation {
  return { status: 'COMPATIBLE', code, title, reason, componentId, targetSlotId };
}

function compatibleWithWarning(
  componentId: string,
  targetSlotId: string,
  code: string,
  title: string,
  reason: string
): CompatibilityEvaluation {
  return { status: 'COMPATIBLE_WITH_WARNING', code, title, reason, componentId, targetSlotId };
}

function incompatible(
  componentId: string,
  targetSlotId: string,
  code: string,
  title: string,
  reason: string
): CompatibilityEvaluation {
  return { status: 'INCOMPATIBLE', code, title, reason, componentId, targetSlotId };
}
