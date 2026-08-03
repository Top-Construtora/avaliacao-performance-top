# Estudo — Referências públicas de UI aplicadas à GIO (avaliacao-performance-top)

**Data:** 2026-08-03 · **Escopo:** reactbits.dev, 21st.dev, uiverse.io, gsap.com, motion.dev, threejs.org → onde aplicar no nosso sistema.

---

## 1. Onde estamos (inventário do frontend)

**Stack real:** React 18.3 + TypeScript + Tailwind 3.4 + **framer-motion 11.18** (61 arquivos) + lucide + react-hot-toast. Sem lib de gráficos em uso (tudo SVG/div à mão). `chart.js`, `react-table`, `react-hook-form` e **toda a pasta `components/ui/` (30 arquivos shadcn/Radix, ~1.900 linhas)** estão instalados e **mortos**.

**O que já é bom (nossa régua de qualidade):**

- `Login.tsx` + `CursorGrid` (React Bits portado) — a tela mais polida do app;
- `evaluation-flow/*` — wizard com swipe, springs, `useReducedMotion`, a11y (só serve 2 telas);
- `Sidebar` (crossfade da marca), `ThemeToggle`, `NotFound`, `GioLoading` (subutilizado).

**Onde a UI está crua:**

- **30 páginas** com spinner bloqueante; zero skeletons;
- **KPIs 100% estáticos** — nenhum contador animado no app inteiro (Home ×4, Reports, EvaluationDashboard, NineBox);
- Toast **branco hardcoded** mesmo no dark mode;
- `Button` sem estado de loading (416 ações com toast e nenhum feedback in-place);
- Page transition quebrada (`exit` sem `AnimatePresence` em `Layout.tsx:161`);
- Listas grandes sem stagger/paginação (UserManagement etc.); tabelas cruas (AuditLog, RecruitmentList, Reports);
- NineBox = grid CSS 3×3 estático, 1 ponto por vez, sem tooltip;
- Formulários gigantes sem steps (RegisterUser 1.275 linhas, EditUser 1.525) — o wizard que resolveria isso já existe (`EvaluationFlow`);
- ~30 empty states genéricos (ícone `opacity-50` + parágrafo).

**Bugs/dívidas achados de brinde:** classes inexistentes no Header (`bg-status-success-50`…) — cores de notificação não pintam; divisão por zero em `EvaluationDashboard` (`width: NaN%`); DM Sans declarada como fonte primária mas nunca carregada; paletas legadas `top-*`/`naue-*`/`yt-*` com safelist de ~60 classes; dois Buttons conflitantes; raio de borda sem padrão (token 10px vs uso real 16px).

---

## 2. As seis referências — veredicto para o nosso caso

| Referência              | O que é                                                                                                                                                                                                         | Licença                                                                                | Veredicto                                                                                                                                                                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Motion (motion.dev)** | Sucessora oficial do framer-motion (pacote `motion`, import `motion/react`). Motion 12 **sem breaking changes** vs v11. Hybrid engine (WAAPI, 120fps), bundle menor (`LazyMotion` ~4,6 KB)                      | Core **MIT**; Motion+ (£299) só para componentes premium/exemplos                      | ✅ **Adotar como espinha dorsal.** Já usamos a API inteira; migração é trocar import                                                                                                      |
| **React Bits**          | ~140 componentes curados (backgrounds, text animations, micro-interações, counters). 4 variantes por componente (JS/TS × CSS/Tailwind), copy-paste ou shadcn CLI. Cores via props (fácil aplicar lime/obsidian) | MIT + Commons Clause: **uso comercial OK**, proibido revender os componentes           | ✅ **Fonte principal de efeitos.** Já usamos (CursorGrid). Sem foco em a11y — adicionar `prefers-reduced-motion` ao portar                                                                |
| **GSAP**                | Motor de animação imperativo. **100% gratuito desde a 3.13** (pós-Webflow), incluindo SplitText, Flip, MorphSVG, ScrollTrigger. React via `@gsap/react`/`useGSAP` (cleanup automático). Core ~23 KB gz          | "GSAP Standard License" proprietária, sem custo; sem restrição prática para nosso SaaS | ⚠️ **Adotar pontualmente** (fase 2): Flip para NineBox/reordenação, SplitText em títulos. Coexiste com motion (nunca as duas na mesma propriedade do mesmo elemento)                      |
| **21st.dev**            | Marketplace comunitário (~20k variações): Stats & KPIs (153), Dashboards (400), Empty States (77), Progress (375), Tables (313)… TSX + Tailwind + convenções shadcn                                             | **Por autor, muitas vezes indefinida.** Termos não dão grant uniforme                  | ⚠️ **Catálogo de inspiração.** Quando um componente interessar, buscar a lib original do autor (Magic UI, Origin UI, Kokonut — MIT) e copiar de lá                                        |
| **Uiverse**             | 3–6k snippets HTML+CSS/Tailwind copy-paste (buttons, loaders, toggles, inputs)                                                                                                                                  | **MIT** declarado no site                                                              | 🟡 **Inspiração/casos pontuais** (loaders, toggles). Qualidade heterogênea; os **UI Kits oficiais** (`uiverse-astronaut`) são o subconjunto confiável. Preferir portar para nossos tokens |
| **Three.js**            | 3D WebGL/WebGPU (+ react-three-fiber). Bundle ~150–170 KB gz + parse pesado; render loop consome GPU contínuo (ruim p/ notebook corporativo)                                                                    | MIT                                                                                    | ❌ **Não adotar.** Nosso CursorGrid (canvas 2D) já cobre o login; celebrações → `canvas-confetti` (~2 KB); se um dia quisermos aurora WebGL, usar **OGL** (~10 KB) via React Bits         |

