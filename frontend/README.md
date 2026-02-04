# Frontend - Avaliação de Performance

Sistema de avaliação de desempenho desenvolvido com React 18, TypeScript e Tailwind CSS.

## Stack Tecnológico

- **React 18.3** - Framework UI
- **TypeScript 5.5** - Tipagem estática
- **Vite 5.4** - Build tool e dev server
- **Tailwind CSS 3.4** - Estilização
- **Framer Motion** - Animações
- **Chart.js** - Gráficos e visualizações
- **Lucide React** - Ícones
- **React Hot Toast** - Notificações

## Estrutura do Projeto

```
src/
├── components/         # Componentes reutilizáveis
├── pages/             # Páginas da aplicação
├── services/          # Camada de comunicação com API
├── context/           # Estado global (Context API)
├── hooks/             # Hooks customizados
├── types/             # Definições TypeScript
├── config/            # Configurações (API client)
└── lib/               # Bibliotecas (Supabase)
```

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente criando `.env`:
```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:5173`

## Scripts Disponíveis

```bash
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build de produção
npm run lint         # Executa o linter
```

## Funcionalidades Principais

### Dashboards por Papel
- **Admin**: Gestão completa do sistema
- **Diretor**: Visão estratégica e relatórios
- **Líder**: Gestão de equipe e avaliações
- **Colaborador**: Autoavaliação e PDI pessoal

### Módulos
- Avaliação de Desempenho (Self + Leader + Consenso)
- Nine Box Matrix (Performance x Potencial)
- PDI (Plano de Desenvolvimento Individual)
- Gestão de Carreira e Salários
- Relatórios e Exportações (PDF/Excel)

## Autenticação

O sistema utiliza Supabase Auth com JWT tokens. O refresh automático de tokens é implementado no `config/api.ts`.

## Temas

Suporta tema claro e escuro com preferência salva no localStorage.

## Build de Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados em `dist/` e podem ser servidos por qualquer servidor estático.
