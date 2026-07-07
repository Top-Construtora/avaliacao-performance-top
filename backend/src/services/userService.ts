// backend/src/services/userService.ts
import { supabaseAdmin } from '../config/supabase';
import { ApiError } from '../middleware/errorHandler';
import { User } from '../types';
import { filterRestrictedUsers } from '../utils/userFilterUtils';
import {
  applyPositionMasking,
  applyPositionMaskingToOne,
  ViewerContext,
} from '../utils/positionMaskingUtils';

// Colunas que a API de gestão pode gravar na tabela `users`.
// Propositalmente NÃO inclui:
//   - `is_admin`  → papel de super-usuário, concedido apenas fora da aplicação
//                   (impede um diretor de se auto-promover a admin);
//   - `id`/`created_at`/`updated_at` → gerenciados pelo banco/serviço.
// Como as rotas de mutação agora exigem papel de diretor, os campos de gestão
// legítimos (is_leader, is_director, active, reports_to, salário, etc.) seguem
// disponíveis — mas o corpo cru nunca mais é espalhado direto no banco.
const ASSIGNABLE_USER_FIELDS = [
  'name',
  'email',
  'position',
  'is_leader',
  'is_director',
  'phone',
  'birth_date',
  'join_date',
  'active',
  'reports_to',
  'profile_image',
  'contract_type',
  'current_track_position_id',
  'current_salary_level_id',
  'current_salary',
  'position_start_date',
  'department_id',
  'track_id',
  'position_id',
  'intern_level',
  'position_is_confidential',
] as const;

// Validação de profile_image (achado M5). Aceita apenas:
//   - data URL de imagem raster segura (png/jpeg/webp) — SVG é rejeitado
//     (pode conter <script>), assim como text/html e outros schemes;
//   - URL https (ex.: Supabase Storage);
//   - vazio/null (limpar a foto).
// Também limita o tamanho para evitar bloat/DoS de armazenamento no banco.
const MAX_PROFILE_IMAGE_LENGTH = 3_000_000; // ~2,2 MB em base64
const SAFE_DATA_IMAGE_RE = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;

function validateProfileImage(value: unknown): void {
  if (value === null || value === undefined || value === '') return;
  if (typeof value !== 'string') {
    throw new ApiError(400, 'profile_image inválido');
  }
  if (value.length > MAX_PROFILE_IMAGE_LENGTH) {
    throw new ApiError(400, 'Imagem de perfil excede o tamanho máximo permitido');
  }
  const isHttpsUrl = /^https:\/\//i.test(value);
  const isSafeDataImage = SAFE_DATA_IMAGE_RE.test(value);
  if (!isHttpsUrl && !isSafeDataImage) {
    throw new ApiError(400, 'Formato de imagem de perfil não permitido (use PNG, JPEG ou WEBP)');
  }
}

function pickAssignableUserFields(input: Record<string, any> = {}): Record<string, any> {
  const out: Record<string, any> = {};
  for (const key of ASSIGNABLE_USER_FIELDS) {
    if (input[key] !== undefined) out[key] = input[key];
  }
  if (out.profile_image !== undefined) {
    validateProfileImage(out.profile_image);
  }
  return out;
}

