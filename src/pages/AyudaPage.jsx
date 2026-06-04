import { useState, useEffect } from 'react';
import MainContainer from '../components/layout/MainContainer';

// ── Shared styles ─────────────────────────────────────────────────────────────
const PANEL = 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-2xl';
const H2    = 'text-base font-bold text-stone-900 dark:text-stone-50';
const BODY  = 'text-sm text-stone-900 dark:text-stone-100 leading-relaxed';
const LABEL = 'text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wide';

// ── Mock components ───────────────────────────────────────────────────────────

const MockFileZone = ({ filled, filename }) => (
  <div className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center gap-2 text-center select-none
    ${filled ? 'border-lime-400 bg-lime-50 dark:bg-lime-950/30' : 'border-stone-300 dark:border-stone-600 bg-stone-50 dark:bg-stone-800'}`}
  >
    <span className={`material-symbols-outlined text-2xl ${filled ? 'text-lime-600' : 'text-stone-500'}`}>
      {filled ? 'check_circle' : 'upload_file'}
    </span>
    <span className={`text-xs font-semibold ${filled ? 'text-lime-800 dark:text-lime-300' : 'text-stone-700 dark:text-stone-300'}`}>
      {filled ? filename : 'Arrastra aquí o haz clic para subir'}
    </span>
    <span className="text-xs text-stone-500 dark:text-stone-400">PDF o DOCX · máx. 25 MB</span>
  </div>
);

const MockDot = ({ n, active, done }) => (
  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
    ${done   ? 'bg-lime-500 text-white' :
      active ? 'bg-stone-900 text-white' :
               'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'}`}
  >
    {done ? <span className="material-symbols-outlined text-sm">check</span> : n}
  </div>
);

const MockBubble = ({ text }) => (
  <div className="flex justify-start mb-1.5">
    <div className="max-w-[90%] rounded-2xl rounded-tl-sm px-3 py-2 text-xs font-medium bg-stone-200 dark:bg-stone-700 text-stone-900 dark:text-stone-100 leading-relaxed">
      {text}
    </div>
  </div>
);

const MockHitlCard = () => (
  <div className="border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/40 rounded-xl p-3 text-xs">
    <p className="font-bold text-stone-900 dark:text-stone-100 mb-2">Revisión requerida — intento 1 de 3</p>
    <div className="rounded-lg px-3 py-2 mb-2 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 text-stone-800 dark:text-stone-200 font-medium">
      Perfil PACI generado · haz clic para ver...
    </div>
    <div className="flex gap-2">
      <div className="flex-1 py-1.5 rounded-lg text-center font-bold border-2 border-lime-500 text-lime-800 dark:text-lime-300 bg-white dark:bg-stone-800">Aprobar</div>
      <div className="flex-1 py-1.5 rounded-lg text-center font-bold border-2 border-red-400 text-red-700 dark:text-red-300 bg-white dark:bg-stone-800">Rechazar</div>
    </div>
  </div>
);

// ── Step data ─────────────────────────────────────────────────────────────────

