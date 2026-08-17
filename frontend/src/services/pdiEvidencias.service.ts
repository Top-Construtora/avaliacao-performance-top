import { api } from '../config/api';

/**
 * Evidências e anexos de um item do PDI.
 *
 * O que a pessoa fez fica no texto; o comprovante fica no anexo. Os arquivos
 * vivem num bucket privado, então o download nunca é um link direto — pede-se
 * uma URL assinada ao backend na hora de abrir.
 */
export interface PdiAttachment {
  id: string;
  action_id: string;
  file_name: string;
  content_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

function unwrap(response: any) {
  return response.data || response;
}

async function toBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const pdiEvidenciasService = {
  async saveEvidencias(planId: string, actionId: string, evidencias: string): Promise<void> {
    await api.patch(`/pdi/${planId}/actions/${actionId}/evidencias`, { evidencias });
  },

  async uploadAttachment(planId: string, actionId: string, file: File): Promise<PdiAttachment> {
    return unwrap(
      await api.post(`/pdi/${planId}/actions/${actionId}/attachments`, {
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        content_base64: await toBase64(file),
      }),
    );
  },

  async attachmentUrl(attachmentId: string): Promise<{ url: string; file_name: string }> {
    return unwrap(await api.get(`/pdi/attachments/${attachmentId}/url`));
  },

  async removeAttachment(attachmentId: string): Promise<void> {
    await api.delete(`/pdi/attachments/${attachmentId}`);
  },
};
