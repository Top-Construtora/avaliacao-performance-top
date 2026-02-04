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
- `POST /api/auth/login` - Login com email/senha
- `POST /api/auth/register` - Cadastro de usuário
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Perfil do usuário autenticado

### Usuários (`/api/users`)
- `GET /api/users` - Listar usuários (com filtros)
- `POST /api/users` - Criar usuário
- `GET /api/users/:id` - Detalhes do usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Remover usuário
- `GET /api/users/leader/:id/subordinates` - Listar subordinados

### Avaliações (`/api/evaluations`)
- `GET /api/evaluations/cycles` - Listar ciclos
- `GET /api/evaluations/cycles/current` - Ciclo atual
- `POST /api/evaluations/cycles` - Criar ciclo
- `PUT /api/evaluations/cycles/:id/open` - Abrir ciclo
- `PUT /api/evaluations/cycles/:id/close` - Fechar ciclo
- `POST /api/evaluations/self` - Criar autoavaliação
- `POST /api/evaluations/leader` - Criar avaliação do líder
- `GET /api/evaluations/employee/:id` - Avaliações do colaborador
- `GET /api/evaluations/cycles/:id/nine-box` - Dados da Matriz Nine Box
- `GET /api/evaluations/cycles/:id/dashboard` - Dashboard do ciclo

### PDI (`/api/pdi`)
- `POST /api/pdi` - Salvar PDI
- `GET /api/pdi/:employeeId` - PDI do colaborador
- `PUT /api/pdi/:pdiId` - Atualizar PDI
- `GET /api/pdi/cycle/:cycleId` - PDIs do ciclo

### Departamentos (`/api/departments`)
- `GET /api/departments` - Listar departamentos
- `POST /api/departments` - Criar departamento
- `PUT /api/departments/:id` - Atualizar departamento
- `DELETE /api/departments/:id` - Remover departamento

### Salários & Carreira (`/api/salary`)
- `GET/POST/PUT/DELETE /api/salary/classes` - Classes salariais
- `GET/POST/PUT/DELETE /api/salary/positions` - Cargos
- `GET/POST/PUT/DELETE /api/salary/levels` - Níveis salariais
- `GET/POST/PUT/DELETE /api/salary/career-tracks` - Trilhas de carreira
- `GET/POST/PUT/DELETE /api/salary/track-positions` - Cargos nas trilhas
- `GET/POST/PUT/DELETE /api/salary/progression-rules` - Regras de progressão
- `POST /api/salary/assign-user` - Atribuir colaborador a trilha
- `POST /api/salary/progress-user` - Progredir colaborador
- `GET /api/salary/reports/*` - Relatórios salariais

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
