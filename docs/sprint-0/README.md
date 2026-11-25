# Sprint 0 — Engenharia e Definição do Projeto (TechBench 3D)

> **Objetivo da Sprint 0:** Congelar arquitetura, contratos de dados, regras de domínio, padrões 3D e escopo **antes** de escrever código de aplicação ou modelar assets finais.

---

## Mapa dos 12 Entregáveis

| # | Entregável | Documento |
| :---: | --- | --- |
| — | Protocolo de Engenharia & Prompt Permanente | [ENGINEERING_RULES.md](../../ENGINEERING_RULES.md) |
| 1 | Visão geral do sistema | [01-visao-geral-e-escopo.md](./01-visao-geral-e-escopo.md) |
| 2 | Arquitetura Angular + Three.js | [02-arquitetura-e-estrutura.md](./02-arquitetura-e-estrutura.md) |
| 3 | Estrutura de pastas | [02-arquitetura-e-estrutura.md](./02-arquitetura-e-estrutura.md) |
| 4 | Modelo de dados | [03-modelo-de-dados-e-estados.md](./03-modelo-de-dados-e-estados.md) |
| 5 | Regras de interação | [05-interacao-3d-e-ux.md](./05-interacao-3d-e-ux.md) |
| 6 | Sistema de compatibilidade | [04-compatibilidade-conexoes-diagnostico.md](./04-compatibilidade-conexoes-diagnostico.md) |
| 7 | Sistema de conexões (e motor de POST/Diagnóstico) | [04-compatibilidade-conexoes-diagnostico.md](./04-compatibilidade-conexoes-diagnostico.md) |
| 8 | Estados dos componentes | [03-modelo-de-dados-e-estados.md](./03-modelo-de-dados-e-estados.md) |
| 9 | Padrão dos modelos 3D | [06-padroes-3d-nomenclatura-e-assets.md](./06-padroes-3d-nomenclatura-e-assets.md) |
| 10 | Padrão de nomenclatura | [06-padroes-3d-nomenclatura-e-assets.md](./06-padroes-3d-nomenclatura-e-assets.md) |
| 11 | Estratégia de assets | [06-padroes-3d-nomenclatura-e-assets.md](./06-padroes-3d-nomenclatura-e-assets.md) |
| 12 | Definição do que será real e do que será didático | [01-visao-geral-e-escopo.md](./01-visao-geral-e-escopo.md) |

---

## Decisões de Projeto Congeladas na Sprint 0

- **DECISÃO DE PROJETO #01 — MVP em Bancada Aberta (TechBench):** O escopo v1 foca em placa-mãe montada em bancada aberta (`Motherboard`, `CPU`, `CPU Cooler`, `RAM`, `GPU`, `SSD M.2`, `PSU` e cabeamento essencial). Gabinete ATX fechado e colisões de chassi ficam para a v2.
- **DECISÃO DE PROJETO #02 — Stack Desacoplada:** Angular moderno (Standalone + Signals + Zoneless) para UI/orquestração + Three.js puro encapsulado em `core/engine` + Domínio de Hardware headless em TypeScript puro.
- **DECISÃO DE PROJETO #03 — Diagnóstico Dinâmico desde a v1:** O simulador executará uma sequência de **POST** realística (PSU Power Good → CPU → DRAM → VGA → BOOT) com LEDs de debug (EZ-Debug) e códigos de beep, suportando falhas clássicas de montagem e defeitos injetados.
- **DECISÃO DE PROJETO #04 — Greyboxing Primeiro:** A Sprint 1/2 usará geometrias paramétricas / GLBs leves com *anchors* padronizados para validar todo o motor antes da produção de modelos 3D detalhados.

---

## Gate de Saída da Sprint 0 (Critérios para iniciar Sprint 1)

- [x] Regras de engenharia definidas em `ENGINEERING_RULES.md`.
- [x] Todos os 12 entregáveis documentados e revisados.
- [ ] Revisão e aprovação final do dono do projeto sobre eventuais ajustes de escopo ou contratos de dados.
- [ ] Setup do repositório Angular + Three.js + Vitest/Jest (início da Sprint 1).
