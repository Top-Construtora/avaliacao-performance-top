import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  Paperclip,
  Trash2,
  Download,
  Upload,
  ClipboardCheck,
  NotebookPen,
  Plus,
} from 'lucide-react';
import { pdiEvidenciasService, PdiAttachment, PdiNote } from '../services/pdiEvidencias.service';

/**
 * Evidências de um item do PDI: o relato do que a pessoa fez, os arquivos que
 * comprovam, e o diário de anotações do acompanhamento.
 *
 * As três coisas são diferentes de propósito. A evidência é o relato final, um
 * texto que se reescreve até ficar bom; a anotação é o caminho até lá, um
 * registro por vez que ninguém sobrescreve. Sem o diário, "comecei o curso em
 * março" só existiria enquanto a pessoa não reescrevesse o relato.
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
  notes?: PdiNote[];
  /** Só o dono do plano (e o RH) relata o que fez. */
  podeEditarTexto?: boolean;
  /** Dono, líder direto e RH podem juntar arquivos ao acompanhamento. */
  podeAnexar?: boolean;
  /** Anotar é dos dois lados: o liderado registra o avanço, o líder comenta. */
  podeAnotar?: boolean;
  usuarioId?: string;
}

const LIMITE_CARACTERES = 5000;
const LIMITE_ANOTACAO = 2000;

/** "18/08/2026 às 14:30" — a hora importa quando se anota mais de uma vez no dia. */
function quando(iso: string) {
  const data = new Date(iso);
  return `${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

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
  notes = [],
  podeEditarTexto = false,
  podeAnexar = false,
  podeAnotar = false,
  usuarioId,
}: PdiEvidenciasProps) {
  const [texto, setTexto] = useState(evidencias || '');
  const [textoSalvo, setTextoSalvo] = useState(evidencias || '');
  const [salvando, setSalvando] = useState(false);
  const [anexos, setAnexos] = useState<PdiAttachment[]>(attachments);
  const [enviando, setEnviando] = useState(false);
  const [anotacoes, setAnotacoes] = useState<PdiNote[]>(notes);
  const [novaAnotacao, setNovaAnotacao] = useState('');
  const [anotando, setAnotando] = useState(false);
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

  const adicionarAnotacao = async () => {
    const texto = novaAnotacao.trim();
    if (!texto) return;

    try {
      setAnotando(true);
      const nota = await pdiEvidenciasService.addNote(planId, actionId, texto);
      setAnotacoes((prev) => [...prev, nota]);
      setNovaAnotacao('');
      toast.success('Anotação registrada');
    } catch {
      toast.error('Erro ao registrar a anotação');
    } finally {
      setAnotando(false);
    }
  };

  const removerAnotacao = async (nota: PdiNote) => {
    try {
      await pdiEvidenciasService.removeNote(nota.id);
      setAnotacoes((prev) => prev.filter((n) => n.id !== nota.id));
      toast.success('Anotação apagada');
    } catch {
      toast.error('Erro ao apagar a anotação');
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

  const semConteudo = !textoSalvo && anexos.length === 0 && anotacoes.length === 0;
  if (!podeEditarTexto && !podeAnexar && !podeAnotar && semConteudo) return null;

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

      {(podeAnotar || anotacoes.length > 0) && (
        <div className="pt-3 border-t border-border/60 space-y-3">
          <span className="text-sm font-semibold text-foreground flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-lime-deep dark:text-lime" />
            Anotações
          </span>

          {podeAnotar && (
            <div className="space-y-2">
              <textarea
                className="w-full rounded-xl border border-border bg-background text-foreground text-base leading-relaxed placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 transition-colors py-2.5 px-3 resize-y min-h-[4.5rem]"
                rows={2}
                maxLength={LIMITE_ANOTACAO}
                placeholder="Registre um avanço, uma dificuldade, o que combinaram na conversa..."
                value={novaAnotacao}
                onChange={(e) => setNovaAnotacao(e.target.value)}
              />
              <div className="flex items-center justify-end gap-3">
                <span className="text-xs text-muted-foreground">
                  {novaAnotacao.length}/{LIMITE_ANOTACAO}
                </span>
                <button
                  type="button"
                  onClick={adicionarAnotacao}
                  disabled={anotando || !novaAnotacao.trim()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#D2FF00] text-obsidian hover:brightness-95 transition disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {anotando ? 'Registrando...' : 'Adicionar anotação'}
                </button>
              </div>
            </div>
          )}

          {anotacoes.length > 0 ? (
            <ul className="space-y-2">
              {/* Mais recente em cima: quem abre o item quer saber onde parou. */}
              {[...anotacoes].reverse().map((nota) => (
                <li key={nota.id} className="bg-secondary rounded-lg px-3 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {quando(nota.created_at)}
                      {nota.author_name ? ` · ${nota.author_name}` : ''}
                    </span>
                    {nota.author_id === usuarioId && (
                      <button
                        type="button"
                        onClick={() => removerAnotacao(nota)}
                        className="p-1 -mt-0.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition shrink-0"
                        title="Apagar anotação"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap mt-1">
                    {nota.texto}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            podeAnotar && (
              <p className="text-xs text-muted-foreground">
                Nenhuma anotação ainda. O que for registrado aqui fica com data e autor.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
