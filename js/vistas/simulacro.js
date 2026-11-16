import { h, limpiar, fechaCorta, poner } from '../util.js';
import { EXAMENES, nivelModulo2 } from '../examenes.js';
import { elegir } from '../datos.js';
import { correr } from '../runner.js';
import { TAREAS, SECCIONES } from '../tareas/index.js';
import { pintarResultados, tarjetasBandas } from './resultados.js';
import { cargar, guardar, marcarBloque } from '../estado.js';
import { mcer, comparable120 } from '../bandas.js';
import { tarjetaClases } from './cta.js';

export function pintarLista(main) {
  limpiar(main);
  const e = cargar();
  poner(main, h('section', { class: 'seccion' }, h('div', { class: 'contenedor' },
    h('p', { class: 'kicker' }, 'Simulacros'),
    h('h1', {}, 'Exámenes completos, en el orden real'),
    h('p', { class: 'suave', style: { maxWidth: '70ch' } }, 'Haga el diagnóstico al empezar, el Simulacro 1 en la Sesión 12, el 2 en la Sesión 22 y el final en la 24. Cada simulacro elige piezas que usted no ha visto y adapta el segundo módulo de Reading y Listening a cómo le fue en el primero.'),
    h('div', { class: 'rejilla dos', style: { marginTop: '18px' } }, EXAMENES.map((ex) => {
      const previo = ex.id === 'diagnostico' ? e.diagnostico : [...e.simulacros].reverse().find((s) => s.id === ex.id);
      return h('div', { class: 'tarjeta' },
        h('p', { class: 'kicker' }, `≈ ${ex.minutos} minutos`),
        h('h2', {}, ex.titulo),
        h('p', { class: 'suave' }, ex.descripcion),
        h('ul', { class: 'vinetas', style: { fontSize: '14px' } }, ex.secciones.map((s) =>
          h('li', {}, h('b', {}, SECCIONES[s.seccion].en), ': ',
            s.modulos.flatMap((m) => m.piezas).map((p) => `${TAREAS[p.tipo].oficial}${p.cantidad > 1 ? ' ×' + p.cantidad : ''}`).join(' · ')))),
        previo ? h('p', { style: { fontWeight: 700 } }, `Último resultado (${fechaCorta(previo.fecha || previo.f)}): global ${previo.global != null ? previo.global.toFixed(1) : '—'} ≈ ${mcer(previo.global)}`) : null,
        h('a', { class: 'boton', href: `#/simulacro/${ex.id}` }, previo ? 'Hacerlo de nuevo' : 'Empezar'));
    })))));
  poner(main.querySelector('.seccion .contenedor'), tarjetaClases());
}

export function pintarExamen(main, id, { alTerminar } = {}) {
  const ex = EXAMENES.find((x) => x.id === id);
  if (!ex) return pintarLista(main);
  limpiar(main);
  window.scrollTo(0, 0);
  const empezar = h('button', { class: 'boton sonic', type: 'button' }, `Empezar ${ex.titulo.toLowerCase()}`);
  poner(main, h('section', { class: 'seccion' }, h('div', { class: 'contenedor', style: { maxWidth: '760px' } },
    h('p', { class: 'kicker' }, `${ex.titulo} · ≈ ${ex.minutos} minutos`),
    h('h1', {}, 'Antes de empezar'),
    h('ol', { class: 'pasos', style: { margin: '18px 0' } },
      h('li', {}, 'Use computadora con Chrome, Edge o Safari: hace falta voz para Listening y micrófono para Speaking.'),
      h('li', {}, 'Póngase audífonos y busque un lugar silencioso. Cada audio suena una sola vez.'),
      h('li', {}, 'Tenga papel y lápiz para tomar notas, como en el examen real.'),
      h('li', {}, 'Las secciones van en el orden del TOEFL: Reading → Listening → Writing → Speaking. Entre secciones puede respirar; dentro de un módulo, el reloj no se detiene.'),
      h('li', {}, 'Si sale a mitad de camino, se califica lo que alcanzó a responder.')),
    h('div', { class: 'fila-botones' }, empezar, h('a', { class: 'boton secundario', href: '#/simulacros' }, 'Volver')))));
  empezar.onclick = () => ejecutar(main, ex, { alTerminar });
}

async function intermedio(main, ex, sec, i) {
  limpiar(main);
  window.scrollTo(0, 0);
  const s = SECCIONES[sec.seccion];
  const piezas = sec.modulos.flatMap((m) => m.piezas);
  const minutos = sec.modulos.reduce((t, m) => t + (m.limite ? m.limite / 60 : 0), 0);
  return new Promise((resolve) => {
    poner(main, h('section', { class: 'seccion' }, h('div', { class: 'contenedor', style: { maxWidth: '760px' } },
      h('p', { class: 'kicker' }, `${ex.titulo} · Sección ${i + 1} de ${ex.secciones.length}`),
      h('h1', { class: 'display', style: { fontSize: 'clamp(56px, 12vw, 120px)', color: 'var(--sonic)', margin: '6px 0 18px' } }, s.en),
      h('p', {}, sec.modulos.length > 1 && sec.modulos.some((m) => m.adaptativo)
        ? `Dos módulos con reloj (${Math.round(minutos)} min en total). El segundo se adapta a su resultado en el primero.`
        : minutos ? `Con reloj: unos ${Math.round(minutos)} minutos más las tareas que llevan su propio tiempo.` : 'Cada tarea lleva su propio reloj, como en el examen.'),
      h('ul', { class: 'vinetas' }, piezas.map((p) => h('li', {}, `${TAREAS[p.tipo].oficial}${p.cantidad > 1 ? ' ×' + p.cantidad : ''} — ${TAREAS[p.tipo].que}`))),
      h('div', { class: 'fila-botones', style: { marginTop: '18px' } },
        h('button', { class: 'boton sonic', type: 'button', onclick: () => resolve(true) }, `Empezar ${s.en}`),
        h('button', { class: 'boton secundario', type: 'button', onclick: () => resolve(false) }, 'Terminar aquí')))));
  });
}