---

## 3. Mapa de aplicação — elemento por elemento

### 3.1 Fundação (pré-requisito, ~meio dia)

- **Migrar `framer-motion` 11 → `motion`**: trocar imports para `motion/react` nos 61 arquivos (Motion 12 não tem breaking changes vs v11). Habilita os exemplos free do motion.dev e o hybrid engine.
- **Corrigir a page transition**: envolver o `motion.div` do `Layout` em `AnimatePresence mode="wait"` (o `exit` hoje nunca roda).

### 3.2 Botões

| Melhoria                                                                              | Fonte                    | Notas                                                                                           |
| ------------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------- |
| Estado de loading no `Button` (spinner interno + `aria-busy`, largura estável)        | próprio + padrão Motion  | Maior ganho de UX por linha de código do app; elimina os "Salvando…" reimplementados por página |
| Micro-interação de clique: **Click Spark** (faíscas lime no ponto do clique)          | React Bits `click-spark` | Global e barato (canvas 2D); usar só no CTA primário                                            |
| Hover premium no CTA: **Glare Hover** ou **Star Border** (luz percorrendo o contorno) | React Bits               | Reservar para CTAs de destaque (Entrar, Salvar PDI, Enviar Avaliação)                           |

### 3.3 Inputs e formulários

- **Extrair `<Input>`/`<Select>` compartilhados** — a string de classes de foco lime está duplicada dezenas de vezes; centralizar é pré-requisito para qualquer refinamento.
- Focus ring animado (escala/glow sutil no focus) — padrão próprio com motion; Uiverse como inspiração.
- **Formulários longos → wizard**: generalizar o `EvaluationFlow` (que já é excelente) ou usar o padrão **Stepper** (React Bits) para RegisterUser/EditUser/InterviewForm.
- Validação: adotar `react-hook-form` (já instalado, morto) + foco no primeiro erro.

### 3.4 Sidebar

- Já é boa (crossfade da marca, portal no colapsado). Upgrade de maior efeito: **indicador ativo deslizante** — a barrinha lime viaja entre itens com `layoutId` (shared layout animation do Motion) em vez de aparecer/sumir.
- Stagger sutil nos itens ao expandir seção (motion variants; já temos o padrão no DirectorDashboard).

### 3.5 Header

- **Corrigir as classes inexistentes** do `notificationTypeConfig` (bug: cores não pintam).
- Sino: badge com **spring pop** ao chegar notificação; dropdown com stagger nos itens (exemplos free do motion.dev — "Toast: Notifications list").
- Relógio/data com `font-variant-numeric` já ok; sem mudança.

### 3.6 Dashboards e KPIs (Home ×4, Reports, EvaluationDashboard)

| Melhoria                                                                                            | Fonte                                                                    | Notas                                                                      |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **Count-up nos números** (0 → valor com spring)                                                     | React Bits `count-up` **ou** exemplo free "Number counter" do motion.dev | O app não tem um único número animado; é a melhoria mais visível do estudo |
| Dígitos rolantes em destaques (ex.: nota final)                                                     | React Bits `counter`                                                     | Usar com parcimônia                                                        |
| Anéis de progresso: animar `strokeDashoffset` com motion (hoje é CSS transition disparada no mount) | próprio + motion                                                         | Anéis já existem em Leader/CollaboratorDashboard                           |
| **Spotlight Card** nos cards de KPI (glow lime seguindo o mouse)                                    | React Bits `spotlight-card`                                              | Combina com a identidade; versão CSS custom properties é leve              |
| Guard de divisão por zero no EvaluationDashboard                                                    | correção                                                                 | `width: NaN%` hoje                                                         |

### 3.7 Loading e empty states

