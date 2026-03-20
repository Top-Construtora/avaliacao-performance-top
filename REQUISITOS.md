# Requisitos - Sistema de RH (Top Construtora)

## Visao Geral

Transformar o sistema atual de Avaliacao de Performance em uma plataforma completa de RH, onde a avaliacao passa a ser **um modulo** dentro de um sistema maior.

---

## Modulos

### 1. Avaliacao de Desempenho (existente)
- Auto-avaliacao
- Avaliacao do lider
- Consenso / Comite de Pessoas
- Nine Box
- Ciclos de avaliacao
- Dashboard por role
- Competencias organizacionais / Codigo cultural

### 2. Gestao de Colaboradores (extensao do modulo existente)
O sistema ja possui cadastro, edicao e listagem de colaboradores, departamentos e equipes. As novas funcionalidades sao:
- **Filtro ativos/desligados** - visualizacao clara do status do colaborador (ja existe campo `is_active`)
- **Colaboradores completando 90 dias** - alerta/listagem automatica baseada na `admission_date`

### 3. Entrevistas
- **Entrevista de desligamento** - formulario estruturado para registrar feedback do colaborador ao sair
- **Entrevista de 90 dias** - formulario para acompanhamento do periodo de experiencia

### 4. Calendario de PDI
- Visualizacao em formato calendario dos planos de desenvolvimento individual
- Acompanhamento de prazos e status das acoes

### 5. Nivel de Satisfacao dos Colaboradores
- Pesquisas de satisfacao periodicas
- Dashboard com metricas de satisfacao
- Historico de resultados

### 6. Recrutamento e Selecao
- **Vagas em aberto** - cadastro e gerenciamento de vagas
- **Quantidade de curriculos recebidos** - contagem e registro por vaga
- **Entrevistas realizadas** - registro e acompanhamento
- **Descricao da vaga** - detalhamento completo (requisitos, beneficios, etc.)
- **Brief inicial** - formulario preenchido pelo gestor solicitante da vaga

---

## Diretrizes Tecnicas

- Manter o mesmo padrao visual existente (Tailwind, Space Grotesk, temas dark/light)
- Manter stack atual: React + Vite (frontend), Express + TypeScript (backend), Supabase (banco)
- Implementacao passo a passo, modulo por modulo
- Boas praticas: codigo limpo, tipagem forte, componentes reutilizaveis
- Cada modulo deve ser independente mas integrado ao sistema de navegacao principal

---

## Ordem de Implementacao (sugerida)

1. ~~**Reestruturacao da navegacao**~~ - CONCLUIDO (sidebar com secoes, header e footer atualizados)
2. ~~**Gestao de Colaboradores**~~ - CONCLUIDO (filtro ativos/inativos ja existia, adicionado alerta de 90 dias)
3. ~~**Entrevistas**~~ - CONCLUIDO (tabelas SQL, backend API, frontend com listagem e formulários)
4. ~~**Calendario de PDI**~~ - CONCLUIDO (rota backend /pdi/all, pagina calendario com visualizacao mensal, painel lateral de detalhes, filtros por status)
5. ~~**Nivel de Satisfacao**~~ - CONCLUIDO (tabelas SQL, backend API, pesquisas com 3 tipos de pergunta, pagina de resposta, dashboard de resultados com graficos)
6. ~~**Recrutamento e Selecao**~~ - CONCLUIDO (tabelas SQL, backend API, listagem de vagas, formulario com brief do gestor, gestao de candidatos com pipeline de status)
