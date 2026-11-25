# 01 — Visão Geral do Sistema e Escopo (Real vs. Didático)

---

## 1. Visão Geral do Sistema

O **TechBench 3D** é um **simulador interativo 3D de montagem, arquitetura e diagnóstico de hardware** rodando no navegador. Diferente de um catálogo 3D estático, cada peça possui propriedades mecânicas, elétricas, térmicas e lógicas que governam o funcionamento de um computador real em bancada de testes.

### 1.1 Os 3 Pilares do Produto

1. **Montagem Interativa (Build Mode):**
   - Seleção de peças compatíveis (ou incompatíveis, para aprendizado por erro controlado).
   - Encaixe em slots reais com ordem lógica de montagem (ex.: instalar CPU antes do cooler; abrir trava da RAM).
   - Conexão dos cabos essenciais de alimentação (ATX 24-pin, EPS 8-pin, PCIe 6+2 / 12VHPWR).
2. **Arquitetura Visual (Inspect / X-Ray Mode):**
   - Visualização didática da topologia da placa-mãe: barramentos de dados (CPU ↔ RAM, CPU ↔ PCIe x16, CPU/Chipset ↔ M.2) e trilhas de potência (PSU → VRM → CPU / GPU).
   - Inspeção técnica de cada componente (specs reais, pinagem, consumo estimado, estado atual).
3. **Diagnóstico e Troubleshooting (Power-On / Diagnostic Mode):**
   - Botão de Power na bancada que dispara a sequência de **POST** (Power-On Self-Test).
   - Feedback realista: LEDs de diagnóstico na placa-mãe (`CPU`, `DRAM`, `VGA`, `BOOT`), códigos sonoros de beep, rotação de ventoinhas, telemetria térmica/elétrica simplificada e saída de tela simulada (BIOS/POST screen ou "Sem Sinal").
   - Modo Desafio / Cenários de Falha: bancadas pré-montadas com defeitos ocultos (RAM mal encaixada, cabo EPS desconectado, pasta térmica ausente, fonte subdimensionada, módulo defeituoso) para o usuário diagnosticar.

### 1.2 Escopo de Componentes no MVP (v1 — Bancada Aberta)

* **DECISÃO DE PROJETO:** Começar com uma **bancada aberta (Open Test Bench)** contendo 7 categorias de componentes:
  1. `Motherboard` (ATX padrão, 1 modelo Intel LGA1700 ou AMD AM5 + opção DDR4/DDR5 para demonstrar incompatibilidade)
  2. `CPU` (compatível e incompatível para testar validação de socket/chipset)
  3. `CPU Cooler` (Air Cooler torre / Stock Cooler + estado de pasta térmica)
  4. `RAM` (Módulos DDR4 e DDR5, 1 a 4 pentes, validação de canais A2/B2)
  5. `GPU` (Placa de vídeo PCIe x16 com conector auxiliar PCIe 8-pin ou 12VHPWR)
  6. `Storage` (SSD M.2 NVMe 2280)
  7. `PSU` (Fonte modular/semi-modular com cabos ATX 24-pin, EPS 4+4, PCIe 6+2 / 12VHPWR e potência nominal real)

* **FATO TÉCNICO:** Eliminar o gabinete no MVP remove a necessidade imediata de detecção de colisão malha-a-malha (clearance de GPU, altura de cooler, painel frontal, roteamento traseiro complexo), permitindo validar 100% da arquitetura de software e do motor de hardware com risco controlado.

---

## 2. Definição do que Será REAL vs. DIDÁTICO

Uma armadilha clássica em simuladores de hardware é tentar simular física de CAD/SPICE em áreas que não agregam valor pedagógico, ou simplificar demais áreas que destroem o aprendizado real.

* **SUGESTÃO DE ENGENHARIA:** Adotar uma fronteira explícita de fidelidade por subsistema: **alta fidelidade nas regras lógicas/elétricas de engenharia**, **abstração controlada na física contínua**.