- **Skeleton screens** nas 10 telas mais acessadas (o componente `Skeleton` existe morto em `ui/`; ressuscitar só ele ou reescrever em 15 linhas com Tailwind `animate-pulse`). Elimina o layout shift do spinner bloqueante.
- `GioLoading` (anel + wordmark) promovido a fallback do `Suspense` de rota (hoje a área central fica vazia durante chunk load).
- Empty states: ícone com **Blur Text** / fade-up (React Bits `blur-text` ou motion variants) + CTA contextual; diferenciar "busca sem resultado" de "sem dados ainda". Inspiração de composição: categoria Empty States do 21st.dev (77 exemplos — copiar composição, não código).

### 3.8 Listas e tabelas

- **Stagger de entrada** nos grids de cards (UserManagement, Teams, Departments, Feedbacks): `motion` variants com `delay: index * 0.04` — padrão que o Reports já usa em um lugar.
- Tabelas (AuditLog, RecruitmentList, Reports): hover row, sticky header, entrada animada das linhas; sort visual. Base própria + inspiração 21st.dev/Origin UI (Tables).
- **Reorder** (motion, free) onde houver ordenação manual futura.
- Paginação/virtualização no UserManagement (111+ usuários renderizados de uma vez).

### 3.9 NineBox (a tela com maior potencial visual)

- Movimento entre quadrantes com **GSAP Flip** (grava layout → muda quadrante → anima a diferença) ou shared layout do Motion — o ponto do colaborador "viaja" pela matriz em vez de teleportar.
- Tooltip nos quadrantes; visão de população (todos os pontos, com hover) em vez de 1 ponto por vez.
- Contadores animados nos cards Performance/Potencial (mesmo padrão do 3.6).

### 3.10 Login / 404 (efeito "wow" controlado)

- Login já tem CursorGrid. Complementos opcionais React Bits: **Dark Veil**/**Soft Aurora** (variante OGL leve) atrás do painel de marca; **Split Text**/**Blur Text** no headline "Pessoas no centro…".
- 404: **Decrypted Text** no título (React Bits) — combina com o clima blueprint.
- Celebração ao concluir autoavaliação/ciclo: `canvas-confetti` (~2 KB) pontual — não Three.js.

### 3.11 Toasts

- **Corrigir o estilo hardcoded** (branco no dark mode): mapear para tokens do tema, success/error do design system.
- Evoluir para toasts empilhados animados (exemplo free "Stacked notifications" do motion.dev) mantendo react-hot-toast, ou custom render.

---

## 4. Roadmap sugerido

**Fase 1 — Quick wins (1–2 dias, alto impacto):**

1. Migração `framer-motion` → `motion` + conserto da page transition (`AnimatePresence`).
2. Count-up nos KPIs dos 4 dashboards + Reports.
3. `Button` com estado de loading.
4. Toast respeitando o tema.
5. Skeletons nas 5 telas mais usadas (Home, UserManagement, Reports, PdiManagement, EvaluationDashboard).
6. Correções de brinde: classes do Header, NaN%, fonte DM Sans (importar ou remover da stack de fontes).

**Fase 2 — Identidade em movimento (3–5 dias):** 7. Spotlight Card nos KPIs; Click Spark no CTA primário; indicador deslizante na Sidebar (`layoutId`). 8. Stagger em listas/grids; tabelas com hover/sticky/entrada animada. 9. Empty states padronizados (componente único com variantes). 10. NineBox: Flip/layout animation + tooltips + população.

**Fase 3 — Estrutural (contínuo):** 11. Formulários longos no padrão wizard (generalizar EvaluationFlow/Stepper). 12. Limpeza: remover `components/ui/` morto **ou** adotá-lo de verdade (decisão única); desinstalar chart.js/react-table se não usar; matar paletas legadas `top-*`/`naue-*`/`yt-*` e safelist. 13. Se gráficos reais entrarem no roadmap (Reports/NineBox população), decidir lib de charts nessa hora — hoje nada usa as instaladas.

---

## 5. Regras de adoção (para não virar circo)

1. **Um efeito WebGL/canvas por tela, no máximo** — e só em telas sem densidade de dados (login, 404, vazio).
2. **`prefers-reduced-motion` em tudo que portar** — React Bits/Uiverse não trazem isso; o `EvaluationFlow` já mostra como fazemos.
3. **Nunca motion e GSAP na mesma propriedade do mesmo elemento** (briga por `transform`).
4. **21st.dev/Uiverse = inspiração**; código entra no repo vindo do React Bits (licença clara), das libs MIT originais dos autores, ou escrito por nós nos nossos tokens.
5. **Cores sempre via tokens** (lime `#D2FF00`, obsidian, surfaces) — nada de paleta própria de componente importado.
6. **Movimento com propósito**: entrada de conteúdo, mudança de estado, feedback de ação. Decoração contínua só no login/404.

---

_Levantamento feito com 4 agentes (3 de pesquisa web + 1 de inventário do código) em 2026-08-03. Fontes citadas nos outputs dos agentes; números de bundle são ordem de grandeza._
