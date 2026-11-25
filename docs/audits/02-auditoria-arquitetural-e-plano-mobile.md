# Auditoria Arquitetural, Plano de Refatoração Incremental e Estratégia Mobile (Seções 19–27)

> **Regra de Execução (Seção 23 & 26):** Nenhuma refatoração massiva em lote. Primeiro documentamos o estado real do código, classificamos os riscos (`CRÍTICO`, `ALTO`, `MÉDIO`, `BAIXO`) e definimos etapas incrementais seguras com validação por testes a cada passo.

---

## 1. Mapa da Arquitetura Atual (`13.686` linhas · `57` arquivos)

| Camada Atual | Diretório | Arquivos | Linhas | Avaliação |
| --- | --- | :---: | :---: | --- |
| **Domínio Headless (TS Puro)** | `src/app/domain/` | 27 (c/ 9 specs) | ~4.450 | **Excelente.** Zero imports de Angular ou Three.js; 100% testado no Vitest. |
| **Motor 3D Isolado (Three.js)** | `src/app/engine/` | 9 | ~2.780 | **Bom, mas com pontos hardcoded** em `drag-drop-controller.ts` (526 L) e `cable-renderer.ts` (296 L). |
| **Estado (Angular Signals)** | `src/app/state/` | 2 (c/ spec) | ~1.023 | **Sobrecarregado.** `workbench.facade.ts` atingiu **791 linhas** concentrando 7 domínios. |
| **UI Standalone (Angular 22)** | `src/app/features/workbench/` | 7 | ~4.196 | **Parcialmente monolítico.** `inspector-sidebar.component.ts` tem **989 linhas**; mobile/touch ausente. |
| **Shell / Config** | `src/app/app.*` | 5 | ~216 | Enxuto e limpo. |

---

## 2. Problemas Identificados (Classificação Técnica)

### CRÍTICO

1. **Interação Touch & Conflito de Gestos no Mobile (`drag-drop-controller.ts`, `selection-controller.ts`, `viewport-3d.component.ts`):**
   - **FATO TÉCNICO:** Em telas touch, arrastar com 1 dedo dispara `pointermove` imediatamente — sem **long-press (~280ms)** para pegar peças e sem `touch-action: none` no `<canvas>`, tentar girar a câmera acidentalmente arrasta peças da manta ESD ou dispara scroll nativo do navegador. Além disso, gestos multi-touch (`pinch-to-zoom` com 2 dedos) precisam cancelar qualquer arrasto em andamento imediatamente.
2. **Responsividade Real por 4 Formatos (`app.scss`, `viewport-3d.component.ts`, `inspector-sidebar.component.ts`):**
   - **FATO TÉCNICO:** Hoje existe apenas um `@media (max-width: 960px)`. Não existem layouts dedicados para **Tablet**, **Smartphone Landscape (cena 3D predominante + bottom sheet expansível)** e **Smartphone Portrait (aviso amigável recomendando paisagem com botão `[Continuar mesmo assim]` sem bloquear)**.
3. **Performance 3D Mobile / Qualidade Adaptativa (`scene-manager.ts`):**
   - **FATO TÉCNICO:** Sombras `PCFSoftShadowMap` `1024×1024`, `antialias: true` e `DPR = 2` fixos consomem GPU e bateria excessivos em smartphones de entrada. Falta um gerenciador de qualidade (`Auto | Baixo | Médio | Alto`) que ajuste `pixelRatio`, `shadows`, `shadowMapSize` e iluminação dinamicamente.

### ALTO

4. **God Facade (`workbench.facade.ts` — `791` linhas):**
   - Mistura estado de seleção/câmera, montagem, conexões, modo elétrico, laboratório de diagnóstico, gamificação/localStorage e registro de equipamentos.
   - **Solução:** Extrair serviços coesos de estado (`AssemblyStateService`, `ConnectionStateService`, `DiagnosticsStateService`, `GamificationStateService`, `GraphicsQualityService`), mantendo `WorkbenchFacade` como orquestrador fino sem quebrar componentes existentes.
5. **Componente Lateral Monolítico (`inspector-sidebar.component.ts` — `989` linhas):**
   - Ainda mantém inline o HTML/CSS das abas `Componentes`, `Conexões` e `⚡ Elétrico`.
   - **Solução:** Extrair `ComponentsTabComponent`, `ConnectionsTabComponent` e `ElectricalTabComponent` (igual fizemos com sucesso para `TechnicalInfoPanelComponent` e `DiagnosticsPanelComponent`).
6. **Lacunas da Auditoria Física de Conectores (Seção 18):**
   - Faltam no domínio: `ConnectorDomainClass` explícito (`power | data | expansion | cooling`), `Molex 4P`, `Adaptador Molex → SATA Power`, `Cabo de Força AC` e a lista didática explícita de **conectores disponíveis que podem permanecer sem uso** (`Conector disponível ≠ Conector necessário`).

