# Auditoria Física dos Conectores e Cabos — Bancada PCWare IPM41-D3 (Seção 18)

> **Princípio Fundamental de Engenharia de Hardware:**
> ```text
> Conector disponível  ≠  Conector necessário
> ```
> Em qualquer computador real (e em qualquer fonte ATX), **diversos conectores permanecem legitimamente sem utilização**. Um técnico precisa saber distinguir conectores **obrigatórios para boot**, **condicionais/opcionais** e **sobras normais de projeto**.

---

## 1. Taxonomia Oficial de Conectores do Simulador

Todo conector do domínio DEVE pertencer a exatamente uma das **4 classes técnicas**:

| Classe (`ConnectorDomainClass`) | Função Física | Exemplos na Bancada |
| --- | --- | --- |
| **Energia (`power`)** | Conduz corrente contínua (DC) ou alternada (AC) e sinais de controle elétrico | `ATX 24P`, `CPU 4P`, `SATA Power 15P`, `Molex 4P`, `PCIe 6P`, `IEC C13/C14` |
| **Dados (`data`)** | Transporta sinais diferenciais ou barramentos de comunicação lógica | `SATA Data 7P` (4× portas na IPM41-D3) |
| **Expansão (`expansion`)** | Acopla placas/módulos diretamente aos barramentos da placa-mãe | `CPU Socket LGA775`, `DIMM 1/2 DDR3`, `PCIe x16`, `PCIe x1`, `2× PCI 32-bit` |
| **Refrigeração (`cooling`)** | Alimenta ventoinhas e transporta tacômetro (RPM) / controle PWM | `CPU_FAN (4P PWM)`, `SYS_FAN (3P)` |

---

## 2. Auditoria Completa dos Conectores da Bancada

### 2.1 Conectores de Alimentação (Energia)

| Conector | Tipo / Classe | Origem → Destino | Obrigatório? | Pode ficar sem uso? | Dependentes | Erros Comuns de Conexão |
| --- | --- | --- | :---: | :---: | --- | --- |
| **ATX 24 pinos (`motherboard-atx-24pin`)** | `power` · ATX12V 24P (20+4) | Fonte ATX → Placa-Mãe | **Sim** | Não | Placa-mãe inteira (`+5VSB`, `PS_ON#`, `PWR_OK`, `+3.3V`, `+5V`, `+12V`) | Deixar o bloco `+4` desalinhado; não travar até o clique; conectar com chave da PSU ligada. |
| **CPU Power 4 pinos (`motherboard-cpu-power`)** | `power` · ATX12V P4 (4P) | Fonte ATX (`4+4` separado) → VRM CPU | **Sim** | Não | CPU LGA775 (VRM converte `+12V → Vcore`) | Esquecer conectado (gira fans sem vídeo/sem beeps); tentar forçar cabo `PCIe 6+2P` (polaridade `+12V/GND` invertida!). |
| **SATA Power 15 pinos (`hdd-in-sata-power`)** | `power` · SATA 15P em "L" | Fonte ATX → HD Samsung 3.5" | **Sim** (se houver HD) | Sobras da fonte: **Sim** | HD Samsung (`+12V` motor 7200 RPM + `+5V` placa lógica) | Conectar apenas SATA Data e esquecer SATA Power (HD não gira); forçar invertido quebrando a lingueta "L". |
| **Molex 4 pinos (`psu-out-molex`)** | `power` · Periférico 4P (`+12V/GND/GND/+5V`) | Fonte ATX → Periféricos legados / Adaptador | **Não** | **Sim (Normal ficar livre!)** | Apenas drives IDE/ventoinhas antigas ou adaptador emergencial | Forçar invertido (embora chanfrado); pinos frouxos saindo por trás do conector plástico. |
| **PCIe 6 pinos (`gpu-in-pcie6`)** | `power` · PCIe Auxiliar 6P (`+12V`) | Fonte ATX (`6+2P`) → GPU Dedicada | **Condicional** (obrigatório se GPU instalada exigir >75W) | **Sim** se usando vídeo onboard GMA X4500 ou GPU ≤75W | Placa de vídeo dedicada PCIe x16 | Esquecer com GPU dedicada (1 beep longo + 3 curtos / tela preta); tentar plugar no `CPU 4P`. |
| **Entrada AC IEC C14 (`psu-in-ac`)** | `power` · AC 100–240V | Rede Elétrica → Fonte ATX | **Sim** | Não | Toda a bancada | Cabo frouxo causando faiscamento; ligar chave `I` antes de concluir montagem. |

### 2.2 Conectores de Dados e Armazenamento

| Conector | Tipo / Classe | Origem → Destino | Obrigatório? | Pode ficar sem uso? | Dependentes | Erros Comuns |
| --- | --- | --- | :---: | :---: | --- | --- |
| **SATA Data — Porta 1 (`mb-port-sata-1`)** | `data` · SATA II 7P em "L" | Southbridge ICH7 ↔ HD Samsung | **Sim** (para boot via HD) | Não (com 1 HD) | HD Samsung (link 3 Gbps) | Confundir com SATA Power; dobrar cabo em 90° seco gerando erro CRC; puxar sem apertar trava metálica. |
| **SATA Data — Portas 2, 3 e 4 (`mb-port-sata-2..4`)** | `data` · SATA II 7P em "L" | Southbridge ICH7 ↔ Discos extras / DVD-RW | **Não** | **Sim (Normal ficarem livres!)** | Apenas unidades adicionais | Achar que é defeito ter 3 portas SATA vazias em uma placa com 1 HD. |

