import { useMemo, useState } from 'react';
import { Check, Search, Users } from 'lucide-react';
import type { UserWithDetails } from '../../../types/supabase';

interface EmployeePickerScreenProps {
  subordinates: UserWithDetails[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading?: boolean;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** Seleção do colaborador a avaliar — busca + lista com toque confortável. */
export default function EmployeePickerScreen({
  subordinates,
  selectedId,
  onSelect,
  loading,
}: EmployeePickerScreenProps) {
  const [term, setTerm] = useState('');

  const filtered = useMemo(() => {
    if (!term.trim()) return subordinates;
    const t = term.toLowerCase();
    return subordinates.filter(
      (e) => e.name.toLowerCase().includes(t) || e.position?.toLowerCase().includes(t),
    );
  }, [subordinates, term]);

  return (
    <div data-flow-autofocus tabIndex={-1} className="outline-none">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-lime/15 text-lime-deep dark:text-lime">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Quem você vai avaliar?</h2>
          <p className="text-sm text-muted-foreground">Selecione um membro da sua equipe.</p>
        </div>
      </div>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por nome ou cargo…"
          className="h-12 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-base text-foreground placeholder:text-muted-foreground focus:border-lime focus:outline-none focus:ring-2 focus:ring-lime/40"
        />
      </div>

      <div className="mt-4 space-y-2">
        {loading && <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>}
        {!loading && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum colaborador encontrado.
          </p>
        )}
        {filtered.map((emp) => {
          const selected = emp.id === selectedId;
          return (
            <button
              key={emp.id}
              type="button"
              onClick={() => onSelect(emp.id)}
              className={[
                'flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all',
                selected
                  ? 'border-lime bg-lime/10'
                  : 'border-border bg-card hover:border-lime/60 active:scale-[0.99]',
              ].join(' ')}
            >
              <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground">
                {initials(emp.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {emp.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{emp.position}</span>
              </span>
              {selected && (
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-lime text-obsidian">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
