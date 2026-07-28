import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { supabaseAdmin } from '../config/supabase';

// Código Cultural — repositório da cultura da empresa (valores, missão,
// princípios, rituais...). Estrutura flexível: seções com itens.
// Leitura: todos autenticados. Escrita: diretor/admin (via rotas).
export const culturalCodeController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const [sectionsRes, itemsRes] = await Promise.all([
        supabaseAdmin.from('cultural_code_sections').select('*').order('order_index'),
        supabaseAdmin.from('cultural_code_items').select('*').order('order_index'),
      ]);
      if (sectionsRes.error) throw sectionsRes.error;
      if (itemsRes.error) throw itemsRes.error;

      const itemsBySection = new Map<string, any[]>();
      for (const item of itemsRes.data || []) {
        const list = itemsBySection.get(item.section_id) || [];
        list.push(item);
        itemsBySection.set(item.section_id, list);
      }

      const data = (sectionsRes.data || []).map((s: any) => ({
        ...s,
        items: itemsBySection.get(s.id) || [],
      }));

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async createSection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, description } = req.body;
      if (!title?.trim()) {
        return res.status(400).json({ success: false, error: 'Título é obrigatório' });
      }

      // Nova seção entra no fim
      const { data: last } = await supabaseAdmin
        .from('cultural_code_sections')
        .select('order_index')
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data, error } = await supabaseAdmin
        .from('cultural_code_sections')
        .insert([
          {
            title: title.trim(),
            description: description?.trim() || null,
            order_index: (last?.order_index ?? -1) + 1,
          },
        ])
        .select()
        .single();
      if (error) throw error;

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async updateSection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, description, order_index } = req.body;

      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description || null;
      if (order_index !== undefined) updates.order_index = order_index;

      const { data, error } = await supabaseAdmin
        .from('cultural_code_sections')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async deleteSection(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin.from('cultural_code_sections').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true, message: 'Seção excluída' });
    } catch (error) {
      next(error);
    }
  },

  async createItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { section_id, title, description } = req.body;
      if (!section_id || !title?.trim()) {
        return res.status(400).json({ success: false, error: 'Seção e título são obrigatórios' });
      }

      const { data: last } = await supabaseAdmin
        .from('cultural_code_items')
        .select('order_index')
        .eq('section_id', section_id)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data, error } = await supabaseAdmin
        .from('cultural_code_items')
        .insert([
          {
            section_id,
            title: title.trim(),
            description: description?.trim() || null,
            order_index: (last?.order_index ?? -1) + 1,
          },
        ])
        .select()
        .single();
      if (error) throw error;

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async updateItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { title, description, order_index } = req.body;

      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description || null;
      if (order_index !== undefined) updates.order_index = order_index;

      const { data, error } = await supabaseAdmin
        .from('cultural_code_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async deleteItem(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin.from('cultural_code_items').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true, message: 'Item excluído' });
    } catch (error) {
      next(error);
    }
  },
};