export const userService = {
  async getUsers(filters?: {
    active?: boolean;
    is_leader?: boolean;
    is_director?: boolean;
    is_leader_or_director?: boolean;
    reports_to?: string;
    currentUserEmail?: string;
    viewer?: ViewerContext;
  }) {
    // Select com relacionamentos para trilha e posição salarial
    let query = supabaseAdmin.from('users').select(`
      *,
      track_position:track_positions!current_track_position_id(
        id,
        base_salary,
        class:salary_classes!class_id(id, code, name),
        position:job_positions!position_id(id, name),
        track:career_tracks!track_id(id, name, code)
      ),
      salary_level:salary_levels!current_salary_level_id(id, name, percentage)
    `);

    if (filters?.active !== undefined) {
      query = query.eq('active', filters.active);
    }

    // Se is_leader_or_director for true, buscar usuários que são líderes OU diretores
    if (filters?.is_leader_or_director === true) {
      query = query.or('is_leader.eq.true,is_director.eq.true');
    } else {
      // Caso contrário, aplicar filtros individuais apenas se explicitamente true
      if (filters?.is_leader === true) {
        query = query.eq('is_leader', true);
      }
      if (filters?.is_director === true) {
        query = query.eq('is_director', true);
      }
    }

    if (filters?.reports_to) {
      query = query.eq('reports_to', filters.reports_to);
    }

    const { data, error } = await query.order('name');

    if (error) {
      throw new ApiError(500, 'Failed to fetch users');
    }

    // Aplicar filtro de usuários restritos
    const filteredData = filterRestrictedUsers(filters?.currentUserEmail, data || []);

    // Aplicar mascaramento de cargo sigiloso
    const maskedData = await applyPositionMasking(filters?.viewer, filteredData);

    return maskedData;
  },

  async getUserById(id: string, viewer?: ViewerContext) {
    const { data, error } = await supabaseAdmin.from('users').select('*').eq('id', id).single();

    if (error) {
      throw new ApiError(404, 'User not found');
    }

    return await applyPositionMaskingToOne(viewer, data);
  },

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    // Whitelist de campos — nunca espalhar o corpo cru (anti mass-assignment)
    const userToInsert = pickAssignableUserFields(userData as Record<string, any>);

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(userToInsert)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'Failed to create user');
    }

    return data;
  },

  async updateUser(id: string, updates: Partial<User>) {
    // Whitelist de campos — nunca espalhar o corpo cru (anti mass-assignment).
    // `is_admin` e `id` ficam de fora de propósito (ver ASSIGNABLE_USER_FIELDS).
    const updateData: any = {
      ...pickAssignableUserFields(updates as Record<string, any>),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'Failed to update user');
    }

    return data;
  },

  async deleteUser(id: string) {
    // Verificar se o usuário já está desativado
    const { data: user, error: getUserError } = await supabaseAdmin
      .from('users')
      .select('active')
      .eq('id', id)
      .single();

    if (getUserError) {
      throw new ApiError(404, 'User not found');
    }

    // Se usuário já está desativado (active = false), fazer hard delete
    if (user.active === false) {
      // Deletar em cascata: primeiro os dados relacionados, depois o usuário

      // 1. Deletar avaliações
      await supabaseAdmin.from('self_evaluations').delete().eq('employee_id', id);
      await supabaseAdmin.from('leader_evaluations').delete().eq('employee_id', id);
      await supabaseAdmin.from('leader_evaluations').delete().eq('evaluator_id', id);
      await supabaseAdmin.from('consensus_evaluations').delete().eq('employee_id', id);

      // 2. Deletar PDIs
      await supabaseAdmin.from('development_plans').delete().eq('employee_id', id);

      // 3. Deletar membros de times
      await supabaseAdmin.from('team_members').delete().eq('user_id', id);

      // 4. Remover como responsável de times/departamentos
      await supabaseAdmin.from('teams').update({ responsible_id: null }).eq('responsible_id', id);
      await supabaseAdmin
        .from('departments')
        .update({ responsible_id: null })
        .eq('responsible_id', id);

      // 5. Remover reports_to de subordinados
      await supabaseAdmin.from('users').update({ reports_to: null }).eq('reports_to', id);

      // 6. Deletar competências de avaliação
      const { data: selfEvals } = await supabaseAdmin
        .from('self_evaluations')
        .select('id')
        .eq('employee_id', id);
      const { data: leaderEvals } = await supabaseAdmin
        .from('leader_evaluations')
        .select('id')
        .eq('employee_id', id);

      const evalIds = [
        ...(selfEvals?.map((e) => e.id) || []),
        ...(leaderEvals?.map((e) => e.id) || []),
      ];

      if (evalIds.length > 0) {
        await supabaseAdmin.from('evaluation_competencies').delete().in('evaluation_id', evalIds);
      }

      // 7. Finalmente, deletar o usuário
      const { error: deleteError } = await supabaseAdmin.from('users').delete().eq('id', id);

      if (deleteError) {
        throw new ApiError(500, 'Failed to permanently delete user');
      }

      // 8. Deletar do Auth
      await supabaseAdmin.auth.admin.deleteUser(id);
    } else {
      // Se usuário está ativo, fazer soft delete (desativar)
      const { error } = await supabaseAdmin
        .from('users')
        .update({
          active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw new ApiError(500, 'Failed to deactivate user');
      }
    }
  },

  async createUserWithAuth(
    email: string,
    password: string,
    userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'email'>,
  ) {
    try {
      // Whitelist de campos do perfil (anti mass-assignment / escalonamento).
      const safeUserData = pickAssignableUserFields(userData as Record<string, any>);
      // Verificar se o email já existe na tabela users
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (existingUser) {
        throw new ApiError(400, 'Email já cadastrado no sistema');
      }

      // Verificar se já existe um usuário no Auth com este email
      const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();

      let authUserId: string;
      let existingAuthUser = null;

      if (existingAuthUsers && existingAuthUsers.users.length > 0) {
        // Procurar o usuário com o email específico
        existingAuthUser = existingAuthUsers.users.find(
          (user) => user.email?.toLowerCase() === email.toLowerCase(),
        );
      }

      if (existingAuthUser) {
        // Se o usuário já existe no Auth, usar o ID existente
        authUserId = existingAuthUser.id;

        // Atualizar a senha se necessário
        await supabaseAdmin.auth.admin.updateUserById(authUserId, {
          password: password,
          email_confirm: true,
          user_metadata: {
            name: userData.name,
            position: userData.position,
          },
        });
      } else {
        // Criar usuário no Auth usando Admin API (não cria sessão)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: email.toLowerCase(),
          password: password,
          email_confirm: true, // Confirma o email automaticamente
          user_metadata: {
            name: userData.name,
            position: userData.position,
          },
        });

        if (authError || !authData.user) {
          throw new ApiError(
            500,
            authError?.message || 'Erro ao criar usuário no sistema de autenticação',
          );
        }

        authUserId = authData.user.id;
      }

      // Verificar se já existe um usuário com este ID na tabela users (pode acontecer se houver inconsistências)
      const { data: existingUserById } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      if (existingUserById) {
        // Se já existe um usuário com este ID mas com email diferente, há uma inconsistência
        if (existingUserById.email !== email.toLowerCase()) {
          throw new ApiError(
            500,
            'Inconsistência detectada: ID de usuário já existe com email diferente',
          );
        }
        // Se é o mesmo email, atualizar os dados e retornar
        const { data: updatedUser, error: updateError } = await supabaseAdmin
          .from('users')
          .update({
            ...safeUserData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', authUserId)
          .select()
          .single();

        if (updateError) {
          throw new ApiError(500, 'Erro ao atualizar usuário existente: ' + updateError.message);
        }

        return updatedUser;
      }

      // Preparar dados do usuário
      const userToInsert = {
        id: authUserId,
        email: email.toLowerCase(),
        ...safeUserData,
        active: true,
        join_date: safeUserData.join_date || new Date().toISOString().split('T')[0],
      };

      // Criar perfil do usuário
      const { data: userProfile, error: profileError } = await supabaseAdmin
        .from('users')
        .insert(userToInsert)
        .select()
        .single();

      if (profileError) {
        // Se houver erro ao criar o perfil, deletar o usuário do Auth apenas se foi criado agora
        if (!existingAuthUser) {
          await supabaseAdmin.auth.admin.deleteUser(authUserId);
        }
        throw new ApiError(500, 'Erro ao criar perfil: ' + profileError.message);
      }

      return userProfile;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, error.message || 'Erro ao criar usuário');
    }
  },

  async getSubordinates(leaderId: string, currentUserEmail?: string, viewer?: ViewerContext) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('reports_to', leaderId)
      .eq('active', true)
      .order('name');

    if (error) {
      throw new ApiError(500, 'Failed to fetch subordinates');
    }

    // Aplicar filtro de usuários restritos
    const filteredData = filterRestrictedUsers(currentUserEmail, data || []);

    // Aplicar mascaramento de cargo sigiloso
    const maskedData = await applyPositionMasking(viewer, filteredData);

    return maskedData;
  },

  // Novos métodos para estatísticas
  async getUserStatistics() {
    try {
      const { data, error } = await supabaseAdmin.from('users').select('id', { count: 'exact' });

      if (error) {
        throw new ApiError(500, 'Failed to fetch user statistics');
      }

      return {
        totalUsers: data.length,
      };
    } catch (error) {
      throw new ApiError(500, 'Failed to fetch user statistics');
    }
  },

  async resetUserPassword(userId: string, newPassword: string) {
    try {
      // Usa a API Admin do Supabase para atualizar senha (requer SERVICE_KEY)
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) {
        throw new ApiError(500, 'Erro ao atualizar senha: ' + error.message);
      }

      return { success: true };
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, error.message || 'Erro ao redefinir senha');
    }
  },

  // Verificar se email já existe
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar email:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      return false;
    }
  },

  // Adicionar usuário a múltiplos times
  async addUserToTeams(userId: string, teamIds: string[]): Promise<void> {
    try {
      if (!teamIds || teamIds.length === 0) {
        return;
      }

      const teamMembers = teamIds.map((teamId) => ({
        team_id: teamId,
        user_id: userId,
      }));

      const { error } = await supabaseAdmin.from('team_members').insert(teamMembers);

      if (error) {
        throw new ApiError(500, 'Erro ao adicionar usuário aos times: ' + error.message);
      }
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, error.message || 'Erro ao adicionar usuário aos times');
    }
  },

  // Define (substitui) o conjunto de times de um usuário: remove os vínculos
  // atuais e insere os novos. Substitui o antigo delete+insert que o frontend
  // fazia direto no Supabase com a anon key (achado H6).
  async setUserTeams(userId: string, teamIds: string[]): Promise<void> {
    try {
      // Remove todos os vínculos atuais do usuário
      const { error: deleteError } = await supabaseAdmin
        .from('team_members')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        throw new ApiError(500, 'Erro ao atualizar times do usuário: ' + deleteError.message);
      }

      if (!teamIds || teamIds.length === 0) {
        return;
      }

      const teamMembers = teamIds.map((teamId) => ({
        team_id: teamId,
        user_id: userId,
      }));

      const { error: insertError } = await supabaseAdmin.from('team_members').insert(teamMembers);

      if (insertError) {
        throw new ApiError(500, 'Erro ao atualizar times do usuário: ' + insertError.message);
      }
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, error.message || 'Erro ao atualizar times do usuário');
    }
  },

  // Migração: corrigir usuários que têm position_id mas não têm current_track_position_id
  async migrateTrackPositions() {
    try {
      // Buscar usuários que têm position_id preenchido mas current_track_position_id está nulo
      const { data: usersToFix, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id, name, position_id, track_id, current_track_position_id')
        .not('position_id', 'is', null)
        .is('current_track_position_id', null);

      if (fetchError) {
        throw new ApiError(500, 'Erro ao buscar usuários: ' + fetchError.message);
      }

      if (!usersToFix || usersToFix.length === 0) {
        return { message: 'Nenhum usuário precisa de correção', fixed: 0 };
      }

      const results: { userId: string; name: string; status: string; details?: string }[] = [];

      for (const user of usersToFix) {
        try {
          // O position_id estava recebendo o ID do track_position erroneamente
          // Então vamos verificar se esse ID existe na tabela track_positions
          const { data: trackPosition, error: tpError } = await supabaseAdmin
            .from('track_positions')
            .select('id, track_id, position_id, base_salary')
            .eq('id', user.position_id)
            .maybeSingle();

          if (tpError) {
            results.push({
              userId: user.id,
              name: user.name,
              status: 'error',
              details: 'Erro ao buscar track_position: ' + tpError.message,
            });
            continue;
          }

          if (trackPosition) {
            // O position_id é realmente um track_position_id
            // Atualizar current_track_position_id com esse valor
            const { error: updateError } = await supabaseAdmin
              .from('users')
              .update({
                current_track_position_id: trackPosition.id,
                track_id: trackPosition.track_id, // Garantir que track_id também está correto
                updated_at: new Date().toISOString(),
              })
              .eq('id', user.id);

            if (updateError) {
              results.push({
                userId: user.id,
                name: user.name,
                status: 'error',
                details: 'Erro ao atualizar: ' + updateError.message,
              });
            } else {
              results.push({
                userId: user.id,
                name: user.name,
                status: 'fixed',
                details: `current_track_position_id definido como ${trackPosition.id}`,
              });
            }
          } else {
            // O position_id não é um track_position válido
            // Tentar encontrar pelo track_id
            if (user.track_id) {
              const { data: possiblePositions, error: ppError } = await supabaseAdmin
                .from('track_positions')
                .select('id')
                .eq('track_id', user.track_id)
                .order('order_index')
                .limit(1);

              if (!ppError && possiblePositions && possiblePositions.length > 0) {
                const { error: updateError } = await supabaseAdmin
                  .from('users')
                  .update({
                    current_track_position_id: possiblePositions[0].id,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', user.id);

                if (updateError) {
                  results.push({
                    userId: user.id,
                    name: user.name,
                    status: 'error',
                    details:
                      'Erro ao atualizar com primeira posição da trilha: ' + updateError.message,
                  });
                } else {
                  results.push({
                    userId: user.id,
                    name: user.name,
                    status: 'fixed_with_default',
                    details: `Atribuído à primeira posição da trilha: ${possiblePositions[0].id}`,
                  });
                }
              } else {
                results.push({
                  userId: user.id,
                  name: user.name,
                  status: 'skipped',
                  details: 'position_id inválido e nenhuma posição encontrada na trilha',
                });
              }
            } else {
              results.push({
                userId: user.id,
                name: user.name,
                status: 'skipped',
                details: 'position_id inválido e sem track_id definido',
              });
            }
          }
        } catch (err: any) {
          results.push({
            userId: user.id,
            name: user.name,
            status: 'error',
            details: err.message,
          });
        }
      }

      const fixed = results.filter(
        (r) => r.status === 'fixed' || r.status === 'fixed_with_default',
      ).length;
      const errors = results.filter((r) => r.status === 'error').length;
      const skipped = results.filter((r) => r.status === 'skipped').length;

      return {
        message: `Migração concluída: ${fixed} corrigidos, ${errors} erros, ${skipped} ignorados`,
        total: usersToFix.length,
        fixed,
        errors,
        skipped,
        details: results,
      };
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, error.message || 'Erro na migração');
    }
  },
};
