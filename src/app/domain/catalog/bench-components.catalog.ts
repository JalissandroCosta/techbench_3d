import { BenchComponentObject, BenchComponentType } from '../models/hardware.models';

/**
 * Catálogo técnico dos 9 componentes físicos da bancada TechBench 3D (Sprint 3),
 * compatíveis com a plataforma PCWare IPM41-D3 (LGA775 / DDR3 / PCIe x16 / SATA II / ATX).
 * Domínio Headless: zero dependência de Angular ou Three.js.
 */
export const TECHBENCH_COMPONENTS: readonly BenchComponentObject[] = [
  {
    entityKind: 'bench-component',
    id: 'component-cpu-lga775',
    type: 'cpu',
    name: 'Processador Intel Core 2 Duo E8400 (LGA775)',
    shortLabel: 'CPU LGA775',
    categoryLabel: 'PROCESSADOR (CPU)',
    modelCode: 'Intel Core 2 Duo E8400 · 3.0 GHz',
    category: 'CPU',
    anchorName: 'ANCHOR_BENCH_COMP_CPU',
    accentColor: '#f59e0b',
    cameraFocus: {
      position: [0.22, 0.14, 0.04],
      target: [0.21, 0.022, -0.07],
    },
    description:
      'Unidade central de processamento dual-core de 45 nm em encapsulamento LGA775 com dissipador metálico integrado (IHS).',
    functionSummary:
      'Executar instruções de programas, operações lógicas/aritméticas e coordenar o fluxo de dados com o chipset Northbridge G41 via barramento FSB.',
    characteristics: [
      { label: 'Socket', value: 'LGA775 (775 pads na base)' },
      { label: 'Núcleos / Threads', value: '2 Cores / 2 Threads' },
      { label: 'Clock Base', value: '3.00 GHz (FSB 1333 MHz)' },
      { label: 'Cache L2', value: '6 MB' },
      { label: 'TDP', value: '65 W' },
    ],
    compatibility: [
      'Placas-mãe com socket LGA775 e suporte a FSB 1333 MHz (ex.: PCWare IPM41-D3).',
      'Exige cooler compatível com furação LGA775 e pasta térmica.',
    ],
    connectors: ['775 contatos planos (LGA) na face inferior — sem pinos no processador.'],
    powerInfo: {
      voltages: ['Vcore (0.85V – 1.3625V)', 'VTT / FSB (1.1V – 1.2V)'],
      consumption: 'TDP 65 W (alimentado pelo VRM via CPU Power 4 pinos)',
      source: 'Placa-mãe (VRM alimentado por ATX12V 4P)',
    },
    connections: ['Placa-mãe → CPU SOCKET (LGA775)', 'IHS superior → Pasta Térmica → CPU Cooler'],
    precautions: [
      'Segurar sempre pelas bordas laterais da PCB verde; nunca tocar nos contatos dourados inferiores.',
      'Alinhar o triângulo dourado (pino 1) e os dois entalhes laterais com o socket antes de baixar a trava.',
      'Nunca ligar a placa sem cooler e pasta térmica aplicados.',
    ],
    commonProblems: [
      'Superaquecimento e desligamento térmico rápido por cooler mal encaixado ou falta de pasta térmica.',
      'Ausência de vídeo no POST se o cabo CPU Power 4 pinos estiver desconectado.',
      'Oxidação leve nos pads inferiores ou pinos amassados no socket impedindo reconhecimento de memória/boot.',
    ],
  },
  {
    entityKind: 'bench-component',
    id: 'component-ram-ddr3',
    type: 'ram-ddr3',
    name: 'Memória RAM DDR3 4 GB (1333 MHz)',
    shortLabel: 'Memória DDR3',
    categoryLabel: 'MEMÓRIA RAM',
    modelCode: '4 GB DDR3-1333 UDIMM · PC3-10600',
    category: 'RAM',
    anchorName: 'ANCHOR_BENCH_COMP_RAM',
    accentColor: '#a855f7',
    cameraFocus: {
      position: [0.3, 0.14, 0.06],
      target: [0.29, 0.02, -0.055],
    },
    description:
      'Módulo de memória volátil UDIMM de 240 pinos com 16 chips DRAM (dual-rank, compatível com chipset Intel G41).',
    functionSummary:
      'Armazenar temporariamente dados e instruções utilizados pelo processador com acesso aleatório de baixíssima latência.',
    characteristics: [
      { label: 'Tecnologia', value: 'DDR3 SDRAM' },
      { label: 'Capacidade', value: '4 GB (Dual-Rank 2Rx8)' },
      { label: 'Frequência', value: '1333 MHz (opera a 1066/1333 MHz na IPM41-D3)' },
      { label: 'Pinagem', value: '240 pinos (chanfro deslocado DDR3)' },
    ],
    compatibility: [
      'Slots DIMM DDR3 de 240 pinos (PCWare IPM41-D3: DIMM 1 e DIMM 2, máx. 8 GB).',
      'Incompatível física e eletricamente com DDR2 (1.8V) e DDR4 (1.2V).',
    ],
    connectors: ['Borda de contato dourada 240 pinos com chave física (key notch) DDR3.'],
    powerInfo: {
      voltages: ['+1.5V VDD', '+0.75V VTT', '+3.3V SPD'],
      consumption: '~2 W a 3 W por módulo',
      source: 'Placa-mãe → Slot DIMM',
    },
    connections: ['Placa-mãe → DIMM 1 ou DIMM 2 (par em DIMM 1 + DIMM 2 ativa Dual-Channel)'],
    precautions: [
      'O encaixe físico deve coincidir exatamente com a chave (chanfro) existente no módulo e no slot.',
      'Descarregar eletricidade estática (ESD) antes de manusear e evitar tocar nos contatos dourados.',
      'Pressionar uniformemente nas duas extremidades até as travas laterais fecharem com clique.',
    ],
    commonProblems: [
      'Módulo mal encaixado (SEATED_LOOSE): computador liga ventoinhas mas não dá vídeo e emite beeps de memória.',
      'Contatos oxidados/sujos causando tela preta ou congelamentos.',
      'Módulos DDR3 single-rank de alta densidade (4 GB com apenas 8 chips) podem não dar POST no chipset G41.',
    ],
  },
  {
    entityKind: 'bench-component',
    id: 'component-cooler-lga775',
    type: 'cpu-cooler',
    name: 'CPU Cooler LGA775 (Air Cooler PWM)',
    shortLabel: 'Cooler CPU',
    categoryLabel: 'REFRIGERAÇÃO (COOLER)',
    modelCode: 'Air Cooler Radial Alumínio/Cobre · 4-Pin PWM',
    category: 'CPU_COOLER',
    anchorName: 'ANCHOR_BENCH_COMP_COOLER',
    accentColor: '#06b6d4',
    cameraFocus: {
      position: [0.22, 0.17, 0.14],
      target: [0.215, 0.04, 0.025],
    },
    description:
      'Conjunto dissipador radial de alumínio com núcleo de cobre, 4 travas push-pin LGA775 e ventoinha axial controlada por PWM.',
    functionSummary:
      'Absorver o calor gerado pelo processador por condução térmica e dissipá-lo para o ar através das aletas e da ventoinha.',
    characteristics: [
      { label: 'Fixação', value: '4× Push-Pin LGA775 (72 × 72 mm)' },
      { label: 'Dissipação', value: 'Até 95 W TDP' },
      { label: 'Ventoinha', value: '92 mm · 800–2800 RPM (PWM)' },
      { label: 'Conector', value: '4 pinos PWM (CPU_FAN)' },
    ],
    compatibility: [
      'Sockets Intel LGA775 (furação 72 mm × 72 mm da PCWare IPM41-D3).',
      'Requer aplicação prévia de pasta térmica entre a base metálica e o IHS da CPU.',
    ],
    connectors: ['Plugue 4 pinos PWM fêmea (GND, +12V, SENSE/RPM, PWM).'],
    powerInfo: {
      voltages: ['+12V DC', 'Sinal PWM (+5V/+3.3V)'],
      consumption: '~2 W a 4 W (0.15A – 0.35A)',
      source: 'Placa-mãe → Header CPU_FAN',
    },
    connections: [
      'Base térmica → Pasta Térmica → CPU LGA775',
      'Cabo 4 pinos → Placa-mãe (CPU_FAN)',
    ],
    precautions: [
      'Travar os 4 pinos push-pin em padrão cruzado (X) para distribuir pressão uniforme sobre o socket.',
      'Verificar se nenhum fio está encostando nas pás da ventoinha.',
      'Remover eventual película plástica protetora da base em coolers novos.',
    ],
    commonProblems: [
      'Um ou mais push-pins soltos deixando o dissipador inclinado → temperatura sobe acima de 95 °C em segundos.',
      'Esquecer o cabo no header CPU_FAN → ventoinha parada e alerta "CPU Fan Error".',
      'Acúmulo de poeira entre as aletas reduzindo drasticamente a troca térmica.',
    ],
  },
  {
    entityKind: 'bench-component',
    id: 'component-thermal-paste',
    type: 'thermal-paste',
    name: 'Pasta Térmica (Seringa Aplicadora)',
    shortLabel: 'Pasta Térmica',
    categoryLabel: 'INTERFACE TÉRMICA',
    modelCode: 'Composto Térmico Cinza · 6.5 W/m·K (Não Condutivo)',
    category: 'THERMAL_PASTE',
    anchorName: 'ANCHOR_BENCH_COMP_PASTE',
    accentColor: '#94a3b8',
    cameraFocus: {
      position: [0.32, 0.13, 0.1],
      target: [0.305, 0.02, 0.025],
    },
    description:
      'Composto térmico de alta condutividade térmica e baixa condutividade elétrica acondicionado em seringa dosadora.',
    functionSummary:
      'Preencher micro-imperfeições microscópicas entre o IHS do processador e a base do cooler, eliminando bolsões de ar isolante.',
    characteristics: [
      { label: 'Condutividade', value: '6.5 W/m·K' },
      { label: 'Condutividade Elétrica', value: 'Não condutiva (segura próxima a SMDs)' },
      { label: 'Aplicação', value: 'Pequena gota central (~tamanho de um grão de ervilha)' },
    ],
    compatibility: [
      'Universal para CPUs (IHS metálico) e GPUs (die exposto, usando composto não condutivo).',
    ],
    connectors: ['Interface física direta (sem conector elétrico).'],
    powerInfo: {
      voltages: ['Isolante elétrico (0 V)'],
      consumption: 'Passivo (0 W)',
      source: 'Não se aplica',
    },
    connections: ['Aplicada entre a face superior da CPU (IHS) e a base do CPU Cooler'],
    precautions: [
      'Limpar totalmente resíduos de pasta antiga ressecada com álcool isopropílico antes de reaplicar.',
      'Não exagerar na quantidade para evitar transbordamento sobre a trava do socket ou contatos.',
      'Sempre reaplicar ao remover e recolocar o cooler.',
    ],
    commonProblems: [
      'Ausência de pasta térmica eleva a temperatura em 20 °C a 40 °C, causando thermal throttling ou desligamento.',
      'Pasta ressecada após anos de uso perde condutividade e provoca superaquecimento sob carga.',
      'Uso de pasta metálica condutiva em excesso pode causar curto se escorrer sobre componentes SMD.',
    ],
  },
  {
    entityKind: 'bench-component',
    id: 'component-gpu-pcie',
    type: 'gpu',
    name: 'Placa de Vídeo Dedicada (PCIe x16)',
    shortLabel: 'Placa de Vídeo',
    categoryLabel: 'PLACA DE VÍDEO (GPU)',
    modelCode: 'GPU Dedicada PCIe x16 · 1 GB GDDR5 · 6-Pin Aux',
    category: 'GPU',
    anchorName: 'ANCHOR_BENCH_COMP_GPU',
    accentColor: '#22c55e',
    cameraFocus: {
      position: [0.3, 0.17, 0.24],
      target: [0.27, 0.035, 0.105],
    },
    description:
      'Placa aceleradora gráfica dedicada com GPU, memória VRAM dedicada, dissipador ativo e alimentação auxiliar PCIe 6 pinos.',
    functionSummary:
      'Processar renderização 2D/3D, decodificação de vídeo e gerar o sinal de imagem para o monitor (HDMI/DVI/VGA).',
    characteristics: [
      { label: 'Barramento', value: 'PCI Express x16' },
      { label: 'Memória de Vídeo', value: '1 GB GDDR5' },
      { label: 'Alimentação Auxiliar', value: '1× Conector PCIe 6 pinos' },
      { label: 'TDP Estimado', value: '110 W (75 W slot + até 75 W cabo 6P)' },
    ],
    compatibility: [
      'Slot PCIe x16 da placa-mãe (PCWare IPM41-D3).',
      'Requer fonte ATX com potência adequada e conector PCIe 6 pinos.',
    ],
    connectors: [
      'Conector de borda PCIe x16',
      'Entrada de alimentação auxiliar PCIe 6 pinos',
      'Saídas de vídeo HDMI / DVI / DisplayPort',
    ],
    powerInfo: {
      voltages: ['+12V (Slot PCIe + Cabo Auxiliar 6P)', '+3.3V (Slot PCIe)'],
      consumption: '~15 W idle / ~110 W sob carga',
      source: 'Slot PCIe x16 (até 75 W) + Fonte ATX (PCIe 6P)',
    },
    connections: [
      'Placa-mãe → Slot PCIe x16',
      'Fonte ATX → Conector auxiliar PCIe 6 pinos',
      'Saída de vídeo → Monitor',
    ],
    precautions: [
      'Sempre conectar o cabo do monitor na placa de vídeo dedicada (e não na saída VGA onboard) quando instalada.',
      'Destravar a presilha traseira do slot PCIe x16 antes de retirar a placa.',
      'Usar cabo PCIe nativo da fonte em vez de adaptadores precários sempre que possível.',
    ],
    commonProblems: [
      'Esquecer o cabo auxiliar PCIe 6 pinos → tela preta ou aviso "Please power down and connect the PCIe power cable".',
      'Placa mal encaixada no slot PCIe x16 causando falha no estágio VGA do POST.',
      'Fonte genérica subdimensionada desarmando ao abrir aplicações 3D.',
    ],
  },
  {
    entityKind: 'bench-component',
    id: 'component-hdd-samsung',
    type: 'hdd-sata',
    name: 'HD Samsung SpinPoint 500 GB (SATA II)',
    shortLabel: 'HD Samsung',
    categoryLabel: 'ARMAZENAMENTO (HDD 3.5")',
    modelCode: 'Samsung HD502HJ · 500 GB · 7200 RPM · SATA II',
    category: 'STORAGE',
    anchorName: 'ANCHOR_BENCH_COMP_HDD',
    accentColor: '#3b82f6',
    cameraFocus: {
      position: [0.44, 0.16, 0.14],
      target: [0.395, 0.028, 0.035],
    },
    description:
      'Disco rígido eletromecânico de 3.5 polegadas com pratos magnéticos a 7200 RPM, placa lógica inferior e interface SATA II.',
    functionSummary:
      'Armazenar permanentemente (não volátil) o sistema operacional, aplicativos e arquivos do usuário.',
    characteristics: [
      { label: 'Formato', value: '3.5" Desktop' },
      { label: 'Capacidade', value: '500 GB' },
      { label: 'Rotação', value: '7200 RPM (16 MB Cache)' },
      { label: 'Interface', value: 'SATA II (3.0 Gbps)' },
    ],
    compatibility: [
      'Qualquer porta SATA I/II/III da placa-mãe (PCWare IPM41-D3 possui 4× SATA II).',
      'Requer cabo de Energia HD/SSD (15 pinos) da fonte (+12V para motor e +5V para placa lógica).',
    ],
    connectors: [
      'Cabo SATA (7 pinos em "L" — Dados)',
      'Energia HD/SSD da Fonte (15 pinos em "L")',
    ],
    powerInfo: {
      voltages: ['+12V (motor do spindle e atuador)', '+5V (placa lógica/controladora)'],
      consumption: '~6 W a 9 W em leitura/escrita (pico de ~18 W no spin-up)',
      source: 'Fonte ATX → Cabo de Energia HD/SSD (15 pinos)',
    },
    connections: [
      'Placa-mãe (Porta SATA) ↔ Cabo SATA ↔ HD Samsung',
      'Fonte ATX → Cabo de Energia HD/SSD (15P) → HD Samsung',
    ],
    precautions: [
      'Nunca movimentar ou dar impactos no HD enquanto estiver energizado e com os pratos girando.',
      'Não apoiar a placa lógica (face inferior exposta) diretamente sobre superfícies metálicas condutoras.',
      'Conectar ambos os cabos (Cabo SATA 7P + Energia da Fonte 15P) com alinhamento correto do "L".',
    ],
    commonProblems: [
      'HD não aparece na BIOS porque apenas o Cabo SATA foi conectado (falta energia da fonte) ou vice-versa.',
      'Ruído repetitivo de clique ("click of death") indicando falha mecânica da cabeça de leitura ou queda na linha +12V.',
      'Boot e abertura de programas muito mais lentos (~38 s) em comparação a um SSD 2.5" (~9 s).',
    ],
  },
  {
    entityKind: 'bench-component',
    id: 'component-ssd-sata',
    type: 'hdd-sata',
    name: 'SSD 2.5" 240 GB SATA III (NAND Flash)',
    shortLabel: 'SSD 2.5" SATA',
    categoryLabel: 'ARMAZENAMENTO SÓLIDO (SSD)',
    modelCode: 'SSD 2.5" 240 GB · NAND Flash TLC · SATA III (Compatível SATA II)',
    category: 'STORAGE',
    anchorName: 'ANCHOR_BENCH_COMP_SSD',
    accentColor: '#06b6d4',
    cameraFocus: {
      position: [-0.07, 0.18, 0.33],
      target: [-0.068, 0.012, 0.185],
    },
    description:
      'Unidade de Estado Sólido (Solid State Drive) 2.5" com memória flash NAND sem partes móveis, projetada para boot ultrarrápido do sistema operacional.',
    functionSummary:
      'Armazenar o sistema operacional e aplicativos com latência ~100× menor que um HD mecânico, reduzindo o tempo de boot de ~38 segundos para ~9 segundos mesmo em SATA II.',
    characteristics: [
      { label: 'Formato', value: '2.5" Ultrafino (7 mm, sem partes móveis)' },
      { label: 'Capacidade', value: '240 GB (NAND Flash TLC)' },
      { label: 'Tempo de Acesso', value: '~0,1 ms (vs ~14 ms no HD 7200 RPM)' },
      { label: 'Boot Estimado', value: '~9 segundos (até 4× mais rápido que HD)' },
    ],
    compatibility: [
      'Compatível com qualquer porta SATA II/III da PCWare IPM41-D3 via Cabo SATA.',
      'Usa o mesmo Cabo SATA (7P) e cabo de Energia HD/SSD da Fonte (15P) do HD 3.5".',
    ],
    connectors: [
      'Cabo SATA (7 pinos em "L" — Dados)',
      'Energia HD/SSD da Fonte (15 pinos em "L" — +5V)',
    ],
    powerInfo: {
      voltages: ['+5V (Controladora + Memória NAND Flash)'],
      consumption: '~0,5 W idle / ~2,0 W em gravação (até 4× mais econômico que HD)',
      source: 'Fonte ATX → Cabo de Energia HD/SSD (15 pinos)',
    },
    connections: [
      'Placa-mãe (Porta SATA 2) ↔ Cabo SATA ↔ SSD 2.5"',
      'Fonte ATX → Cabo de Energia HD/SSD (15P) → SSD 2.5"',
    ],
    precautions: [
      'Sempre desligar a bancada (Power OFF) antes de conectar ou desconectar o SSD.',
      'Em PCs com SSD + HD, instalar o Sistema Operacional no SSD e guardar arquivos pesados no HD.',
      'Não desfragmentar SSDs (reduz a vida útil da memória NAND; o SO usa TRIM automaticamente).',
    ],
    commonProblems: [
      'Conectar apenas o Cabo SATA sem a energia da fonte → SSD não é listado na BIOS.',
      'Em placas SATA II (3 Gbps) a taxa sequencial limita-se a ~270 MB/s, mas a latência de 0,1 ms ainda deixa o PC muito mais ágil.',
    ],
  },
  {
    entityKind: 'bench-component',
    id: 'component-psu-atx',
    type: 'psu-atx',
    name: 'Fonte ATX 500W (Chaveada)',
    shortLabel: 'Fonte ATX',
    categoryLabel: 'FONTE DE ALIMENTAÇÃO (PSU)',
    modelCode: 'PSU ATX 500W · PFC Ativo · Padrão ATX12V',
    category: 'PSU',
    anchorName: 'ANCHOR_BENCH_COMP_PSU',
    accentColor: '#ef4444',
    cameraFocus: {
      position: [0.46, 0.2, -0.02],
      target: [0.405, 0.055, -0.085],
    },
    description:
      'Fonte chaveada padrão ATX que converte corrente alternada da rede (110V/220V AC) nas tensões contínuas reguladas do PC.',
    functionSummary:
      'Fornecer energia elétrica estável, filtrada e protegida (OCP/OVP/OPP/SCP) para placa-mãe, CPU, GPU e armazenamento.',
    characteristics: [
      { label: 'Potência Nominal', value: '500 W reais' },
      { label: 'Entrada AC', value: '100–240 V AC (PFC Ativo Full Range)' },
      { label: 'Proteções', value: 'OVP, UVP, OCP, OPP, SCP' },
      { label: 'Refrigeração', value: 'Ventoinha interna 120 mm' },
    ],
    compatibility: [
      'Padrão ATX12V compatível com PCWare IPM41-D3 (ATX 24P + ATX12V 4P).',
      'Fornece chicotes para GPU (PCIe 6+2P) e discos (SATA Power 15P).',
    ],
    connectors: [
      '1× ATX 24 pinos (20+4)',
      '1× CPU Power 4+4 pinos (EPS/ATX12V)',
      '1× PCIe 6+2 pinos (GPU)',
      '4× SATA Power (15 pinos) + 2× Molex 4 pinos',
      '1× Entrada AC IEC C14 + Chave I/O',
    ],
    powerInfo: {
      voltages: ['+12V', '+5V', '+3.3V', '-12V', '+5VSB'],
      consumption: 'Entrega até 500 W contínuos (eficiência ~82%)',
      source: 'Rede elétrica AC (via Cabo de Força IEC C13)',
    },
    connections: [
      'Rede AC → Cabo de Força → Fonte ATX',
      'Fonte ATX → ATX 24P + CPU Power 4P (Placa-mãe)',
      'Fonte ATX → PCIe 6P (GPU) e SATA Power (HD Samsung)',
    ],
    precautions: [
      'Manter a chave traseira em "O" (desligado) durante toda a montagem e conexão de cabos.',
      'Nunca abrir a carcaça da fonte: capacitores primários retêm alta tensão letal mesmo fora da tomada.',
      'Em fontes sem PFC ativo com chave seletora 115V/230V, conferir a tensão da rede antes de ligar.',
    ],
    commonProblems: [
      'Esquecer a chave traseira da fonte desligada ("O") → bancada não dá nenhum sinal de vida.',
      'Proteção contra curto (SCP) desarmando instantaneamente ao pressionar Power.',
      'Fonte genérica com ripple alto causando instabilidade, reinícios sob carga ou falha prematura de HDs.',
    ],
  },
  {
    entityKind: 'bench-component',
    id: 'component-cable-sata',
    type: 'cable-sata',
    name: 'Cabo SATA 1 (HD 3.5")',
    shortLabel: 'Cabo SATA (HD)',
    categoryLabel: 'CABEAMENTO DE DADOS',
    modelCode: 'Cabo SATA 7P Vermelho · Trava Metálica',
    category: 'CABLE',
    anchorName: 'ANCHOR_BENCH_COMP_CABLE_SATA',
    accentColor: '#dc2626',
    cameraFocus: {
      position: [0.43, 0.13, 0.22],
      target: [0.385, 0.02, 0.148],
    },
    description:
      'Cabo flat blindado vermelho de 7 vias com conectores chaveados em "L" nas duas extremidades para transferência serial de dados do HD 3.5".',
    functionSummary:
      'Transportar sinais diferenciais de dados entre a Porta SATA 1 da placa-mãe (ICH7) e o HD Samsung 3.5" (Armazenamento Interno).',
    characteristics: [
      { label: 'Pinagem', value: '7 pinos (3× GND + 2 pares diferenciais TX/RX)' },
      { label: 'Taxa Suportada', value: 'SATA I / II / III (até 6 Gbps)' },
      { label: 'Chaveamento', value: 'Perfil em "L" + trava metálica anti-folga' },
    ],
    compatibility: [
      'Portas SATA da PCWare IPM41-D3 e HD Samsung 3.5" (Armazenamento Interno).',
    ],
    connectors: ['2× Plugues fêmea SATA 7 pinos (ponta reta ou 90°).'],
    powerInfo: {
      voltages: ['Sinal lógico diferencial (~0.25V–0.5V p-p)'],
      consumption: 'Não conduz alimentação para o disco',
      source: 'Controlador SATA (Southbridge ICH7)',
    },
    connections: ['Placa-mãe (Porta SATA 1) ↔ Cabo SATA 1 ↔ HD Samsung 3.5"'],
    precautions: [
      'Pressionar a trava metálica antes de puxar o cabo para não arrancar o conector plástico da placa-mãe.',
      'Evitar dobras bruscas em ângulo agudo que rompem os condutores internos e causam erros CRC.',
    ],
    commonProblems: [
      'Cabo frouxo ou parcialmente desconectado fazendo o HD sumir intermitentemente da BIOS.',
      'Cabo danificado gerando erros de UltraDMA CRC no S.M.A.R.T. e travamentos de leitura.',
    ],
  },
  {
    entityKind: 'bench-component',
    id: 'component-cable-sata-ssd',
    type: 'cable-sata',
    name: 'Cabo SATA 2 (SSD 2.5")',
    shortLabel: 'Cabo SATA (SSD)',
    categoryLabel: 'CABEAMENTO DE DADOS',
    modelCode: 'Cabo SATA 7P Ciano · Trava Metálica (Boot SSD)',
    category: 'CABLE',
    anchorName: 'ANCHOR_BENCH_COMP_CABLE_SATA_SSD',
    accentColor: '#06b6d4',
    cameraFocus: {
      position: [0.35, 0.13, 0.22],
      target: [0.315, 0.02, 0.148],
    },
    description:
      'Segundo cabo flat blindado de 7 vias com conectores em "L", dedicado para ligar o SSD 2.5" (Boot Primário) à placa-mãe.',
    functionSummary:
      'Transportar sinais diferenciais de dados entre a Porta SATA 2 da placa-mãe (ICH7) e o SSD 2.5" 240 GB (Boot Primário do SO).',
    characteristics: [
      { label: 'Pinagem', value: '7 pinos (3× GND + 2 pares diferenciais TX/RX)' },
      { label: 'Taxa Suportada', value: 'SATA I / II / III (até 6 Gbps)' },
      { label: 'Uso na Bancada', value: 'Arraste até a Porta SATA da placa-mãe para conectar o SSD 2.5"' },
    ],
    compatibility: [
      'Portas SATA da PCWare IPM41-D3 e SSD 2.5" 240 GB (Boot Primário).',
    ],
    connectors: ['2× Plugues fêmea SATA 7 pinos com trava metálica.'],
    powerInfo: {
      voltages: ['Sinal lógico diferencial (~0.25V–0.5V p-p)'],
      consumption: 'Não conduz alimentação elétrica (o SSD usa o cabo 15P da fonte)',
      source: 'Controlador SATA (Southbridge ICH7)',
    },
    connections: ['Placa-mãe (Porta SATA 2) ↔ Cabo SATA 2 ↔ SSD 2.5" (Boot Primário)'],
    precautions: [
      'Sempre desligar a bancada (Power OFF) antes de conectar ou remover o Cabo SATA.',
      'Garantir que o SSD também receba o cabo de alimentação 15P da Fonte ATX.',
    ],
    commonProblems: [
      'Conectar apenas o Cabo SATA sem alimentação da fonte → SSD não aparece na BIOS.',
      'Conectar apenas o HD e esquecer o SSD → boot mais lento (~38 s em vez de ~9 s).',
    ],
  },
];

export function findBenchComponentById(id: string | null): BenchComponentObject | null {
  if (!id) {
    return null;
  }
  return TECHBENCH_COMPONENTS.find((item) => item.id === id) ?? null;
}

export function getBenchComponentsByType(
  type: BenchComponentType
): readonly BenchComponentObject[] {
  return TECHBENCH_COMPONENTS.filter((item) => item.type === type);
}
