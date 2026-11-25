import { CableConnectionEntity } from '../connections/connection.models';
import {
  BenchComponentObject,
  InspectableHardwareObject,
} from '../models/hardware.models';
import { TechnicalDossier } from './technical-info.models';

interface DidacticEnrichment {
  readonly whatIsIt: string;
  readonly beginnerFunction: string;
  readonly howItWorks: string;
  readonly whyItExists: string;
  readonly installationGuide: string;
  readonly whatHappensIfWrong: string;
}

/**
 * Camada pedagógica aprofundada (6 perguntas fundamentais de engenharia)
 * indexada por ID de peça, região ou conexão.
 */
const DIDACTIC_ENRICHMENTS: Readonly<Record<string, DidacticEnrichment>> = {
  'component-ram-ddr3': {
    whatIsIt:
      'É a memória de trabalho ultrarrápida do computador, construída com chips DRAM sobre um módulo de 240 pinos.',
    beginnerFunction:
      'Guarda temporariamente o sistema operacional, o navegador e os programas abertos para que o processador acesse tudo instantaneamente.',
    howItWorks:
      'Cada bit é armazenado em um micro-capacitor + transistor (célula DRAM) que precisa ser recarregado (refresh) milhares de vezes por segundo. No padrão DDR3, transfere dados duas vezes por ciclo de clock (Double Data Rate) a 1.5V.',
    whyItExists:
      'Discos rígidos (HD) são milhares de vezes mais lentos que o processador. A RAM atua como bancada de trabalho intermediária para evitar que a CPU fique ociosa esperando dados do disco.',
    installationGuide:
      'Abra as duas travas laterais do slot DIMM 1 ou DIMM 2, alinhe o chanfro do módulo com a divisória do slot e pressione firmemente nas duas pontas até ouvir o clique das travas.',
    whatHappensIfWrong:
      'Se ficar mal encaixada (SEATED_LOOSE), oxidada ou incompatível, o computador liga as ventoinhas mas não exibe imagem e trava no estágio DRAM do POST (3 beeps longos).',
  },
  'component-cpu-lga775': {
    whatIsIt:
      'É o "cérebro" eletrônico do computador: um circuito integrado com centenas de milhões de transistores protegidos por uma tampa metálica (IHS).',
    beginnerFunction:
      'Executa cálculos, interpreta comandos do sistema operacional e coordena todas as tarefas dos programas.',
    howItWorks:
      'Busca instruções na memória RAM (Fetch), decodifica (Decode), executa operações na ULA (Execute) e escreve resultados em registradores internos a bilhões de ciclos por segundo (3.0 GHz), comunicando-se com o Northbridge G41 pelo barramento FSB.',
    whyItExists:
      'É o componente programável central que transforma código binário em processamento real de aplicações.',
    installationGuide:
      'Levante a alavanca e a tampa metálica do socket LGA775, alinhe o triângulo dourado (pino 1) e os entalhes laterais sem pressionar os pinos, feche a tampa e trave a alavanca.',
    whatHappensIfWrong:
      'Pinos tortos, falta de alimentação CPU 4P ou ausência de cooler impedem o POST (sem vídeo) ou causam desligamento térmico de emergência em poucos segundos.',
  },
  'component-cooler-lga775': {
    whatIsIt:
      'É o sistema de refrigeração ativa da CPU, combinando bloco dissipador metálico (alumínio/cobre) com ventoinha controlada por PWM.',
    beginnerFunction:
      'Retira o calor intenso produzido pelo processador para mantê-lo operando em temperatura segura.',
    howItWorks:
      'O calor flui por condução do IHS da CPU através da pasta térmica para a base do dissipador, espalha-se pelas aletas aumentando a área de contato e é removido por convecção forçada pela ventoinha de 12V.',
    whyItExists:
      'Um processador de 65W concentra muito calor em poucos centímetros quadrados; sem dissipação ativa, atinge >100 °C em segundos.',
    installationGuide:
      'Após instalar a CPU e aplicar pasta térmica, alinhe os 4 pinos push-pin aos furos 72×72 mm da placa-mãe, pressione em padrão cruzado (X) até travar e conecte o cabo em CPU_FAN.',
    whatHappensIfWrong:
      'Cooler solto ou ventoinha desconectada gera superaquecimento severo, queda drástica de desempenho (thermal throttling) e desligamento abrupto.',
  },
  'component-thermal-paste': {
    whatIsIt:
      'É uma pasta viscosa de alta condutividade térmica usada em camada finíssima entre a CPU e o cooler.',
    beginnerFunction:
      'Ajuda o calor do processador a passar com eficiência para o cooler.',
    howItWorks:
      'Mesmo superfícies metálicas polidas possuem micro-irregularidades que retêm ar (péssimo condutor térmico: ~0.026 W/m·K). A pasta térmica (~6.5 W/m·K) expulsa o ar e reduz a resistência térmica da junção.',
    whyItExists:
      'Sem interface térmica, o contato metal-metal real ocorre em menos de 30% da área, elevando a temperatura da CPU em dezenas de graus.',
    installationGuide:
      'Com a CPU já travada no socket, aplique uma pequena gota (tamanho de um grão de ervilha) no centro do IHS. A própria pressão do cooler espalhará a camada uniformemente.',
    whatHappensIfWrong:
      'Falta de pasta causa superaquecimento sob carga; excesso de pasta condutiva pode escorrer para os contatos do socket e provocar curto ou falha de contato.',
  },
  'component-gpu-pcie': {
    whatIsIt:
      'É um processador gráfico dedicado com memória própria (VRAM) montado em uma placa de expansão PCI Express x16.',
    beginnerFunction:
      'Desenha imagens, vídeos, interfaces 3D e jogos na tela do monitor com muito mais velocidade que o vídeo integrado.',
    howItWorks:
      'Possui centenas de núcleos paralelos especializados em geometria, shaders e texturas, recebendo comandos da CPU via 16 lanes PCIe e convertendo o framebuffer em sinal de vídeo digital/analógico.',
    whyItExists:
      'CPUs são otimizadas para poucas tarefas sequenciais complexas; gráficos 3D exigem milhões de cálculos paralelos simultâneos por segundo.',
    installationGuide:
      'Alinhe a borda dourada PCIe x16 ao slot da placa-mãe, pressione firmemente até a trava traseira fechar e conecte o cabo auxiliar PCIe 6 pinos da fonte.',
    whatHappensIfWrong:
      'Sem o cabo PCIe 6P, a placa não inicializa (tela preta no estágio VGA). Conectar o cabo do monitor na placa-mãe em vez da GPU também deixa a tela sem sinal.',
  },
  'component-hdd-samsung': {
    whatIsIt:
      'É uma unidade de armazenamento magnético permanente de 3.5 polegadas com pratos giratórios (7200 RPM) e cabeças de leitura/escrita.',
    beginnerFunction:
      'Guarda o sistema operacional, documentos, fotos e programas mesmo quando o computador é desligado da tomada.',
    howItWorks:
      'Um motor de +12V gira discos revestidos de material ferromagnético a 7200 RPM enquanto um braço atuador posiciona cabeças magnéticas a nanômetros da superfície para ler/gravar bits, controlados pela placa lógica de +5V via SATA II.',
    whyItExists:
      'A memória RAM apaga ao desligar a energia; o HD fornece armazenamento não volátil de grande capacidade.',
    installationGuide:
      'Apoie o HD firmemente na bancada (sem curto na placa lógica inferior) e conecte dois cabos: SATA Data (7P) até a placa-mãe e SATA Power (15P) vindo da fonte ATX.',
    whatHappensIfWrong:
      'Esquecer qualquer um dos dois cabos impede o HD de aparecer na BIOS (erro de BOOT). Queda na linha +12V ou impactos físicos causam ruído de clique e perda de dados.',
  },
  'component-psu-atx': {
    whatIsIt:
      'É a fonte chaveada que transforma a eletricidade da tomada (110V/220V AC) nas tensões contínuas precisas (+12V, +5V, +3.3V) exigidas pelo PC.',
    beginnerFunction:
      'Fornece energia limpa, regulada e segura para todas as peças do computador funcionarem.',
    howItWorks:
      'Retifica a tensão alternada da rede, chaveia em alta frequência através de transformadores isoladores, filtra o ripple e monitora continuamente corrente/tensão (OCP/OVP/SCP), só liberando o sinal PWR_OK quando todas as linhas estão estáveis.',
    whyItExists:
      'Componentes eletrônicos digitais operam em baixas tensões contínuas (1V a 12V) e seriam destruídos instantaneamente pela corrente alternada da tomada.',
    installationGuide:
      'Mantenha a chave traseira em "O" (desligado), conecte ATX 24P e CPU 4P na placa-mãe, SATA Power no HD e PCIe 6P na GPU. Só ligue o cabo de força AC e a chave "I" ao finalizar.',
    whatHappensIfWrong:
      'Chave traseira desligada impede qualquer sinal de vida; curto-circuito aciona a proteção SCP (liga e desarma em fração de segundo); fonte fraca reinicia sob carga.',
  },
  'component-cable-sata': {
    whatIsIt:
      'É o cabo de comunicação de dados de 7 pinos que liga unidades SATA diretamente à placa-mãe.',
    beginnerFunction:
      'Serve de "estrada de dados" para enviar e receber arquivos entre o HD/SSD e a placa-mãe.',
    howItWorks:
      'Utiliza dois pares diferenciais blindados (TX+/TX− e RX+/RX−) intercalados com 3 pinos de terra (GND) para transmitir dados seriais a até 3 Gbps (SATA II) com imunidade a ruído eletromagnético.',
    whyItExists:
      'Substituiu os antigos cabos flat IDE de 40/80 vias, oferecendo maior velocidade, menor interferência e melhor circulação de ar.',
    installationGuide:
      'Alinhe o formato em "L" do plugue de 7 pinos na porta SATA da placa-mãe e a outra ponta na porta estreita (7P) do HD Samsung até travar.',
    whatHappensIfWrong:
      'Cabo frouxo ou dobrado em ângulo agudo faz o disco desaparecer da BIOS ou gera erros de leitura/CRC e travamentos do sistema operacional.',
  },
  'component-cable-power': {
    whatIsIt:
      'Kit de alimentação contendo o cabo de força AC tripolar (IEC C13) da tomada e o adaptador auxiliar de energia DC (Molex → SATA Power).',
    beginnerFunction:
      'Traz energia da parede para a fonte ATX e adapta conectores de energia para discos quando faltam saídas SATA nativas.',
    howItWorks:
      'O cabo AC conduz Fase, Neutro e Terra até a entrada IEC C14 da fonte; o adaptador DC remapeia os fios Amarelo (+12V), Vermelho (+5V) e Preto (GND) do Molex 4P para o plugue SATA 15P.',
    whyItExists:
      'Padroniza a conexão segura com a rede elétrica aterrada e oferece flexibilidade de cabeamento em fontes antigas ou bancadas de teste.',
    installationGuide:
      'Encaixe o cabo IEC C13 até o fundo na traseira da fonte ATX com a chave em "O". Use adaptadores Molex→SATA apenas se forem crimpados de boa qualidade.',
    whatHappensIfWrong:
      'Cabo AC frouxo causa desligamentos aleatórios e faiscamento; adaptadores Molex→SATA moldados de baixa qualidade podem superaquecer e derreter em curto.',
  },
  'motherboard-atx-24pin': {
    whatIsIt:
      'É o conector principal de 24 pinos que recebe a alimentação primária da fonte ATX na placa-mãe.',
    beginnerFunction:
      'Leva energia da fonte para a placa-mãe e permite que o botão Power ligue o computador.',
    howItWorks:
      'Distribui +12V, +5V, +3.3V e +5VSB para os barramentos da PCB. Quando você aperta o botão Power, a placa aterra o pino PS_ON# (fio verde) para acordar a fonte, que responde com PWR_OK (fio cinza) ao estabilizar as tensões.',
    whyItExists:
      'Centraliza a energia primária e o protocolo de handshake elétrico (PS_ON# / PWR_OK) entre a fonte ATX e a placa-mãe.',
    installationGuide:
      'Alinhe a trava lateral do cabo ATX 24P (ou 20+4 unido) com a lingueta externa do conector na borda direita da PCB e pressione firmemente até travar.',
    whatHappensIfWrong:
      'Se desconectado ou frouxo, a placa-mãe não recebe +5VSB nem completa o sinal PS_ON#, ficando totalmente morta ao pressionar Power.',
  },
};

