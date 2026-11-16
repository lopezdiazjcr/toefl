// Una lección de estrategia (los textos viven en datos/estrategias-*.json).
import { h } from '../util.js';

export function leccion(e) {
  if (!e) return h('p', { class: 'suave' }, 'Lección no disponible.');
  return h('article', { class: 'leccion' },
    e.subtitulo ? h('p', { class: 'kicker' }, e.subtitulo) : null,
    h('h2', {}, e.titulo),
    e.resumen ? h('p', {}, e.resumen) : null,
    e.formato && e.formato.length ? [h('h3', {}, 'Cómo es'), h('ul', { class: 'vinetas' }, e.formato.map((x) => h('li', {}, x)))] : null,
    e.califica ? [h('h3', {}, 'Cómo se califica'), h('p', {}, e.califica)] : null,
    e.regla ? h('div', { class: 'regla' }, h('strong', {}, 'La regla: '), e.regla) : null,
    e.pasos && e.pasos.length ? [h('h3', {}, 'Estrategia paso a paso'), h('ol', { class: 'pasos' }, e.pasos.map((x) => h('li', {}, x)))] : null,
    e.errores && e.errores.length ? [h('h3', {}, 'Errores típicos de hispanohablantes'), h('ul', { class: 'vinetas' }, e.errores.map((x) => h('li', {}, x)))] : null,
    e.frases && e.frases.length ? [h('h3', {}, 'Frases que sirven'), h('ul', { class: 'vinetas', lang: 'en' }, e.frases.map((x) => h('li', {}, x)))] : null,
    e.ejemplo ? [h('h3', {}, 'Ejemplo'), h('div', { class: 'modelo', lang: 'en' }, e.ejemplo.en), e.ejemplo.es ? h('p', { class: 'suave', style: { marginTop: '8px' } }, e.ejemplo.es) : null] : null,
    e.fuente ? h('p', { class: 'suave', style: { fontSize: '13px', marginTop: '18px' } }, 'Fuente: ', e.fuente.url ? h('a', { href: e.fuente.url, target: '_blank', rel: 'noopener' }, e.fuente.texto || e.fuente.url) : e.fuente.texto) : null,
  );
}
