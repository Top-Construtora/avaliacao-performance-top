# Configuração de Expiração do Token JWT no Supabase

## Como alterar o tempo de expiração do token para 3 horas

### Passo 1: Acessar o Dashboard do Supabase
1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Faça login com sua conta
3. Selecione o projeto "avaliacao-performance"

### Passo 2: Configurar o JWT Expiry Time
1. No menu lateral, clique em **Settings** (Configurações)
2. Clique em **Auth** (Autenticação)
3. Procure a seção **JWT Settings**
4. Encontre o campo **JWT Expiry Time**
5. Altere de `3600` (1 hora) para `10800` (3 horas)
   - 3 horas = 3 × 60 × 60 = 10800 segundos
6. Clique em **Save** para salvar as alterações

### Passo 3: Configurar o Refresh Token (Opcional)
Se desejar, você também pode ajustar o tempo do refresh token:
1. Na mesma seção **Auth Settings**
2. Procure **Refresh Token Rotation**
3. Ajuste o **Refresh Token Expiry** conforme necessário
   - Recomendado: manter o padrão ou definir para 1 semana (604800 segundos)

### Observações Importantes

#### ⚠️ Segurança
- Tokens com maior duração aumentam a janela de vulnerabilidade em caso de comprometimento
- Certifique-se de que o sistema está configurado para limpar a sessão ao fechar o navegador (já implementado)
- Monitore atividades suspeitas regularmente

#### 🔄 Renovação Automática
O sistema já está configurado com:
- `autoRefreshToken: true` - Renova automaticamente o token antes de expirar
- `persistSession: false` - Não persiste a sessão (logout ao fechar navegador)
- Uso de `sessionStorage` em vez de `localStorage`

#### 📝 Alterações no Código
As seguintes alterações foram feitas no código:
1. **frontend/src/lib/supabase.ts**: Configurado para usar `sessionStorage` e `persistSession: false`
2. **frontend/src/context/AuthContext.tsx**: Mudança de `localStorage` para `sessionStorage`
3. **frontend/src/config/api.ts**: Mudança de `localStorage` para `sessionStorage`

#### 🚀 Comportamento Esperado
Após as configurações:
- Token expira em 3 horas de inatividade
- Usuário é deslogado ao fechar o navegador
- Usuário é deslogado ao fechar a aba
- Sessão não persiste entre sessões do navegador
- Login é sempre necessário ao abrir o sistema

### Testando as Alterações
1. Faça login no sistema
2. Verifique que consegue navegar normalmente
3. Feche o navegador completamente
4. Abra novamente e acesse o sistema
5. Você deve ser redirecionado para a tela de login
6. Para testar a expiração de 3 horas: faça login e deixe inativo por 3 horas

### Rollback (Se Necessário)
Para reverter as alterações:
1. No Supabase: volte o JWT Expiry Time para 3600
2. No código: mude `sessionStorage` de volta para `localStorage`
3. No código: mude `persistSession: false` de volta para `true`
4. Remova o storage customizado do supabase.ts