export function buildDossierForComponent(comp: BenchComponentObject): TechnicalDossier {
  const rich = DIDACTIC_ENRICHMENTS[comp.id];

  return {
    id: comp.id,
    entityType: 'bench-component',
    title: comp.name,
    badgeLabel: comp.categoryLabel,
    subtitle: `${comp.modelCode} · ${comp.id}`,
    accentColor: comp.accentColor,

    whatIsIt: rich?.whatIsIt ?? comp.description,
    whyItExists:
      rich?.whyItExists ??
      'Componente essencial para a operação completa e equilibrada da arquitetura do computador em bancada.',

    beginnerFunction: rich?.beginnerFunction ?? comp.functionSummary,
    howItWorks: rich?.howItWorks ?? comp.description,

    specs: comp.characteristics,
    physicalIdentification: comp.description,

    installationGuide:
      rich?.installationGuide ??
      'Posicione o componente alinhando os chanfros físicos de segurança antes de pressionar até o travamento.',
    precautions: comp.precautions,

    howItConnects: comp.connections.join(' · '),
    connectionLinks: comp.connections,
    connectors: comp.connectors,

    voltages: comp.powerInfo.voltages,
    powerConsumption: comp.powerInfo.consumption,
    powerSource: comp.powerInfo.source,

    compatibilityRules: comp.compatibility,

    whatHappensIfWrong:
      rich?.whatHappensIfWrong ??
      comp.commonProblems[0] ??
      'Falha de montagem ou incompatibilidade impede a conclusão do POST.',
    commonFaults: comp.commonProblems,
  };
}

