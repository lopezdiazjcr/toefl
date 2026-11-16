// El plan: 24 sesiones en 8 semanas (3 por semana, el mismo ritmo de las
// clases de la academia: lunes, miércoles y jueves). Cada sesión dura ~60 min.
//
// Lógica del orden (ver PLAN.md §4):
//   1. Fundamentos (S1–S9): conocer cada una de las 11 tareas con su estrategia,
//      siempre en modo guiado (con explicación inmediata).
//   2. Construcción (S10–S18): las mismas tareas con el reloj del examen, un
//      simulacro a la mitad y sesiones que atacan lo que salió mal.
//   3. Simulacros (S19–S24): pruebas por sección, dos simulacros completos y
//      el plan para el día del examen.
//
// bloque = { tipo, cantidad, modo: 'guiada' | 'examen', cronometrado?: true }
// sesion.dinamica = n  → la sesión elige las n tareas más flojas del historial.

export const FASES = [
  { id: 1, nombre: 'Fundamentos', semanas: '1–3', idea: 'Conocer las 11 tareas por dentro: qué piden, cómo se califican y la estrategia para cada una. Todo con explicación inmediata.' },
  { id: 2, nombre: 'Construcción', semanas: '4–6', idea: 'Las mismas tareas con el reloj del examen. Simulacro a la mitad y sesiones dedicadas a lo que salió mal.' },
  { id: 3, nombre: 'Simulacros y afinación', semanas: '7–8', idea: 'Pruebas por sección, dos simulacros completos y el plan para el día del examen.' },
];

const g = (tipo, cantidad) => ({ tipo, cantidad, modo: 'guiada' });
const x = (tipo, cantidad) => ({ tipo, cantidad, modo: 'examen', cronometrado: true });

