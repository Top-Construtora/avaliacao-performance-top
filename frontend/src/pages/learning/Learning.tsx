import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  GraduationCap,
  BookOpen,
  Library,
  Award,
  Settings2,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Video,
  FileText,
  Link2,
  Check,
  X,
  Users,
  Trash2,
  Route,
  Lock,
  Upload,
} from 'lucide-react';
import Button from '../../components/Button';
import { useUserRole } from '../../context/AuthContext';
import {
  learningApiService,
  Course,
  CourseClass,
  CourseContent,
  Enrollment,
  ExternalCourse,
  LearningTrack,
  MyTrack,
} from '../../services/learning.service';
import { userService } from '../../services/user.service';
import { satisfactionService } from '../../services/satisfaction.service';
import { api } from '../../config/api';

interface MyPdiAction {
  id: string;
  competencia: string;
  prazo: string;
  status: string;
  course: { id: string; title: string } | null;
  due_date?: string | null;
  course_url?: string | null;
  course_url_title?: string | null;
}

type Tab = 'mine' | 'catalog' | 'external' | 'admin';

const CONTENT_ICONS = { video: Video, link: Link2, file: FileText };

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso).toLocaleDateString('pt-BR');
}

const Learning = () => {
  const { isAdmin, isDirector } = useUserRole();
  const privileged = isAdmin || isDirector;

  const [tab, setTab] = useState<Tab>('mine');
  const [loading, setLoading] = useState(true);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [openEnrollment, setOpenEnrollment] = useState<Enrollment | null>(null);
  const [catalog, setCatalog] = useState<CourseClass[]>([]);
  const [externals, setExternals] = useState<ExternalCourse[]>([]);
  const [pendingExternals, setPendingExternals] = useState<ExternalCourse[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [openCourse, setOpenCourse] = useState<
    (Course & { contents: CourseContent[]; classes: CourseClass[] }) | null
  >(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);

  // Modais
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [externalForm, setExternalForm] = useState({
    name: '',
    institution: '',
    workload_hours: '',
    completed_at: '',
    certificate_url: '',
  });
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    workload_hours: '',
  });
  const [contentForm, setContentForm] = useState({
    section: '',
    title: '',
    type: 'link' as 'video' | 'link' | 'file',
    url: '',
    mandatory: true,
  });
  const [classForm, setClassForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
    self_enrollment: false,
  });
  const [enrollTarget, setEnrollTarget] = useState<CourseClass | null>(null);
  const [enrollSelection, setEnrollSelection] = useState<string[]>([]);
  const [overview, setOverview] = useState<{ cls: CourseClass; rows: Enrollment[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Vínculo curso↔PDI (5C)
  const [pdiPlanId, setPdiPlanId] = useState<string | null>(null);
  const [pdiActions, setPdiActions] = useState<MyPdiAction[]>([]);
  const [pdiLinkTarget, setPdiLinkTarget] = useState<Enrollment | null>(null);

  // Trilhas (5B)
  const [myTracks, setMyTracks] = useState<MyTrack[]>([]);
  const [tracks, setTracks] = useState<LearningTrack[]>([]);
  const [surveys, setSurveys] = useState<Array<{ id: string; title: string }>>([]);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackForm, setTrackForm] = useState({ name: '', description: '' });
  const [trackCoursesTarget, setTrackCoursesTarget] = useState<LearningTrack | null>(null);
  const [trackCoursesSelection, setTrackCoursesSelection] = useState<string[]>([]);
  const [trackEnrollTarget, setTrackEnrollTarget] = useState<LearningTrack | null>(null);

  const loadTab = useCallback(
    async (targetTab: Tab) => {
      setLoading(true);
      try {
        if (targetTab === 'mine') {
          const [mine, tracksMine] = await Promise.all([
            learningApiService.myEnrollments(),
            learningApiService.myTracks(),
          ]);
          setEnrollments(mine);
          setMyTracks(tracksMine);
          // Ações do PDI ativo (para o vínculo curso↔ação)
          api
            .get('/pdi/actions/mine')
            .then((response: any) => {
              const result = response.data || response;
              setPdiPlanId(result?.plan_id || null);
              setPdiActions(result?.actions || []);
            })
            .catch(() => undefined);
          // O catálogo é o que diz se existe turma aberta para o curso indicado
          // no PDI — sem ele, o botão de começar nunca apareceria nesta aba.
          learningApiService
            .catalog()
            .then(setCatalog)
            .catch(() => undefined);
        } else if (targetTab === 'catalog') {
          setCatalog(await learningApiService.catalog());
        } else if (targetTab === 'external') {
          const [mine, pending] = await Promise.all([
            learningApiService.myExternalCourses(),
            privileged ? learningApiService.pendingExternalCourses() : Promise.resolve([]),
          ]);
          setExternals(mine);
          setPendingExternals(pending);
        } else {
          const [allCourses, allTracks, activeSurveys] = await Promise.all([
            learningApiService.listCourses(true),
            learningApiService.listTracks(true),
            satisfactionService.getSurveys('active').catch(() => []),
          ]);
          setCourses(allCourses);
          setTracks(allTracks);
          setSurveys((activeSurveys as any[]).map((s) => ({ id: s.id, title: s.title })));
        }
      } catch {
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    },
    [privileged],
  );

  useEffect(() => {
    loadTab(tab);
    setOpenEnrollment(null);
    setOpenCourse(null);
    setOverview(null);
  }, [tab, loadTab]);

  useEffect(() => {
    if (!privileged) return;
    userService
      .getUsers({ active: true })
      .then((list: any[]) => setUsers(list.map((u) => ({ id: u.id, name: u.name }))))
      .catch(() => undefined);
  }, [privileged]);

  const tabs = useMemo(
    () =>
      [
        { id: 'mine' as Tab, label: 'Meus cursos', icon: BookOpen },
        { id: 'catalog' as Tab, label: 'Catálogo', icon: Library },
        { id: 'external' as Tab, label: 'Cursos externos', icon: Award },
        ...(privileged ? [{ id: 'admin' as Tab, label: 'Gestão', icon: Settings2 }] : []),
      ] as Array<{ id: Tab; label: string; icon: any }>,
    [privileged],
  );

  // ===== Aluno =====

  const openEnrollmentDetail = async (enrollment: Enrollment) => {
    if (openEnrollment?.id === enrollment.id) {
      setOpenEnrollment(null);
      return;
    }
    try {
      setOpenEnrollment(await learningApiService.enrollmentDetail(enrollment.id));
    } catch {
      toast.error('Erro ao abrir o curso');
    }
  };

  const toggleContent = async (contentId: string, done: boolean) => {
    if (!openEnrollment) return;
    try {
      const result = await learningApiService.setContentDone(openEnrollment.id, contentId, done);
      setOpenEnrollment((prev) =>
        prev
          ? {
              ...prev,
              progress: result.progress,
              completed_at: result.completed ? prev.completed_at || new Date().toISOString() : null,
              contents: (prev.contents || []).map((c) => (c.id === contentId ? { ...c, done } : c)),
            }
          : prev,
      );
      setEnrollments((prev) =>
        prev.map((e) =>
          e.id === openEnrollment.id
            ? {
                ...e,
                progress: result.progress,
                completed_at: result.completed ? e.completed_at || new Date().toISOString() : null,
              }
            : e,
        ),
      );
      if (result.completed) toast.success('Curso concluído! 🎉');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao atualizar progresso');
    }
  };

  // ===== Gestão =====

  const openCourseDetail = async (course: Course) => {
    if (openCourse?.id === course.id) {
      setOpenCourse(null);
      return;
    }
    try {
      setOpenCourse(await learningApiService.courseDetail(course.id));
    } catch {
      toast.error('Erro ao abrir o curso');
    }
  };

  const refreshCourse = async (courseId: string) => {
    try {
      setOpenCourse(await learningApiService.courseDetail(courseId));
      loadTab('admin');
    } catch {
      /* mantém */
    }
  };

  const progressBar = (value: number) => (
    <div className="w-full bg-secondary rounded-full h-2">
      <div
        className="bg-lime h-2 rounded-full transition-all"
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl md:rounded-2xl shadow-sm dark:shadow-lg border border-border p-4 md:p-8">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-start md:space-y-0">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center flex-wrap">
              <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-lime-deep dark:text-lime mr-2 sm:mr-3 flex-shrink-0" />
              <span className="break-words">Aprendizado</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Cursos, turmas e desenvolvimento contínuo
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {tab === 'external' && (
              <Button
                variant="primary"
                onClick={() => setShowExternalModal(true)}
                icon={<Plus size={16} />}
              >
                Registrar curso externo
              </Button>
            )}
            {tab === 'admin' && privileged && (
              <Button
                variant="primary"
                onClick={() => setShowCourseModal(true)}
                icon={<Plus size={16} />}
              >
                Novo curso
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-6 border-b border-border overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === t.id
                  ? 'border-[#D2FF00] text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Carregando...
        </div>
      ) : tab === 'mine' ? (
        /* ===== MEUS CURSOS ===== */
        <div className="space-y-6">
          {/* Indicações do PDI: o líder aponta o curso na ação, e ele aparece
              aqui sem o colaborador precisar procurar no catálogo. */}
          {(() => {
            const indicados = pdiActions.filter(
              (a) => (a.course || a.course_url) && !['4', '5'].includes(a.status),
            );
            if (indicados.length === 0) return null;

            return (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4" /> Indicados no seu PDI
                </h3>
                <div className="space-y-3">
                  {indicados.map((acao) => {
                    // Já inscrito? Então o acompanhamento acontece no card do curso.
                    const inscrito = acao.course
                      ? enrollments.find((e) => e.class?.course?.id === acao.course!.id)
                      : null;
                    // Turma aberta para autoinscrição deste curso, se houver.
                    const turma = acao.course
                      ? catalog.find((cl) => cl.course?.id === acao.course!.id)
                      : null;

                    return (
                      <div
                        key={acao.id}
                        className="bg-card border border-border rounded-xl p-4 md:p-5 flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground">
                            {acao.course?.title || acao.course_url_title || 'Material indicado'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Ação do PDI: {acao.competencia}
                            {acao.due_date &&
                              ` · até ${new Date(`${acao.due_date}T00:00:00`).toLocaleDateString('pt-BR')}`}
                          </p>
                        </div>

                        {acao.course ? (
                          inscrito ? (
                            <span className="text-xs font-medium text-muted-foreground">
                              Inscrito · {inscrito.progress}%
                            </span>
                          ) : turma ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await learningApiService.selfEnroll(turma.id);
                                  toast.success('Inscrição feita!');
                                  loadTab('mine');
                                } catch (error: any) {
                                  toast.error(error?.message || 'Erro na inscrição');
                                }
                              }}
                              icon={<Plus size={14} />}
                            >
                              Começar
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Aguardando turma disponível
                            </span>
                          )
                        ) : (
                          <a
                            href={acao.course_url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-secondary"
                          >
                            Abrir material
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Trilhas (5B): sequência com liberação progressiva */}
          {myTracks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Route className="h-4 w-4" /> Minhas trilhas
              </h3>
              <div className="space-y-3">
                {myTracks.map((mt) => (
                  <div key={mt.id} className="bg-card border border-border rounded-xl p-4 md:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{mt.track?.name}</p>
                        {mt.track?.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {mt.track.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {mt.progress}%
                        {mt.completed_at && (
                          <span className="ml-2 inline-flex items-center gap-1 text-success">
                            <Check className="h-3.5 w-3.5" /> Trilha concluída
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {mt.courses.map((c, index) => (
                        <span
                          key={c.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            c.status === 'completed'
                              ? 'bg-success/15 text-success'
                              : c.status === 'current'
                                ? 'bg-lime/20 text-lime-deep dark:text-lime'
                                : 'bg-secondary text-muted-foreground'
                          }`}
                        >
                          {c.status === 'completed' ? (
                            <Check className="h-3 w-3" />
                          ) : c.status === 'locked' ? (
                            <Lock className="h-3 w-3" />
                          ) : (
                            <BookOpen className="h-3 w-3" />
                          )}
                          {index + 1}. {c.title}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {enrollments.length === 0 ? (
            <div className="bg-card border border-border rounded-xl py-16 text-center text-sm text-muted-foreground">
              Você ainda não está inscrito em nenhum curso. Veja o Catálogo.
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment) => {
                const isOpen = openEnrollment?.id === enrollment.id;
                const display = isOpen ? openEnrollment! : enrollment;
                const course = enrollment.class?.course;
                const sections = isOpen
                  ? Array.from(
                      new Set((openEnrollment!.contents || []).map((c) => c.section || '')),
                    )
                  : [];
                return (
                  <div
                    key={enrollment.id}
                    className="bg-card border border-border rounded-xl p-4 md:p-5"
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => openEnrollmentDetail(enrollment)}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {course?.title}
                            <span className="font-normal text-muted-foreground">
                              {' '}
                              · {enrollment.class?.name}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {course?.workload_hours ? `${course.workload_hours}h · ` : ''}
                            Prazo: {formatDate(enrollment.class?.end_date || null)}
                            {enrollment.mandatory ? ' · Obrigatório' : ''}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex-1 max-w-xs">{progressBar(display.progress)}</div>
                            <span className="text-xs font-medium text-foreground">
                              {display.progress}%
                            </span>
                            {display.completed_at && (
                              <span className="inline-flex items-center gap-1 text-xs text-success">
                                <Check className="h-3.5 w-3.5" /> Concluído
                              </span>
                            )}
                          </div>
                        </div>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-border mt-4 pt-4 space-y-4">
                        {course?.description && (
                          <p className="text-sm text-muted-foreground">{course.description}</p>
                        )}

                        {/* Vínculo curso↔PDI (5C) */}
                        {pdiPlanId &&
                          (() => {
                            const linked = pdiActions.find((a) => a.course?.id === course?.id);
                            return (
                              <div className="flex flex-wrap items-center gap-2">
                                {linked ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-lime/20 text-lime-deep dark:text-lime">
                                    <GraduationCap className="h-3.5 w-3.5" />
                                    Vinculado à ação do PDI: {linked.competencia}
                                  </span>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPdiLinkTarget(enrollment)}
                                  >
                                    Vincular a uma ação do meu PDI
                                  </Button>
                                )}
                              </div>
                            );
                          })()}

                        {sections.map((section) => (
                          <div key={section || '_default'}>
                            {section && (
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                {section}
                              </h4>
                            )}
                            <div className="space-y-1.5">
                              {(openEnrollment!.contents || [])
                                .filter((c) => (c.section || '') === section)
                                .map((content) => {
                                  const Icon = CONTENT_ICONS[content.type] || Link2;
                                  return (
                                    <div
                                      key={content.id}
                                      className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg px-3 py-2"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={!!content.done}
                                        onChange={(e) =>
                                          toggleContent(content.id, e.target.checked)
                                        }
                                        className="rounded border-border accent-[#D2FF00]"
                                      />
                                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <span
                                        className={
                                          content.done
                                            ? 'line-through text-muted-foreground'
                                            : 'text-foreground'
                                        }
                                      >
                                        {content.title}
                                      </span>
                                      {!content.mandatory && (
                                        <span className="text-xs text-muted-foreground">
                                          (opcional)
                                        </span>
                                      )}
                                      <a
                                        href={content.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="ml-auto text-lime-deep dark:text-lime hover:opacity-80"
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </a>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : tab === 'catalog' ? (
        /* ===== CATÁLOGO ===== */
        catalog.length === 0 ? (
          <div className="bg-card border border-border rounded-xl py-16 text-center text-sm text-muted-foreground">
            Nenhuma turma aberta para inscrição no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalog.map((cls) => (
              <div
                key={cls.id}
                className="bg-card border border-border rounded-xl p-5 flex flex-col"
              >
                <p className="text-xs text-muted-foreground">{cls.course?.category || 'Curso'}</p>
                <h3 className="text-base font-semibold text-foreground mt-1">
                  {cls.course?.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-1">
                  {cls.course?.description}
                </p>
                <p className="text-xs text-muted-foreground mt-3">
                  {cls.course?.workload_hours ? `${cls.course.workload_hours}h · ` : ''}
                  Turma {cls.name}
                  {cls.end_date ? ` · até ${formatDate(cls.end_date)}` : ''}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    try {
                      await learningApiService.selfEnroll(cls.id);
                      toast.success('Inscrição feita! Veja em Meus cursos.');
                      loadTab('catalog');
                    } catch (error: any) {
                      toast.error(error?.message || 'Erro na inscrição');
                    }
                  }}
                  icon={<Plus size={14} />}
                >
                  Inscrever-se
                </Button>
              </div>
            ))}
          </div>
        )
      ) : tab === 'external' ? (
        /* ===== CURSOS EXTERNOS ===== */
        <div className="space-y-6">
          {privileged && pendingExternals.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Aguardando aprovação ({pendingExternals.length})
              </h3>
              <div className="space-y-2">
                {pendingExternals.map((ec) => (
                  <div
                    key={ec.id}
                    className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {ec.name}
                        <span className="text-muted-foreground font-normal">
                          {' '}
                          — {ec.user?.name}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ec.institution || 'Instituição não informada'}
                        {ec.workload_hours ? ` · ${ec.workload_hours}h` : ''}
                        {ec.completed_at ? ` · concluído em ${formatDate(ec.completed_at)}` : ''}
                        {ec.certificate_url && (
                          <>
                            {' · '}
                            <a
                              href={ec.certificate_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-lime-deep dark:text-lime underline"
                            >
                              certificado
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Check size={14} />}
                        onClick={async () => {
                          await learningApiService
                            .reviewExternalCourse(ec.id, 'approved')
                            .catch(() => toast.error('Erro ao aprovar'));
                          loadTab('external');
                        }}
                      >
                        Aprovar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<X size={14} />}
                        onClick={async () => {
                          const note = window.prompt('Motivo da recusa (opcional):') || undefined;
                          await learningApiService
                            .reviewExternalCourse(ec.id, 'rejected', note)
                            .catch(() => toast.error('Erro ao recusar'));
                          loadTab('external');
                        }}
                      >
                        Recusar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Meus cursos externos
            </h3>
            {externals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Fez um curso fora da GIO? Registre aqui para contar no seu histórico.
              </p>
            ) : (
              <div className="space-y-2">
                {externals.map((ec) => (
                  <div key={ec.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground">{ec.name}</p>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ec.status === 'approved'
                            ? 'bg-success/15 text-success'
                            : ec.status === 'rejected'
                              ? 'bg-destructive/15 text-destructive'
                              : 'bg-warning/15 text-warning'
                        }`}
                      >
                        {ec.status === 'approved'
                          ? 'Aprovado'
                          : ec.status === 'rejected'
                            ? 'Recusado'
                            : 'Em análise'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ec.institution || 'Instituição não informada'}
                      {ec.workload_hours ? ` · ${ec.workload_hours}h` : ''}
                      {ec.completed_at ? ` · concluído em ${formatDate(ec.completed_at)}` : ''}
                    </p>
                    {ec.review_note && (
                      <p className="text-xs text-muted-foreground mt-1">Nota: {ec.review_note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ===== GESTÃO ===== */
        <div className="space-y-6">
          {/* Trilhas (5B) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Route className="h-4 w-4" /> Trilhas
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTrackModal(true)}
                icon={<Plus size={14} />}
              >
                Nova trilha
              </Button>
            </div>
            {tracks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma trilha criada. Trilhas encadeiam cursos com liberação progressiva.
              </p>
            ) : (
              <div className="space-y-2">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{track.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(track.courses || []).length > 0
                          ? (track.courses || [])
                              .map((tc, i) => `${i + 1}. ${tc.course?.title}`)
                              .join(' → ')
                          : 'Sem cursos ainda'}
                        {' · '}
                        {track.enrollments_count} inscritos
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTrackCoursesTarget(track);
                          setTrackCoursesSelection(
                            (track.courses || []).map((tc) => tc.course?.id || '').filter(Boolean),
                          );
                        }}
                      >
                        Cursos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Users size={13} />}
                        onClick={() => {
                          setTrackEnrollTarget(track);
                          setEnrollSelection([]);
                        }}
                      >
                        Inscrever
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" /> Cursos
          </h3>
          {courses.length === 0 ? (
            <div className="bg-card border border-border rounded-xl py-16 text-center text-sm text-muted-foreground">
              Nenhum curso criado ainda.
            </div>
          ) : (
            courses.map((course) => {
              const isOpen = openCourse?.id === course.id;
              return (
                <div key={course.id} className="bg-card border border-border rounded-xl p-4 md:p-5">
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => openCourseDetail(course)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {course.title}
                          {!course.active && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground">
                              inativo
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {course.category || 'Sem categoria'} · {course.contents_count} conteúdos ·{' '}
                          {course.classes_count} turmas
                        </p>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {isOpen && openCourse && (
                    <div className="border-t border-border mt-4 pt-4 space-y-5">
                      {/* Conteúdos */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Conteúdos
                        </h4>
                        <div className="space-y-1.5">
                          {openCourse.contents.map((content) => {
                            const Icon = CONTENT_ICONS[content.type] || Link2;
                            return (
                              <div
                                key={content.id}
                                className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg px-3 py-2"
                              >
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-foreground">{content.title}</span>
                                {content.section && (
                                  <span className="text-xs text-muted-foreground">
                                    · {content.section}
                                  </span>
                                )}
                                {!content.mandatory && (
                                  <span className="text-xs text-muted-foreground">(opcional)</span>
                                )}
                                <button
                                  className="ml-auto text-muted-foreground hover:text-destructive"
                                  onClick={async () => {
                                    await learningApiService
                                      .deleteContent(openCourse.id, content.id)
                                      .catch(() => toast.error('Erro ao excluir'));
                                    refreshCourse(openCourse.id);
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })}
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 mt-2">
                            <input
                              type="text"
                              value={contentForm.title}
                              onChange={(e) =>
                                setContentForm((f) => ({ ...f, title: e.target.value }))
                              }
                              placeholder="Título do conteúdo"
                              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground"
                            />
                            <input
                              type="text"
                              value={contentForm.url}
                              onChange={(e) =>
                                setContentForm((f) => ({ ...f, url: e.target.value }))
                              }
                              placeholder="URL (vídeo, PDF, link...)"
                              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground"
                            />
                            <select
                              value={contentForm.type}
                              onChange={(e) =>
                                setContentForm((f) => ({ ...f, type: e.target.value as any }))
                              }
                              className="px-2 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                            >
                              <option value="video">Vídeo</option>
                              <option value="link">Link</option>
                              <option value="file">Arquivo</option>
                            </select>
                            <input
                              type="text"
                              value={contentForm.section}
                              onChange={(e) =>
                                setContentForm((f) => ({ ...f, section: e.target.value }))
                              }
                              placeholder="Seção (opcional)"
                              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground w-32"
                            />
                            {/* Upload nativo (5B): envia ao Storage e preenche a URL */}
                            <label
                              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm cursor-pointer text-muted-foreground hover:text-foreground ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
                            >
                              {uploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              Enviar arquivo
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.png,.jpg,.jpeg,.mp4,.pptx,.docx,.xlsx"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  e.target.value = '';
                                  if (!file) return;
                                  if (file.size > 8 * 1024 * 1024) {
                                    toast.error('Arquivo acima de 8MB — use um link externo');
                                    return;
                                  }
                                  setUploading(true);
                                  try {
                                    const result = await learningApiService.uploadFile(file);
                                    if (result.url) {
                                      setContentForm((f) => ({
                                        ...f,
                                        url: result.url!,
                                        type: 'file',
                                        title: f.title || file.name,
                                      }));
                                      toast.success('Arquivo enviado — URL preenchida');
                                    }
                                  } catch {
                                    toast.error('Erro no upload');
                                  } finally {
                                    setUploading(false);
                                  }
                                }}
                              />
                            </label>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!contentForm.title.trim() || !contentForm.url.trim()}
                              onClick={async () => {
                                await learningApiService
                                  .addContent(openCourse.id, {
                                    title: contentForm.title.trim(),
                                    url: contentForm.url.trim(),
                                    type: contentForm.type,
                                    section: contentForm.section.trim() || undefined,
                                    mandatory: contentForm.mandatory,
                                  })
                                  .catch(() => toast.error('Erro ao adicionar conteúdo'));
                                setContentForm({
                                  section: contentForm.section,
                                  title: '',
                                  type: contentForm.type,
                                  url: '',
                                  mandatory: true,
                                });
                                refreshCourse(openCourse.id);
                              }}
                            >
                              Adicionar
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Turmas */}
                      <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          Turmas
                        </h4>
                        <div className="space-y-1.5">
                          {openCourse.classes.map((cls) => (
                            <div
                              key={cls.id}
                              className="flex flex-wrap items-center gap-2 text-sm bg-secondary/50 rounded-lg px-3 py-2"
                            >
                              <span className="text-foreground font-medium">{cls.name}</span>
                              {/* Pesquisa de avaliação disparada na conclusão (5B) */}
                              <select
                                value={cls.survey_id || ''}
                                onChange={async (e) => {
                                  await learningApiService
                                    .updateClass(cls.id, {
                                      survey_id: (e.target.value || null) as any,
                                    })
                                    .catch(() => toast.error('Erro ao vincular pesquisa'));
                                  refreshCourse(openCourse.id);
                                }}
                                className="px-2 py-1 rounded-lg border border-border bg-background text-foreground text-xs"
                                title="Pesquisa enviada ao concluir o curso"
                              >
                                <option value="">Sem pesquisa</option>
                                {surveys.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    📋 {s.title}
                                  </option>
                                ))}
                              </select>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(cls.start_date)} → {formatDate(cls.end_date)} ·{' '}
                                {cls.enrollments_count} inscritos
                                {cls.self_enrollment ? ' · catálogo aberto' : ''}
                              </span>
                              <div className="ml-auto flex gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={<Users size={13} />}
                                  onClick={() => {
                                    setEnrollTarget(cls);
                                    setEnrollSelection([]);
                                  }}
                                >
                                  Inscrever
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    const rows = await learningApiService
                                      .classOverview(cls.id)
                                      .catch(() => [] as Enrollment[]);
                                    setOverview({ cls, rows });
                                  }}
                                >
                                  Acompanhar
                                </Button>
                              </div>
                            </div>
                          ))}
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto_auto] gap-2 mt-2">
                            <input
                              type="text"
                              value={classForm.name}
                              onChange={(e) =>
                                setClassForm((f) => ({ ...f, name: e.target.value }))
                              }
                              placeholder="Nome da turma (ex.: Turma 2026.2)"
                              className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground"
                            />
                            <input
                              type="date"
                              value={classForm.start_date}
                              onChange={(e) =>
                                setClassForm((f) => ({ ...f, start_date: e.target.value }))
                              }
                              className="px-2 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                            />
                            <input
                              type="date"
                              value={classForm.end_date}
                              onChange={(e) =>
                                setClassForm((f) => ({ ...f, end_date: e.target.value }))
                              }
                              className="px-2 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                            />
                            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <input
                                type="checkbox"
                                checked={classForm.self_enrollment}
                                onChange={(e) =>
                                  setClassForm((f) => ({ ...f, self_enrollment: e.target.checked }))
                                }
                                className="rounded border-border accent-[#D2FF00]"
                              />
                              Catálogo
                            </label>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!classForm.name.trim()}
                              onClick={async () => {
                                await learningApiService
                                  .createClass(openCourse.id, {
                                    name: classForm.name.trim(),
                                    start_date: classForm.start_date || undefined,
                                    end_date: classForm.end_date || undefined,
                                    self_enrollment: classForm.self_enrollment,
                                  })
                                  .catch(() => toast.error('Erro ao criar turma'));
                                setClassForm({
                                  name: '',
                                  start_date: '',
                                  end_date: '',
                                  self_enrollment: false,
                                });
                                refreshCourse(openCourse.id);
                              }}
                            >
                              Criar turma
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            await learningApiService
                              .updateCourse(openCourse.id, { active: !openCourse.active })
                              .catch(() => toast.error('Erro'));
                            refreshCourse(openCourse.id);
                          }}
                        >
                          {openCourse.active ? 'Desativar curso' : 'Reativar curso'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modal: novo curso */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Novo curso</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={courseForm.title}
                onChange={(e) => setCourseForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Título do curso"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground"
              />
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                placeholder="Descrição"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={courseForm.category}
                  onChange={(e) => setCourseForm((f) => ({ ...f, category: e.target.value }))}
                  placeholder="Categoria"
                  className="px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground"
                />
                <input
                  type="number"
                  value={courseForm.workload_hours}
                  onChange={(e) => setCourseForm((f) => ({ ...f, workload_hours: e.target.value }))}
                  placeholder="Carga horária (h)"
                  className="px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => setShowCourseModal(false)} disabled={busy}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                disabled={busy || courseForm.title.trim().length < 2}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await learningApiService.createCourse({
                      title: courseForm.title.trim(),
                      description: courseForm.description || undefined,
                      category: courseForm.category || undefined,
                      workload_hours: courseForm.workload_hours
                        ? Number(courseForm.workload_hours)
                        : undefined,
                    });
                    toast.success('Curso criado!');
                    setShowCourseModal(false);
                    setCourseForm({ title: '', description: '', category: '', workload_hours: '' });
                    loadTab('admin');
                  } catch {
                    toast.error('Erro ao criar curso');
                  } finally {
                    setBusy(false);
                  }
                }}
                icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />}
              >
                Criar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: registrar curso externo */}
      {showExternalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Registrar curso externo</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={externalForm.name}
                onChange={(e) => setExternalForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome do curso"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground"
              />
              <input
                type="text"
                value={externalForm.institution}
                onChange={(e) => setExternalForm((f) => ({ ...f, institution: e.target.value }))}
                placeholder="Instituição"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={externalForm.workload_hours}
                  onChange={(e) =>
                    setExternalForm((f) => ({ ...f, workload_hours: e.target.value }))
                  }
                  placeholder="Carga horária (h)"
                  className="px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground"
                />
                <input
                  type="date"
                  value={externalForm.completed_at}
                  onChange={(e) => setExternalForm((f) => ({ ...f, completed_at: e.target.value }))}
                  className="px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm"
                />
              </div>
              <input
                type="text"
                value={externalForm.certificate_url}
                onChange={(e) =>
                  setExternalForm((f) => ({ ...f, certificate_url: e.target.value }))
                }
                placeholder="Link do certificado (Drive, PDF...)"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => setShowExternalModal(false)} disabled={busy}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                disabled={busy || externalForm.name.trim().length < 2}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await learningApiService.submitExternalCourse({
                      name: externalForm.name.trim(),
                      institution: externalForm.institution || undefined,
                      workload_hours: externalForm.workload_hours
                        ? Number(externalForm.workload_hours)
                        : undefined,
                      completed_at: externalForm.completed_at || undefined,
                      certificate_url: externalForm.certificate_url || undefined,
                    });
                    toast.success('Enviado para aprovação do RH!');
                    setShowExternalModal(false);
                    setExternalForm({
                      name: '',
                      institution: '',
                      workload_hours: '',
                      completed_at: '',
                      certificate_url: '',
                    });
                    loadTab('external');
                  } catch {
                    toast.error('Erro ao registrar');
                  } finally {
                    setBusy(false);
                  }
                }}
                icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award size={16} />}
              >
                Registrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: inscrever na turma */}
      {enrollTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Inscrever colaboradores</h2>
            <p className="text-sm text-muted-foreground mb-4">Turma {enrollTarget.name}</p>
            <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
              {users.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-2 text-sm cursor-pointer px-1 py-0.5 rounded hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    checked={enrollSelection.includes(u.id)}
                    onChange={() =>
                      setEnrollSelection((sel) =>
                        sel.includes(u.id) ? sel.filter((id) => id !== u.id) : [...sel, u.id],
                      )
                    }
                    className="rounded border-border accent-[#D2FF00]"
                  />
                  <span className="text-foreground">{u.name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => setEnrollTarget(null)} disabled={busy}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                disabled={busy || enrollSelection.length === 0}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const result = await learningApiService.enroll(
                      enrollTarget.id,
                      enrollSelection,
                      false,
                    );
                    toast.success(`${result.enrolled} colaborador(es) inscritos`);
                    setEnrollTarget(null);
                    if (openCourse) refreshCourse(openCourse.id);
                  } catch {
                    toast.error('Erro ao inscrever');
                  } finally {
                    setBusy(false);
                  }
                }}
                icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users size={16} />}
              >
                Inscrever
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: acompanhamento da turma */}
      {overview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-foreground mb-1">Acompanhamento</h2>
            <p className="text-sm text-muted-foreground mb-4">Turma {overview.cls.name}</p>
            {overview.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum inscrito ainda.</p>
            ) : (
              <div className="space-y-2">
                {overview.rows.map((row) => (
                  <div key={row.id} className="flex items-center gap-3">
                    <span className="text-sm text-foreground flex-1 truncate">
                      {row.user?.name}
                    </span>
                    <div className="w-32">{progressBar(row.progress)}</div>
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {row.progress}%
                    </span>
                    {row.completed_at && <Check className="h-4 w-4 text-success" />}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-5">
              <Button variant="outline" onClick={() => setOverview(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: nova trilha */}
      {showTrackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">Nova trilha</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={trackForm.name}
                onChange={(e) => setTrackForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome da trilha (ex.: Onboarding de líderes)"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground"
              />
              <textarea
                value={trackForm.description}
                onChange={(e) => setTrackForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                placeholder="Descrição (opcional)"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => setShowTrackModal(false)} disabled={busy}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                disabled={busy || trackForm.name.trim().length < 2}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await learningApiService.createTrack({
                      name: trackForm.name.trim(),
                      description: trackForm.description || undefined,
                    });
                    toast.success('Trilha criada — agora adicione os cursos');
                    setShowTrackModal(false);
                    setTrackForm({ name: '', description: '' });
                    loadTab('admin');
                  } catch {
                    toast.error('Erro ao criar trilha');
                  } finally {
                    setBusy(false);
                  }
                }}
                icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route size={16} />}
              >
                Criar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: cursos da trilha (a ordem de seleção define a sequência) */}
      {trackCoursesTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Cursos da trilha</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {trackCoursesTarget.name} — a ordem em que você marca define a sequência
            </p>
            <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
              {courses
                .filter((c) => c.active)
                .map((c) => {
                  const orderIndex = trackCoursesSelection.indexOf(c.id);
                  return (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 text-sm cursor-pointer px-1 py-0.5 rounded hover:bg-accent"
                    >
                      <input
                        type="checkbox"
                        checked={orderIndex >= 0}
                        onChange={() =>
                          setTrackCoursesSelection((sel) =>
                            sel.includes(c.id) ? sel.filter((id) => id !== c.id) : [...sel, c.id],
                          )
                        }
                        className="rounded border-border accent-[#D2FF00]"
                      />
                      {orderIndex >= 0 && (
                        <span className="w-5 h-5 rounded-full bg-lime text-obsidian text-xs font-bold flex items-center justify-center">
                          {orderIndex + 1}
                        </span>
                      )}
                      <span className="text-foreground">{c.title}</span>
                    </label>
                  );
                })}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => setTrackCoursesTarget(null)} disabled={busy}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await learningApiService.setTrackCourses(
                      trackCoursesTarget.id,
                      trackCoursesSelection,
                    );
                    toast.success('Trilha atualizada');
                    setTrackCoursesTarget(null);
                    loadTab('admin');
                  } catch {
                    toast.error('Erro ao salvar cursos da trilha');
                  } finally {
                    setBusy(false);
                  }
                }}
                icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check size={16} />}
              >
                Salvar sequência
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: inscrever na trilha */}
      {/* Modal: vincular curso a uma ação do PDI (5C) */}
      {pdiLinkTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Vincular ao PDI</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Escolha a ação do seu PDI que este curso desenvolve. Ao concluir o curso, a ação será
              marcada como concluída automaticamente.
            </p>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {pdiActions.filter((a) => !['4', '5'].includes(a.status)).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Seu PDI não tem ações em aberto para vincular.
                </p>
              ) : (
                pdiActions
                  .filter((a) => !['4', '5'].includes(a.status))
                  .map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await api.patch(`/pdi/${pdiPlanId}/actions/${action.id}`, {
                            course_id: pdiLinkTarget.class?.course?.id,
                          });
                          toast.success('Curso vinculado à ação do PDI!');
                          setPdiLinkTarget(null);
                          loadTab('mine');
                        } catch {
                          toast.error('Erro ao vincular');
                        } finally {
                          setBusy(false);
                        }
                      }}
                      className="w-full text-left bg-secondary hover:bg-accent rounded-lg px-3 py-2.5 transition-colors"
                    >
                      <p className="text-sm font-medium text-foreground">{action.competencia}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Prazo {action.prazo}
                        {action.course ? ` · já vinculada a ${action.course.title}` : ''}
                      </p>
                    </button>
                  ))
              )}
            </div>
            <div className="flex justify-end mt-5">
              <Button variant="outline" onClick={() => setPdiLinkTarget(null)} disabled={busy}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {trackEnrollTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">Inscrever na trilha</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {trackEnrollTarget.name} — o primeiro curso é liberado imediatamente
            </p>
            <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-2 space-y-1">
              {users.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-2 text-sm cursor-pointer px-1 py-0.5 rounded hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    checked={enrollSelection.includes(u.id)}
                    onChange={() =>
                      setEnrollSelection((sel) =>
                        sel.includes(u.id) ? sel.filter((id) => id !== u.id) : [...sel, u.id],
                      )
                    }
                    className="rounded border-border accent-[#D2FF00]"
                  />
                  <span className="text-foreground">{u.name}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" onClick={() => setTrackEnrollTarget(null)} disabled={busy}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                disabled={busy || enrollSelection.length === 0}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const result = await learningApiService.enrollInTrack(
                      trackEnrollTarget.id,
                      enrollSelection,
                    );
                    toast.success(`${result.enrolled} colaborador(es) na trilha`);
                    setTrackEnrollTarget(null);
                    loadTab('admin');
                  } catch (error: any) {
                    toast.error(error?.message || 'Erro ao inscrever');
                  } finally {
                    setBusy(false);
                  }
                }}
                icon={busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users size={16} />}
              >
                Inscrever
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Learning;