const STEPS = [
  {
    number: 1,
    title: 'Inicia una nueva sesión',
    description: 'Haz clic en "Nueva Sesión" en el menú lateral. Se abrirá un formulario de tres pasos para preparar los documentos.',
    tip: 'Necesitas dos archivos: el PACI del estudiante y el material de la clase que quieres adaptar.',
    mock: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <MockDot n={1} active /><MockDot n={2} /><MockDot n={3} />
        </div>
        <p className="text-xs font-bold text-stone-900 dark:text-stone-100">Paso 1 — Perfil PACI</p>
        <MockFileZone filled={false} />
      </div>
    ),
  },
  {
    number: 2,
    title: 'Sube los documentos',
    description: 'Paso 1: sube el PACI del estudiante (PDF o DOCX). Paso 2: sube el material de clase o planificación del docente.',
    tip: 'Si no tienes el PACI en digital, puedes escanearlo. El agente puede leer documentos escaneados.',
    mock: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <MockDot n={1} done /><MockDot n={2} active /><MockDot n={3} />
        </div>
        <p className="text-xs font-bold text-stone-900 dark:text-stone-100">Paso 2 — Material Base</p>
        <MockFileZone filled filename="planificacion_matematicas.docx" />
      </div>
    ),
  },
  {
    number: 3,
    title: 'Agrega un contexto (opcional)',
    description: 'En el paso 3 puedes escribir instrucciones adicionales: grado, asignatura, tipo de necesidad del alumno. Si no escribes nada, el agente usará solo los documentos.',
    tip: 'Ejemplo útil: "Alumno de 5° básico con TEA, matemáticas, fracciones. Necesita instrucciones paso a paso."',
    mock: (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <MockDot n={1} done /><MockDot n={2} done /><MockDot n={3} active />
        </div>
        <p className="text-xs font-bold text-stone-900 dark:text-stone-100">Paso 3 — Contexto (opcional)</p>
        <div className="border border-stone-300 dark:border-stone-600 rounded-xl p-3 text-xs text-stone-800 dark:text-stone-200 bg-white dark:bg-stone-800 min-h-[52px] font-medium">
          Alumno de 4° básico con TEA grado 2...
        </div>
        <div className="flex justify-end">
          <div className="bg-stone-900 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm">send</span>Crear Sesión
          </div>
        </div>
      </div>
    ),
  },
  {
    number: 4,
    title: 'El agente procesa los documentos',
    description: 'Después de enviar, el agente inicia automáticamente. Verás sus mensajes en tiempo real mientras analiza el PACI y adapta el material. El proceso dura entre 5 y 15 minutos.',
    tip: 'Puedes ir a otra página — el ícono flotante en la esquina inferior derecha indica que el proceso continúa.',
    mock: (
      <div className="bg-stone-100 dark:bg-stone-800 rounded-xl p-4 space-y-1">
        <MockBubble text="Documentos recibidos. Iniciando análisis del PACI..." />
        <MockBubble text="Analizando PACI del estudiante..." />
        <MockBubble text="Adaptando material educativo..." />
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 pt-1 pl-1">
          <div className="w-3 h-3 border-2 border-lime-500 border-t-transparent rounded-full animate-spin" />
          <span>El agente está procesando...</span>
        </div>
      </div>
    ),
  },
  {
    number: 5,
    title: 'Revisa y aprueba el análisis',
    description: 'El agente se detiene para que valides su trabajo antes de continuar. Verás el perfil del alumno y la planificación adaptada. Si todo está bien, aprueba. Si hay errores, rechaza e indica qué corregir.',
    tip: 'Tienes hasta 3 intentos para aprobar. Si rechazas, el agente corrige y presenta de nuevo.',
    mock: (
      <div className="bg-stone-100 dark:bg-stone-800 rounded-xl p-4 space-y-2">
        <MockBubble text="Revisión requerida — intento 1 de 3." />
        <MockHitlCard />
      </div>
    ),
  },
  {
    number: 6,
    title: 'Descarga la rúbrica adaptada',
    description: 'Una vez aprobado el análisis, el agente genera y evalúa la rúbrica. Cuando termina, aparece el botón de descarga. El archivo .docx está listo para imprimir o compartir.',
    tip: 'Si ves un aviso naranja, la rúbrica se generó pero no pasó todos los criterios automáticos. Revísala antes de usarla.',
    mock: (
      <div className="bg-stone-100 dark:bg-stone-800 rounded-xl p-4">
        <MockBubble text="Proceso completado. La rúbrica está lista." />
        <div className="flex flex-col items-center gap-2 pt-4">
          <span className="material-symbols-outlined text-4xl text-lime-500">check_circle</span>
          <p className="text-xs font-bold text-stone-900 dark:text-stone-100">Rúbrica generada y validada</p>
          <div className="flex items-center gap-1.5 bg-lime-600 text-white text-xs font-bold px-5 py-2 rounded-xl">
            <span className="material-symbols-outlined text-sm">download</span>
            Descargar PACI Adaptado (.docx)
          </div>
        </div>
      </div>
    ),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

const AyudaPage = () => {
  const [active, setActive] = useState(0);
  const step = STEPS[active];

  useEffect(() => { document.title = 'P.R.I.S.M.A. - Ayuda'; }, []);

  return (
    <MainContainer title="Guía de uso">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Intro */}
        <div className={`${PANEL} p-5`}>
          <h2 className={`${H2} mb-2`}>¿Cómo funciona P.R.I.S.M.A.?</h2>
          <p className={BODY}>
            P.R.I.S.M.A. es un asistente de inteligencia artificial que lee el PACI de tu estudiante
            y el material de clase, y genera automáticamente una rúbrica de evaluación adaptada a sus necesidades.
            Sigue los pasos a continuación para completar tu primera sesión.
          </p>
        </div>

        {/* Step tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <button
              key={s.number}
              onClick={() => setActive(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex-shrink-0
                ${active === i
                  ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900'
                  : 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-600'}`}
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center bg-black/20 dark:bg-white/20 text-[10px]">{s.number}</span>
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Step detail */}
        <div className="grid md:grid-cols-2 gap-4">

          {/* Explanation card */}
          <div className={`${PANEL} p-5 space-y-4`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 flex items-center justify-center font-black text-sm flex-shrink-0">
                {step.number}
              </div>
              <h3 className="font-black text-stone-900 dark:text-stone-50 leading-tight">{step.title}</h3>
            </div>

            <p className={BODY}>{step.description}</p>

            {/* Tip */}
            <div className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/50 rounded-r-xl pl-4 pr-3 py-3">
              <p className="text-xs font-bold text-stone-900 dark:text-stone-100 mb-0.5">Consejo</p>
              <p className="text-xs text-stone-800 dark:text-stone-200 leading-relaxed">{step.tip}</p>
            </div>

            {/* Nav */}
            <div className="flex justify-between pt-1">
              <button
                onClick={() => setActive(i => Math.max(0, i - 1))}
                disabled={active === 0}
                className="flex items-center gap-1 text-xs font-bold text-stone-800 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white disabled:opacity-25 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>Anterior
              </button>
              <button
                onClick={() => setActive(i => Math.min(STEPS.length - 1, i + 1))}
                disabled={active === STEPS.length - 1}
                className="flex items-center gap-1 text-xs font-bold text-stone-800 dark:text-stone-200 hover:text-stone-900 dark:hover:text-white disabled:opacity-25 transition-colors"
              >
                Siguiente<span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Visual mock */}
          <div className={`${PANEL} p-5`}>
            <p className={`${LABEL} mb-3`}>Vista de referencia</p>
            {step.mock}
          </div>
        </div>

        {/* Summary */}
        <div className={`${PANEL} p-5`}>
          <p className={`${LABEL} mb-4`}>Resumen del proceso</p>
          <div className="space-y-2">
            {STEPS.map((s, i) => (
              <button
                key={s.number}
                onClick={() => setActive(i)}
                className="w-full flex items-center gap-3 text-left rounded-xl px-2 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors group"
              >
                <MockDot n={s.number} active={active === i} done={active > i} />
                <span className={`text-sm font-semibold flex-1 ${
                  active === i ? 'text-stone-900 dark:text-stone-50' : 'text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-100'
                }`}>
                  {s.title}
                </span>
                {active === i && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-lime-100 dark:bg-lime-900/50 text-lime-800 dark:text-lime-300">
                    actual
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </MainContainer>
  );
};

export default AyudaPage;
