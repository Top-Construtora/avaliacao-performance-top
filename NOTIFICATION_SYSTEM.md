# Sistema de Notificações Real-time

Documentação completa do sistema de notificações para replicação em outros projetos.

## Stack

- **Backend**: Express + TypeScript + Supabase (PostgreSQL)
- **Frontend**: React + TypeScript + Supabase Realtime
- **Real-time**: Supabase Realtime (postgres_changes)

---

## Arquitetura

```
Ação do usuário (ex: completar avaliação)
  → Controller chama notificationService.send() (fire-and-forget)
    → Resolve destinatários (user, role, team, department, all)
    → Aplica anti-spam (always, aggregate, cooldown)
    → INSERT na tabela notifications (via supabaseAdmin)
      → Supabase Realtime dispara evento automático
        → Frontend (subscrito no channel) recebe INSERT
          → Atualiza bell badge + mostra toast
```

---

## 1. Banco de Dados

### Tabela `notifications`

```sql
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  action_url text,
  entity_type text,
  entity_id text,
  group_key text,
  metadata jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);
```

### Campos explicados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `recipient_id` | uuid FK | Quem recebe a notificação |
| `actor_id` | uuid FK | Quem disparou (null = sistema) |
| `type` | text | Tipo da notificação (ex: `evaluation_cycle_opened`) |
| `title` | text | Título curto exibido no bell/toast |
| `message` | text | Mensagem descritiva |
| `priority` | text | `low`, `medium`, `high` |
| `action_url` | text | Rota de navegação ao clicar |
| `entity_type` | text | Tipo da entidade relacionada (ex: `evaluation_cycle`) |
| `entity_id` | text | ID da entidade relacionada |
| `group_key` | text | Chave para anti-spam (ex: `candidate_new:{opening_id}`) |
| `metadata` | jsonb | Dados extras (scores, contadores de aggregate, etc.) |
| `read` | boolean | Se foi lida |
| `archived` | boolean | Se foi arquivada |
| `read_at` | timestamptz | Quando foi lida |

### Índices

```sql
CREATE INDEX idx_notifications_recipient_id ON notifications(recipient_id);
CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_id, read) WHERE archived = false;
CREATE INDEX idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_group_key ON notifications(recipient_id, group_key) WHERE read = false;
```

### RLS (Row Level Security)

```sql
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Usuários veem apenas suas notificações
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (auth.uid() = recipient_id);

-- Usuários atualizam apenas suas notificações
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Usuários deletam apenas suas notificações
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE USING (auth.uid() = recipient_id);

-- Service role pode inserir para qualquer usuário
CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT WITH CHECK (true);
```

### Habilitar Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

Depois verificar no Supabase Dashboard: **Database > Replication > supabase_realtime** → toggle da tabela `notifications` ativo.

---

## 2. Backend - Types

### `notification.types.ts`

```typescript
// Todos os tipos de notificação do sistema
export type NotificationType =
  | 'evaluation_cycle_opened'
  | 'self_evaluation_completed'
  | 'pdi_created'
  // ... adicionar conforme necessidade

export type NotificationPriority = 'low' | 'medium' | 'high';
export type AntiSpamStrategy = 'always' | 'aggregate' | 'cooldown';
export type DisplayCategory = 'success' | 'info' | 'warning' | 'alert' | 'achievement';

// Tipos de destinatário
export type RecipientTarget =
  | { type: 'user'; user_id: string }        // pessoa específica
  | { type: 'role'; role: 'admin' | 'director' | 'leader' }  // todos com essa role
  | { type: 'team'; team_id: string }         // todos do time
  | { type: 'department'; department_id: string }  // todos do departamento
  | { type: 'all' };                          // broadcast

// Input para enviar notificação
export interface SendNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  targets: RecipientTarget[];
  actor_id?: string;
  priority?: NotificationPriority;
  action_url?: string;
  entity_type?: string;
  entity_id?: string;
  group_key?: string;          // chave para anti-spam
  anti_spam?: AntiSpamStrategy; // estratégia: always | aggregate | cooldown
  cooldown_minutes?: number;    // para strategy cooldown (default 30)
  metadata?: Record<string, any>;
}

// Config padrão por tipo de notificação
export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, {
  defaultPriority: NotificationPriority;
  displayCategory: DisplayCategory;
}> = {
  evaluation_cycle_opened: { defaultPriority: 'high', displayCategory: 'info' },
  self_evaluation_completed: { defaultPriority: 'medium', displayCategory: 'success' },
  pdi_created: { defaultPriority: 'medium', displayCategory: 'info' },
  // ... mapear cada tipo
};
```

---

## 3. Backend - Service

### `notificationService.ts`

O service é o core do sistema. Pontos-chave:

#### `send()` - Método principal

