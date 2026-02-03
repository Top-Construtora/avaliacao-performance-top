# Avaliação de Performance - Top Construtora

![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-06b6d4?logo=tailwindcss&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646cff?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/Licença-Privado-red)

Sistema de avaliação de desempenho, gestão de carreira e desenvolvimento pessoal para a **Top Construtora**. Monorepo com frontend React e backend Express, ambos em TypeScript.

---

## Funcionalidades

### Avaliação de Desempenho
- **Ciclos de avaliação** com abertura e fechamento controlado
- **Autoavaliação** de competências técnicas, comportamentais e organizacionais
- **Avaliação do líder** com análise de potencial
- **Consenso** consolidando múltiplas avaliações
- **Matriz Nine Box** (Performance x Potencial) com visualização interativa
- **Código Cultural** - competências organizacionais configuráveis

### Gestão de Carreira & Salários
- **Trilhas de carreira** com cargos e progressão definida
- **Classes salariais** com níveis e multiplicadores
- **Regras de progressão** entre cargos
- **Atribuição de colaboradores** a trilhas e faixas salariais
- **Relatórios salariais** por departamento e cargo

### PDI (Plano de Desenvolvimento Individual)
- Criação de planos com itens de ação por competência
- Prazos: curto, médio e longo prazo
- Acompanhamento de status em 5 níveis
- Integração com ciclos de avaliação

### Gestão Organizacional
- **Usuários** com 4 papéis: Admin, Diretor, Líder, Colaborador
- **Departamentos** e **equipes** com hierarquia
- **Dashboards** específicos por papel
- **Notificações** persistentes
- **Tema escuro/claro**

### Relatórios & Exportação
- Dashboard analítico de avaliações
- Exportação em **PDF** (jsPDF / PDFKit)
- Exportação em **Excel** (XLSX / ExcelJS)
- Relatórios de trilha de carreira

---

## Arquitetura

