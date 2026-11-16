import { h, limpiar, poner } from '../util.js';
import { SESIONES, FASES, calendario, MINUTOS_SESION } from '../plan.js';
import { cargar, perfil, actualizarPerfil } from '../estado.js';
import { TAREAS } from '../tareas/index.js';
import { tarjetaClases } from './cta.js';

const DIAS = [[1, 'L'], [2, 'Ma'], [3, 'Mi'], [4, 'J'], [5, 'V'], [6, 'S'], [0, 'D']];

export function pintar(main) {
  limpiar(main);
  const e = cargar();
  const p = perfil();
  const dias = p.dias && p.dias.length ? p.dias : [1, 3, 4];
  const fechas = calendario(p.inicio, dias);
  const siguiente = SESIONES.find((s) => !(e.sesiones[s.n] && e.sesiones[s.n].completada));
  const hechas = SESIONES.filter((s) => e.sesiones[s.n] && e.sesiones[s.n].completada).length;

  const aviso = h('div', {});
  const pintarAviso = () => {
    limpiar(aviso);
    const f = calendario(perfil().inicio, perfil().dias || dias);
    const examen = perfil().fechaExamen ? new Date(perfil().fechaExamen + 'T12:00:00') : null;
    if (!f.length) return;
    const fin = f[f.length - 1];
    const texto = `Con este ritmo termina el ${fin.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}.`;
    if (examen && fin >= examen) {
      const diasDisp = Math.max(1, Math.round((examen - new Date(perfil().inicio + 'T12:00:00')) / 86400000));
      const porSemana = Math.ceil((SESIONES.length / diasDisp) * 7);
      poner(aviso, h('p', { class: 'aviso' }, `${texto} Su examen es antes: necesita unas ${Math.min(7, porSemana)} sesiones por semana. Si no le alcanza, priorice las sesiones 1–6 (conocer las tareas), 10–12 y 21–24.`));
    } else {
      poner(aviso, h('p', { class: 'aviso' }, texto + (examen ? ' Le quedan días de margen para repasar antes del examen.' : '')));
    }
  };

  const inputInicio = h('input', { type: 'date', value: p.inicio || '', onchange: (ev) => { actualizarPerfil({ inicio: ev.target.value }); pintar(main); } });
  const inputExamen = h('input', { type: 'date', value: p.fechaExamen || '', onchange: (ev) => { actualizarPerfil({ fechaExamen: ev.target.value }); pintarAviso(); } });
  const meta = h('select', { onchange: (ev) => actualizarPerfil({ bandaMeta: Number(ev.target.value) }) },
    [3, 3.5, 4, 4.5, 5, 5.5, 6].map((b) => { const o = h('option', { value: b }, b.toFixed(1)); if (b === p.bandaMeta) o.selected = true; return o; }));
  const casillas = h('div', { class: 'escala', role: 'group', 'aria-label': 'Días de estudio' }, DIAS.map(([d, t]) =>
    h('button', { type: 'button', 'aria-pressed': String(dias.includes(d)), onclick: () => {
      const actual = new Set(perfil().dias && perfil().dias.length ? perfil().dias : [1, 3, 4]);
      actual.has(d) ? actual.delete(d) : actual.add(d);
      if (!actual.size) return;
      actualizarPerfil({ dias: [...actual] });
      pintar(main);
    } }, t)));
  const estiloCampo = { padding: '10px 12px', borderRadius: '10px', border: '1.5px solid var(--linea-fuerte)', background: '#fff', font: 'inherit', color: '#111' };
  [inputInicio, inputExamen, meta].forEach((el) => Object.assign(el.style, estiloCampo));

  poner(main, h('section', { class: 'seccion' }, h('div', { class: 'contenedor' },
    h('p', { class: 'kicker' }, `Plan · ${hechas} de ${SESIONES.length} sesiones hechas`),
    h('h1', {}, '24 sesiones, 8 semanas, 3 fases'),
    h('p', { class: 'suave', style: { maxWidth: '72ch' } }, `Cada sesión dura unos ${MINUTOS_SESION} minutos y sigue el mismo orden: estrategia, práctica guiada, práctica con reloj y tarea para la casa. El orden importa: primero se aprende cómo funciona cada tarea, después se le pone reloj y al final se ensaya el examen completo.`),
    !e.diagnostico ? h('div', { class: 'tarjeta azul', style: { margin: '18px 0' } },
      h('p', { style: { fontWeight: 700, margin: '0 0 10px' } }, 'Antes de la Sesión 1: haga el diagnóstico (unos 40 minutos). Así sabe de dónde parte.'),
      h('a', { class: 'boton claro chico', href: '#/simulacro/diagnostico' }, 'Hacer el diagnóstico')) : null,

    h('div', { class: 'tarjeta plana', style: { margin: '18px 0 30px' } },
      h('h3', {}, 'Su calendario'),
      h('div', { class: 'rejilla cuatro', style: { alignItems: 'end' } },
        h('label', {}, h('div', { style: { fontWeight: 600, fontSize: '14px', marginBottom: '6px' } }, 'Empiezo el'), inputInicio),
        h('label', {}, h('div', { style: { fontWeight: 600, fontSize: '14px', marginBottom: '6px' } }, 'Mi examen es el'), inputExamen),
        h('label', {}, h('div', { style: { fontWeight: 600, fontSize: '14px', marginBottom: '6px' } }, 'Banda meta'), meta),
        h('div', {}, h('div', { style: { fontWeight: 600, fontSize: '14px', marginBottom: '6px' } }, 'Días de estudio'), casillas)),
      h('div', { style: { marginTop: '14px' } }, aviso)),

    FASES.map((f) => h('div', { class: 'fase' },
      h('div', { class: 'fase-cabecera' },
        h('h2', { style: { margin: 0 } }, `Fase ${f.id} · ${f.nombre}`),
        h('span', { class: 'suave', style: { fontWeight: 600 } }, `Semanas ${f.semanas}`)),
      h('p', { class: 'suave', style: { maxWidth: '72ch' } }, f.idea),
      h('div', { class: 'rejilla', style: { gap: '10px' } }, SESIONES.filter((s) => s.fase === f.id).map((s) => {
        const prog = e.sesiones[s.n];
        const hecha = prog && prog.completada;
        const esSig = siguiente && siguiente.n === s.n;
        const fecha = fechas[s.n - 1];
        const tipos = s.simulacro ? ['Simulacro completo'] : s.dinamica ? ['Elegida por sus errores', ...s.bloques.map((b) => TAREAS[b.tipo].oficial)] : [...new Set(s.bloques.map((b) => TAREAS[b.tipo].oficial))];
        return h('a', { class: `tarjeta sesion-tarjeta${hecha ? ' hecha' : ''}${esSig ? ' siguiente' : ''}`, href: `#/sesion/${s.n}` },
          h('span', { class: 'sesion-num' }, String(s.n)),
          h('div', {},
            h('div', { style: { fontWeight: 700 } }, s.titulo),
            h('div', { class: 'sesion-meta' }, tipos.map((t) => h('span', { class: 'etiqueta', style: { background: 'rgba(12,14,130,.07)', color: 'var(--tinta)' } }, t)))),
          h('span', { class: 'estado-sesion' }, hecha ? '✓ Hecha' : esSig ? 'Siguiente' : fecha ? fecha.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' }) : ''));
      })))))));
  poner(main.querySelector('.seccion .contenedor'), tarjetaClases());
  pintarAviso();
}