```typescript
async send(supabase, input: SendNotificationInput): Promise<void> {
  try {
    // 1. Resolver destinatários
    const recipientIds = await this.resolveRecipients(supabase, input.targets);

    // 2. Remover o actor (não auto-notificar)
    const filtered = recipientIds.filter(id => id !== input.actor_id);

    // 3. Para cada destinatário, aplicar anti-spam
    for (const recipientId of filtered) {
      if (anti_spam === 'aggregate' && group_key) {
        // Busca notificação não lida com mesmo group_key
        // Se encontrar: UPDATE (incrementa metadata.aggregate_count)
        // Se não: INSERT nova
      }
      if (anti_spam === 'cooldown' && group_key) {
        // Busca notificação com mesmo group_key nos últimos N minutos
        // Se encontrar: SKIP
        // Se não: INSERT nova
      }
      // 'always': INSERT direto
    }

    // 4. Batch INSERT em chunks de 100
  } catch (error) {
    // NUNCA joga erro - apenas console.error
    // Notificações não devem quebrar o fluxo principal
    console.error('[NotificationService] send error:', error);
  }
}
```

**Regra fundamental**: `send()` nunca lança exceção. Notificações são fire-and-forget.

#### `resolveRecipients()` - Resolve targets em user_ids

```typescript
async resolveRecipients(supabase, targets: RecipientTarget[]): Promise<string[]> {
  const userIds = new Set<string>();

  for (const target of targets) {
    switch (target.type) {
      case 'user':       // adiciona direto
      case 'role':       // query users por is_admin/is_director/is_leader + active
      case 'team':       // query team_members + join users active
      case 'department': // query users por department_id + active
      case 'all':        // query users active
    }
  }

  return Array.from(userIds); // deduplicado
}
```

#### CRUD Methods

```
getByUser(userId, { page, limit, filter, type })  → paginado, join actor name
markAsRead(userId, ids[])                          → update read + read_at
markAllAsRead(userId)                              → update all unread
archive(userId, ids[])                             → update archived
delete(userId, ids[])                              → delete
getUnreadCount(userId)                             → count exact, head: true
```

Todos filtram por `recipient_id = userId` para segurança.

---

## 4. Backend - Controller + Routes

### Endpoints

```
GET    /api/notifications              → lista paginada (query: page, limit, filter, type)
GET    /api/notifications/unread-count  → { count: number }
PATCH  /api/notifications/read          → body: { ids: string[] }
PATCH  /api/notifications/read-all      → marca todas como lidas
PATCH  /api/notifications/archive       → body: { ids: string[] }
POST   /api/notifications/delete        → body: { ids: string[] }
```

Todos protegidos por `authenticateToken`. O `userId` vem de `req.user.id` (nunca do client).

**Nota**: Usamos `POST /delete` em vez de `DELETE /` porque o `api.delete()` do frontend não aceita body.

---

## 5. Frontend - Service

### `notification.service.ts`

```typescript
// Mapeia dados brutos da API para a interface unificada
function mapNotification(raw: any): Notification {
  return {
    id: raw.id,
    type: raw.type,
    displayCategory: NOTIFICATION_DISPLAY_MAP[raw.type] || 'info',
    title: raw.title,
    message: raw.message,
    // ...
  };
}

export const notificationApiService = {
  getNotifications(params),
  getUnreadCount(),
  markAsRead(ids),
  markAllAsRead(),
  archive(ids),
  deleteNotifications(ids),
};
```

---

## 6. Frontend - Context (Realtime)

### `NotificationContext.tsx`

O context faz 3 coisas:

#### 1. Fetch inicial

```typescript
useEffect(() => {
  if (!profile?.id) return;
  refreshUnreadCount();
  fetchNotifications();
}, [profile?.id]);
```

#### 2. Supabase Realtime subscription

```typescript
const channel = supabase
  .channel(`notifications:${profile.id}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `recipient_id=eq.${profile.id}`,  // FILTRO POR USUÁRIO
    },
    (payload) => {
      const notification = mapPayload(payload.new);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast(notification.title);  // toast real-time
    }
  )
  .subscribe();
