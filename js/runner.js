// El "corredor": pone la pantalla de examen y pasa por una lista de piezas
// [{ tipo, item }], con reloj opcional. Devuelve los resultados de cada una.
import { h, limpiar, mmss, anunciar, poner } from './util.js';
import { TAREAS, SECCIONES } from './tareas/index.js';
import { detenerVoz } from './audio.js';
import { registrarIntento, registrarError, guardar } from './estado.js';

export function totalDe(tipo, item) {
  if (tipo === 'cw') return 10;
  if (['dl', 'ap', 'lc', 'la', 'lt'].includes(tipo)) return item.preguntas.length;
  if (tipo === 'rp') return item.frases.length * 5;
  if (tipo === 'iv') return item.preguntas.length * 5;
  if (['we', 'ad'].includes(tipo)) return 5;
  return 1;
}

export const PRODUCTIVOS = new Set(['we', 'ad', 'iv']);

// opts: { titulo, subtitulo, modo: 'guiada'|'examen', limiteSeg, montaje (elemento) }
export function correr(unidades, opts) {
  const { titulo, subtitulo = '', modo = 'guiada', limiteSeg = null } = opts;
  const raiz = opts.montaje;
  limpiar(raiz);
  window.scrollTo(0, 0);

  const reloj = h('span', { class: 'reloj', role: 'timer', 'aria-live': 'off' }, limiteSeg ? mmss(limiteSeg) : '');
  if (!limiteSeg) reloj.hidden = true;
  const contador = h('small', {}, '');
  const barra = h('i', { style: { width: '0%' } });
  const salir = h('button', { class: 'salir-examen', type: 'button' }, 'Salir');
  const zona = h('div', { class: 'contenedor zona-tarea' });
  poner(raiz, h('section', { class: 'examen' },
    h('div', { class: 'examen-cabecera' },
      h('div', { class: 'contenedor' }, h('div', { class: 'examen-titulo' }, titulo, contador), reloj, salir),
      h('div', { class: 'progreso-examen' }, barra)),
    zona));

  const control = new AbortController();
  const resultados = [];
  let abortarActual = null;
  let terminar;
  const fin = new Promise((r) => (terminar = r));
  let cerrado = false;
  let intervalo = null;

  function cerrarTodo(motivo) {
    if (cerrado) return;
    cerrado = true;
    clearInterval(intervalo);
    control.abort();
    detenerVoz();
    // La pieza en curso entrega lo que lleve; las que faltan cuentan como no respondidas.
    const idx = resultados.length;
    if (idx < unidades.length && abortarActual) {
      const parcial = abortarActual();
      if (parcial) guardarResultado(idx, parcial);
    }
    for (let i = resultados.length; i < unidades.length; i++) {
      const u = unidades[i];
      guardarResultado(i, { correctas: 0, total: totalDe(u.tipo, u.item), sinResponder: true, revisar: () => [h('p', { class: 'suave' }, 'Sin responder: se acabó el tiempo.')] }, true);
    }
    guardar();
    terminar({ resultados, motivo });
  }

  function guardarResultado(i, r, sinRegistro) {
    const u = unidades[i];
    const res = { tipo: u.tipo, id: u.item.id, ...r };
    resultados[i] = res;
    if (!sinRegistro && !r.sinResponder) {
      registrarIntento({ tipo: u.tipo, id: u.item.id, correctas: res.correctas || 0, total: res.total || 1, modo });
      (r.errores || []).slice(0, 6).forEach((e) => registrarError(u.tipo, u.item.id, e));
    }
  }

  // Si la persona navega a otra página a mitad de camino, se apaga todo en
  // silencio (sin resolver: la vista nueva no debe ser pisada por resultados).
  window.addEventListener('toefl:salir', () => {
    if (cerrado) return;
    cerrado = true;
    clearInterval(intervalo);
    control.abort();
    detenerVoz();
  }, { once: true });

  salir.onclick = () => {
    if (salir.dataset.confirmar) return cerrarTodo('salida');
    salir.dataset.confirmar = '1';
    salir.textContent = '¿Seguro? Toque otra vez';
    setTimeout(() => { delete salir.dataset.confirmar; salir.textContent = 'Salir'; }, 3500);
  };

  if (limiteSeg) {
    const t0 = Date.now();
    intervalo = setInterval(() => {
      const quedan = limiteSeg - (Date.now() - t0) / 1000;
      reloj.textContent = mmss(quedan);
      reloj.classList.toggle('urgente', quedan <= 60);
      if (Math.round(quedan) === 60) anunciar('Queda un minuto.');
      if (quedan <= 0) cerrarTodo('tiempo');
    }, 250);
  }

  (async () => {
    for (let i = 0; i < unidades.length && !cerrado; i++) {
      const u = unidades[i];
      const t = TAREAS[u.tipo];
      contador.textContent = `${t.oficial} · ${i + 1} de ${unidades.length}${subtitulo ? ' · ' + subtitulo : ''}`;
      barra.style.width = `${(i / unidades.length) * 100}%`;
      limpiar(zona);
      poner(zona, h('span', { class: `etiqueta ${SECCIONES[t.seccion].clase}`, style: { marginBottom: '14px' } }, `${SECCIONES[t.seccion].en} · ${t.oficial}`));
      const lienzo = h('div', { style: { marginTop: '14px' } });
      poner(zona, lienzo);
      abortarActual = null;
      const ctx = {
        modo,
        senal: control.signal,
        alAbortar: (fn) => { abortarActual = fn; },
      };
      let r;
      try {
        r = await t.render(lienzo, u.item, ctx);
      } catch (e) {
        console.error(e);
        r = { correctas: 0, total: totalDe(u.tipo, u.item), revisar: () => [h('p', {}, 'Hubo un error con esta pieza.')] };
      }
      if (cerrado) break;
      guardarResultado(i, r);
      guardar();
      window.scrollTo({ top: 0 });
    }
    barra.style.width = '100%';
    if (!cerrado) {
      cerrado = true;
      clearInterval(intervalo);
      terminar({ resultados, motivo: 'completo' });
    }
  })();

  return fin;
}
