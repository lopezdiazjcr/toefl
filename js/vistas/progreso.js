import { h, limpiar, fechaCorta, poner } from '../util.js';
import { cargar, precisionPorTipo, reiniciar, exportar, hayMemoria } from '../estado.js';
import { TAREAS, SECCIONES, ORDEN_SECCIONES, TIPOS_POR_SECCION } from '../tareas/index.js';
import { SESIONES } from '../plan.js';
import { mcer } from '../bandas.js';
import { tarjetasBandas } from './resultados.js';
import { tarjetaClases } from './cta.js';

export function pintar(main) {
  limpiar(main);
  const e = cargar();
  const prec = precisionPorTipo();
  const hechas = SESIONES.filter((s) => e.sesiones[s.n] && e.sesiones[s.n].completada).length;
  const mediciones = [
    ...(e.diagnostico ? [{ nombre: 'Diagnóstico', ...e.diagnostico }] : []),
    ...e.simulacros.map((s, i) => ({ nombre: s.id === 'simulacro-3' ? 'Simulacro final' : `Simulacro ${s.id ? s.id.replace('simulacro-', '') : i + 1}`, ...s })),
  ].sort((a, b) => new Date(a.fecha || a.f) - new Date(b.fecha || b.f));
  const ultima = mediciones[mediciones.length - 1];
  const debiles = Object.entries(prec).filter(([, p]) => p.precision != null && p.intentos >= 2).sort((a, b) => a[1].precision - b[1].precision).slice(0, 3);

  const borrar = h('button', { class: 'boton peligro chico', type: 'button' }, 'Borrar todo mi progreso');
  borrar.onclick = () => {
    if (borrar.dataset.ok) { reiniciar(); pintar(main); return; }
    borrar.dataset.ok = '1';
    borrar.textContent = '¿Seguro? No se puede deshacer. Toque otra vez.';
  };
  const descargar = h('button', { class: 'boton secundario chico', type: 'button', onclick: () => {
    const url = URL.createObjectURL(new Blob([exportar()], { type: 'application/json' }));
    const a = h('a', { href: url, download: `toefl-progreso-${new Date().toISOString().slice(0, 10)}.json` });
    poner(document.body, a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  } }, 'Descargar copia (JSON)');

  poner(main, h('section', { class: 'seccion' }, h('div', { class: 'contenedor' },
    h('p', { class: 'kicker' }, 'Progreso'),
    h('h1', {}, 'Dónde está y qué le falta'),
    !hayMemoria() ? h('p', { class: 'aviso' }, 'Su navegador no permite guardar datos (¿modo incógnito?). El progreso se pierde al cerrar la pestaña.') : null,

    h('div', { class: 'rejilla tres', style: { margin: '18px 0' } },
      h('div', { class: 'tarjeta' }, h('p', { class: 'kicker' }, 'Sesiones'), h('div', { class: 'dato' }, `${hechas}`, h('small', {}, ` de ${SESIONES.length}`)),
        h('div', { class: 'medidor', style: { marginTop: '10px' } }, h('i', { style: { width: `${(hechas / SESIONES.length) * 100}%` } }))),
      h('div', { class: 'tarjeta' }, h('p', { class: 'kicker' }, 'Ejercicios resueltos'), h('div', { class: 'dato' }, String(e.intentos.length))),
      h('div', { class: 'tarjeta' }, h('p', { class: 'kicker' }, 'Banda meta'), h('div', { class: 'dato' }, (e.perfil.bandaMeta || 4.5).toFixed(1), h('small', {}, ` ≈ ${mcer(e.perfil.bandaMeta || 4.5)}`)))),

    h('h2', { style: { marginTop: '28px' } }, 'Bandas estimadas'),
    ultima ? [
      h('p', { class: 'suave' }, `Última medición: ${ultima.nombre}, ${fechaCorta(ultima.fecha || ultima.f)}${ultima.incompleto ? ' (incompleta)' : ''}.`),
      tarjetasBandas(ultima.bandas || {}, ultima.global),
      mediciones.length > 1 ? h('div', { class: 'tabla-envoltura', style: { marginTop: '16px' } }, h('table', {},
        h('thead', {}, h('tr', {}, ['Medición', 'Fecha', ...ORDEN_SECCIONES.map((s) => SECCIONES[s].en), 'Global'].map((t) => h('th', {}, t)))),
        h('tbody', {}, mediciones.map((m) => h('tr', {},
          h('td', { style: { fontWeight: 700 } }, m.nombre), h('td', {}, fechaCorta(m.fecha || m.f)),
          ORDEN_SECCIONES.map((s) => h('td', {}, m.bandas && m.bandas[s] != null ? m.bandas[s].toFixed(1) : '—')),
          h('td', { style: { fontWeight: 800 } }, m.global != null ? m.global.toFixed(1) : '—')))))) : null,
    ] : h('div', { class: 'vacio' }, 'Todavía no hay mediciones. ', h('a', { href: '#/simulacro/diagnostico' }, 'Haga el diagnóstico'), ' para tener su punto de partida.'),

    tarjetaClases(),

    h('h2', { style: { marginTop: '32px' } }, 'Acierto por tarea'),
    h('p', { class: 'suave' }, 'Sobre sus últimos intentos de cada tarea. En email, discusión y entrevista cuenta su autoevaluación con la rúbrica.'),
    debiles.length ? h('p', { class: 'aviso' }, 'Para practicar primero: ', debiles.map(([t], i) => [i ? ', ' : '', h('a', { href: `#/practica/${t}/guiada` }, TAREAS[t].oficial)])) : null,
    h('div', { class: 'rejilla dos', style: { marginTop: '12px' } }, ORDEN_SECCIONES.map((s) => h('div', { class: 'tarjeta plana' },
      h('span', { class: `etiqueta ${SECCIONES[s].clase}` }, SECCIONES[s].en),
      TIPOS_POR_SECCION[s].map((t) => {
        const p = prec[t];
        const v = p && p.precision != null ? Math.round(p.precision * 100) : null;
        return h('div', { style: { marginTop: '12px' } },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '14px' } },
            h('a', { href: `#/practica/${t}/guiada`, style: { fontWeight: 600, color: 'var(--tinta)' } }, TAREAS[t].oficial),
            h('span', { class: 'suave' }, v == null ? 'sin datos' : `${v}% · ${p.intentos} intento${p.intentos === 1 ? '' : 's'}`)),
          h('div', { class: 'medidor', style: { marginTop: '4px' } }, h('i', { style: { width: `${v || 0}%`, background: v != null && v < 60 ? 'var(--mal)' : 'var(--sonic)' } })));
      })))),

    h('h2', { style: { marginTop: '32px' } }, 'Sus errores recientes'),
    e.errores.length
      ? h('div', { class: 'tarjeta plana' }, [...e.errores].reverse().slice(0, 30).map((x) => h('div', { class: 'revision-item', style: { padding: '10px 0' } },
          h('span', { class: `etiqueta ${SECCIONES[TAREAS[x.tipo].seccion].clase}`, style: { marginRight: '8px' } }, TAREAS[x.tipo].oficial),
          h('span', { lang: 'en' }, x.nota),
          h('span', { class: 'suave', style: { fontSize: '12px', marginLeft: '8px' } }, fechaCorta(x.f)))))
      : h('div', { class: 'vacio' }, 'Sin errores registrados todavía.'),

    e.escritos.length ? [
      h('h2', { style: { marginTop: '32px' } }, 'Lo que ha escrito'),
      h('div', { class: 'tarjeta plana' }, [...e.escritos].reverse().slice(0, 10).map((x) => h('details', { class: 'revision-item' },
        h('summary', { style: { cursor: 'pointer', fontWeight: 600 } }, `${TAREAS[x.tipo].oficial} · ${x.palabras} palabras · ${fechaCorta(x.f)}${x.puntaje != null ? ` · ${x.puntaje}/5` : ''}`),
        h('div', { class: 'modelo', lang: 'en', style: { marginTop: '8px', background: '#fff' } }, x.texto || '—')))),
    ] : null,

    h('div', { class: 'tarjeta plana', style: { marginTop: '32px' } },
      h('h3', {}, 'Sus datos'),
      h('p', { class: 'suave' }, 'Todo se guarda solo en este navegador: no hay cuenta ni se envía nada. Si cambia de computadora, descargue una copia.'),
      h('div', { class: 'fila-botones' }, descargar, borrar)))));
}
