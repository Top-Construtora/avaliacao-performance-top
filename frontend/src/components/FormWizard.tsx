import { ReactNode, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Button from './Button';

/**
 * Wizard de formulário multi-etapas — a versão "densa" do padrão do
 * EvaluationFlow, para cadastros longos (vários campos por tela em vez de um).
 *
 * - indicador de passos clicável (voltar livre; avançar só validando os
 *   passos intermediários);
 * - transição direcional animada entre passos (respeita reduced motion);
 * - `validate` de cada passo roda ao avançar — devolva false e pinte os
 *   erros no próprio conteúdo (o wizard não conhece os campos);
 * - o último passo troca "Avançar" pelo botão de conclusão com loading.
 */
export interface WizardStep {
  id: string;
  title: string;
  icon: LucideIcon;
  /** Valida o passo ao sair dele (avançar/pular). true = pode seguir. */
  validate?: () => boolean;
  content: ReactNode;
}

interface FormWizardProps {
  steps: WizardStep[];
  onFinish: () => void;
  finishLabel?: string;
  /** Conclusão em andamento (desabilita navegação e mostra spinner). */
  finishing?: boolean;
  onCancel?: () => void;
  cancelLabel?: string;
}

export default function FormWizard({
  steps,
  onFinish,
  finishLabel = 'Concluir',
  finishing = false,
  onCancel,
  cancelLabel = 'Cancelar',
}: FormWizardProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const prefersReducedMotion = useReducedMotion();
  const topRef = useRef<HTMLDivElement>(null);

  const isLast = current === steps.length - 1;

  const goTo = (target: number) => {
    if (finishing || target === current) return;
    if (target > current) {
      // Avançar valida cada passo intermediário; para no primeiro inválido
      for (let i = current; i < target; i++) {
        if (steps[i].validate && !steps[i].validate!()) {
          setCurrent(i);
          return;
        }
      }
    }
    setDirection(target > current ? 1 : -1);
    setCurrent(target);
    topRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const handleAdvance = () => {
    if (isLast) {
      if (!steps[current].validate || steps[current].validate!()) onFinish();
    } else {
      goTo(current + 1);
    }
  };

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: prefersReducedMotion ? 0 : 32 * dir }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: prefersReducedMotion ? 0 : -32 * dir }),
  };

  return (
    <div ref={topRef} className="scroll-mt-24 space-y-4 sm:space-y-6">
      {/* Indicador de passos */}
      <div className="bg-card rounded-2xl shadow-sm dark:shadow-lg border border-border p-4 sm:p-5">
        <ol className="flex items-center">
          {steps.map((step, index) => {
            const done = index < current;
            const active = index === current;
            return (
              <li key={step.id} className={`flex items-center ${index > 0 ? 'flex-1' : ''}`}>
                {index > 0 && (
                  <div
                    aria-hidden
                    className={`mx-2 h-px flex-1 transition-colors duration-300 sm:mx-3 ${
                      done || active ? 'bg-lime' : 'bg-border'
                    }`}
                  />
                )}
                <button
                  type="button"
                  onClick={() => goTo(index)}
                  disabled={finishing}
                  aria-current={active ? 'step' : undefined}
                  className="group flex items-center gap-2 sm:gap-3"
                >
                  <span
                    className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border-2 transition-all duration-300 ${
                      active
                        ? 'border-lime bg-lime text-obsidian shadow-md'
                        : done
                          ? 'border-lime/60 bg-lime/15 text-lime-deep dark:text-lime'
                          : 'border-border bg-secondary text-muted-foreground group-hover:border-lime/50'
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}
                  </span>
                  <span
                    className={`hidden text-sm font-medium md:block ${
                      active
                        ? 'text-foreground'
                        : done
                          ? 'text-muted-foreground'
                          : 'text-muted-foreground/70'
                    }`}
                  >
                    {step.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {/* Título do passo atual no mobile (onde os rótulos ficam ocultos) */}
        <p className="mt-3 text-center text-sm font-medium text-foreground md:hidden">
          {steps[current].title}{' '}
          <span className="text-muted-foreground">
            · {current + 1} de {steps.length}
          </span>
        </p>
      </div>

      {/* Conteúdo do passo */}
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={steps[current].id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="space-y-4 sm:space-y-6"
        >
          {steps[current].content}
        </motion.div>
      </AnimatePresence>

      {/* Navegação */}
      <div className="bg-card rounded-2xl shadow-sm dark:shadow-lg border border-border p-4 sm:p-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={finishing} size="lg">
                {cancelLabel}
              </Button>
            )}
          </div>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {current > 0 && (
              <Button
                variant="outline"
                onClick={() => goTo(current - 1)}
                disabled={finishing}
                size="lg"
                icon={<ChevronLeft className="h-5 w-5" />}
              >
                Voltar
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleAdvance}
              loading={finishing}
              size="lg"
              icon={isLast ? <Save className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            >
              {isLast ? finishLabel : 'Avançar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
