import { h, limpiar, poner } from '../util.js';
import { tarjetaClases } from './cta.js';

// Enlaces revisados el 16-nov-2026. Solo material gratuito y actualizado al formato de 2026.
const OFICIALES = [
  ['Preparación oficial de ETS', 'https://www.ets.org/toefl/test-takers/ibt/prepare.html', 'Muestra interactiva y dos exámenes de práctica completos en línea, en la interfaz real (piden llenar un formulario corto).'],
  ['Examen de práctica completo 1 (PDF)', 'https://www.ets.org/pdfs/toefl/toefl-ibt-full-length-practice-test-1.pdf', 'Alineado con el formato del 21 de enero de 2026. Trae respuestas y guiones de audio; el audio se descarga aparte desde la página para profesores.'],
  ['Examen de práctica completo 2 (PDF)', 'https://www.ets.org/pdfs/toefl/toefl-ibt-full-length-practice-test-2.pdf', 'Segundo examen completo del formato nuevo, con respuestas.'],
  ['Recursos para profesores', 'https://www.ets.org/toefl/teachers-advisors-agents/ibt/teaching/preparing-students.html', 'Más exámenes de práctica del formato nuevo (PDF + audio), rúbricas y guías de calificación. Gratis; sirven igual a estudiantes.'],
  ['TOEFL iBT Test Overview (PDF)', 'https://www.eu.ets.org/pdfs/toefl/toefl-ibt-test-overview.pdf', 'La descripción oficial de cada tarea, con ejemplos y las rúbricas de Writing y Speaking.'],
  ['Cómo se leen los puntajes', 'https://www.ets.org/toefl/test-takers/ibt/scores/understand-scores.html', 'Escala 1–6, equivalencia MCER y tabla de comparación con la escala 0–120.'],
  ['Rúbricas de Speaking (PDF)', 'https://www.ets.org/content/dam/ets-org/pdfs/toefl/speaking-rubrics.pdf', 'Qué distingue un 5 de un 3 en Listen and Repeat y en la entrevista.'],
  ['Rúbricas de Writing (PDF)', 'https://www.ets.org/content/dam/ets-org/pdfs/toefl/writing-rubrics.pdf', 'Criterios del email y de la discusión académica.'],
  ['Plan de estudio de 3 meses de ETS', 'https://www.ets.org/toefl/blog/the-ultimate-3-month-study-plan-for-the-toefl-ibt-test-2026.html', 'La secuencia que recomienda ETS: diagnóstico, práctica por habilidad y simulacros.'],
  ['Boletín 2026–27 (reglas del examen)', 'https://www.eu.ets.org/pdfs/toefl/toefl-ibt-bulletin.pdf', 'Inscripción, identificación, reglas del día del examen, revisión de puntajes.'],
];

const TERCEROS = [
  ['TOEFL Resources · preguntas del formato 2026', 'https://www.toeflresources.com/practice-questions-for-the-new-toefl-january-2026-and-beyond/', 'Series gratuitas de Build a Sentence, emails, discusiones, Listen and Repeat y entrevistas.'],
  ['TST Prep · examen completo en español', 'https://tstprep.com/translations/es-419/complete-practice-test-for-the-toefl-test-es/', 'Examen de práctica actualizado a enero de 2026, con audio.'],
  ['Magoosh · examen gratuito', 'https://toefl.magoosh.com/practice_tests/free', 'Cubre las tareas nuevas. Pide correo electrónico.'],
];

function lista(items) {
  return h('div', { class: 'rejilla dos', style: { marginTop: '12px' } }, items.map(([t, url, d]) =>
    h('a', { class: 'tarjeta', href: url, target: '_blank', rel: 'noopener', style: { textDecoration: 'none', color: 'inherit' } },
      h('div', { style: { fontWeight: 700, color: 'var(--sonic-hondo)' } }, `${t} ↗`),
      h('p', { class: 'suave', style: { margin: '6px 0 0', fontSize: '15px' } }, d))));
}

export function pintar(main) {
  limpiar(main);
  poner(main, h('section', { class: 'seccion' }, h('div', { class: 'contenedor' },
    h('p', { class: 'kicker' }, 'Recursos'),
    h('h1', {}, 'Material gratuito que sí sirve para el examen de 2026'),
    h('p', { class: 'suave', style: { maxWidth: '72ch' } }, 'Cuidado con los libros y videos anteriores a 2026: preparan un examen que ya no existe (lecturas de 700 palabras, tareas integradas). Todo lo de esta lista está actualizado al formato nuevo.'),

    h('h2', { style: { marginTop: '28px' } }, 'De ETS, la organización que hace el TOEFL'),
    lista(OFICIALES),

    h('h2', { style: { marginTop: '32px' } }, 'De otros preparadores (gratis)'),
    lista(TERCEROS),
    h('p', { class: 'suave', style: { fontSize: '13px', marginTop: '8px' } }, 'No tenemos relación con estos sitios. Los listamos porque su material gratuito está actualizado.'),

    h('div', { class: 'tarjeta noche', style: { marginTop: '34px' } },
      h('h2', {}, '¿Y los exámenes pasados?'),
      h('p', {}, 'ETS no publica los exámenes que ya se aplicaron: el contenido es confidencial y las reglas prohíben copiarlo o compartirlo. Las colecciones "TPO" que circulan gratis son copias no autorizadas de un producto pagado de ETS, del formato viejo (ETS ha pedido retirarlas de internet). Además, estudiar con preguntas filtradas puede costarle la anulación del puntaje.'),
      h('p', { style: { margin: 0 } }, 'Lo legítimo y útil: los exámenes de práctica oficiales de arriba, que ETS hizo para el formato nuevo, y los simulacros de esta plataforma, escritos desde cero con la misma estructura.')),

    tarjetaClases())));
}