### 2.3 Conectores de Expansão (Placa-Mãe)

| Conector | Tipo / Classe | Finalidade | Obrigatório? | Pode ficar sem uso? | Erros Comuns |
| --- | --- | --- | :---: | :---: | --- |
| **CPU Socket LGA775** | `expansion` | Acopla CPU ao FSB e VRM | **Sim** | Não | CPU rotacionada fora do pino 1; tocar nos 775 pinos. |
| **DIMM 1 (DDR3 — Canal A)** | `expansion` | Memória RAM principal (1.5V) | **Sim** | Não | Encaixe parcial (`SEATED_LOOSE`); forçar DDR2. |
| **DIMM 2 (DDR3 — Canal B)** | `expansion` | Segundo pente (habilita Dual-Channel) | **Não** (opcional com 1 pente) | **Sim** (opera em Single-Channel) | Misturar densidades incompatíveis com G41. |
| **PCIe x16** | `expansion` | GPU dedicada (16 lanes G41) | **Opcional** (G41 tem vídeo onboard GMA X4500) | **Sim** (se usar vídeo onboard) | Puxar GPU sem soltar trava traseira. |
| **PCIe x1** | `expansion` | Placas de rede/som/USB PCIe x1 | **Não** | **Sim (Normal ficar livre!)** | — |
| **2× PCI Legado 32-bit** | `expansion` | Placas PCI antigas / POST Card | **Não** | **Sim (Normal ficarem livres!)** | Tentar encaixar placa PCIe em slot PCI legado. |

### 2.4 Conectores de Refrigeração

| Conector | Tipo / Classe | Origem → Destino | Obrigatório? | Pode ficar sem uso? | Erros Comuns |
| --- | --- | --- | :---: | :---: | --- |
| **CPU_FAN (4 pinos PWM)** | `cooling` | Placa-Mãe → Cooler da CPU | **Sim** | Não | Plugar o cooler em `SYS_FAN` e deixar `CPU_FAN` vazio (`CPU Fan Error`). |
| **SYS_FAN (3 pinos DC)** | `cooling` | Placa-Mãe → Ventoinha de gabinete | **Não** (bancada aberta) | **Sim (Normal ficar livre!)** | Em bancada aberta não há gabinete fechado exigindo exaustor auxiliar. |

---

## 3. Auditoria dos Cabos Físicos Disponíveis

| Cabo | Tipo | Origem → Destino | Conectores nas Extremidades | Função | Compatibilidade & Regra Didática |
| --- | --- | --- | --- | --- | --- |
| **Cabo ATX 24P** | `power` | Fonte ATX → Placa-Mãe | Fixo na PSU → Macho 24P (20+4) | Alimentação principal + standby + controle | Exclusivo para `ATX 24P` da placa-mãe. |
| **Cabo CPU Power 4P** | `power` | Fonte ATX → Placa-Mãe | Fixo na PSU → 4P ATX12V (metade de 4+4) | `+12V` dedicado ao VRM da CPU | Exclusivo para `CPU POWER 4P`. Nunca usar em GPU. |
| **Cabo SATA Power Nativo** | `power` | Fonte ATX → HD Samsung | Fixo na PSU → 15P SATA Power em "L" | `+12V` motor + `+5V` lógica do HD | **Preferencial** sobre adaptadores Molex→SATA. |
| **Cabo PCIe 6P** | `power` | Fonte ATX → GPU Dedicada | Fixo na PSU → 6P (6+2) PCIe | `+12V` auxiliar (até 75W extras) | Exclusivo para GPU dedicada. **Nunca** plugar em `CPU 4P`. |
| **Cabo SATA Data** | `data` | Placa-Mãe ↔ HD Samsung | 7P SATA "L" ↔ 7P SATA "L" | Dados seriais diferenciais (3 Gbps) | Conecta apenas porta SATA 7P ↔ HD SATA 7P. Não leva energia. |
| **Cabo de Força AC** | `power` | Tomada AC → Fonte ATX | NBR 14136 (3P) ↔ IEC C13 | Alimentação 110V/220V AC + Terra | Universal para fontes ATX. |
| **Adaptador Molex → SATA Power** | `power` | Molex 4P (PSU) → SATA 15P (HD) | Molex 4P fêmea ↔ SATA Power 15P | Adaptação emergencial quando faltam saídas SATA nativas | **FATO TÉCNICO:** Opcional e **desnecessário** quando a fonte já tem SATA Power nativo! Evitar versões moldadas de má qualidade (risco de curto/derretimento). |

---

## 4. Por que Conectores Sem Uso São Normais (Regra Pedagógica)

* **FATO TÉCNICO:** Uma fonte ATX 500W traz múltiplos chicotes sobressalentes (`3× SATA Power extras`, `2× Molex 4P`, metade sobressalente do `4+4` CPU e `+2` do `PCIe 6+2`) e a placa-mãe `PCWare IPM41-D3` traz `3× portas SATA vazias`, `2× slots PCI`, `1× PCIe x1`, `1× SYS_FAN` e `1× DIMM 2` (se usar 1 pente).
* **DECISÃO DE PROJETO:** O simulador deve exibir explicitamente na aba **Conexões** uma seção **"Conectores Disponíveis sem Necessidade de Uso"** explicando tecnicamente por que `Molex 4P`, `Adaptador Molex→SATA`, `Portas SATA 2–4`, `Slots PCI` e `SYS_FAN` permanecem livres sem impedir o funcionamento nem gerar erro!
