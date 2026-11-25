export interface PsuConnectorSpec {
  readonly id: string;
  readonly name: string;
  readonly badge: string;
  readonly colorHex: string;
  readonly targetComponent: string;
  readonly voltages: string;
  readonly maxWattage: string;
  readonly pinoutSummary: string;
  readonly physicalDifference: string;
  readonly criticalWarning: string;
}

/**
 * Especificações técnicas oficiais (padrão ATX12V / EPS12V) de cada saída da Fonte ATX.
 * Domínio Headless: zero dependência de Angular ou Three.js.
 */
export const PSU_CONNECTOR_SPECS: readonly PsuConnectorSpec[] = [
  {
    id: 'psu-spec-atx24',
    name: 'ATX 24 Pinos (20+4P)',
    badge: 'Placa-Mãe Principal',
    colorHex: '#f43f5e',
    targetComponent: 'Entrada ATX 24P na borda direita da Placa-Mãe',
    voltages: '+3.3V · +5V · +12V · -12V · +5VSB (Standby)',
    maxWattage: '~300 W+ (circuitos da placa, RAM, chipset e slots)',
    pinoutSummary:
      'Pino 16 (Verde) = PS_ON# (liga a fonte ao aterrar) · Pino 8 (Cinza) = PWR_OK (confirma tensões estáveis) · Pino 9 (Roxo) = +5VSB.',
    physicalDifference:
      'Bloco largo de 24 pinos com trava lateral única e bloco destacável de 4 pinos (20+4).',
    criticalWarning:
      'Sem o ATX 24P conectado, a placa-mãe não recebe +5VSB nem envia PS_ON# — o PC não dá nenhum sinal de vida.',
  },
  {
    id: 'psu-spec-cpu4',
    name: 'CPU Power 4P (ATX12V) / 8P (EPS 4+4)',
    badge: 'VRM do Processador',
    colorHex: '#f59e0b',
    targetComponent: 'Conector ATX12V 4P próximo ao Socket da CPU',
    voltages: 'Apenas +12V e GND (sem +5V nem +3.3V)',
    maxWattage: '4 pinos: até ~155 W · 8 pinos (EPS): até ~336 W',
    pinoutSummary:
      'Pinos 1 e 2 = GND (Preto) · Pinos 3 e 4 = +12V (Amarelo) dedicados ao VRM que converte +12V em Vcore (~1.2V).',
    physicalDifference:
      'Dividido em 4+4 pinos (EPS) ou bloco único de 4 pinos. Chaveamento plástico diferente do PCIe.',
    criticalWarning:
      'NUNCA confundir EPS 8P (CPU 4+4) com PCIe 8P (GPU 6+2): a polaridade (+12V e GND) é COMPLETAMENTE INVERTIDA e causa curto imediato!',
  },
  {
    id: 'psu-spec-pcie6',
    name: 'PCIe 6 Pinos / 6+2 Pinos (VGA)',
    badge: 'Placa de Vídeo (GPU)',
    colorHex: '#22c55e',
    targetComponent: 'Entrada auxiliar na borda da Placa de Vídeo dedicada',
    voltages: 'Apenas +12V e GND (+ 2 pinos Sense/GND no 6+2P)',
    maxWattage: '6 pinos: 75 W · 8 pinos (6+2): 150 W (+ 75 W do slot)',
    pinoutSummary:
      'Pinos 1, 2 e 3 = +12V · Pinos 4, 5 e 6 = GND (no 6+2P, os 2 pinos extras sinalizam suporte a 150 W).',
    physicalDifference:
      'Sempre rotulado como PCI-E ou VGA e dividido em 6+2 (nunca 4+4).',
    criticalWarning:
      'Esquecer o cabo PCIe 6P em GPU dedicada impede a inicialização de vídeo no POST (1 beep longo + 3 curtos).',
  },
  {
    id: 'psu-spec-sata15',
    name: 'Alimentação de Disco 15 Pinos (em "L")',
    badge: 'SSD 2.5" e HD 3.5"',
    colorHex: '#fb923c',
    targetComponent: 'Entrada de energia 15P no SSD (Boot) e no HD (Armaz. Interno)',
    voltages: '+3.3V · +5V (Lógica SSD/HD) · +12V (Motor do HD 3.5")',
    maxWattage: 'Até ~54 W total (1,5 A por grupo de 3 pinos)',
    pinoutSummary:
      'Pinos 1–3: +3.3V (Laranja) · Pinos 4–6 e 10–12: GND (Preto) · Pinos 7–9: +5V (Vermelho) · Pinos 13–15: +12V (Amarelo).',
    physicalDifference:
      'Conector fino e largo de 15 pinos em "L". Diferente do Cabo SATA de dados (7 pinos, estreito, sem energia).',
    criticalWarning:
      'Tanto SSD quanto HD exigem DOIS cabos: este de energia (15P da Fonte) + o Cabo SATA de dados (7P da Placa-Mãe).',
  },
  {
    id: 'psu-spec-molex4',
    name: 'Molex 4 Pinos (Periféricos / Legado)',
    badge: 'Opcional / Livre',
    colorHex: '#94a3b8',
    targetComponent: 'Fans de gabinete, controladoras ou drives legados',
    voltages: '+12V (Pino 1) · 2× GND (Pinos 2 e 3) · +5V (Pino 4)',
    maxWattage: 'Até ~132 W (11 A por pino · sem linha +3.3V)',
    pinoutSummary:
      'Pino 1 = +12V (Amarelo) · Pinos 2 e 3 = GND (Preto) · Pino 4 = +5V (Vermelho).',
    physicalDifference:
      'Bloco plástico grande com 4 pinos cilíndricos e cantos chanfrados na parte superior.',
    criticalWarning:
      'Pode permanecer sem uso normalmente na bancada (conector disponível ≠ conector necessário).',
  },
];
