// Enrutador por hash (#/plan, #/sesion/3…): funciona en /toefl/ sin tocar
// la configuración del servidor del sitio principal.
import { h, limpiar } from './util.js';
import { detenerVoz, soltarMicrofono } from './audio.js';
import * as inicio from './vistas/inicio.js';
import * as plan from './vistas/plan.js';
import * as sesion from './vistas/sesion.js';
import * as practica from './vistas/practica.js';
import * as simulacro from './vistas/simulacro.js';
import * as progreso from './vistas/progreso.js';
import * as recursos from './vistas/recursos.js';
import { botonClases } from './vistas/cta.js';

const main = document.getElementById('main');

const RUTAS = [
  [/^$/, () => inicio.pintar(main), ''],
  [/^plan$/, () => plan.pintar(main), 'plan'],
  [/^sesion\/(\d+)$/, (m) => sesion.pintar(main, m[1]), 'plan'],
  [/^sesion\/(\d+)\/leccion$/, (m) => sesion.pintarLeccion(main, m[1]), 'plan'],
  [/^sesion\/(\d+)\/bloque\/(\d+)$/, (m) => sesion.pintarBloque(main, m[1], m[2]), 'plan'],
  [/^practica$/, () => practica.pintarIndice(main), 'practica'],
  [/^practica\/(\w+)\/(guiada|examen)$/, (m) => practica.pintarRonda(main, m[1], m[2]), 'practica'],
  [/^estrategia\/([\w-]+)$/, (m) => practica.pintarEstrategia(main, m[1]), 'practica'],
  [/^simulacros$/, () => simulacro.pintarLista(main), 'simulacros'],
  [/^simulacro\/([\w-]+)$/, (m, q) => simulacro.pintarExamen(main, m[1], q.get('sesion')
    ? { alTerminar: { href: `#/sesion/${q.get('sesion')}`, texto: `Volver a la Sesión ${q.get('sesion')}`, sesion: Number(q.get('sesion')) } }
    : {}), 'simulacros'],
  [/^progreso$/, () => progreso.pintar(main), 'progreso'],
  [/^recursos$/, () => recursos.pintar(main), 'recursos'],
];

function navegar() {
  detenerVoz();
  soltarMicrofono();
  window.dispatchEvent(new Event('toefl:salir'));
  const [ruta, consulta = ''] = location.hash.replace(/^#\/?/, '').split('?');
  const q = new URLSearchParams(consulta);
  for (const [re, fn, seccion] of RUTAS) {
    const m = ruta.match(re);
    if (!m) continue;
    document.querySelectorAll('.nav a').forEach((a) => {
      if (a.dataset.ruta === seccion) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    Promise.resolve(fn(m, q)).catch((e) => {
      console.error(e);
      limpiar(main);
      main.append(h('div', { class: 'contenedor cargando' },
        h('p', {}, 'Algo falló al cargar esta parte. Recargue la página; si sigue, escríbanos.'),
        h('a', { class: 'boton secundario', href: '#/' }, 'Volver al inicio')));
    });
    main.focus({ preventScroll: true });
    return;
  }
  location.hash = '#/';
}

window.addEventListener('hashchange', navegar);
document.getElementById('anio').textContent = String(new Date().getFullYear());
document.getElementById('pie-clases').append(botonClases({ variante: 'sonic' }));
navegar();
