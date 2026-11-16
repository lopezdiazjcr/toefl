// El botón de clases personalizadas. Un solo componente para que el texto y
// el enlace sean iguales en todas partes (se editan en js/config.js).
import { h } from '../util.js';
import { CONFIG, enlaceWhatsApp } from '../config.js';

export function botonClases({ variante = 'claro', extra = '' } = {}) {
  return h('a', {
    class: `boton boton-clases ${variante}`,
    href: enlaceWhatsApp(extra),
    target: '_blank',
    rel: 'noopener',
  }, h('span', {}, CONFIG.textoBotonClases), h('span', { class: 'flecha', 'aria-hidden': 'true' }, '→'));
}

// Franja de ancho completo (portada).
export function bandaClases(opciones) {
  return h('section', { class: 'banda-clases' }, h('div', { class: 'contenedor' }, botonClases(opciones)));
}

// Recuadro dentro de una página (resultados, sesión, plan, práctica, progreso, recursos).
export function tarjetaClases(opciones) {
  return h('div', { class: 'tarjeta-clases' }, botonClases(opciones));
}
