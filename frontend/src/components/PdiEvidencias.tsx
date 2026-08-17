import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Paperclip, Trash2, Download, Upload, ClipboardCheck } from 'lucide-react';
import { pdiEvidenciasService, PdiAttachment } from '../services/pdiEvidencias.service';

/**
 * Evidências de um item do PDI: o relato do que a pessoa fez, mais os arquivos
 * que comprovam.
 *
 * Mora aqui, num componente só, porque as duas telas mostram a mesma coisa com
 * permissões diferentes — o colaborador escreve e anexa no "Meu PDI"; o líder
 * lê e baixa no "Gerenciar PDI". Duplicar isso seria duas verdades sobre a
 * mesma evidência.
 */
interface PdiEvidenciasProps {
  planId: string;
  actionId: string;
  evidencias?: string | null;
  attachments?: PdiAttachment[];
  /** Só o dono do plano (e o RH) relata o que fez. */
  podeEditarTexto?: boolean;
  /** Dono, líder direto e RH podem juntar arquivos ao acompanhamento. */
  podeAnexar?: boolean;
  usuarioId?: string;
}

const LIMITE_CARACTERES = 5000;

function tamanhoLegivel(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PdiEvidencias({
  planId,
  actionId,
  evidencias,
  attachments = [],
  podeEditarTexto = false,
  podeAnexar = false,
  usuarioId,
}: PdiEvidenciasProps) {
  const [texto, setTexto] = useState(evidencias || '');
  const [textoSalvo, setTextoSalvo] = useState(evidencias || '');
  const [salvando, setSalvando] = useState(false);
  const [anexos, setAnexos] = useState<PdiAttachment[]>(attachments);
  const [enviando, setEnviando] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);

  const alterado = texto !== textoSalvo;

  const salvar = async () => {
    try {
      setSalvando(true);
      await pdiEvidenciasService.saveEvidencias(planId, actionId, texto);
      setTextoSalvo(texto);
      toast.success('Evidências salvas');
    } catch {
      toast.error('Erro ao salvar as evidências');
    } finally {
      setSalvando(false);
    }
  };

  const enviarArquivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Limpa antes de sair: sem isso, reenviar o mesmo arquivo não dispara change
    e.target.value = '';
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Arquivo acima de 8MB');
      return;
    }

    try {
      setEnviando(true);
      const anexo = await pdiEvidenciasService.uploadAttachment(planId, actionId, file);
      setAnexos((prev) => [...prev, anexo]);
      toast.success('Arquivo anexado');
    } catch {
      toast.error('Erro ao anexar o arquivo');
    } finally {
      setEnviando(false);
    }
  };

  // O bucket é privado: o link só existe depois que o backend confere o acesso
  // e assina uma URL temporária.
  const abrir = async (anexo: PdiAttachment) => {
    try {
      const { url } = await pdiEvidenciasService.attachmentUrl(anexo.id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('Erro ao abrir o arquivo');
    }
  };

  const remover = async (anexo: PdiAttachment) => {
    try {
      await pdiEvidenciasService.removeAttachment(anexo.id);
      setAnexos((prev) => prev.filter((a) => a.id !== anexo.id));
      toast.success('Anexo removido');
    } catch {
      toast.error('Erro ao remover o anexo');
    }
  };

  const semConteudo = !textoSalvo && anexos.length === 0;
  if (!podeEditarTexto && !podeAnexar && semConteudo) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-lime-deep dark:text-lime" />
          Evidências
        </span>
        {podeEditarTexto && alterado && (
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#D2FF00] text-obsidian hover:brightness-95 transition disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Salvar evidências'}
          </button>
        )}
      </div>

      {podeEditarTexto ? (
        <>
          <textarea
            className="w-full rounded-xl border border-border bg-background text-foreground text-base leading-relaxed placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 transition-colors py-2.5 px-3 resize-y min-h-[7rem]"
            rows={5}
            maxLength={LIMITE_CARACTERES}
            placeholder="O que você fez para desenvolver esta competência? Cursos, práticas, projetos, conversas..."
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <p className="text-xs text-muted-foreground text-right">
            {texto.length}/{LIMITE_CARACTERES}
          </p>
        </>
      ) : (
        textoSalvo && (
          <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap bg-secondary p-4 rounded-lg">
            {textoSalvo}
          </p>
        )
      )}

      <div className="space-y-2">
        {anexos.map((anexo) => (
          <div
            key={anexo.id}
            className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2 text-sm"
          >
            <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
            <button
              type="button"
              onClick={() => abrir(anexo)}
              className="flex-1 text-left text-foreground hover:text-lime-deep dark:hover:text-lime truncate"
              title={anexo.file_name}
            >
              {anexo.file_name}
            </button>
            <span className="text-xs text-muted-foreground shrink-0">
              {tamanhoLegivel(anexo.file_size)}
            </span>
            <button
              type="button"
              onClick={() => abrir(anexo)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition"
              title="Baixar"
            >
              <Download className="h-4 w-4" />
            </button>
            {(anexo.uploaded_by === usuarioId || podeEditarTexto) && (
              <button
                type="button"
                onClick={() => remover(anexo)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition"
                title="Remover"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}

        {podeAnexar && (
          <>
            <input
              ref={inputArquivo}
              type="file"
              className="hidden"
              onChange={enviarArquivo}
              disabled={enviando}
            />
            <button
              type="button"
              onClick={() => inputArquivo.current?.click()}
              disabled={enviando}
              className="inline-flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-solid transition disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {enviando ? 'Enviando...' : 'Anexar arquivo'}
            </button>
            <span className="text-xs text-muted-foreground ml-2">até 8MB por arquivo</span>
          </>
        )}
      </div>
    </div>
  );
}