```

#### 3. Cleanup

```typescript
return () => {
  supabase.removeChannel(channel);
};
```

### Habilitar Realtime no client

```typescript
// supabase.ts
export const supabase = createClient(url, key, {
  realtime: {
    params: {
      eventsPerSecond: 10  // DEVE ser > 0
    }
  }
});
```

---

## 7. Anti-Spam - 3 Estratégias

### `always` (padrão)
Sempre insere nova notificação. Usar para eventos únicos.
```
Exemplo: Ciclo aberto, progressão aprovada
```

### `aggregate`
Se já existe notificação **não lida** com mesmo `group_key` para o mesmo destinatário, atualiza a existente (incrementa `metadata.aggregate_count`) em vez de criar nova.
```
Exemplo: "3 candidatos cadastrados na vaga X" em vez de 3 notificações separadas
group_key: "candidate_{opening_id}"
```

### `cooldown`
Se já existe notificação com mesmo `group_key` criada nos últimos N minutos, ignora.
```
Exemplo: PDI atualizado → máximo 1 notificação a cada 30min
group_key: "pdi_{employee_id}"
cooldown_minutes: 30
```

---

## 8. Como adicionar um trigger

No controller, após a operação principal ter sucesso:

```typescript
// Fire-and-forget - não usar await, não deixar quebrar o fluxo
notificationService.send(authReq.supabase, {
  type: 'tipo_da_notificacao',
  title: 'Título curto',
  message: `Mensagem descritiva com ${variáveis}.`,
  targets: [
    { type: 'user', user_id: destinatarioId },
    // ou { type: 'role', role: 'director' },
    // ou { type: 'all' },
  ],
  actor_id: authReq.user!.id,
  action_url: '/rota-no-frontend',
  entity_type: 'nome_da_tabela',
  entity_id: registro.id,
  // Anti-spam (opcional):
  group_key: 'chave_unica',
  anti_spam: 'aggregate',  // ou 'cooldown'
  cooldown_minutes: 30,    // só para cooldown
}).catch(err => console.error('Notification error:', err));
```

**Regras**:
- Sempre usar `.catch()` - nunca deixar rejeição não tratada
- Nunca usar `await` - é fire-and-forget
- Colocar ANTES do `res.json()` ou logo após
- O `actor_id` é removido automaticamente dos destinatários (sem auto-notificação)

---

## 9. Segurança - 3 Camadas de Filtro

| Camada | Mecanismo | Garantia |
|--------|-----------|----------|
| **Banco** | RLS `auth.uid() = recipient_id` | Impossível SELECT/UPDATE/DELETE notificação alheia |
| **API** | `getByUser()` filtra por `recipient_id = req.user.id` | Backend nunca retorna dados de outro usuário |
| **Realtime** | `filter: recipient_id=eq.${userId}` | Eventos só disparam para o dono |

---

## 10. Estrutura de Arquivos

```
backend/
├── src/
│   ├── types/
│   │   ├── supabase.ts              # adicionar tabela notifications
│   │   └── notification.types.ts    # NOVO - tipos, targets, config
│   ├── services/
│   │   └── notificationService.ts   # NOVO - core: send, resolve, CRUD
│   ├── controllers/
│   │   └── notificationController.ts # NOVO - endpoints REST
│   ├── routes/
│   │   ├── notificationRoutes.ts    # NOVO - rotas
│   │   └── index.ts                 # MODIFICAR - registrar /notifications
│   └── controllers/
│       ├── evaluationController.ts  # MODIFICAR - adicionar triggers
│       ├── pdiController.ts         # MODIFICAR - adicionar triggers
│       └── ...demais controllers
└── sql/
    └── create_notifications_table.sql  # SQL para Supabase

frontend/
├── src/
│   ├── types/
│   │   └── notification.types.ts    # NOVO - interface unificada
│   ├── services/
│   │   └── notification.service.ts  # NOVO - API client
│   ├── context/
│   │   └── NotificationContext.tsx  # NOVO - realtime + state
│   ├── lib/
│   │   └── supabase.ts             # MODIFICAR - eventsPerSecond > 0
│   ├── components/
│   │   └── Header.tsx              # MODIFICAR - bell com dados reais
│   ├── pages/notifications/
│   │   └── NotificationHistory.tsx  # MODIFICAR - lista com dados reais
│   └── App.tsx                      # MODIFICAR - NotificationProvider
```

---

## 11. Checklist de Implementação

- [ ] Executar SQL no Supabase (tabela + índices + RLS + realtime)
- [ ] Verificar Realtime ativo no Dashboard (Database > Replication)
- [ ] Criar types no backend (`notification.types.ts`)
- [ ] Adicionar tabela no `supabase.ts` (Database types)
- [ ] Criar `notificationService.ts`
- [ ] Criar `notificationController.ts` + `notificationRoutes.ts`
- [ ] Registrar rota em `routes/index.ts`
- [ ] Criar types no frontend (`notification.types.ts`)
- [ ] Criar `notification.service.ts`
- [ ] Habilitar Realtime no client (`eventsPerSecond: 10`)
- [ ] Criar `NotificationContext.tsx`
- [ ] Registrar `NotificationProvider` no `App.tsx`
- [ ] Atualizar componente do bell (Header)
- [ ] Atualizar página de histórico
- [ ] Adicionar triggers nos controllers
- [ ] Testar: inserir via SQL → bell atualiza em real-time
- [ ] Testar: ação real (ex: completar avaliação) → destinatário recebe
- [ ] Testar: notificação para outro user → NÃO aparece no seu bell
