// Estimación de banda 1–6 (escala del TOEFL iBT desde el 21-ene-2026, en medios puntos).
//
// Es una ESTIMACIÓN de práctica: el examen real es adaptativo, equipara con
// IRT y califica Writing/Speaking con el motor de ETS. Sirve para ver
// tendencia y decidir qué estudiar, no para prometer un puntaje.
//
// Cómo se calcula: cada sección suma sus puntos crudos como en el examen
// (Reading y Listening 1 punto por pregunta; Writing 0–20: 10 de Build a
// Sentence + 5 del email + 5 de la discusión; Speaking 0–55: 7 frases × 5 +
// 4 respuestas × 5). La proporción de puntos pasa a banda con escalones
// conservadores. La global es el promedio de las cuatro redondeado al medio
// punto más cercano, igual que ETS (5.125 → 5; 5.25 → 5.5).
import { TAREAS, ORDEN_SECCIONES } from './tareas/index.js';

const ESCALONES = [
  [0.95, 6], [0.88, 5.5], [0.8, 5], [0.7, 4.5], [0.6, 4],
  [0.5, 3.5], [0.4, 3], [0.3, 2.5], [0.2, 2], [0.1, 1.5], [0, 1],
];

export function bandaDesdeProporcion(p) {
  if (p == null || Number.isNaN(p)) return null;
  for (const [min, b] of ESCALONES) if (p >= min) return b;
  return 1;
}

// Equivalencia MCER publicada por ETS para la escala 1–6.
export function mcer(banda) {
  if (banda == null) return '—';
  if (banda >= 6) return 'C2';
  if (banda >= 5) return 'C1';
  if (banda >= 4) return 'B2';
  if (banda >= 3) return 'B1';
  if (banda >= 2) return 'A2';
  return 'A1';
}

export const redondearBanda = (x) => Math.round(x * 2) / 2;

// resultados: [{ tipo, correctas, total }]
export function bandasDe(resultados) {
  const porSeccion = {};
  for (const r of resultados) {
    if (!r || !r.total) continue;
    const t = TAREAS[r.tipo];
    if (!t) continue;
    const s = (porSeccion[t.seccion] ||= { c: 0, t: 0 });
    s.c += r.correctas || 0;
    s.t += r.total;
  }
  const bandas = {};
  for (const s of ORDEN_SECCIONES) {
    bandas[s] = porSeccion[s] ? bandaDesdeProporcion(porSeccion[s].c / porSeccion[s].t) : null;
  }
  const validas = ORDEN_SECCIONES.map((s) => bandas[s]).filter((b) => b != null);
  // Como en el examen, el total solo existe si las cuatro secciones tienen puntaje.
  const global = validas.length === 4 ? redondearBanda(validas.reduce((a, b) => a + b, 0) / 4) : null;
  return { bandas, global, completas: validas.length === 4 };
}

// Concordancia oficial banda → total comparable en la escala 0–120 (piso del
// rango), publicada por ETS para la transición de dos años desde enero 2026.
// Fuente: ets.org/toefl/test-takers/ibt/scores/understand-scores.html
export const CONCORDANCIA_120 = [
  [6, 114], [5.5, 107], [5, 95], [4.5, 86], [4, 72], [3.5, 58],
  [3, 44], [2.5, 34], [2, 24], [1.5, 12], [1, 0],
];

export function comparable120(global) {
  if (global == null) return null;
  const fila = CONCORDANCIA_120.find(([b]) => global >= b);
  return fila ? fila[1] : 0;
}
