import { ConnectorAuditEntry, ConnectorDomainClass } from './connection.models';

/**
 * Registro auditado de conectores físicos da bancada PCWare IPM41-D3 (Seção 18).
 * Ensina explicitamente: Conector disponível ≠ Conector necessário.
 * Domínio Headless: zero dependência de Angular ou Three.js.
 */
export const BENCH_CONNECTOR_AUDIT: readonly ConnectorAuditEntry[] = [
  {
    id: 'audit-atx-24p',
    name: 'ATX 24 pinos',
    domainClass: 'power',
    necessity: 'REQUIRED',
    origin: 'Fonte ATX 500W',
    possibleDestination: 'Placa-Mãe (ATX 24P)',
    functionSummary: 'Alimentação principal (+12V, +5V, +3.3V, +5VSB) e sinais PS_ON# / PWR_OK.',
    canRemainUnused: false,
    whyUnusedIsAcceptable: 'Obrigatório: sem este conector a placa-mãe não recebe standby nem liga.',
    dependentComponents: ['Placa-Mãe IPM41-D3', 'Chipset G41/ICH7', 'RAM DDR3'],
    commonErrors: ['Bloco +4 desalinhado', 'Trava frouxa sem clique'],
  },
  {
    id: 'audit-cpu-4p',
    name: 'CPU Power (ATX12V 4 pinos)',
    domainClass: 'power',
    necessity: 'REQUIRED',
    origin: 'Fonte ATX 500W (metade do cabo 4+4)',
    possibleDestination: 'Placa-Mãe (CPU POWER 4P)',
    functionSummary: 'Entrega +12V dedicado ao VRM que gera Vcore para o processador LGA775.',
    canRemainUnused: false,
    whyUnusedIsAcceptable: 'Obrigatório: sem ele as ventoinhas giram mas não há vídeo nem beeps.',
    dependentComponents: ['VRM da Placa-Mãe', 'CPU LGA775'],
    commonErrors: ['Esquecer desconectado', 'Tentar forçar cabo PCIe 6+2P (polaridade invertida)'],
  },
  {
    id: 'audit-sata-power',
    name: 'SATA Power Nativo (15 pinos)',
    domainClass: 'power',
    necessity: 'REQUIRED',
    origin: 'Fonte ATX 500W',
    possibleDestination: 'HD Samsung 3.5" (SATA Power)',
    functionSummary: 'Alimenta o motor (+12V) e a placa lógica (+5V) do HD Samsung.',
    canRemainUnused: false,
    whyUnusedIsAcceptable: 'Obrigatório para o HD principal; conectores SATA Power extras do chicote permanecem livres normalmente.',
    dependentComponents: ['HD Samsung 500 GB'],
    commonErrors: ['Conectar só SATA Data e esquecer SATA Power'],
  },
  {
    id: 'audit-molex-4p',
    name: 'Molex 4 pinos (Periféricos)',
    domainClass: 'power',
    necessity: 'OPTIONAL_UNUSED',
    origin: 'Fonte ATX 500W',
    possibleDestination: 'Drives IDE legados / Fans Molex',
    functionSummary: 'Fornece +12V e +5V para periféricos legados.',
    canRemainUnused: true,
    whyUnusedIsAcceptable:
      'Normal ficar sem uso: o SSD e o HD já utilizam os conectores nativos de 15 pinos da fonte ATX.',
    dependentComponents: ['Nenhum componente obrigatório nesta bancada'],
    commonErrors: ['Pinos soltos saindo do conector plástico ao forçar encaixe'],
  },
  {
    id: 'audit-pcie-6p',
    name: 'PCIe 6 pinos Auxiliar',
    domainClass: 'power',
    necessity: 'CONDITIONAL',
    origin: 'Fonte ATX 500W (cabo 6+2)',
    possibleDestination: 'Placa de Vídeo Dedicada (GPU)',
    functionSummary: 'Fornece até 75 W adicionais em +12V além dos 75 W do slot PCIe x16.',
    canRemainUnused: true,
    whyUnusedIsAcceptable:
      'Fica sem uso apenas se a bancada operar com vídeo integrado (Intel GMA X4500) ou GPU ≤75 W sem entrada auxiliar.',
    dependentComponents: ['Placa de Vídeo Dedicada PCIe x16'],
    commonErrors: ['Esquecer desconectado com GPU instalada (1 beep longo + 3 curtos)'],
  },
  {
    id: 'audit-sata-data-1',
    name: 'SATA Data — Porta 1 (7 pinos)',
    domainClass: 'data',
    necessity: 'REQUIRED',
    origin: 'Southbridge ICH7 (Placa-Mãe)',
    possibleDestination: 'HD Samsung 3.5" (SATA Data 7P)',
    functionSummary: 'Canal serial diferencial de dados (3 Gbps) entre placa-mãe e disco rígido.',
    canRemainUnused: false,
    whyUnusedIsAcceptable: 'Obrigatório para a BIOS detectar o HD Samsung.',
    dependentComponents: ['HD Samsung 500 GB'],
    commonErrors: ['Confundir com SATA Power (15P)', 'Cabo frouxo sem trava'],
  },
  {
    id: 'audit-sata-data-extra',
    name: 'SATA Data — Portas 2, 3 e 4',
    domainClass: 'data',
    necessity: 'OPTIONAL_UNUSED',
    origin: 'Southbridge ICH7 (Placa-Mãe)',
    possibleDestination: 'SSDs/HDs adicionais ou Drive DVD-RW',
    functionSummary: 'Portas SATA extras para expansão de armazenamento futuro.',
    canRemainUnused: true,
    whyUnusedIsAcceptable:
      'Normal ficarem livres: com apenas 1 HD na bancada, as outras 3 portas permanecem disponíveis para upgrades.',
    dependentComponents: ['Nenhum disco secundário instalado'],
    commonErrors: ['Achar que portas SATA vazias indicam falta de cabo'],
  },
  {
    id: 'audit-dimm-2',
    name: 'Slot DIMM 2 (DDR3 — Canal B)',
    domainClass: 'expansion',
    necessity: 'CONDITIONAL',
    origin: 'Northbridge Intel G41',
    possibleDestination: 'Segundo módulo DDR3 (Dual-Channel)',
    functionSummary: 'Segundo slot de memória que habilita Dual-Channel e expansão até 8 GB.',
    canRemainUnused: true,
    whyUnusedIsAcceptable:
      'Pode permanecer livre quando apenas 1 módulo DDR3 está instalado no DIMM 1 (opera em Single-Channel normalmente).',
    dependentComponents: ['Segundo módulo DDR3 (opcional)'],
    commonErrors: ['Forçar memória DDR2'],
  },
  {
    id: 'audit-pci-legacy',
    name: 'Slots PCI Legados 32-bit (2×) & PCIe x1',
    domainClass: 'expansion',
    necessity: 'OPTIONAL_UNUSED',
    origin: 'Southbridge ICH7',
    possibleDestination: 'Placas de rede, som, captura ou placa POST Card',
    functionSummary: 'Slots de expansão periférica opcionais.',
    canRemainUnused: true,
    whyUnusedIsAcceptable:
      'Normal ficarem vazios: a PCWare IPM41-D3 já possui áudio e rede integrados na placa-mãe.',
    dependentComponents: ['Nenhuma placa PCI instalada'],
    commonErrors: ['Tentar encaixar GPU PCIe em slot PCI legado 32-bit'],
  },
  {
    id: 'audit-cpu-fan',
    name: 'CPU_FAN (4 pinos PWM)',
    domainClass: 'cooling',
    necessity: 'REQUIRED',
    origin: 'Placa-Mãe IPM41-D3',
    possibleDestination: 'Ventoinha do CPU Cooler',
    functionSummary: 'Alimenta (+12V), lê RPM e controla rotação PWM do cooler da CPU.',
    canRemainUnused: false,
    whyUnusedIsAcceptable: 'Obrigatório para refrigeração ativa da CPU e monitoramento na BIOS.',
    dependentComponents: ['CPU Cooler LGA775'],
    commonErrors: ['Ligar cooler em SYS_FAN deixando CPU_FAN vazio'],
  },
  {
    id: 'audit-sys-fan',
    name: 'SYS_FAN (3 pinos DC)',
    domainClass: 'cooling',
    necessity: 'OPTIONAL_UNUSED',
    origin: 'Placa-Mãe IPM41-D3',
    possibleDestination: 'Ventoinha auxiliar de gabinete',
    functionSummary: 'Alimenta ventoinha de exaustão/admissão em gabinetes fechados.',
    canRemainUnused: true,
    whyUnusedIsAcceptable:
      'Normal ficar sem uso em bancada aberta (TechBench), onde há circulação livre de ar ao redor dos componentes.',
    dependentComponents: ['Ventoinha de gabinete (ausente na bancada aberta)'],
    commonErrors: ['Confundir SYS_FAN com CPU_FAN'],
  },
];

export function getConnectorsByDomainClass(
  domainClass: ConnectorDomainClass
): readonly ConnectorAuditEntry[] {
  return BENCH_CONNECTOR_AUDIT.filter((entry) => entry.domainClass === domainClass);
}

export function getUnusedAllowedConnectors(): readonly ConnectorAuditEntry[] {
  return BENCH_CONNECTOR_AUDIT.filter((entry) => entry.canRemainUnused);
}
