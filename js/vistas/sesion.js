import { h, limpiar, poner } from '../util.js';
import { SESIONES, FASES, MINUTOS_SESION } from '../plan.js';
import { TAREAS, SECCIONES } from '../tareas/index.js';
import { progresoSesion, marcarBloque, marcarLeccion, completarSesion, precisionPorTipo, guardar } from '../estado.js';
import { elegir, estrategias } from '../datos.js';
import { correr } from '../runner.js';
import { pintarResultados } from './resultados.js';
import { leccion } from './leccion.js';
import { RONDA } from './practica.js';
import { EXAMENES } from '../examenes.js';
import { tarjetaClases } from './cta.js';

// Las sesiones "dinámicas" eligen las tareas más flojas una sola vez y las
// guardan, para que los bloques no cambien si la persona sale y vuelve.
function bloquesDe(s) {
  const prog = progresoSesion(s.n);
  if (!s.dinamica) return s.bloques;
  if (!prog.dinamicos) {
    const prec = precisionPorTipo();
    const todos = Object.keys(TAREAS);
    const con = todos.filter((t) => prec[t] && prec[t].precision != null).sort((a, b) => prec[a].precision - prec[b].precision);
    const sin = todos.filter((t) => !prec[t]);
    prog.dinamicos = [...con, ...sin].filter((t) => !s.bloques.some((b) => b.tipo === t)).slice(0, s.dinamica);
    guardar();
  }
  const extra = prog.dinamicos.flatMap((tipo) => [
    { tipo, cantidad: Math.max(1, Math.ceil((RONDA[tipo] || 1) / 2)), modo: 'guiada' },
    { tipo, cantidad: Math.max(1, Math.ceil((RONDA[tipo] || 1) / 2)), modo: 'examen', cronometrado: true },
  ]);
  return [...extra, ...s.bloques];
}

const nombreBloque = (b) => `${b.modo === 'guiada' ? 'Práctica guiada' : 'Con reloj'} · ${TAREAS[b.tipo].oficial}${b.cantidad > 1 ? ` × ${b.cantidad}` : ''}`;

export function pintar(main, n) {
  const s = SESIONES.find((x) => x.n === Number(n));
  if (!s) { location.hash = '#/plan'; return; }
  limpiar(main);
  window.scrollTo(0, 0);
  const prog = progresoSesion(s.n);
  const fase = FASES.find((f) => f.id === s.fase);
  const semana = Math.ceil(s.n / 3);
  const bloques = bloquesDe(s);
  const simulacro = s.simulacro ? EXAMENES.find((x) => x.id === s.simulacro) : null;

  const pasos = [];
  if (s.lecciones.length) {
    pasos.push({ hecho: prog.leccion, titulo: 'Estrategia', detalle: 'Lea la lección antes de practicar (5–10 min).', href: `#/sesion/${s.n}/leccion`, accion: prog.leccion ? 'Repasar' : 'Leer' });
  }
  if (simulacro) {
    const hecho = !!prog.bloques.sim;
    pasos.push({ hecho, titulo: simulacro.titulo, detalle: `Examen completo, ≈ ${simulacro.minutos} min.`, href: `#/simulacro/${simulacro.id}?sesion=${s.n}`, accion: hecho ? 'Repetir' : 'Empezar' });
  }
  bloques.forEach((b, i) => {
    const r = prog.bloques[i];
    pasos.push({
      hecho: !!r, titulo: nombreBloque(b),
      detalle: r ? `Resultado: ${Math.round((r.c / r.t) * 100)}%` : `${SECCIONES[TAREAS[b.tipo].seccion].en}${b.modo === 'examen' ? ' · tiempo de examen' : ' · con explicación'}`,
      href: `#/sesion/${s.n}/bloque/${i}`, accion: r ? 'Repetir' : 'Empezar', seccion: TAREAS[b.tipo].seccion,
    });
  });

  const siguientePaso = pasos.find((p) => !p.hecho);
  const terminar = h('button', { class: prog.completada ? 'boton secundario' : 'boton sonic', type: 'button', onclick: () => {
    completarSesion(s.n);
    const sig = SESIONES.find((x) => x.n === s.n + 1);
    location.hash = sig ? `#/sesion/${sig.n}` : '#/progreso';
  } }, prog.completada ? 'Sesión hecha ✓ · ir a la siguiente' : 'Marcar la sesión como hecha');

  poner(main, h('section', { class: 'seccion' }, h('div', { class: 'contenedor', style: { maxWidth: '880px' } },
    h('a', { href: '#/plan', class: 'suave', style: { fontSize: '14px' } }, '← Plan completo'),
    h('p', { class: 'kicker', style: { marginTop: '16px' } }, `Sesión ${s.n} de ${SESIONES.length} · Semana ${semana} · ${fase.nombre}`),
    h('h1', {}, s.titulo),
    h('p', { style: { fontSize: '18px' } }, s.objetivo),
    h('p', { class: 'suave' }, `Duración: unos ${s.simulacro ? 90 : MINUTOS_SESION} minutos.`),
    s.dinamica ? h('p', { class: 'aviso' }, `Esta sesión eligió sus ${s.dinamica} tareas con menor acierto: ${(prog.dinamicos || []).map((t) => TAREAS[t].oficial).join(', ')}.`) : null,
    h('h2', { style: { marginTop: '26px' } }, 'La ruta de hoy'),
    h('ol', { class: 'ruta-sesion lista-limpia' }, pasos.map((p, i) => h('li', { class: `bloque-sesion${p.hecho ? ' hecho' : ''}${p === siguientePaso ? ' activo' : ''}` },
      h('span', { class: 'n' }, p.hecho ? '✓' : String(i + 1)),
      h('div', {}, h('div', { style: { fontWeight: 700 } }, p.titulo), h('div', { class: 'suave', style: { fontSize: '14px' } }, p.detalle)),
      h('a', { class: `boton chico${p === siguientePaso ? '' : ' secundario'}`, href: p.href }, p.accion)))),
    h('div', { class: 'tarjeta plana', style: { marginTop: '22px' } },
      h('h3', {}, 'Tarea para la casa'),
      h('p', { style: { margin: 0 } }, s.tarea)),
    tarjetaClases(),
    h('div', { class: 'fila-botones', style: { marginTop: '22px' } }, terminar,
      SESIONES.find((x) => x.n === s.n + 1) ? h('a', { class: 'boton secundario', href: `#/sesion/${s.n + 1}` }, 'Ver la siguiente') : null))));
}

