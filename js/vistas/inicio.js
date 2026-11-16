import { h, limpiar, poner } from '../util.js';
import { cargar } from '../estado.js';
import { SESIONES } from '../plan.js';
import { TAREAS, SECCIONES, TIPOS_POR_SECCION, ORDEN_SECCIONES } from '../tareas/index.js';
import { CONCORDANCIA_120, mcer } from '../bandas.js';
import { bandaClases, botonClases } from './cta.js';

const FORMATO = {
  lectura: { preguntas: '≈ 50', tiempo: '≈ 30 min', nota: 'Adaptativa: 2 módulos' },
  escucha: { preguntas: '≈ 47', tiempo: '≈ 29 min', nota: 'Adaptativa; audio una sola vez' },
  escritura: { preguntas: '12', tiempo: '≈ 23 min', nota: 'Email 7 min · Discusión 10 min' },
  habla: { preguntas: '11', tiempo: '≈ 8 min', nota: 'Sin tiempo de preparación' },
};


export function pintar(main) {
  limpiar(main);
  const e = cargar();
  const hechas = SESIONES.filter((s) => e.sesiones[s.n] && e.sesiones[s.n].completada).length;
  const siguiente = SESIONES.find((s) => !(e.sesiones[s.n] && e.sesiones[s.n].completada));

  const retomar = (e.diagnostico || hechas) && siguiente
    ? h('div', { class: 'tarjeta noche', style: { marginTop: '22px', maxWidth: '520px' } },
        h('p', { class: 'kicker', style: { color: 'var(--crema)' } }, `Su avance: ${hechas} de ${SESIONES.length} sesiones`),
        h('p', { style: { fontWeight: 700, fontSize: '18px', margin: '0 0 12px' } }, `Siga con la Sesión ${siguiente.n}: ${siguiente.titulo}`),
        h('a', { class: 'boton claro', href: `#/sesion/${siguiente.n}` }, 'Continuar'))
    : null;

  poner(main, 
    h('section', { class: 'poster' }, h('div', { class: 'contenedor' },
      h('div', { class: 'poster-texto' },
        h('p', { class: 'kicker' }, 'Inglés Latinoamérica · TOEFL iBT 2026'),
        h('p', {}, 'El TOEFL cambió el 21 de enero de 2026: tareas nuevas, secciones adaptativas y una escala de 1 a 6. Esta plataforma lo prepara para ese examen, no para el viejo: un diagnóstico, 24 sesiones guiadas y simulacros completos, con ejercicios originales y explicaciones en español.'),
        h('div', { class: 'poster-acciones' },
          h('a', { class: 'boton claro', href: '#/simulacro/diagnostico' }, 'Hacer el diagnóstico · 40 min'),
          h('a', { class: 'boton contorno-claro', href: '#/plan' }, 'Ver el plan de 24 sesiones')),
        retomar),
      h('h1', { class: 'display poster-titulo' },
        h('span', {}, 'TOEFL'), h('span', {}, 'SIN'), h('span', { class: 'crema' }, 'ATAJOS.')))),
    bandaClases(),

    h('section', { class: 'seccion' }, h('div', { class: 'contenedor' },
      h('p', { class: 'kicker' }, 'El examen, tal como es hoy'),
      h('h2', {}, 'Cuatro secciones, once tareas, menos de dos horas'),
      h('p', { class: 'suave', style: { maxWidth: '70ch' } }, 'El orden es fijo y no hay descansos programados. Reading y Listening se adaptan: según cómo le vaya en el primer módulo, el segundo es más fácil o más difícil. Se puede tomar notas.'),
      h('div', { class: 'tabla-envoltura', style: { marginTop: '18px' } },
        h('table', {},
          h('thead', {}, h('tr', {}, ['Sección', 'Tareas', 'Ítems', 'Tiempo', 'Ojo'].map((t) => h('th', {}, t)))),
          h('tbody', {}, ORDEN_SECCIONES.map((s) => h('tr', {},
            h('td', {}, h('span', { class: `etiqueta ${SECCIONES[s].clase}` }, SECCIONES[s].en)),
            h('td', {}, TIPOS_POR_SECCION[s].map((t) => h('div', {}, h('a', { href: `#/estrategia/${t}` }, TAREAS[t].oficial)))),
            h('td', {}, FORMATO[s].preguntas),
            h('td', {}, FORMATO[s].tiempo),
            h('td', { class: 'suave' }, FORMATO[s].nota)))))),
      h('p', { class: 'suave', style: { fontSize: '13px', marginTop: '10px' } },
        'Fuente: ETS, ', h('a', { href: 'https://www.eu.ets.org/pdfs/toefl/toefl-ibt-test-overview.pdf', target: '_blank', rel: 'noopener' }, 'TOEFL iBT Test Overview'),
        '. Las cifras de Reading y Listening incluyen preguntas experimentales que no cuentan.'))),

    h('section', { class: 'seccion' }, h('div', { class: 'contenedor' },
      h('p', { class: 'kicker' }, 'Cómo funciona'),
      h('h2', {}, 'Del diagnóstico al día del examen'),
      h('div', { class: 'rejilla cuatro', style: { marginTop: '16px' } },
        paso('1', 'Diagnóstico', 'Unos 40 minutos con las 11 tareas. Le da una banda estimada por sección y le dice por dónde empezar.', '#/simulacro/diagnostico', 'Empezar'),
        paso('2', '24 sesiones', 'Tres por semana, una hora cada una: estrategia, práctica guiada, práctica con reloj y tarea para la casa.', '#/plan', 'Ver el plan'),
        paso('3', 'Práctica libre', 'Cada una de las 11 tareas por separado, guiada (con explicación) o con el reloj del examen.', '#/practica', 'Practicar'),
        paso('4', 'Simulacros', 'Exámenes completos de ~90 minutos, en orden, con módulos adaptativos como el real.', '#/simulacros', 'Ver simulacros')))),

    h('section', { class: 'seccion' }, h('div', { class: 'contenedor' },
      h('div', { class: 'rejilla dos' },
        h('div', {},
          h('p', { class: 'kicker' }, 'La escala nueva'),
          h('h2', {}, 'De 1 a 6, alineada con el MCER'),
          h('p', {}, 'Cada sección y el total se reportan de 1 a 6 en medios puntos. El total es el promedio de las cuatro secciones, redondeado al medio punto más cercano. Durante dos años, desde enero de 2026, el reporte también trae un puntaje comparable en la escala vieja de 0 a 120.'),
          h('p', { class: 'suave' }, 'Antes de inscribirse, confirme qué banda pide su universidad o empleador: muchas todavía publican el requisito en la escala 0–120.')),
        h('div', { class: 'tabla-envoltura' }, h('table', { style: { minWidth: '0' } },
          h('thead', {}, h('tr', {}, ['Banda', 'MCER', 'Comparable 0–120'].map((t) => h('th', {}, t)))),
          h('tbody', {}, CONCORDANCIA_120.filter(([b]) => Number.isInteger(b) || b >= 3.5).map(([b, n]) =>
            h('tr', {}, h('td', { style: { fontWeight: 800 } }, b.toFixed(1)), h('td', {}, mcer(b)), h('td', {}, `${n}+`))))))))),

    h('section', { class: 'seccion' }, h('div', { class: 'contenedor' },
      h('div', { class: 'tarjeta plana' },
        h('p', { class: 'kicker' }, 'Con honestidad'),
        h('h2', {}, 'Lo que esta plataforma no hace'),
        h('ul', { class: 'vinetas' },
          h('li', {}, 'No usa exámenes reales "filtrados". ETS no publica sus exámenes y prohíbe reproducirlos; quien estudia con preguntas filtradas se arriesga a que le anulen el puntaje. Todos los ejercicios de aquí son originales, con el mismo formato.'),
          h('li', {}, 'No promete un puntaje. Las bandas que ve aquí son estimaciones de práctica: sirven para ver si sube y qué estudiar. El puntaje oficial lo da ETS.'),
          h('li', {}, 'No reemplaza el material oficial: en Recursos están los exámenes de práctica gratuitos que ETS publicó para el formato nuevo. Úselos como ensayo final.')),
        h('div', { class: 'fila-botones', style: { marginTop: '14px' } },
          h('a', { class: 'boton secundario', href: '#/recursos' }, 'Ver recursos oficiales gratuitos'),
          botonClases({ variante: 'sonic' }))))),
  );
}

function paso(n, titulo, texto, href, accion) {
  return h('div', { class: 'tarjeta' },
    h('div', { class: 'dato', style: { color: 'var(--sonic)' } }, n),
    h('h3', { style: { marginTop: '10px' } }, titulo),
    h('p', { class: 'suave' }, texto),
    h('a', { class: 'boton secundario chico', href }, accion));
}