| Subsistema | O que será REAL (Alta Fidelidade) | O que será DIDÁTICO (Abstração Controlada) | Fora de Escopo no MVP (v2+) |
| --- | --- | --- | --- |
| **Compatibilidade Mecânica/Lógica** | Socket (LGA1700, AM5), geração de RAM (DDR4 vs DDR5), chaveamento M.2 (NVMe), slot PCIe x16, travas e ordem de montagem (CPU → Pasta → Cooler). | Aviso explicativo claro do *porquê* da incompatibilidade (pinagem, voltagem, chanfro) em vez de apenas travar o encaixe silenciosamente. | Clearance de gabinete, colisão entre dissipador de RAM alto e air cooler gigante, furação mATX/ITX. |
| **Sistema Elétrico & Potência** | Conectores obrigatórios (ATX 24-pin, EPS 8-pin, PCIe auxiliar), cálculo de demanda de potência (TDP + headroom de pico), proteção OPP/OCP simplificada (desarme se demanda > potência da PSU), detecção de cabo errado (ex.: tentar forçar PCIe 8-pin no EPS 8-pin). | Fluxo de energia animado em modo Raio-X (cores por linha: 12V, 5V, 3.3V) e medidor de watts na bancada. | Simulação elétrica SPICE, ripple de tensão, curva de eficiência 80 Plus por faixa de carga, cabos SATA/Molex/ARGB. |
| **Térmica** | Curva térmica simplificada baseada em `TDP da CPU`, presença de `Cooler`, presença de `Pasta Térmica` e estado da ventoinha (`RPM`). Disparo de *thermal throttling* (> 95 °C) e *thermal shutdown* (> 105 °C). | Mapa de calor (overlay de cor emissiva no CPU/VRM/GPU) para visualizar superaquecimento em tempo real. | Dinâmica de fluidos (CFD), airflow de gabinete, curva de fan customizável no BIOS, liquid cooling custom loop. |
| **Cabeamento 3D** | Origem e destino corretos de cada conector, polarização/chaveamento e validação de encaixe firme vs. frouxo. | Cabos renderizados como curvas Bézier/Catmull-Rom paramétricas limpas passando por *waypoints* da bancada. | Física real de cordas/gravidade, colisão entre cabos, dobra rígida de cabo 12VHPWR. |
| **Diagnóstico & POST** | Sequência real: `PSU_PG` → `CPU` → `DRAM` → `VGA` → `BOOT`. LEDs EZ-Debug na placa-mãe, beeps padrão, sintoma coerente (liga e desliga em loop, gira cooler sem vídeo, entra na BIOS sem disco). | Painel de diagnóstico assistido ("Modo Estudo" vs. "Modo Desafio") explicando a causa raiz após a investigação. | Execução real de SO/UEFI completo, overclock de memória (timings secundários), análise com osciloscópio/multímetro por trilha da PCB. |
| **Visual 3D** | Proporções métricas reais (`1 unit = 1m`), posicionamento fiel de slots e conectores na placa-mãe. | Animações suaves de encaixe (*snap*), destaques de slot compatível/incompatível, modo explosão/Raio-X. | Micro-parafusos individuais com física de rosca (parafusos são animados automaticamente ao confirmar fixação). |

---

## 3. Riscos Identificados na Definição de Escopo

* **HIPÓTESE:** Usuários podem querer "forçar" uma peça incompatível (ex.: DDR4 em placa DDR5) para ver o que acontece.
  * **DECISÃO DE PROJETO:** Permitir aproximação visual com **feedback de bloqueio mecânico** (ghost vermelho + explicação técnica do chanfro/pinagem) para incompatibilidades físicas impossíveis, e permitir **erros fisicamente possíveis mas funcionalmente errados** (ex.: esquecer pasta térmica, esquecer cabo EPS, deixar RAM mal encaixada, usar fonte fraca, colocar RAM em slots A1+A2 perdendo dual-channel) para que o motor de diagnóstico brilhe.
