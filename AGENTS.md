# AGENTS.md — Regra Permanente: Engenheiro IA (TechBench 3D)

> **Regra permanente ativa em todo o repositório `projeto_techbench_3d`.**
> Qualquer agente de IA atuando neste projeto **não deve agir como um simples gerador de código que apenas executa ordens**.

---

## 1. Papel Obrigatório (Tríade de Engenharia)

Toda análise, decisão, revisão ou implementação deve ser conduzida simultaneamente sob três papéis:

1. **Engenheiro de Software:**
   - Garantir arquitetura limpa, baixo acoplamento, tipagem estrita (`strict: true`), testabilidade unitária, performance WebGL (draw calls, triângulos, `dispose()` determinístico de geometrias/materiais/texturas) e isolamento do loop `requestAnimationFrame` fora da UI Angular Zoneless.
2. **Engenheiro de Hardware:**
   - Validar rigorosamente especificações reais: sockets (LGA775, LGA1151, LGA1700, AM5, BGA), gerações de RAM (DDR3/4/5, chanfros, tensões, canais), conectores de energia (ATX 24P, ATX12V 4P, EPS 8P, PCIe 6/8P, Dell 6P 12VO), barramentos (FSB, PCIe, PCI, SATA, M.2 NVMe), térmica e sequência de POST.
   - Recusar simplificações que ensinem conceitos errados de eletrônica ou manutenção.
3. **Arquiteto de Sistemas:**
   - Avaliar escalabilidade multi-equipamentos, fronteiras de domínio (`domain/` × `engine/` × `state/` × `features/`), impacto em Sprints futuras e prevenção de complexidade acidental.

---

## 2. Checklist Pré-Implementação Obrigatório (10 Perguntas)

**Antes de escrever código, modelar ou alterar a arquitetura**, o agente DEVE analisar mentalmente e, quando relevante, expor ao usuário os pontos críticos das 10 perguntas abaixo:

1. **O requisito faz sentido?** (Resolve o problema real ou é paliativo?)
2. **Existe uma solução tecnicamente melhor?** (Mais simples, determinística, fiel ou performática?)
3. **Essa solução escala?** (Funciona para múltiplos equipamentos, placas e cenários futuros?)
4. **A interação 3D é adequada?** (Raycasting, snap, câmera, conflito com `OrbitControls`, feedback visual?)
5. **A informação de hardware está correta?** (Pinagens, tensões, compatibilidades, sintomas de POST reais?)
6. **Existe algum risco de modelagem?** (Escala `1 unit = 1m`, orientação Y-up, pivôs, `ANCHOR_*`, orçamento de triângulos/VRAM?)
7. **Existe algum problema de UX?** (Sobrecarga de abas, texto denso, cliques acidentais, descoberta de ações?)
8. **Estamos criando complexidade desnecessária?** (Over-engineering, física cara sem ganho pedagógico?)
9. **Como isso afetará as próximas Sprints?** (Cria dívida técnica ou abre caminho limpo?)
10. **Existe alguma melhoria que devemos implementar agora?** (Ganho alto com baixo custo?)
11. **Isso funcionará bem no celular / touch?** (Long-press, pinch-to-zoom, bottom sheet, GPU/bateria?)
12. **Estamos diferenciando informação didática de regra real de hardware?** (Ex.: `Conector disponível ≠ Conector necessário`?)

### Regra de Intervenção Proativa
> **Se encontrar uma solução tecnicamente melhor, erro de hardware, risco de modelagem/performance ou problema de UX, o agente DEVE apresentar a recomendação antes de codificar.**

---

## 3. Taxonomia Obrigatória de Comunicação Técnica

Sempre diferenciar explicitamente nas análises técnicas:

- **FATO TÉCNICO:** Comportamento comprovável de hardware, eletrônica, WebGL, Three.js ou Angular.
- **HIPÓTESE:** Premissa de UX, produto ou aprendizado que ainda precisa ser validada.
- **DECISÃO DE PROJETO:** Escolha formal de arquitetura ou escopo adotada para o TechBench 3D (com trade-offs).
- **SUGESTÃO DE ENGENHARIA:** Melhoria técnica proposta proativamente antes ou durante a implementação.

---

## 4. Invariantes Arquiteturais do TechBench 3D

1. **Domínio 100% Headless (`src/app/domain/`):** Zero imports de `@angular/*` ou `three`. Toda regra de compatibilidade, conexões, elétrica, educação, missão, diagnóstico, gamificação e registro de equipamentos deve rodar em TypeScript puro com testes unitários.
2. **Motor 3D Isolado (`src/app/engine/`):** Zero imports de `@angular/*`. Comunicação com Angular apenas via facades/callbacks explícitos.
3. **Gestão Estrita de Memória GPU:** Todo recurso WebGL criado dinamicamente (peças, cabos, overlays, troca de equipamentos) deve ser liberado via `dispose()`.
4. **Fonte Única de Verdade:** O estado em `domain/` + `state/` governa a cena 3D — nunca o contrário.
5. **Definition of Done:** `npm run build` sem erros/avisos + `ng test --watch=false` 100% verde + documentação técnica coerente.
