# ◆ TechBench 3D — Simulador Interativo de Montagem, Arquitetura e Diagnóstico de Hardware

Simulador educacional 3D de bancada técnica construído com **Angular 22 (Zoneless + Signals)**, **Three.js** e **Domínio Headless em TypeScript puro**.

---

## Principais Recursos

- **Montagem 3D Interativa (`PCWare IPM41-D3`):** Drag & Drop 3D com detecção de proximidade, rotação automática, snap magnético, validação de compatibilidade e ordem física (`CPU → Pasta Térmica → Cooler → RAM → GPU → Cabos`).
- **Mini Monitor 3D de Boot:** Tela dinâmica (`CanvasTexture`) que exibe o resultado real do POST (`Standby`, `NO SIGNAL`, `CPU OVER TEMPERATURE`, `AMI BIOS — Sem Disco` ou `✓ BOOT INICIALIZADO COM SUCESSO`).
- **Sistema de Conexões & Auditoria Física:** Cabos paramétricos 3D como entidades (`ATX 24P`, `CPU 4P`, `SATA Power`, `SATA Data`, `CPU_FAN`, `PCIe 6P`) + ensino explícito de `Conector disponível ≠ Conector necessário`.
- **Modo Visualização Elétrica:** Destaque 3D por linha de tensão (`+12V`, `+5V`, `+3.3V`, `+5VSB`, `Vcore`, `1.5V DDR3`) com pulsos animados nos cabos conectados.
- **Camada Educacional:** Dossiê técnico de **8 sub-abas** para todas as peças, regiões e cabos.
- **Laboratório de Diagnóstico (POST):** 5 casos de defeitos ocultos + sondas de investigação de bancada.
- **Onboarding, Ranking de Velocidade & Certificado:** Criação de usuário técnico, ranking por **velocidade de montagem (`mm:ss`)** e **pontuação (XP)**, desafios, histórico e certificado interno imprimível.
- **Arquitetura Multi-Equipamentos:** `PCWare IPM41-D3`, `Dell OptiPlex 3070`, `Servidor Rack 1U`, `Notebook Técnico 14"` e **Equipamento Personalizado** gerado em tempo real.
- **Mobile First:** Qualidade gráfica adaptativa (`Auto | Baixo | Médio | Alto`), interação touch (*long-press* + *pinch-to-zoom*), *Bottom Sheet* e orientação amigável para modo paisagem.

---

## Rodando Localmente

```bash
npm install
npm start
```

Abra `http://localhost:4200`.

### Build e Testes

```bash
npm run build
npx ng test --watch=false
```

---

## Publicação Automática no GitHub Pages

O repositório já inclui o workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml).

1. Crie um repositório no GitHub (ex.: `techbench-3d`).
2. Suba o código para a branch `main`.
3. No GitHub, acesse **Settings → Pages → Build and deployment → Source: `GitHub Actions`**.
4. A cada push na `main`, o GitHub Actions executa os testes, compila o Angular com o `--base-href` automático do repositório e publica o site no GitHub Pages!
