import { h, limpiar, poner } from '../util.js';
import { TAREAS, SECCIONES, ORDEN_SECCIONES, TIPOS_POR_SECCION } from '../tareas/index.js';
import { precisionPorTipo } from '../estado.js';
import { elegir, estrategias } from '../datos.js';
import { correr } from '../runner.js';
import { pintarResultados } from './resultados.js';
import { leccion } from './leccion.js';
import { tarjetaClases } from './cta.js';

// Cuántas piezas trae una ronda de práctica libre de cada tarea.
export const RONDA = { cw: 2, dl: 3, ap: 1, lr: 8, lc: 2, la: 2, lt: 1, bs: 10, we: 1, ad: 1, rp: 1, iv: 1 };

export function pintarIndice(main) {
  limpiar(main);
  const prec = precisionPorTipo();
  poner(main, h('section', { class: 'seccion' }, h('div', { class: 'contenedor' },
    h('p', { class: 'kicker' }, 'Práctica libre'),
    h('h1', {}, 'Las 11 tareas, una por una'),
    h('p', { class: 'suave', style: { maxWidth: '70ch' } }, 'Modo guiado: explicación después de cada respuesta y sin presión de tiempo. Con reloj: el tiempo y las reglas del examen, y la corrección al final. Empiece guiado; pase al reloj cuando acierte 7 de cada 10.'),
    ORDEN_SECCIONES.map((s) => h('div', { style: { marginTop: '28px' } },
      h('h2', {}, h('span', { class: `etiqueta ${SECCIONES[s].clase}`, style: { fontSize: '14px', verticalAlign: 'middle' } }, SECCIONES[s].en), ' ', SECCIONES[s].es),
      h('div', { class: 'rejilla tres', style: { marginTop: '12px' } }, TIPOS_POR_SECCION[s].map((tipo) => {
        const t = TAREAS[tipo];
        const p = prec[tipo];
        return h('div', { class: 'tarjeta' },
          h('h3', { style: { marginBottom: '2px' } }, t.oficial),
          h('p', { class: 'suave', style: { fontSize: '14px', margin: '0 0 8px' } }, t.es),
          h('p', { style: { fontSize: '15px' } }, t.que),
          p && p.precision != null
            ? h('div', { style: { margin: '6px 0 12px' } },
                h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700 } }, h('span', {}, 'Su acierto reciente'), h('span', {}, `${Math.round(p.precision * 100)}%`)),
                h('div', { class: 'medidor' }, h('i', { style: { width: `${Math.round(p.precision * 100)}%` } })))
            : h('p', { class: 'suave', style: { fontSize: '13px' } }, 'Todavía sin práctica.'),
          h('div', { class: 'fila-botones' },
            h('a', { class: 'boton chico', href: `#/practica/${tipo}/guiada` }, 'Guiada'),
            h('a', { class: 'boton secundario chico', href: `#/practica/${tipo}/examen` }, 'Con reloj'),
            h('a', { class: 'chico', href: `#/estrategia/${tipo}`, style: { fontSize: '14px', fontWeight: 600 } }, 'Estrategia')));
      })))))));
  poner(main.querySelector('.seccion .contenedor'), tarjetaClases());
}

export async function pintarRonda(main, tipo, modo) {
  const t = TAREAS[tipo];
  if (!t) return pintarIndice(main);
  const items = await elegir(tipo, { cantidad: RONDA[tipo] || 1 });
  if (!items.length) {
    limpiar(main);
    poner(main, h('div', { class: 'contenedor cargando' }, 'Este banco todavía no tiene piezas.'));
    return;
  }
  const unidades = items.map((item) => ({ tipo, item }));
  const limite = modo === 'examen' && !['we', 'ad', 'rp', 'iv'].includes(tipo)
    ? unidades.reduce((s, u) => s + t.segundos(u.item), 0) : null;
  const { resultados } = await correr(unidades, {
    montaje: main, modo, limiteSeg: limite,
    titulo: `${t.oficial} · ${modo === 'guiada' ? 'práctica guiada' : 'con reloj'}`,
  });
  pintarResultados(main, {
    titulo: `${t.oficial} · ${modo === 'guiada' ? 'práctica guiada' : 'con reloj'}`,
    resultados,
    acciones: [
      h('a', { class: 'boton', href: `#/practica/${tipo}/${modo}?otra=${Date.now()}` }, 'Otra ronda'),
      modo === 'guiada' ? h('a', { class: 'boton secundario', href: `#/practica/${tipo}/examen` }, 'Ahora con reloj') : null,
      h('a', { class: 'boton secundario', href: '#/practica' }, 'Todas las tareas'),
    ].filter(Boolean),
  });
}

export async function pintarEstrategia(main, clave) {
  limpiar(main);
  const todas = await estrategias();
  const t = TAREAS[clave];
  poner(main, h('section', { class: 'seccion' }, h('div', { class: 'contenedor', style: { maxWidth: '820px' } },
    h('a', { href: t ? '#/practica' : '#/plan', class: 'suave', style: { fontSize: '14px' } }, '← Volver'),
    h('div', { style: { marginTop: '14px' } }, leccion(todas[clave])),
    t ? h('div', { class: 'fila-botones', style: { marginTop: '24px' } },
      h('a', { class: 'boton', href: `#/practica/${clave}/guiada` }, 'Practicar guiado'),
      h('a', { class: 'boton secundario', href: `#/practica/${clave}/examen` }, 'Practicar con reloj')) : null)));
}