### MÉDIO

7. **Coordenadas Hardcoded de Snap/Cabos (`drag-drop-controller.ts`, `cable-renderer.ts`):**
   - Coordenadas específicas da `PCWare IPM41-D3` estão hardcoded no controlador 3D em vez de lidas dinamicamente dos nós `ANCHOR_*` da cena.
8. **Tamanho de `evaluation-modal.component.ts` (`794` linhas) e `viewport-3d.component.ts` (`600` linhas):**
   - Extrair o HUD de controles do viewport (`ViewportHudComponent`) e o cartão de certificado (`CertificateCardComponent`) melhora legibilidade e facilita o layout mobile.

### BAIXO

9. **Dados misturados com fábrica em `equipment.registry.ts` (`624` linhas):**
   - Os perfis estáticos (Dell 3070, Servidor 1U, Notebook 14") podem ser movidos para arquivos de dados dedicados em `domain/equipment/profiles/`.

---

## 3. Decisão de Projeto sobre Estrutura de Pastas (Seção 24)

* **DECISÃO DE PROJETO:** A Seção 24 sugere `core/`, `shared/`, `features/`, `three/`, `models/`, `data/`, mas explicita *"A estrutura final pode ser diferente se houver uma justificativa técnica melhor"*.
* **Análise de Trade-off:** Nossa estrutura atual (`domain/` + `engine/` + `state/` + `features/`) já cumpre 100% da separação de responsabilidades (zero acoplamento entre domínio, Three.js e Angular, com 47 testes passando). **Renomear todas as pastas agora geraria churn de 50+ imports sem ganho funcional.**
* **SUGESTÃO DE ENGENHARIA:** Manter os 4 pilares limpos (`domain/`, `engine/`, `state/`, `features/`) e evoluí-los incrementalmente:
  - Fatiar `state/` em serviços coesos por domínio (`assembly.state.ts`, `connections.state.ts`, `diagnostics.state.ts`, `gamification.state.ts`, `graphics.state.ts`);
  - Fatiar `features/workbench/` em subcomponentes focados + `mobile/` (orientation banner, bottom sheet);
  - Enriquecer `domain/connections/` com a taxonomia completa da Seção 18 (`power | data | expansion | cooling` + conectores opcionais/livres).

---

## 4. Plano de Refatoração Incremental (5 Etapas Seguras)

Cada etapa segue rigorosamente a Seção 26 (`Analisar → Propor → Implementar → Testar → Verificar Regressões → Documentar`):

| Etapa | Escopo Focado | Risco | Critério de Validação |
| :---: | --- | :---: | --- |
| **Etapa 1** | **Auditoria Física no Domínio (Seção 18 & 27):** Adicionar `ConnectorDomainClass` (`power \| data \| expansion \| cooling`), `Molex 4P`, `Adaptador Molex→SATA`, `Cabo AC`, regra `Conector disponível ≠ Conector necessário` (seção de conectores livres na aba Conexões) + novos testes unitários. | Baixo | `ng build` + testes unitários cobrindo as 4 classes e conectores opcionais. |
| **Etapa 2** | **Performance 3D Mobile (Seção 22):** Criar `GraphicsQualityService` (`Auto \| Baixo \| Médio \| Alto`), detecção de dispositivo/GPU móvel, ajuste dinâmico de `DPR`, sombras e `shadowMapSize` no `SceneManager` + seletor compacto no HUD. | Baixo | `ng build` + testes unitários do perfil adaptativo + zero regressão visual. |
| **Etapa 3** | **Interação Touch de Primeira Classe (Seção 20):** Adicionar `touch-action: none`, suporte **long-press (~260ms)** no `DragDropController` para diferenciar arrasto de peça vs. órbita com 1 dedo, cancelamento automático em multi-touch (`pinch-to-zoom` 2 dedos) e botões acessíveis de instalar/conectar para quem preferir toque simples. | Médio | `ng build` + testes + validação de gestos touch/mouse sem conflito com `OrbitControls`. |
| **Etapa 4** | **Responsividade Real em 4 Layouts (Seções 19 & 21):** Desktop (lateral), Tablet (adaptável), Smartphone Landscape (3D predominante + **Bottom Sheet** recolhível) e Smartphone Portrait (aviso amigável recomendando modo paisagem com **`[Continuar mesmo assim]`** não bloqueante). | Médio | `ng build` + testes + verificação em viewports desktop, tablet, landscape e portrait. |
| **Etapa 5** | **Fatiamento Arquitetural Incremental (Seções 23–25):** Extrair sub-abas de `inspector-sidebar.component.ts` (`989 L → <220 L`) e extrair serviços de estado de `workbench.facade.ts` (`791 L → <250 L`) mantendo 100% da API e cobertura de testes. | Baixo | `ng build` + `100%` testes passando sem nenhuma regressão. |
