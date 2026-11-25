import { HardwareRegionType, InspectableHardwareObject } from '../models/hardware.models';

export const TECHBENCH_MOTHERBOARD_ID = 'motherboard-ipm41-d3';

/**
 * Catálogo técnico da placa-mãe PCWare IPM41-D3 (Micro-ATX, LGA775, Chipset Intel G41 + ICH7, DDR3).
 * Dimensões métricas reais (1 unidade = 1 metro): PCB 0.244m x 0.195m.
 * Domínio Headless: zero dependência de Angular ou Three.js.
 */
export const TECHBENCH_INSPECTABLE_OBJECTS: readonly InspectableHardwareObject[] = [
  {
    entityKind: 'motherboard-region',
    id: TECHBENCH_MOTHERBOARD_ID,
    type: 'motherboard',
    name: 'PCWare IPM41-D3 (Micro-ATX)',
    shortLabel: 'PCB IPM41-D3',
    category: 'MOTHERBOARD',
    anchorName: 'ANCHOR_BENCH_MB_01',
    accentColor: '#38bdf8',
    cameraFocus: {
      position: [0.28, 0.28, 0.3],
      target: [0, 0.024, 0],
    },
    specs: [
      { label: 'Modelo', value: 'PCWare IPM41-D3' },
      { label: 'Formato', value: 'Micro-ATX (244 × 195 mm)' },
      { label: 'Socket', value: 'Intel LGA775' },
      { label: 'Chipset', value: 'Intel G41 (Northbridge) + ICH7 (Southbridge)' },
      { label: 'Memória', value: '2× DDR3 até 8 GB (Dual-Channel)' },
    ],
    functionSummary:
      'Placa de circuito impresso principal (PCB multicamada) que interconecta e distribui energia e dados entre todos os subsistemas do computador.',
    locationDescription:
      'Montada horizontalmente sobre os espaçadores (standoffs) de latão da bancada aberta TechBench.',
    purpose:
      'Fornecer suporte mecânico, trilhas de barramento (FSB, DDR3, PCIe, PCI, SATA) e distribuição elétrica regulada para CPU, memória, vídeo e armazenamento.',
    relatedVoltages: ['+12V', '+5V', '+3.3V', '+5VSB', 'Vcore (~1.1V–1.35V)', '1.5V DDR3'],
    connectedComponent:
      'CPU LGA775, 2× DDR3, placa de vídeo PCIe x16, placas PCI, discos SATA, fonte ATX e ventoinhas.',
    physicalIdentification:
      'PCB retangular compacta em azul escuro (formato Micro-ATX), com 6 pontos de fixação, painel traseiro metálico à esquerda, 2 slots DIMM à direita e 2 slots PCI brancos na parte inferior.',
    commonConnectionErrors: [
      'Montar a PCB sem espaçadores (standoffs) ou com espaçador sobrando embaixo da placa, causando curto-circuito na trilha de 12V/5V.',
      'Esquecer de conectar o ATX 24P ou o CPU Power 4P, impedindo a placa de inicializar o POST.',
      'Confundir a plataforma DDR3 com módulos DDR2 (o chanfro físico é diferente).',
    ],
  },
  {
    entityKind: 'motherboard-region',
    id: 'motherboard-cpu-socket',
    type: 'cpu-socket',
    name: 'CPU Socket (LGA775)',
    shortLabel: 'CPU SOCKET',
    category: 'CPU',
    anchorName: 'ANCHOR_SLOT_CPU_01',
    accentColor: '#f59e0b',
    cameraFocus: {
      position: [0.02, 0.16, 0.12],
      target: [-0.012, 0.028, -0.032],
    },
    specs: [
      { label: 'Socket', value: 'LGA775 (Socket T)' },
      { label: 'Contatos', value: '775 pinos na placa-mãe' },
      { label: 'Barramento', value: 'FSB 800 / 1066 / 1333 MHz' },
      { label: 'CPUs Suportadas', value: 'Core 2 Quad / Core 2 Duo / Pentium / Celeron' },
    ],
    functionSummary:
      'Interface eletromecânica de alta densidade que conecta o processador ao VRM e ao barramento FSB (ligado ao Northbridge G41).',
    locationDescription:
      'Quadrante superior centro-esquerdo da PCB, cercado pelos 4 furos de fixação do cooler e pelos capacitores/bobinas do VRM.',
    purpose:
      'Garantir contato elétrico preciso dos 775 contatos de dados e alimentação Vcore com pressão uniforme exercida pela moldura metálica de retenção.',
    relatedVoltages: ['Vcore (0.85V–1.36V)', 'VTT / FSB (1.1V–1.2V)', 'GND'],
    connectedComponent: 'Processador Intel LGA775 (Core 2 Duo, Core 2 Quad, Pentium Dual-Core).',
    physicalIdentification:
      'Quadrado metálico com tampa basculante articulada, alavanca lateral de trava em aço, 775 micro-pinos dourados inclinados e dois entalhes laterais de alinhamento.',
    commonConnectionErrors: [
      'Instalar o processador rotacionado fora do triângulo dourado do pino 1, amassando pinos do socket.',
      'Tocar nos pinos LGA775 com os dedos ou deixar cair o processador sobre a matriz de pinos.',
      'Ligar a bancada sem cooler montado ou sem pasta térmica sobre o IHS da CPU.',
    ],
  },
  {
    entityKind: 'motherboard-region',
    id: 'motherboard-dimm-1',
    type: 'memory-slot',
    name: 'Slot DIMM 1 (DDR3 — Canal A)',
    shortLabel: 'DIMM 1',
    category: 'RAM',
    anchorName: 'ANCHOR_SLOT_DIMM_1',
    accentColor: '#a855f7',
    cameraFocus: {
      position: [0.16, 0.15, 0.08],
      target: [0.068, 0.03, -0.022],
    },
    specs: [
      { label: 'Padrão', value: 'DDR3 (240 pinos)' },
      { label: 'Canal', value: 'Canal A (Slot Primário)' },
      { label: 'Capacidade', value: 'Até 4 GB por slot' },
      { label: 'Frequência', value: '800 / 1066 / 1333(OC) MHz' },
    ],
    functionSummary:
      'Primeiro conector de memória RAM volátil principal da placa-mãe, ligado ao controlador de memória no Northbridge Intel G41.',
    locationDescription:
      'Lado direito da placa-mãe, paralelo ao conector ATX 24 pinos (slot interno mais próximo do Socket CPU).',
    purpose:
      'Acoplar o módulo DDR3 principal de alta velocidade onde o sistema operacional e programas em execução são carregados.',
    relatedVoltages: ['+1.5V VDD (DDR3)', '+0.75V VTT (Terminação)', '+3.3V SPD'],
    connectedComponent: 'Módulo de Memória RAM DDR3 Desktop (UDIMM 240 pinos).',
    physicalIdentification:
      'Conector vertical longo (~133 mm) com trava plástica nas duas extremidades e chanfro interno deslocado (chaveamento DDR3).',
    commonConnectionErrors: [
      'Encaixe parcial (apenas uma trava fechada), gerando estado SEATED_LOOSE: liga sem vídeo e dispara beeps de memória.',
      'Tentar forçar memória DDR2 (240 pinos, mas chanfro em posição diferente e tensão de 1.8V).',
      'Instalar módulo DDR3 de alta densidade incompatível com o limite de organização de chips do chipset G41.',
    ],
  },
  {
    entityKind: 'motherboard-region',
    id: 'motherboard-dimm-2',
    type: 'memory-slot',
    name: 'Slot DIMM 2 (DDR3 — Canal B)',
    shortLabel: 'DIMM 2',
    category: 'RAM',
    anchorName: 'ANCHOR_SLOT_DIMM_2',
    accentColor: '#c084fc',
    cameraFocus: {
      position: [0.18, 0.15, 0.08],
      target: [0.08, 0.03, -0.022],
    },
    specs: [
      { label: 'Padrão', value: 'DDR3 (240 pinos)' },
      { label: 'Canal', value: 'Canal B (Habilita Dual-Channel)' },
      { label: 'Capacidade', value: 'Até 4 GB por slot (Total 8 GB)' },
      { label: 'Frequência', value: '800 / 1066 / 1333(OC) MHz' },
    ],
    functionSummary:
      'Segundo conector de memória RAM DDR3 que, quando populado junto com DIMM 1, ativa o modo Dual-Channel (128-bit).',
    locationDescription:
      'Lado direito da placa-mãe, imediatamente ao lado do DIMM 1 e adjacente ao conector ATX 24 pinos.',
    purpose:
      'Expandir a capacidade total de memória até 8 GB e dobrar a largura de banda efetiva de memória em conjunto com o DIMM 1.',
    relatedVoltages: ['+1.5V VDD (DDR3)', '+0.75V VTT (Terminação)', '+3.3V SPD'],
    connectedComponent: 'Segundo módulo de Memória RAM DDR3 Desktop (preferencialmente par idêntico ao DIMM 1).',
    physicalIdentification:
      'Conector longo idêntico ao DIMM 1, posicionado na faixa externa antes da borda do ATX 24 pinos, com travas brancas nas pontas.',
    commonConnectionErrors: [
      'Pressionar o módulo sem abrir previamente as travas laterais.',
      'Misturar módulos com densidades/latências muito divergentes causando instabilidade no POST.',
      'Contatos oxidados no módulo causando tela preta sem sinal de vídeo.',
    ],
  },
  {
    entityKind: 'motherboard-region',
    id: 'motherboard-pcie-x16',
    type: 'expansion-slot',
    name: 'Slot PCIe x16',
    shortLabel: 'PCIe x16',
    category: 'GPU',
    anchorName: 'ANCHOR_SLOT_PCIE_X16',
    accentColor: '#22c55e',
    cameraFocus: {
      position: [-0.02, 0.14, 0.16],
      target: [-0.042, 0.028, 0.026],
    },
    specs: [
      { label: 'Interface', value: 'PCI Express x16 (16 lanes)' },
      { label: 'Origem', value: 'Northbridge Intel G41' },
      { label: 'Potência do Slot', value: 'Até 75 W (12V + 3.3V)' },
      { label: 'Comprimento', value: '89 mm (164 contatos)' },
    ],
    functionSummary:
      'Barramento serial de alta velocidade dedicado principalmente à instalação de placas de vídeo (GPU) dedicadas.',
    locationDescription:
      'Região centro-inferior esquerda da PCB, logo abaixo do dissipador do Northbridge G41 e acima dos slots PCI brancos.',
    purpose:
      'Permitir comunicação direta de alta largura de banda entre a GPU dedicada e o Northbridge/CPU, substituindo o vídeo integrado GMA X4500.',
    relatedVoltages: ['+12V (até 5.5A / 66W)', '+3.3V (até 3A / 10W)', '+3.3Vaux'],
    connectedComponent: 'Placa de Vídeo dedicada (GPU PCIe x16).',
    physicalIdentification:
      'Slot horizontal azul/escuro de 89 mm com divisória curta próxima ao painel traseiro e trava plástica de retenção na extremidade direita.',
    commonConnectionErrors: [
      'Puxar a GPU para remoção sem destravar a presilha traseira do slot, danificando a trava ou arrancando o conector.',
      'Instalar GPU com TDP > 75W esquecendo o cabo auxiliar PCIe 6/8 pinos da fonte.',
      'Encaixe torto no espelho traseiro deixando parte dos pinos fora de contato.',
    ],
  },
  {
    entityKind: 'motherboard-region',
    id: 'motherboard-pci',
    type: 'expansion-slot',
    name: 'Slots PCI (Barramento Legado 32-bit)',
    shortLabel: 'PCI',
    category: 'MOTHERBOARD',
    anchorName: 'ANCHOR_SLOT_PCI_01',
    accentColor: '#e2e8f0',
    cameraFocus: {
      position: [-0.03, 0.14, 0.19],
      target: [-0.042, 0.028, 0.066],
    },
    specs: [
      { label: 'Padrão', value: 'PCI 2.3 (32-bit / 33 MHz)' },
      { label: 'Quantidade', value: '2× Slots PCI paralelos' },
      { label: 'Controlador', value: 'Southbridge Intel ICH7' },
      { label: 'Largura de Banda', value: '133 MB/s compartilhados' },
    ],
    functionSummary:
      'Barramento de expansão paralelo legado para placas periféricas de baixa/média largura de banda.',
    locationDescription:
      'Parte inferior esquerda da PCB, abaixo do slot PCIe x16 (dois conectores brancos paralelos).',
    purpose:
      'Conectar placas de rede PCI, placas de som dedicadas, placas de captura, controladoras seriais/paralelas ou placas POST de diagnóstico.',
    relatedVoltages: ['+5V', '+3.3V', '+12V', '-12V', '+3.3Vaux'],
    connectedComponent: 'Placas de expansão PCI 32-bit (Rede, Som, Placa Diagnóstica POST Card).',
    physicalIdentification:
      'Dois conectores longos de cor branca (85 mm), sem trava traseira de GPU, com chanfro único deslocado próximo à extremidade direita.',
    commonConnectionErrors: [
      'Tentar encaixar uma placa PCI Express em um slot PCI legado (protocolos e pinagens completamente incompatíveis).',
      'Inserir placa PCI parcialmente desalinhada provocando curto entre linhas de +5V e +3.3V.',
    ],
  },
  {
    entityKind: 'motherboard-region',
    id: 'motherboard-sata',
    type: 'storage-connector',
    name: 'Portas SATA II (4× 3 Gbps)',
    shortLabel: 'SATA',
    category: 'STORAGE',
    anchorName: 'ANCHOR_PORT_SATA_01',
    accentColor: '#ef4444',
    cameraFocus: {
      position: [0.16, 0.14, 0.18],
      target: [0.095, 0.028, 0.064],
    },
    specs: [
      { label: 'Interface', value: '4× SATA II (3.0 Gbps)' },
      { label: 'Controlador', value: 'Southbridge Intel ICH7' },
      { label: 'Pinos', value: '7 pinos (sinais diferenciais TX/RX + GND)' },
      { label: 'Chaveamento', value: 'Formato em "L" anti-inversão' },
    ],
    functionSummary:
      'Portas de comunicação serial de dados para unidades de armazenamento (HD, SSD SATA 2.5" e drives ópticos).',
    locationDescription:
      'Quadrante inferior direito da placa-mãe, próximos ao dissipador do Southbridge ICH7.',
    purpose:
      'Transferir dados entre o Southbridge ICH7 e dispositivos de armazenamento com taxa teórica de até 300 MB/s por porta.',
    relatedVoltages: ['Sinal diferencial de dados (~0.25V–0.5V p-p; não alimenta o disco)'],
    connectedComponent: 'Cabo de dados SATA ligado a SSD 2.5" SATA, HD 3.5" ou Drive DVD-RW.',
    physicalIdentification:
      'Bloco de 4 conectores compactos vermelhos/laranjas com guia interna em formato de "L" e parede plástica de proteção.',
    commonConnectionErrors: [
      'Conectar apenas o cabo de dados SATA na placa-mãe e esquecer o cabo de alimentação SATA Power (15 pinos) vindo da fonte.',
      'Forçar o conector invertido contra o chanfro em "L", quebrando a lingueta plástica da porta.',
      'Cabo SATA sem trava metálica frouxo causando erro de detecção de disco (BOOT failure) ou travamentos intermitentes.',
    ],
  },
  {
    entityKind: 'motherboard-region',
    id: 'motherboard-atx-24pin',
    type: 'power-connector',
    name: 'ATX 24 pinos',
    shortLabel: 'ATX 24P',
    category: 'PSU',
    anchorName: 'ANCHOR_PORT_ATX_24PIN',
    accentColor: '#f43f5e',
    cameraFocus: {
      position: [0.22, 0.15, 0.05],
      target: [0.106, 0.032, -0.022],
    },
    specs: [
      { label: 'Pinagem', value: '24 pinos (2 fileiras de 12)' },
      { label: 'Padrão', value: 'ATX12V 2.x (compatível com 20+4)' },
      { label: 'Sinais Críticos', value: 'PS_ON# (Verde) e PWR_OK (Cinza)' },
      { label: 'Obrigatório', value: 'Sim — alimentação principal da placa' },
    ],
    functionSummary:
      'Conector principal de alimentação elétrica e controle de inicialização entre a fonte (PSU) e a placa-mãe.',
    locationDescription:
      'Borda direita da PCB, imediatamente ao lado externo do slot DIMM 2.',
    purpose:
      'Fornecer todas as linhas de tensão primárias para chipset, memórias, barramentos PCI/PCIe, lógica de standby (+5VSB) e receber o sinal de Power Good (PWR_OK) que libera o reset da CPU.',
    relatedVoltages: ['+12V', '+5V', '+3.3V', '-12V', '+5VSB (Standby)', 'PS_ON#', 'PWR_OK'],
    connectedComponent: 'Cabo principal ATX 24 pinos (ou 20+4 pinos) da Fonte de Alimentação (PSU).',
    physicalIdentification:
      'Maior conector de energia da placa-mãe (~52 mm de comprimento), com 24 cavidades quadradas/chanfradas e trava lateral voltada para fora.',
    commonConnectionErrors: [
      'Deixar o bloco destacável de +4 pinos (em cabos 20+4) mal alinhado ou parcialmente elevado.',
      'Não empurrar até ouvir o clique da trava, causando mal contato no pino PS_ON# ou aquecimento dos terminais.',
      'Tentar conectar com a chave traseira da fonte ligada (risco de faísca na linha +5VSB).',
    ],
  },
  {
    entityKind: 'motherboard-region',
    id: 'motherboard-cpu-power',
    type: 'power-connector',
    name: 'CPU Power (ATX12V 4 pinos)',
    shortLabel: 'CPU POWER',
    category: 'PSU',
    anchorName: 'ANCHOR_PORT_CPU_4PIN',
    accentColor: '#fb923c',
    cameraFocus: {
      position: [-0.14, 0.16, -0.02],
      target: [-0.072, 0.032, -0.078],
    },
    specs: [
      { label: 'Pinagem', value: '4 pinos (2× +12V Amarelo + 2× GND Preto)' },
      { label: 'Padrão', value: 'ATX12V P4 (aceita metade de EPS 4+4)' },
      { label: 'Capacidade', value: 'Até ~150 W contínuos em +12V' },
      { label: 'Obrigatório', value: 'Sim — alimenta o VRM da CPU' },
    ],
    functionSummary:
      'Entrada dedicada de +12V que alimenta exclusivamente o circuito regulador de tensão (VRM) do processador.',
    locationDescription:
      'Quadrante superior esquerdo da PCB, entre o painel traseiro I/O, a borda superior e o circuito VRM do socket LGA775.',
    purpose:
      'Entregar alta corrente em +12V diretamente aos MOSFETs do VRM para conversão em Vcore (~1.1V–1.35V), aliviando a corrente sobre o conector ATX 24 pinos.',
    relatedVoltages: ['+12V (2 pinos)', 'GND (2 pinos)'],
    connectedComponent: 'Cabo ATX12V 4 pinos (ou metade de um cabo EPS 4+4 pinos) da Fonte de Alimentação.',
    physicalIdentification:
      'Conector quadrado branco/preto de 2×2 pinos com cavidades chanfradas (2 quadradas e 2 arredondadas) e trava lateral.',
    commonConnectionErrors: [
      'Esquecer de conectar este cabo: sintoma clássico de bancada — ventoinhas giram, mas não há vídeo nem beeps porque a CPU fica sem Vcore.',
      'Tentar forçar um conector PCIe 6+2 pinos (de GPU) no lugar do CPU Power: as polaridades de +12V e GND são invertidas e causam curto-circuito.',
      'Conectar o cabo 4+4 sem separá-lo quando há capacitores próximos bloqueando o espaço.',
    ],
  },
  {
    entityKind: 'motherboard-region',
    id: 'motherboard-fan',
    type: 'fan-header',
    name: 'CPU_FAN (Conector de Ventoinha 4 pinos PWM)',
    shortLabel: 'FAN',
    category: 'CPU_COOLER',
    anchorName: 'ANCHOR_PORT_CPU_FAN',
    accentColor: '#14b8a6',
    cameraFocus: {
      position: [0.06, 0.14, -0.02],
      target: [0.036, 0.03, -0.074],
    },
    specs: [
      { label: 'Pinagem', value: '4 pinos (GND · +12V · SENSE/RPM · PWM)' },
      { label: 'Controle', value: 'Modulação por Largura de Pulso (PWM)' },
      { label: 'Corrente Máx.', value: 'Até 1.0 A (~12 W)' },
      { label: 'Compatibilidade', value: 'Ventoinhas 4 pinos (PWM) e 3 pinos (DC)' },
    ],
    functionSummary:
      'Alimenta, monitora a rotação (RPM) e controla dinamicamente a velocidade da ventoinha do cooler da CPU.',
    locationDescription:
      'Borda superior da placa-mãe, entre o socket LGA775 e o topo dos slots DIMM DDR3.',
    purpose:
      'Garantir refrigeração ativa da CPU ajustando a rotação conforme a temperatura lida pelo sensor térmico e alertar a BIOS em caso de falha de rotação (CPU Fan Error).',
    relatedVoltages: ['+12V (Alimentação)', 'GND', 'Sinal Tacômetro (RPM)', 'Sinal PWM (+5V/+3.3V)'],
    connectedComponent: 'Cabo da ventoinha do CPU Cooler (4 pinos PWM ou 3 pinos).',
    physicalIdentification:
      'Fileira estreita de 4 pinos metálicos verticais com aba plástica guia branca atrás dos pinos 1 a 3 (permite encaixar plugues de 3 pinos deixando o pino PWM livre).',
    commonConnectionErrors: [
      'Conectar o cooler da CPU no conector SYS_FAN e deixar CPU_FAN vazio, gerando alerta "CPU Fan Error" na inicialização.',
      'Forçar o plugue deslocado por 1 pino ignorando a aba plástica guia, correndo risco de inverter +12V/GND.',
      'Deixar o fio da ventoinha solto tocando nas pás do cooler.',
    ],
  },
  {
    entityKind: 'motherboard-region',
    id: 'motherboard-northbridge-g41',
    type: 'chipset',
    name: 'Northbridge Intel G41 (GMCH)',
    shortLabel: 'Northbridge G41',
    category: 'MOTHERBOARD',
    anchorName: 'ANCHOR_SUBSYS_NORTHBRIDGE',
    accentColor: '#0ea5e9',
    cameraFocus: {
      position: [0.02, 0.14, 0.12],
      target: [-0.012, 0.032, 0.008],
    },
    specs: [
      { label: 'Chip', value: 'Intel G41 Express (GMCH)' },
      { label: 'Controladores', value: 'IMC DDR3 + PCIe x16 + GMA X4500' },
      { label: 'Ligação CPU', value: 'Front-Side Bus (FSB)' },
      { label: 'Refrigeração', value: 'Dissipador passivo de alumínio' },
    ],
    functionSummary:
      'Ponte Norte clássica: concentra o controlador de memória DDR3, o barramento PCIe x16 e o vídeo integrado GMA X4500.',
    locationDescription:
      'Centro da placa-mãe, entre o Socket LGA775 e o slot PCIe x16.',
    purpose:
      'Interligar os barramentos de altíssima velocidade (CPU via FSB, RAM DDR3 e GPU PCIe x16) antes de repassar periféricos lentos ao Southbridge ICH7.',
    relatedVoltages: ['+1.1V Core GMCH', '+1.5V Interface DDR3', '+3.3V'],
    connectedComponent: 'Integrado (BGA) à PCB sob dissipador passivo de alumínio.',
    physicalIdentification:
      'Dissipador metálico quadrado com aletas de alumínio posicionado logo abaixo do socket da CPU.',
    commonConnectionErrors: [
      'Dissipador solto (pinos plásticos de pressão quebrados) causando superaquecimento do G41 e travamentos aleatórios.',
      'Confundir a arquitetura LGA775 com CPUs modernas: aqui, falha de leitura de RAM também pode envolver o Northbridge G41.',
    ],
  },
  {
    entityKind: 'motherboard-region',
    id: 'motherboard-southbridge-ich7',
    type: 'chipset',
    name: 'Southbridge Intel ICH7',
    shortLabel: 'Southbridge ICH7',
    category: 'MOTHERBOARD',
    anchorName: 'ANCHOR_SUBSYS_SOUTHBRIDGE',
    accentColor: '#0284c7',
    cameraFocus: {
      position: [0.14, 0.14, 0.16],
      target: [0.048, 0.028, 0.056],
    },
    specs: [
      { label: 'Chip', value: 'Intel 82801GB (ICH7)' },
      { label: 'Controladores', value: '4× SATA II, PCI, USB 2.0, Áudio HD' },
      { label: 'Interconexão', value: 'DMI até o Northbridge G41' },
    ],
    functionSummary:
      'Ponte Sul: gerencia barramentos de entrada/saída (SATA, PCI, USB 2.0, BIOS, áudio e painel frontal).',
    locationDescription:
      'Quadrante inferior direito da PCB, ao lado das portas SATA e dos slots PCI.',
    purpose:
      'Centralizar os periféricos de armazenamento, expansão legada e controle de energia (ACPI / botão Power do painel frontal).',
    relatedVoltages: ['+1.5V Core ICH7', '+3.3V I/O', '+3.3VSB (Standby)'],
    connectedComponent: 'Integrado (BGA) à PCB sob dissipador compacto.',
    physicalIdentification:
      'Dissipador metálico plano e compacto próximo às portas SATA vermelhas.',
    commonConnectionErrors: [
      'Curto em portas USB frontais ligadas incorretamente nos headers F_USB pode aquecer severamente ou danificar o ICH7.',
    ],
  },
  {
    entityKind: 'motherboard-region',
    id: 'motherboard-cmos-battery',
    type: 'cmos-battery',
    name: 'Bateria CMOS (CR2032 3V)',
    shortLabel: 'Bateria CMOS',
    category: 'MOTHERBOARD',
    anchorName: 'ANCHOR_CMOS_BATTERY',
    accentColor: '#cbd5e1',
    cameraFocus: {
      position: [0.08, 0.13, 0.15],
      target: [0.015, 0.028, 0.058],
    },
    specs: [
      { label: 'Modelo', value: 'Célula de Lítio CR2032' },
      { label: 'Tensão Nominal', value: '3.0 V DC (mínimo saudável ~2.8 V)' },
      { label: 'Função', value: 'RTC (Relógio) + memória CMOS da BIOS' },
    ],
    functionSummary:
      'Mantém a data/hora (RTC) e as configurações salvas da BIOS quando o computador está fora da tomada.',
    locationDescription:
      'Região inferior central da PCB, entre os slots PCI e o Southbridge ICH7.',
    purpose:
      'Alimentar continuamente o circuito RTC e a SRAM CMOS dentro do ICH7 mesmo com a fonte desconectada da rede elétrica.',
    relatedVoltages: ['+3.0V DC (VBAT)'],
    connectedComponent: 'Bateria moeda CR2032 encaixada no soquete com mola metálica.',
    physicalIdentification:
      'Disco metálico prateado de 20 mm de diâmetro com sinal "+" visível na face superior dentro de um suporte circular preto.',
    commonConnectionErrors: [
      'Inserir a bateria invertida (polo negativo para cima), zerando a BIOS ou impedindo o circuito RTC de funcionar.',
      'Bateria descarregada (< 2.6V) causando perda de data/hora, erro "CMOS Checksum Bad" ou falha para ligar em algumas placas.',
    ],
  },
];

export function findInspectableObjectById(id: string | null): InspectableHardwareObject | null {
  if (!id) {
    return null;
  }
  return TECHBENCH_INSPECTABLE_OBJECTS.find((item) => item.id === id) ?? null;
}

export function getInspectableObjectsByType(
  type: HardwareRegionType
): readonly InspectableHardwareObject[] {
  return TECHBENCH_INSPECTABLE_OBJECTS.filter((item) => item.type === type);
}
