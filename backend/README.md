# Backend - Avaliação de Performance

API REST desenvolvida com Express, TypeScript e Supabase para o sistema de avaliação de desempenho.

## Stack Tecnológico

- **Express 4.18** - Framework web
- **TypeScript 5.3** - Tipagem estática
- **Supabase** - Banco de dados PostgreSQL e autenticação
- **PDFKit** - Geração de PDFs no servidor
- **ExcelJS** - Geração de planilhas Excel
- **Helmet** - Segurança HTTP headers
- **CORS** - Controle de origem cruzada

## Estrutura do Projeto

```
src/
├── app.ts              # Configuração do Express
├── config/             # Configurações (Supabase)
├── controllers/        # Handlers de requisição
├── routes/             # Definição de rotas
├── services/           # Lógica de negócio
├── middleware/         # Middlewares (auth, error handler)
├── types/              # Definições TypeScript
└── utils/              # Utilitários
```

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure as variáveis de ambiente criando `.env`:
```env
# Servidor
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_KEY=sua-service-key

# JWT
JWT_SECRET=sua-chave-secreta
```

3. Inicie o servidor:
```bash
npm run dev
```

A API estará disponível em `http://localhost:3001`

## Scripts Disponíveis

```bash
npm run dev          # Inicia o servidor em modo desenvolvimento
npm run build        # Compila TypeScript para JavaScript
npm start            # Inicia o servidor de produção
```

## Endpoints da API

### Autenticação (`/api/auth`)
- `POST /login` - Login com email/senha
- `POST /register` - Cadastro de usuário
- `POST /logout` - Logout
- `GET /profile` - Perfil do usuário autenticado

### Usuários (`/api/users`)
- `GET /` - Listar usuários (com filtros)
- `POST /` - Criar usuário
- `GET /:id` - Detalhes do usuário
- `PUT /:id` - Atualizar usuário
- `DELETE /:id` - Remover usuário
- `GET /leader/:id/subordinates` - Listar subordinados

### Avaliações (`/api/evaluations`)
- Gestão de ciclos de avaliação
- Autoavaliação e avaliação do líder
- Matriz Nine Box
- Dashboard analítico

### PDI (`/api/pdi`)
- Criação e gestão de planos de desenvolvimento
- Acompanhamento de itens por ciclo

### Departamentos (`/api/departments`)
- CRUD de departamentos e equipes

### Salários & Carreira (`/api/salary`)
- Gestão de classes salariais
- Trilhas de carreira
- Relatórios salariais

## Segurança

- **Helmet**: Headers HTTP seguros
- **CORS**: Whitelist de origens permitidas
- **JWT**: Autenticação com tokens
- **Middleware de autorização**: Validação de papéis e permissões
- **Supabase Auth**: Gestão de autenticação

## Banco de Dados

O backend utiliza Supabase (PostgreSQL) com as seguintes tabelas principais:

- `users` - Usuários do sistema
- `departments` / `teams` - Estrutura organizacional
- `evaluation_cycles` - Ciclos de avaliação
- `self_evaluations` / `leader_evaluations` - Avaliações
- `personal_development_plans` - PDIs
- `career_tracks` / `salary_classes` - Carreira e salários

## Build de Produção

```bash
npm run build
```

Os arquivos compilados serão gerados em `dist/` e podem ser executados com:

```bash
npm start
```

## Deploy

Recomendado para deploy em:
- Render
- Railway
- Heroku
- AWS EC2
- DigitalOcean

Certifique-se de configurar todas as variáveis de ambiente no serviço de hosting.
