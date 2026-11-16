// Bancos de preguntas: un JSON por tipo de tarea en /datos.
// Se elige primero lo que la persona no ha visto, y entre lo visto, lo más viejo.
import { cargar as estado } from './estado.js';
import { barajar } from './util.js';

const cache = {};

export async function banco(tipo) {
  if (!cache[tipo]) {
    cache[tipo] = fetch(new URL(`../datos/${tipo}.json`, import.meta.url))
      .then((r) => {
        if (!r.ok) throw new Error(`No se pudo cargar el banco ${tipo}`);
        return r.json();
      })
      .then((j) => j.items || []);
  }
  return cache[tipo];
}

// Las lecciones vienen en cinco archivos (general + una por sección) y se juntan.
const ARCHIVOS_ESTRATEGIA = ['general', 'lectura', 'escucha', 'escritura', 'habla'];

export async function estrategias() {
  if (!cache._estrategias) {
    cache._estrategias = Promise.all(ARCHIVOS_ESTRATEGIA.map((n) =>
      fetch(new URL(`../datos/estrategias-${n}.json`, import.meta.url))
        .then((r) => (r.ok ? r.json() : {}))
        .catch(() => ({}))))
      .then((partes) => Object.assign({}, ...partes));
  }
  return cache._estrategias;
}

const ORDEN_NIVEL = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

// opciones: { cantidad, nivel: 'B1' | ['B1','B2'], ids: [...], reservados: Set }
export async function elegir(tipo, { cantidad = 1, nivel, ids, reservados } = {}) {
  const todos = await banco(tipo);
  if (ids && ids.length) return ids.map((id) => todos.find((x) => x.id === id)).filter(Boolean);
  const vistos = estado().vistos || {};
  let pool = todos.filter((x) => !(reservados && reservados.has(x.id)));
  if (nivel) {
    const niveles = Array.isArray(nivel) ? nivel : [nivel];
    const filtrado = pool.filter((x) => !x.nivel || niveles.includes(x.nivel));
    if (filtrado.length >= cantidad) pool = filtrado;
  }
  const nuevos = barajar(pool.filter((x) => !vistos[x.id]));
  const viejos = pool.filter((x) => vistos[x.id]).sort((a, b) => vistos[a.id] - vistos[b.id]);
  const elegidos = [...nuevos, ...viejos].slice(0, cantidad);
  // De fácil a difícil dentro del bloque, como sube un examen.
  return elegidos.sort((a, b) => (ORDEN_NIVEL[a.nivel] || 3) - (ORDEN_NIVEL[b.nivel] || 3));
}
