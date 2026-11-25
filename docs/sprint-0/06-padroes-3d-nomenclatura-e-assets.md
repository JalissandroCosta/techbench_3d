# 06 — Padrões de Modelos 3D, Nomenclatura e Estratégia de Assets

---

## 1. Padrão dos Modelos 3D (Especificação Técnica)

* **FATO TÉCNICO:** A especificação oficial **glTF 2.0** define unidades em **metros**, sistema de coordenadas **Right-Handed**, **+Y para cima (Y-Up)** e **+Z para frente**. Desviar desse padrão gera bugs acumulativos de escala, rotação de cabos e iluminação.

### 1.1 Requisitos Obrigatórios de Exportação (Blender → `.glb`)

| Parâmetro | Padrão Obrigatório | Observação de Engenharia |
| --- | --- | --- |
| **Formato** | `.glb` (glTF 2.0 binário) | Único arquivo contendo geometria, materiais PBR e hierarquia de nós |
| **Escala** | `1 unidade = 1 metro` (escala aplicada `1, 1, 1`) | Ex.: Placa-mãe ATX = `0.305m × 0.244m` |
| **Orientação** | `+Y` = Cima, `+Z` = Frente da bancada | Todas as rotações zeradas (`Apply All Transforms`) antes de exportar |
| **Pivô (Origin)** | Ponto de encaixe físico principal | Ex.: MB = centro da base inferior; CPU = centro da face inferior; RAM = centro da base do chanfro; GPU = centro da base do conector PCIe |
| **Compressão** | **Draco** (geometria) + **KTX2 / Basis** (texturas) | Reduz payload em 60%–85% e uso de VRAM na GPU |
| **Materiais** | PBR Metallic-Roughness (`MeshStandardMaterial`) | Texturas em potência de 2 (`512px` a `1024px`; `2048px` apenas para textura principal da PCB da placa-mãe) |

### 1.2 Sistema de Anchors (Empties no Blender)

* **DECISÃO DE PROJETO:** Nunca usar coordenadas `(x, y, z)` hardcoded no TypeScript para encaixar peças ou cabos. Todo ponto de encaixe, conector, LED e ventoinha deve existir como um nó **Empty (`THREE.Object3D`)** dentro do `.glb` com orientação padronizada (`+Y` apontando na direção de inserção/saída do cabo).

Exemplos obrigatórios na hierarquia de uma Placa-Mãe (`mb_atx_z790.glb`):
- `ANCHOR_SLOT_CPU_01`
- `ANCHOR_SLOT_COOLER_01`
- `ANCHOR_SLOT_DIMM_A1`, `ANCHOR_SLOT_DIMM_A2`, `ANCHOR_SLOT_DIMM_B1`, `ANCHOR_SLOT_DIMM_B2`
- `ANCHOR_SLOT_PCIE_X16_01`
- `ANCHOR_SLOT_M2_01`
- `ANCHOR_PORT_ATX_24PIN_01`
- `ANCHOR_PORT_EPS_8PIN_01`
- `ANCHOR_PORT_FAN_CPU_01`
- `FX_LED_CPU`, `FX_LED_DRAM`, `FX_LED_VGA`, `FX_LED_BOOT`

### 1.3 Orçamento de Performance (Budgets WebGL v1)

| Componente | Triângulos (Máx.) | Draw Calls (Alvo) | Textura Máx. |
| --- | :---: | :---: | :---: |
| Bancada (`TechBench`) | 5.000 | 2–3 | 1024px |
| Placa-Mãe (`Motherboard`) | 25.000 | 5–8 | 2048px (PCB) |
| GPU | 18.000 | 4–6 | 1024px |
| CPU Cooler | 12.000 | 3–4 | 1024px |
| PSU | 8.000 | 2–3 | 1024px |
| CPU / RAM / SSD M.2 | 3.000 cada | 1–2 cada | 512px |
| **Cena Completa (Alvo)** | **< 100.000 tris** | **< 60 draw calls** | **60 FPS estáveis** |

---

## 2. Padrão de Nomenclatura

### 2.1 Código (Angular / TypeScript)
- **Arquivos:** `kebab-case` com sufixo de papel (`simulation.facade.ts`, `compatibility.engine.ts`, `cable-mesh.builder.ts`, `viewport-3d.component.ts`).
- **Classes / Interfaces / Types:** `PascalCase` (`MotherboardSpec`, `PostDiagnosticResult`, `SceneSynchronizer`).
- **Signals:** sufixo implícito ou explícito consistente (`benchState`, `selectedInstanceId`, `activeMode`); observables (se usados) com sufixo `$`.
- **Constantes e Enums/Unions:** `SCREAMING_SNAKE_CASE` para valores discriminantes (`'BLOCKER_PHYSICAL'`, `'EPS_8PIN'`, `'SEATED_LOOSE'`).

