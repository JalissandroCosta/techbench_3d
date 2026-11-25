# 05 — Regras de Interação 3D e UX da Bancada

---

## 1. Modos de Operação da Bancada

Para evitar sobrecarga cognitiva e conflito de cliques/arrastos no 3D, a interação opera em **4 modos explícitos** (selecionáveis na barra superior ou por atalhos `1`–`4`):

| Modo | Atalho | Objetivo | O que é clicável (Raycast Layer) |
| --- | :---: | --- | --- |
| **1. Montagem (`BUILD`)** | `1` | Instalar, travar, aplicar pasta térmica e remover componentes | Slots da bancada/MB e componentes instalados |
| **2. Cabeamento (`CABLE`)** | `2` | Conectar e desconectar cabos de energia e `CPU_FAN` | Apenas portas elétricas (`SOURCE` e `SINK`) e cabos existentes |
| **3. Arquitetura (`INSPECT`)** | `3` | Inspecionar specs, ativar Raio-X de barramentos, fluxo de energia e mapa térmico | Qualquer componente (abre painel técnico; não move peças) |
| **4. Diagnóstico (`DIAGNOSE`)** | `4` | Ligar chave da PSU, pressionar Power, rodar Stress Test, observar LEDs/beeps e identificar falhas | Botões físicos da bancada/PSU + inspeção de sintomas |

* **DECISÃO DE PROJETO:** Separar `BUILD` e `CABLE` evita o clássico problema de UX 3D onde o usuário tenta clicar em um conector 8-pin pequeno na placa-mãe e acaba selecionando a placa-mãe inteira ou o cooler.

---

## 2. Fluxo de Montagem e Snap Points

* **FATO TÉCNICO:** Drag-and-drop livre em 3D com mouse 2D é impreciso e frustrante sem planos de projeção e imãs (*snap points*).
* **SUGESTÃO DE ENGENHARIA:** Adotar interação **Click-to-Place com Ghost Preview Magnético** (e suporte opcional a arrastar da gaveta):
  1. Usuário seleciona uma peça no catálogo (ex.: `CPU Intel i5-13600K`).
  2. A cena destaca todos os slots candidatos (`SLOT_CPU_01`) com um anel/outline pulsante.
  3. Ao passar o mouse (*hover*) sobre um slot:
     - O `CompatibilityEngine` valida em tempo real.
     - Um **Ghost Mesh translúcido** encaixa exatamente na transformação do `ANCHOR_SLOT_*`:
       - **Verde translúcido:** Compatível (clique instala com animação suave de 250ms–350ms + som de encaixe).
       - **Âmbar translúcido:** Compatível com alerta (ex.: RAM fora do slot A2/B2; tooltip explica antes do clique).
       - **Vermelho translúcido:** Incompatibilidade física (`BLOCKER_PHYSICAL`); clique exibe feedback técnico e não instala.
  4. **Travas e Pasta Térmica (Micro-etapas didáticas):**
     - Ao instalar CPU, a alavanca do socket fecha automaticamente (ou com um clique de confirmação no modo avançado).
     - Antes de instalar o `CPU_COOLER`, o usuário pode clicar na CPU para **Aplicar Pasta Térmica** (exibe o padrão visual de pasta sobre o IHS). Esquecer é permitido — e gera consequência térmica real!

---

## 3. Fluxo de Cabeamento (`CABLE` Mode)

1. No modo `CABLE`, o motor aplica um leve *dimming* (opacidade/saturação reduzida) nos componentes não-elétricos e acende marcadores visuais nas portas disponíveis (`ATX_24PIN`, `EPS_8PIN`, `PCIE_8PIN`, `12VHPWR`, `FAN_4PIN_PWM`).
2. Usuário clica em uma porta de origem (ex.: `PSU → EPS_8PIN`) ou destino (`MB → EPS_8PIN`).
3. Apenas portas compatíveis brilham em verde; portas incompatíveis (ex.: `PCIE_8PIN` quando segurando `EPS_8PIN`) exibem bloqueio vermelho com explicação técnica da pinagem.
4. Ao clicar na segunda ponta, o `CableMeshBuilder` gera uma curva suave (`CatmullRomCurve3` → `TubeGeometry`) passando pelos *waypoints* da bancada, evitando atravessar o cooler ou a placa-mãe.
5. Clicar em um cabo já conectado permite **Desconectar** ou (no modo Diagnóstico) **Verificar Encaixe** (revela e corrige cabos `LOOSE`).

---

## 4. Regras de Câmera e Navegação

- **Câmera Orbital Restrita (`OrbitControls`):**
  - `minDistance` e `maxDistance` calibrados para a escala real da bancada (`0.18m` a `1.6m`).
  - `maxPolarAngle = Math.PI * 0.48` (impede a câmera de atravessar o tampo da bancada).
  - Damping ativado (`enableDamping = true`) para movimento fluido.
- **Presets de Foco Automático (Focus Framing):**
  - Ao selecionar um componente ou entrar no modo de instalação de CPU/RAM/M.2, a câmera faz uma transição suave (*tween* de ~400ms) para um ângulo ótimo de visão daquela região (ex.: vista superior inclinada para CPU/RAM; vista lateral frontal para GPU/cabos).
  - Tecla `R` reseta a câmera para a visão geral da bancada.

---

## 5. Regras de Segurança na Bancada (Feedback Realista)

* **HIPÓTESE:** Tentar remover uma peça (RAM, GPU, CPU) com o computador ligado é um erro comum de iniciantes que merece feedback educativo.
* **DECISÃO DE PROJETO:**
  - Se `systemPowerOn === true`, ações de instalação/remoção de componentes ou cabos são bloqueadas com alerta de segurança: *"Desligue o sistema (e a chave da PSU) antes de manipular hardware para evitar curto-circuito/ESD."*
  - Opcionalmente (v2), um modo "Sem Proteção" pode simular dano por hot-unplug.