```
avaliacao-performance-top/
├── frontend/          # React 18 + Vite + Tailwind CSS
├── backend/           # Express 4 + TypeScript + Supabase
└── package.json       # Scripts do monorepo (concurrently)
```

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18.x
- Conta no [Supabase](https://supabase.com/) com projeto configurado

## Instalação

```bash
# Instalar todas as dependências (raiz + frontend + backend)
npm run install:all
```

## Executando

```bash
# Frontend + Backend simultaneamente (recomendado)
npm run dev

# Apenas frontend (http://localhost:5173)
npm run dev:frontend

# Apenas backend (http://localhost:3001)
npm run dev:backend
```

## Build

```bash
# Build do frontend (produção)
npm run build:frontend

# Build do backend (compila TypeScript)
npm run build:backend
```

## Outros comandos

```bash
# Limpar todos os node_modules
npm run clean

# Limpar e reinstalar tudo
npm run clean:install

# Trocar variáveis de ambiente
npm run switch-env
```

---

## Frontend

### Estrutura

```
frontend/src/
├── components/         # 18 componentes reutilizáveis
│   ├── Layout.tsx              # Wrapper principal (Header + Sidebar)
│   ├── ProtectedRoute.tsx      # Guard de rota por autenticação
│   ├── RoleGuard.tsx           # Guard de rota por papel
│   ├── CriteriaRating.tsx      # Rating interativo de competências
│   ├── PDIViewer.tsx           # Visualização do PDI
│   ├── ThemeToggle.tsx         # Alternância escuro/claro
│   └── ...
├── pages/              # Páginas organizadas por domínio
│   ├── auth/                   # Login, Esqueci Senha, Reset
│   ├── home/                   # Dashboards (Admin, Diretor, Líder, Colaborador)
│   ├── evaluations/            # Autoavaliação, Líder, Consenso, Nine Box
│   ├── pdi/                    # Meu PDI, Gestão de PDIs
│   ├── management/             # Ciclos, Salários, Código Cultural
│   ├── users/                  # CRUD de usuários
│   ├── teams/                  # CRUD de equipes
│   ├── departments/            # CRUD de departamentos
│   ├── carrer/                 # Trilhas de carreira
│   ├── reports/                # Relatórios e Dashboard analítico
│   ├── settings/               # Configurações do usuário
│   ├── notifications/          # Histórico de notificações
│   └── help/                   # Página de ajuda
├── services/           # Camada de API (7 serviços)
│   ├── auth.service.ts
│   ├── evaluation.service.ts
│   ├── user.service.ts
│   ├── departments.service.ts
│   ├── salary.service.ts
│   ├── pdiService.ts
│   └── supabase.service.ts
├── context/            # React Context (estado global)
│   ├── AuthContext.tsx          # Autenticação e tokens
│   ├── EvaluationContext.tsx    # Ciclos, PDI, Nine Box
│   ├── ThemeContext.tsx         # Tema escuro/claro
│   └── UserContext.tsx          # Dados do usuário
├── hooks/              # Hooks customizados
├── types/              # Definições TypeScript
├── config/
│   └── api.ts                  # Cliente API centralizado com refresh de token
└── lib/
    └── supabase.ts             # Cliente Supabase
```

### Principais Bibliotecas

| Biblioteca | Uso |
|---|---|
| **React 18** | Framework UI |
| **Vite** | Build tool com HMR |
| **Tailwind CSS** | Estilização utility-first |
| **Framer Motion** | Animações suaves |
| **Chart.js** + react-chartjs-2 | Gráficos e analytics |
| **Lucide React** | Ícones |
| **jsPDF** + jspdf-autotable | Exportação PDF |
| **XLSX** | Exportação Excel |
| **React Hot Toast** | Notificações toast |
| **React Table** | Tabelas de dados |
| **Space Grotesk** | Fonte customizada |

### Variáveis de Ambiente (frontend)

Crie `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

---

## Backend

### Estrutura

```
backend/src/
├── app.ts              # Configuração Express (CORS, Helmet, rotas)
├── config/
│   └── supabase.ts     # Cliente Supabase
├── controllers/        # Handlers de requisição (6 controllers)
│   ├── authController.ts
│   ├── evaluationController.ts
│   ├── userController.ts
│   ├── departmentController.ts
│   ├── salaryController.ts
│   └── pdiController.ts
├── routes/             # Definição de rotas (7 arquivos)
│   ├── authRoutes.ts
│   ├── evaluationRoutes.ts
│   ├── userRoutes.ts
│   ├── departmentRoutes.ts
│   ├── salaryRoutes.ts
│   ├── pdiRoutes.ts
│   └── index.ts
├── services/           # Lógica de negócio (6 serviços)
│   ├── authService.ts
│   ├── evaluationService.ts
│   ├── userService.ts
│   ├── exportService.ts
│   ├── salaryService.ts
│   └── pdiService.ts
├── middleware/
│   ├── auth.ts         # Verificação JWT + Supabase Auth
│   └── errorHandler.ts # Handler global de erros
├── types/              # Definições TypeScript
└── utils/              # Utilitários (regras salariais, filtros)
```

### Endpoints da API

#### Autenticação (`/api/auth`)
| Método | Rota | Descrição |
|---|---|---|
| POST | `/login` | Login com email/senha |
| POST | `/register` | Cadastro de usuário |
| POST | `/logout` | Logout |
| GET | `/profile` | Perfil do usuário autenticado |

#### Usuários (`/api/users`)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Listar usuários (com filtros) |
| POST | `/` | Criar usuário |
| GET | `/:id` | Detalhes do usuário |
| PUT | `/:id` | Atualizar usuário |
| DELETE | `/:id` | Remover usuário |
| GET | `/leader/:id/subordinates` | Listar subordinados |

#### Avaliações (`/api/evaluations`)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/cycles` | Listar ciclos |
| GET | `/cycles/current` | Ciclo atual |
| POST | `/cycles` | Criar ciclo |
| PUT | `/cycles/:id/open` | Abrir ciclo |
| PUT | `/cycles/:id/close` | Fechar ciclo |
| POST | `/self` | Criar autoavaliação |
| POST | `/leader` | Criar avaliação do líder |
| GET | `/employee/:id` | Avaliações do colaborador |
| GET | `/cycles/:id/nine-box` | Dados da Matriz Nine Box |
| GET | `/cycles/:id/dashboard` | Dashboard do ciclo |

#### PDI (`/api/pdi`)
| Método | Rota | Descrição |
|---|---|---|
| POST | `/` | Salvar PDI |
| GET | `/:employeeId` | PDI do colaborador |
| PUT | `/:pdiId` | Atualizar PDI |
| GET | `/cycle/:cycleId` | PDIs do ciclo |

#### Departamentos (`/api/departments`)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/` | Listar departamentos |
| POST | `/` | Criar departamento |
| PUT | `/:id` | Atualizar departamento |
| DELETE | `/:id` | Remover departamento |

#### Salários & Carreira (`/api/salary`)
| Método | Rota | Descrição |
|---|---|---|
| CRUD | `/classes` | Classes salariais |
| CRUD | `/positions` | Cargos |
| CRUD | `/levels` | Níveis salariais |
| CRUD | `/career-tracks` | Trilhas de carreira |
| CRUD | `/track-positions` | Cargos nas trilhas |
| CRUD | `/progression-rules` | Regras de progressão |
| POST | `/assign-user` | Atribuir colaborador a trilha |
| POST | `/progress-user` | Progredir colaborador |
| GET | `/reports/*` | Relatórios salariais |

### Variáveis de Ambiente (backend)

Crie `backend/.env`:

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

# E-mail (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-de-app
EMAIL_FROM=seu-email@gmail.com
EMAIL_REPLY_TO=seu-email@gmail.com
```

---

## Banco de Dados (Supabase)

### Tabelas principais

| Grupo | Tabelas |
|---|---|
| **Autenticação** | `users` (com papéis, departamento, cargo, salário) |
| **Organização** | `departments`, `teams`, `team_members` |
| **Avaliação** | `evaluation_cycles`, `self_evaluations`, `leader_evaluations`, `evaluation_competencies` |
| **Carreira** | `salary_classes`, `job_positions`, `salary_levels`, `career_tracks`, `track_positions`, `progression_rules`, `user_salary_history` |
| **PDI** | `personal_development_plans`, `pdi_items` |

### Papéis de Usuário

| Papel | Acesso |
|---|---|
| **Admin** | Acesso total ao sistema, gestão de usuários e configurações |
| **Diretor** | Dashboard RH, gestão de ciclos, relatórios, Nine Box |
| **Líder** | Avaliação de subordinados, PDI da equipe, dashboard de equipe |
| **Colaborador** | Autoavaliação, visualização do próprio PDI, dashboard pessoal |

---

## Segurança

- **Helmet** para headers HTTP seguros
- **CORS** com whitelist de origens permitidas
- **Rate Limiting** contra abuso de requisições
- **Supabase Auth** para autenticação gerenciada
- **JWT** com refresh automático de tokens
- **Guards de rota** por papel no frontend
- **Middleware de autorização** no backend

## Deploy

| Componente | Plataforma |
|---|---|
| Frontend | Vercel / Netlify (build estático) |
| Backend | Render |
| Banco de dados | Supabase (PostgreSQL gerenciado) |

```bash
# Build de produção do frontend
npm run build:frontend

# Build do backend
npm run build:backend

# Iniciar backend em produção
cd backend && npm start
```

---

Desenvolvido para **Top Construtora**