### 2.2 IDs de Hardware (Catálogo)
Formato: `<categoria>_<marca>_<modelo>[_<variante>]` em `snake_case`:
- `mb_asus_z790_ddr5`
- `mb_msi_b650_ddr5`
- `cpu_intel_i5_13600k`
- `cpu_amd_r5_7600x`
- `ram_corsair_ddr5_16gb_6000`
- `ram_kingston_ddr4_16gb_3200`
- `gpu_nvidia_rtx4070_12gb`
- `psu_corsair_rm750e_750w`
- `ssd_samsung_980pro_1tb`

### 2.3 Nós Internos nos Arquivos 3D (Blender / glTF)
Prefixos rígidos (validados automaticamente no carregamento pelo `AssetManager`):
- `MESH_*` — Geometria visível (ex.: `MESH_PCB`, `MESH_HEATSINK_VRM`, `MESH_FAN_BLADES_01`)
- `COLLIDER_*` — Hitbox simplificada invisível para Raycasting rápido (ex.: `COLLIDER_DIMM_A2`)
- `ANCHOR_SLOT_*` — Ponto de encaixe de componente filho
- `ANCHOR_PORT_*` — Ponto de conexão de cabo elétrico/fan
- `WAYPOINT_CABLE_*` — Pontos intermediários de passagem de cabo na bancada
- `FX_LED_*` — Malha/ponto de LED controlável por código
- `ANIM_FAN_*` — Pivô rotacionável de ventoinha (eixo de rotação padronizado em `Z` ou `Y` documentado por asset)

---

## 3. Estratégia de Assets (Pipeline Evolutivo em 3 Fases)

* **SUGESTÃO DE ENGENHARIA:** Não bloquear o desenvolvimento da programação esperando modelagem 3D final no Blender. Usar um **pipeline de substituição transparente** baseado em `assets.manifest.json`.

### Fase 1 — Greybox Paramétrico (Sprint 1 e Sprint 2)
- Uma `GreyboxFactory` em `src/app/engine/assets/` gera meshes procedurais com **dimensões métricas reais**, cores técnicas por categoria e **todos os `ANCHOR_SLOT_*`, `ANCHOR_PORT_*` e `FX_LED_*` exatamente nos mesmos nomes da Fase 3**.
- **Resultado:** Motor de montagem, compatibilidade, cabos, POST e UI ficam 100% funcionais e testáveis na semana 1, sem nenhum `.glb` pronto.

### Fase 2 — Low-Poly Técnico em `.glb` (Sprint 3)
- Substituição progressiva dos greyboxes por modelos `.glb` leves modelados no Blender com proporções reais, dissipadores, ventoinhas separadas (`ANIM_FAN_*`) e serigrafia básica.
- Como os nomes de `ANCHOR_*` são idênticos, **nenhuma linha do domínio ou da interação precisa mudar**.

### Fase 3 — Polimento PBR + Otimização (Sprint 4+)
- Texturas PBR (Normal/Roughness/Metallic), compressão Draco + KTX2, `EnvironmentMap` HDRI de estúdio técnico e validação automatizada de assets via script Node (`gltf-transform` / validador de anchors obrigatórios no CI).

### Exemplo de Manifesto (`public/assets/manifests/assets.manifest.json`)

```json
{
  "version": "1.0.0",
  "assets": {
    "mb_asus_z790_ddr5": {
      "strategy": "GREYBOX_FALLBACK",
      "glbUrl": "/assets/models/motherboards/mb_asus_z790_ddr5.glb",
      "requiredAnchors": [
        "ANCHOR_SLOT_CPU_01",
        "ANCHOR_SLOT_DIMM_A2",
        "ANCHOR_SLOT_DIMM_B2",
        "ANCHOR_SLOT_PCIE_X16_01",
        "ANCHOR_PORT_ATX_24PIN_01",
        "ANCHOR_PORT_EPS_8PIN_01",
        "FX_LED_CPU",
        "FX_LED_DRAM",
        "FX_LED_VGA",
        "FX_LED_BOOT"
      ]
    }
  }
}
```
