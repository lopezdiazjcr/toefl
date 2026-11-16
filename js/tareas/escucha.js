// Listening: Listen and Choose a Response, Conversation, Announcement, Academic Talk.
// En modo examen el audio suena UNA vez, como en el TOEFL. En modo guiada se
// puede repetir y la transcripción se ve al terminar.
import { h, limpiar, poner } from '../util.js';
import { opcionMultiple, resultadoPreguntas } from './comun.js';
import { reproducir, detenerVoz, hayVoz } from '../audio.js';

function onda() {
  return h('div', { class: 'onda', 'aria-hidden': 'true' },
    Array.from({ length: 40 }, (_, i) => h('i', { style: { height: `${20 + ((i * 37) % 70)}%` } })));
}

// Panel con botón de reproducir. Resuelve cuando el audio termina por primera vez.
function reproductor(lineas, ctx, { etiqueta = 'Escuchar' } = {}) {
  const barras = onda();
  const boton = h('button', { class: 'boton claro', type: 'button' }, `▶  ${etiqueta}`);
  const estado = h('span', { class: 'oculto-visual', 'aria-live': 'polite' });
  const panel = h('div', { class: 'reproductor' }, boton, barras, estado);
  let veces = 0;
  let resolver;
  const terminado = new Promise((r) => (resolver = r));

  async function sonar() {
    boton.disabled = true;
    barras.classList.add('sonando');
    estado.textContent = 'Reproduciendo audio';
    await reproducir(lineas);
    barras.classList.remove('sonando');
    estado.textContent = 'Audio terminado';
    veces++;
    if (ctx.modo === 'guiada') {
      boton.disabled = false;
      boton.textContent = '↺  Repetir';
    } else {
      boton.textContent = 'Audio reproducido';
    }
    resolver();
  }
  boton.onclick = sonar;
  if (!hayVoz()) {
    boton.disabled = true;
    boton.textContent = 'Sin voz';
    resolver();
  }
  return { panel, terminado, sonar, veces: () => veces };
}

function transcripcion(lineas, abierta = false) {
  return h('details', { class: 'transcripcion', open: abierta },
    h('summary', {}, 'Transcripción'),
    lineas.map((l) => h('p', { lang: 'en' }, l.h ? h('b', {}, `${l.h}: `) : null, l.t)));
}

function sinVozAviso(lineas) {
  return h('div', { class: 'aviso', style: { marginTop: '12px' } },
    'Su navegador no puede leer en voz alta. Para no perder la práctica, lea la transcripción como si la escuchara (Chrome, Edge o Safari sí tienen voz).',
    transcripcion(lineas, true));
}

// ---------- Listen and Choose a Response ----------
export function lr(zona, item, ctx) {
  limpiar(zona);
  const lineas = [{ g: item.g || 'f', t: item.enunciado, audio: item.audio }];
  const pregunta = { enunciado: 'Choose the best response.', opciones: item.opciones, correcta: item.correcta, explicacion: item.explicacion };
  const sinResponder = () => resultadoPreguntas([pregunta], [{ elegida: null, correcta: false }], () => transcripcion(lineas, true));
  ctx.alAbortar(sinResponder);

  const rep = reproductor(lineas, ctx);
  const lado = h('div', { style: { marginTop: '18px' } });
  poner(zona, 
    h('p', { class: 'consigna' }, 'Listen to the speaker. Then choose the best response.',
      h('small', {}, 'Escuche lo que dice la persona y elija la respuesta más natural.')),
    rep.panel,
    hayVoz() ? null : sinVozAviso(lineas),
    lado,
  );
  if (ctx.modo === 'examen' && hayVoz()) setTimeout(rep.sonar, 350);
  return rep.terminado.then(() =>
    opcionMultiple(lado, [pregunta], ctx, {
      envolver: (resp) => resultadoPreguntas([pregunta], resp, () => transcripcion(lineas, true)),
    }));
}

// ---------- Conversation, Announcement, Academic Talk ----------
const CONSIGNA = {
  lc: ['Listen to a conversation.', 'Escuche la conversación completa; las preguntas aparecen al final.'],
  la: ['Listen to an announcement.', 'Escuche el anuncio completo; las preguntas aparecen al final.'],
  lt: ['Listen to part of a talk in an academic setting.', 'Escuche la charla completa y tome notas; las preguntas aparecen al final.'],
};

function conGuion(tipo) {
  return (zona, item, ctx) => {
    limpiar(zona);
    const lineas = item.guion.map((l) => ({ ...l, g: l.g || 'f' }));
    const sinResponder = () => resultadoPreguntas(item.preguntas, item.preguntas.map(() => ({ elegida: null, correcta: false })), () => transcripcion(lineas));
    ctx.alAbortar(sinResponder);

    const rep = reproductor(lineas, ctx);
    const notas = tipo === 'lt' || tipo === 'lc'
      ? h('textarea', { class: 'redaccion', style: { minHeight: '110px', marginTop: '14px' }, placeholder: 'Notas (opcional). En el examen real también puede tomar notas.', 'aria-label': 'Notas' })
      : null;
    const lado = h('div', { style: { marginTop: '18px' } });
    poner(zona, 
      h('p', { class: 'consigna' }, CONSIGNA[tipo][0], h('small', {}, CONSIGNA[tipo][1])),
      item.escena ? h('div', { class: 'escena' }, h('span', { 'aria-hidden': 'true' }, '🎧'), h('span', {}, item.escena)) : null,
      rep.panel,
      hayVoz() ? null : sinVozAviso(lineas),
      notas,
      lado,
    );
    if (ctx.modo === 'examen' && hayVoz()) setTimeout(rep.sonar, 400);
    return rep.terminado.then(() => {
      if (notas) notas.style.minHeight = '80px';
      return opcionMultiple(lado, item.preguntas, ctx, {
        envolver: (resp) => resultadoPreguntas(item.preguntas, resp, () => transcripcion(lineas)),
      });
    });
  };
}

export const lc = conGuion('lc');
export const la = conGuion('la');
export const lt = conGuion('lt');
export { detenerVoz };