export function buildDossierForRegion(region: InspectableHardwareObject): TechnicalDossier {
  const rich = DIDACTIC_ENRICHMENTS[region.id];

  return {
    id: region.id,
    entityType: 'motherboard-region',
    title: region.name,
    badgeLabel: `Placa-Mãe · ${region.shortLabel}`,
    subtitle: `${region.type} · ${region.anchorName}`,
    accentColor: region.accentColor,

    whatIsIt: rich?.whatIsIt ?? region.functionSummary,
    whyItExists: rich?.whyItExists ?? region.purpose,

    beginnerFunction: rich?.beginnerFunction ?? region.functionSummary,
    howItWorks: rich?.howItWorks ?? region.purpose,

    specs: region.specs,
    physicalIdentification: region.physicalIdentification,

    installationGuide: rich?.installationGuide ?? region.locationDescription,
    precautions: [
      `Localização na PCWare IPM41-D3: ${region.locationDescription}`,
      'Sempre desligue a fonte ATX na chave traseira antes de conectar ou desconectar qualquer peça nesta região.',
    ],

    howItConnects: `Recebe/conecta: ${region.connectedComponent}`,
    connectionLinks: [`${region.shortLabel} ↔ ${region.connectedComponent}`],
    connectors: [region.physicalIdentification],

    voltages: region.relatedVoltages,
    powerConsumption: 'Conforme componente acoplado e especificação do barramento',
    powerSource: 'Distribuído pela PCB da PCWare IPM41-D3 / Fonte ATX',

    compatibilityRules: [
      `Componente compatível: ${region.connectedComponent}`,
      ...region.specs.slice(0, 2).map((s) => `${s.label}: ${s.value}`),
    ],

    whatHappensIfWrong:
      rich?.whatHappensIfWrong ??
      region.commonConnectionErrors[0] ??
      'Conexão incorreta impede a inicialização ou causa instabilidade elétrica.',
    commonFaults: region.commonConnectionErrors,
  };
}