export async function pintarLeccion(main, n) {
  const s = SESIONES.find((x) => x.n === Number(n));
  if (!s) return;
  limpiar(main);
  window.scrollTo(0, 0);
  const todas = await estrategias();
  marcarLeccion(s.n);
  poner(main, h('section', { class: 'seccion' }, h('div', { class: 'contenedor', style: { maxWidth: '820px' } },
    h('a', { href: `#/sesion/${s.n}`, class: 'suave', style: { fontSize: '14px' } }, `← Sesión ${s.n}`),
    s.lecciones.map((k, i) => h('div', { style: { marginTop: i ? '40px' : '16px', paddingTop: i ? '30px' : 0, borderTop: i ? '1px solid var(--linea)' : 0 } }, leccion(todas[k]))),
    h('div', { class: 'fila-botones', style: { marginTop: '28px' } }, h('a', { class: 'boton', href: `#/sesion/${s.n}` }, 'Listo: volver a la sesión')))));
}

export async function pintarBloque(main, n, i) {
  const s = SESIONES.find((x) => x.n === Number(n));
  if (!s) return;
  const b = bloquesDe(s)[Number(i)];
  if (!b) { location.hash = `#/sesion/${n}`; return; }
  const t = TAREAS[b.tipo];
  const items = await elegir(b.tipo, { cantidad: b.cantidad, nivel: b.nivel });
  const unidades = items.map((item) => ({ tipo: b.tipo, item }));
  const limite = b.cronometrado && !['we', 'ad', 'rp', 'iv'].includes(b.tipo) ? unidades.reduce((acc, u) => acc + t.segundos(u.item), 0) : null;
  const { resultados } = await correr(unidades, { montaje: main, modo: b.modo, limiteSeg: limite, titulo: `Sesión ${s.n} · ${nombreBloque(b)}` });
  const c = resultados.reduce((acc, r) => acc + (r.correctas || 0), 0);
  const tt = resultados.reduce((acc, r) => acc + (r.total || 0), 0);
  marcarBloque(s.n, Number(i), c, tt || 1);
  pintarResultados(main, {
    titulo: `Sesión ${s.n} · ${nombreBloque(b)}`,
    resultados,
    alCambiar: () => {
      const c2 = resultados.reduce((acc, r) => acc + (r.correctas || 0), 0);
      marcarBloque(s.n, Number(i), c2, tt || 1);
    },
    acciones: [h('a', { class: 'boton', href: `#/sesion/${s.n}` }, 'Volver a la sesión')],
  });
}
