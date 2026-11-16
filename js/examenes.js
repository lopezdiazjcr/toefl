// Diagnóstico y simulacros. La estructura copia la de los exámenes de práctica
// oficiales de ETS para el formato 2026 (ver PLAN.md §1):
//   Reading   módulo 1: 1 Complete the Words + 2 Daily Life + 1 Academic Passage (20 ítems)
//             módulo 2: lo mismo, más fácil o más difícil según el módulo 1
//   Listening módulo 1: 8 Choose a Response + 2 conversaciones + 1 anuncio + 1 charla (18)
//             módulo 2: 8 + 1 + 1 + 1 (16), adaptativo
//   Writing   10 Build a Sentence + 1 email (7 min) + 1 discusión (10 min)
//   Speaking  Listen and Repeat (7 frases) + entrevista (4 preguntas)
//
// pieza = { tipo, cantidad, nivel? }  · modulo.adaptativo = true → el nivel lo decide el módulo anterior
// limite en segundos (null = cada tarea lleva su propio reloj: email, discusión, speaking).

const MEDIO = ['B1', 'B2'];
const ALTO = ['B2', 'C1'];
const BAJO = ['A2', 'B1'];
export const UMBRAL_ADAPTATIVO = 0.65; // ≥ 65% en el módulo 1 → módulo 2 difícil

function simulacro(id, titulo) {
  return {
    id, titulo, minutos: 90,
    descripcion: 'Examen completo en el orden real, con reloj por módulo y segundo módulo adaptativo en Reading y Listening.',
    secciones: [
      { seccion: 'lectura', modulos: [
        { titulo: 'Módulo 1', limite: 18 * 60, piezas: [{ tipo: 'cw', cantidad: 1, nivel: MEDIO }, { tipo: 'dl', cantidad: 2, nivel: MEDIO }, { tipo: 'ap', cantidad: 1, nivel: MEDIO }] },
        { titulo: 'Módulo 2', limite: 12 * 60, adaptativo: true, piezas: [{ tipo: 'cw', cantidad: 1 }, { tipo: 'dl', cantidad: 2 }, { tipo: 'ap', cantidad: 1 }] },
      ] },
      { seccion: 'escucha', modulos: [
        { titulo: 'Módulo 1', limite: 18 * 60, piezas: [{ tipo: 'lr', cantidad: 8, nivel: MEDIO }, { tipo: 'lc', cantidad: 2, nivel: MEDIO }, { tipo: 'la', cantidad: 1, nivel: MEDIO }, { tipo: 'lt', cantidad: 1, nivel: MEDIO }] },
        { titulo: 'Módulo 2', limite: 11 * 60, adaptativo: true, piezas: [{ tipo: 'lr', cantidad: 8 }, { tipo: 'lc', cantidad: 1 }, { tipo: 'la', cantidad: 1 }, { tipo: 'lt', cantidad: 1 }] },
      ] },
      { seccion: 'escritura', modulos: [
        { titulo: 'Build a Sentence', limite: 7 * 60, piezas: [{ tipo: 'bs', cantidad: 10 }] },
        { titulo: 'Email y discusión', limite: null, piezas: [{ tipo: 'we', cantidad: 1 }, { tipo: 'ad', cantidad: 1 }] },
      ] },
      { seccion: 'habla', modulos: [
        { titulo: 'Listen and Repeat y entrevista', limite: null, piezas: [{ tipo: 'rp', cantidad: 1 }, { tipo: 'iv', cantidad: 1 }] },
      ] },
    ],
  };
}

export const EXAMENES = [
  {
    id: 'diagnostico', titulo: 'Diagnóstico', minutos: 40,
    descripcion: 'Las 11 tareas en versión corta. Le da una banda estimada por sección para saber por dónde empezar.',
    secciones: [
      { seccion: 'lectura', modulos: [
        { titulo: 'Reading', limite: 11 * 60, piezas: [{ tipo: 'cw', cantidad: 1, nivel: MEDIO }, { tipo: 'dl', cantidad: 1, nivel: MEDIO }, { tipo: 'ap', cantidad: 1, nivel: MEDIO }] },
      ] },
      { seccion: 'escucha', modulos: [
        { titulo: 'Listening', limite: 10 * 60, piezas: [{ tipo: 'lr', cantidad: 5, nivel: MEDIO }, { tipo: 'lc', cantidad: 1, nivel: MEDIO }, { tipo: 'la', cantidad: 1, nivel: MEDIO }, { tipo: 'lt', cantidad: 1, nivel: MEDIO }] },
      ] },
      { seccion: 'escritura', modulos: [
        { titulo: 'Build a Sentence', limite: 4 * 60, piezas: [{ tipo: 'bs', cantidad: 5, nivel: MEDIO }] },
        { titulo: 'Email', limite: null, piezas: [{ tipo: 'we', cantidad: 1 }] },
      ] },
      { seccion: 'habla', modulos: [
        { titulo: 'Speaking', limite: null, piezas: [{ tipo: 'rp', cantidad: 1, nivel: MEDIO }, { tipo: 'iv', cantidad: 1 }] },
      ] },
    ],
  },
  simulacro('simulacro-1', 'Simulacro 1'),
  simulacro('simulacro-2', 'Simulacro 2'),
  simulacro('simulacro-3', 'Simulacro final'),
];

export const nivelModulo2 = (proporcion) => (proporcion >= UMBRAL_ADAPTATIVO ? ALTO : BAJO);