export function buildDossierForConnection(conn: CableConnectionEntity): TechnicalDossier {
  const kindLabel =
    conn.kind === 'power' ? 'Energia' : conn.kind === 'data' ? 'Dados' : 'Controle';

  return {
    id: conn.id,
    entityType: 'cable-connection',
    title: conn.name,
    badgeLabel: `Conexão · ${kindLabel}`,
    subtitle: `${conn.connectorLabel} · ${conn.id}`,
    accentColor: conn.colorHex,

    whatIsIt: `Ligação física e lógica (${kindLabel}) utilizando o padrão ${conn.connectorLabel} entre ${conn.source.deviceName} e ${conn.target.deviceName}.`,
    whyItExists:
      conn.kind === 'power'
        ? 'Garante entrega dedicada de corrente contínua regulada com baixa queda de tensão entre a fonte ATX e o subsistema de destino.'
        : conn.kind === 'data'
          ? 'Estabelece um canal serial blindado de alta velocidade entre o dispositivo de armazenamento e o chipset Southbridge.'
          : 'Permite alimentação e telemetria ativa de velocidade (RPM/PWM) em tempo real pela placa-mãe.',

    beginnerFunction: conn.functionSummary,
    howItWorks: `Opera em fluxo ${conn.source.deviceName} (${conn.source.portLabel}) → ${conn.target.deviceName} (${conn.target.portLabel}), transportando: ${conn.voltagesOrSignals.join(', ')}.`,

    specs: [
      { label: 'Origem', value: `${conn.source.deviceName} (${conn.source.portLabel})` },
      { label: 'Destino', value: `${conn.target.deviceName} (${conn.target.portLabel})` },
      { label: 'Tipo', value: kindLabel },
      { label: 'Conector', value: conn.connectorLabel },
      { label: 'Obrigatório p/ Boot', value: conn.requiredForBoot ? 'Sim' : 'Condicional' },
    ],
    physicalIdentification: `Cabo chaveado padrão ${conn.connectorLabel} com plugues polarizados anti-inversão.`,

    installationGuide: `Conecte a origem em ${conn.source.deviceName} (${conn.source.portLabel}) e encaixe firmemente o destino em ${conn.target.deviceName} (${conn.target.portLabel}) até a trava fechar.`,
    precautions: [
      'Nunca force um conector que não alinha naturalmente com o chaveamento plástico.',
      'Desligue a chave traseira da fonte ATX antes de conectar ou desconectar cabos de energia.',
    ],

    howItConnects: `${conn.source.deviceName} → ${conn.connectorLabel} → ${conn.target.deviceName}`,
    connectionLinks: [
      `Origem: ${conn.source.deviceName} (${conn.source.portId})`,
      `Destino: ${conn.target.deviceName} (${conn.target.portId})`,
    ],
    connectors: [conn.connectorLabel],

    voltages: conn.voltagesOrSignals,
    powerConsumption:
      conn.kind === 'power'
        ? 'Condução ativa de potência conforme demanda da carga conectada'
        : 'Sinal lógico de baixa potência',
    powerSource: conn.source.deviceName,

    compatibilityRules: [conn.compatibilitySummary],

    whatHappensIfWrong: conn.requiredForBoot
      ? 'Se este cabo estiver ausente ou mal encaixado, o sistema falha na sequência de POST ou não reconhece o dispositivo na inicialização.'
      : 'Se ausente com o componente correspondente instalado, gera erro de inicialização (VGA sem vídeo ou CPU Fan Error).',
    commonFaults: [
      'Plugue parcialmente encaixado gerando mal contato elétrico ou falha intermitente.',
      'Tentativa de inversão entre conectores visualmente parecidos (ex.: PCIe 6P vs CPU 4P ou SATA Power vs SATA Data).',
    ],
  };
}