export const SESIONES = [
  // ---------- Fase 1: Fundamentos ----------
  { n: 1, fase: 1, titulo: 'El examen nuevo y las palabras incompletas', objetivo: 'Entender cómo es el TOEFL desde 2026 y dominar la primera tarea del examen.',
    lecciones: ['examen', 'cw', 'lr'], bloques: [g('cw', 2), g('lr', 6)],
    tarea: 'Lea 15 minutos en inglés (una noticia o un artículo corto). Anote 10 palabras con su familia: decide, decision, decisive, decisively.' },
  { n: 2, fase: 1, titulo: 'Textos de la vida diaria y orden de palabras', objetivo: 'Leer correos, avisos y mensajes buscando el propósito; ordenar oraciones sin dudar.',
    lecciones: ['dl', 'bs'], bloques: [g('dl', 3), g('bs', 8)],
    tarea: 'Escriba 5 preguntas indirectas en inglés ("Do you know where…", "Could you tell me when…"). Son las que más salen en Build a Sentence.' },
  { n: 3, fase: 1, titulo: 'Repetir con ritmo y entender conversaciones', objetivo: 'Repetir frases completas agrupando las palabras en bloques; seguir una conversación de principio a fin.',
    lecciones: ['rp', 'lc'], bloques: [g('rp', 1), g('lc', 2)],
    tarea: 'Shadowing: ponga un video corto en inglés y repita cada frase justo después del hablante durante 10 minutos.' },
  { n: 4, fase: 1, titulo: 'El email que cumple los tres puntos', objetivo: 'Escribir un correo de 7 minutos con estructura fija y tono correcto; captar lo esencial de un anuncio.',
    lecciones: ['we', 'la'], bloques: [g('we', 1), g('la', 2)],
    tarea: 'Memorice su plantilla de email (saludo, propósito, tres párrafos, cierre) y escríbala dos veces de memoria.' },
  { n: 5, fase: 1, titulo: 'Textos académicos y la entrevista', objetivo: 'Responder preguntas de idea principal, detalle e inferencia; hablar 45 segundos con estructura.',
    lecciones: ['ap', 'iv'], bloques: [g('ap', 1), g('iv', 1)],
    tarea: 'Grábese respondiendo 3 preguntas de entrevista con la estructura respuesta → razón → ejemplo → cierre. Escúchese.' },
  { n: 6, fase: 1, titulo: 'Charlas académicas y discusión en foro', objetivo: 'Tomar notas útiles de una charla y escribir 100+ palabras que aporten algo nuevo al foro.',
    lecciones: ['lt', 'ad'], bloques: [g('lt', 1), g('ad', 1)],
    tarea: 'Prepare 3 ejemplos personales que sirvan para muchos temas (un trabajo, un viaje, un proyecto). Los usará en Writing y Speaking.' },
  { n: 7, fase: 1, titulo: 'Reading completo, guiado', objetivo: 'Encadenar las tres tareas de Reading y ver dónde se le va el tiempo.',
    lecciones: [], bloques: [g('cw', 2), g('dl', 2), g('ap', 1)],
    tarea: 'Repase su lista de errores de Reading (Progreso → Errores) y escriba por qué falló cada uno.' },
  { n: 8, fase: 1, titulo: 'Listening completo, guiado', objetivo: 'Encadenar las cuatro tareas de Listening y medir cuánto retiene sin repetir el audio.',
    lecciones: [], bloques: [g('lr', 6), g('lc', 1), g('la', 1), g('lt', 1)],
    tarea: 'Escuche un pódcast de 10 minutos y escriba un resumen de 5 líneas sin volver a escucharlo.' },
  { n: 9, fase: 1, titulo: 'Writing y Speaking juntos', objetivo: 'Cerrar la primera fase pasando por las tareas productivas con la estrategia ya aprendida.',
    lecciones: [], bloques: [g('bs', 6), g('we', 1), g('rp', 1), g('iv', 1)],
    tarea: 'Releer sus dos emails y su respuesta de foro: subraye cada error de artículos (a/an/the) y de preposiciones.' },

  // ---------- Fase 2: Construcción ----------
  { n: 10, fase: 2, titulo: 'Reading con reloj', objetivo: 'Hacer Reading con el tiempo del examen: no quedarse pegado en una pregunta.',
    lecciones: ['tiempo'], bloques: [x('cw', 2), x('dl', 2), x('ap', 1)],
    tarea: 'Lea un artículo de divulgación (National Geographic, BBC Future) y escriba la idea principal en una oración.' },
  { n: 11, fase: 2, titulo: 'Listening con reloj y notas', objetivo: 'Escuchar una sola vez, con notas de dos columnas, y responder a ritmo de examen.',
    lecciones: ['notas'], bloques: [x('lr', 8), x('lc', 1), x('la', 1), x('lt', 1)],
    tarea: 'Practique la toma de notas con una charla TED de 5 minutos: idea principal a la izquierda, ejemplos a la derecha.' },
  { n: 12, fase: 2, titulo: 'Simulacro 1', objetivo: 'Medir dónde está a la mitad del plan, con las cuatro secciones en orden y con reloj.',
    simulacro: 'simulacro-1', lecciones: ['simulacro'], bloques: [],
    tarea: 'No estudie hoy después del simulacro. Mañana revise la corrección completa con calma.' },
  { n: 13, fase: 2, titulo: 'Revisión del simulacro', objetivo: 'Convertir los errores del simulacro en práctica: la sesión elige sus dos tareas más flojas.',
    lecciones: ['errores'], dinamica: 2, bloques: [g('we', 1)],
    tarea: 'Escriba en una hoja sus 3 errores más repetidos y una regla para cada uno. Péguela donde estudia.' },
  { n: 14, fase: 2, titulo: 'Argumentar en 10 minutos y hablar 45 segundos', objetivo: 'Afinar las dos tareas que más pesan: la discusión académica y la entrevista.',
    lecciones: ['ad', 'iv'], bloques: [g('ad', 1), g('iv', 1)],
    tarea: 'Responda en voz alta, cronometrando 45 segundos, 5 preguntas de opinión sobre trabajo, estudio y tecnología.' },
  { n: 15, fase: 2, titulo: 'Leer rápido sin perder detalle', objetivo: 'Usar las preguntas para guiar la lectura: buscar, no leer todo dos veces.',
    lecciones: ['dl', 'ap'], bloques: [x('dl', 3), g('ap', 2)],
    tarea: 'Lea 3 correos o avisos reales en inglés (de su trabajo o de internet) y diga en una línea qué quiere quien escribe.' },
  { n: 16, fase: 2, titulo: 'Escuchar lo que no se dice', objetivo: 'Preguntas de actitud, propósito e inferencia en conversaciones, anuncios y charlas.',
    lecciones: ['lc', 'la'], bloques: [g('lc', 2), x('la', 2), x('lt', 1)],
    tarea: 'Vea una escena de una serie en inglés y anote cómo se siente cada personaje y por qué lo sabe.' },
  { n: 17, fase: 2, titulo: 'Pronunciación que se entiende', objetivo: 'Las trampas del hispanohablante: vocales reducidas, finales -ed y -s, y el ritmo del inglés.',
    lecciones: ['pronunciacion', 'rp'], bloques: [g('rp', 2), x('iv', 1)],
    tarea: 'Grabe las 7 frases de Listen and Repeat que peor le salieron y repítalas hasta pasar de 90%.' },
  { n: 18, fase: 2, titulo: 'Gramática que suma puntos', objetivo: 'Orden de palabras, artículos, preposiciones y concordancia: lo que cuesta puntos en tres tareas a la vez.',
    lecciones: ['gramatica'], bloques: [x('bs', 10), x('cw', 2), x('we', 1)],
    tarea: 'Reescriba su email de hoy corrigiendo cada error. Compárelo con el modelo.' },

  // ---------- Fase 3: Simulacros y afinación ----------
  { n: 19, fase: 3, titulo: 'Prueba de sección: Reading', objetivo: 'Una sección completa de Reading con reloj, sin ayudas.',
    lecciones: [], bloques: [x('cw', 2), x('dl', 2), x('ap', 2)],
    tarea: 'Revise cada error y clasifíquelo: vocabulario, lectura apresurada o trampa de la pregunta.' },
  { n: 20, fase: 3, titulo: 'Prueba de sección: Listening', objetivo: 'Una sección completa de Listening con reloj, audio una sola vez.',
    lecciones: [], bloques: [x('lr', 8), x('lc', 2), x('la', 1), x('lt', 2)],
    tarea: 'Escuche de nuevo los audios que falló, ahora con la transcripción, y encuentre la frase exacta que tenía la respuesta.' },
  { n: 21, fase: 3, titulo: 'Prueba de sección: Writing y Speaking', objetivo: 'Las tareas productivas seguidas, con el tiempo exacto del examen.',
    lecciones: [], bloques: [x('bs', 10), x('we', 1), x('ad', 1), x('rp', 1), x('iv', 1)],
    tarea: 'Califíquese con la rúbrica y compare con los modelos. ¿Qué frase del modelo podría usar usted siempre?' },
  { n: 22, fase: 3, titulo: 'Simulacro 2', objetivo: 'Segundo examen completo: compare contra el Simulacro 1.',
    simulacro: 'simulacro-2', lecciones: ['simulacro'], bloques: [],
    tarea: 'Compare sus bandas con las del Simulacro 1 en Progreso. Anote qué sección subió y cuál no.' },
  { n: 23, fase: 3, titulo: 'Ataque a los puntos débiles', objetivo: 'Tres tareas, elegidas por su historial, con práctica guiada y luego con reloj.',
    lecciones: ['errores'], dinamica: 3, bloques: [],
    tarea: 'Prepare el día del examen: documento de identidad, hora, equipo y lugar (ver la lista de la Sesión 24).' },
  { n: 24, fase: 3, titulo: 'Simulacro final y plan del día del examen', objetivo: 'El último ensayo completo y una lista clara de qué hacer antes, durante y después del examen.',
    simulacro: 'simulacro-3', lecciones: ['dia-examen'], bloques: [],
    tarea: 'Descanse el día anterior al examen. Repase solo su hoja de errores y sus plantillas.' },
];

export const MINUTOS_SESION = 60;

// Fechas sugeridas a partir de un día de inicio y los días de estudio por semana.
// diasSemana: arreglo de números de día (0 = domingo). Por defecto L, Mi, J.
export function calendario(inicioISO, diasSemana = [1, 3, 4]) {
  if (!inicioISO) return [];
  const fechas = [];
  const d = new Date(inicioISO + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return [];
  let guard = 0;
  while (fechas.length < SESIONES.length && guard < 400) {
    if (diasSemana.includes(d.getDay())) fechas.push(new Date(d));
    d.setDate(d.getDate() + 1);
    guard++;
  }
  return fechas;
}