async function ejecutar(main, ex, { alTerminar } = {}) {
  const todos = [];
  const usados = new Set();
  let abandonado = false;

  for (let i = 0; i < ex.secciones.length && !abandonado; i++) {
    const sec = ex.secciones[i];
    if (!(await intermedio(main, ex, sec, i))) { abandonado = true; break; }
    let proporcionPrevia = null;
    for (const mod of sec.modulos) {
      const nivel = mod.adaptativo && proporcionPrevia != null ? nivelModulo2(proporcionPrevia) : null;
      const unidades = [];
      for (const p of mod.piezas) {
        const items = await elegir(p.tipo, { cantidad: p.cantidad, nivel: nivel || p.nivel, reservados: usados });
        items.forEach((it) => { usados.add(it.id); unidades.push({ tipo: p.tipo, item: it }); });
      }
      const { resultados, motivo } = await correr(unidades, {
        montaje: main, modo: 'examen', limiteSeg: mod.limite,
        titulo: sec.modulos.length > 1 ? `${SECCIONES[sec.seccion].en} · ${mod.titulo}` : `${ex.titulo} · ${SECCIONES[sec.seccion].en}`,
        subtitulo: nivel ? (nivel.includes('C1') ? 'módulo alto' : 'módulo base') : '',
      });
      todos.push(...resultados);
      const c = resultados.reduce((s, r) => s + (r.correctas || 0), 0);
      const t = resultados.reduce((s, r) => s + (r.total || 0), 0);
      proporcionPrevia = t ? c / t : 0;
      if (motivo === 'salida') { abandonado = true; break; }
    }
  }

  // Guardar y mostrar.
  const e = cargar();
  const registro = { id: ex.id, fecha: new Date().toISOString(), bandas: {}, global: null, incompleto: abandonado };
  // Un diagnóstico a medias no pisa uno completo anterior.
  if (ex.id === 'diagnostico') { if (!(abandonado && e.diagnostico && !e.diagnostico.incompleto)) e.diagnostico = registro; }
  else e.simulacros.push(registro);

  const recomendacion = h('div', {});
  const { bandas, global } = pintarResultados(main, {
    titulo: abandonado ? `${ex.titulo} (incompleto)` : ex.titulo,
    resultados: todos,
    conBandas: true,
    nota: 'En Writing y Speaking el puntaje inicial es una estimación automática. Abra cada respuesta en la revisión de abajo, compárela con el modelo y ajuste su puntaje con la rúbrica: las bandas se recalculan solas.',
    alCambiar: ({ bandas, global }) => {
      registro.bandas = bandas;
      registro.global = global;
      guardar();
      pintarRecomendacion(recomendacion, ex, bandas, global);
    },
    acciones: [
      h('a', { class: 'boton', href: alTerminar ? alTerminar.href : '#/plan' }, alTerminar ? alTerminar.texto : 'Ir al plan'),
      h('a', { class: 'boton secundario', href: '#/progreso' }, 'Ver mi progreso'),
    ],
  });
  registro.bandas = bandas;
  registro.global = global;
  guardar();
  if (alTerminar && alTerminar.sesion && !abandonado) {
    const c = todos.reduce((acc, r) => acc + (r.correctas || 0), 0);
    const t = todos.reduce((acc, r) => acc + (r.total || 0), 0);
    marcarBloque(alTerminar.sesion, 'sim', c, t || 1);
  }
  main.querySelector('.seccion .contenedor h1').after(recomendacion);
  pintarRecomendacion(recomendacion, ex, bandas, global);
}

function pintarRecomendacion(cont, ex, bandas, global) {
  limpiar(cont);
  const orden = Object.entries(bandas).filter(([, b]) => b != null).sort((a, b) => a[1] - b[1]);
  if (!orden.length) return;
  if (global == null) {
    poner(cont, h('div', { class: 'aviso', style: { margin: '14px 0 20px' } },
      `Quedó incompleto: la banda global solo se calcula con las cuatro secciones. Por ahora, su sección más floja es ${SECCIONES[orden[0][0]].en}.`));
    return;
  }
  const debil = orden[0];
  const total = comparable120(global);
  poner(cont, h('div', { class: 'tarjeta azul', style: { margin: '14px 0 20px' } },
    h('p', { style: { fontWeight: 700, fontSize: '18px', margin: '0 0 6px' } },
      `Su banda global estimada es ${global != null ? global.toFixed(1) : '—'} (≈ ${mcer(global)}${total != null ? `, comparable a ${total}+ en la escala 0–120` : ''}).`),
    h('p', { class: 'suave', style: { margin: 0 } },
      ex.id === 'diagnostico'
        ? `Su sección más floja hoy es ${SECCIONES[debil[0]].en}. Empiece el plan por la Sesión 1 —que recorre todas las tareas— y dedique 10 minutos extra de práctica libre a ${SECCIONES[debil[0]].en} en cada sesión.`
        : `La sección que más le resta es ${SECCIONES[debil[0]].en}. La sesión siguiente del plan ataca sus errores: revíselos primero en Progreso.`)));
}

export { tarjetasBandas };
