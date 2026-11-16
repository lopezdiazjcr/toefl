// Speaking: Listen and Repeat, Take an Interview.
// Graba con el micrófono y, si el navegador sabe transcribir (Chrome, Edge,
// Safari), compara lo dicho con lo pedido. Sin micrófono se practica en voz
// alta y la persona se autoevalúa: nadie se queda sin practicar.
import { h, limpiar, normalizarPalabras, alinear, contarPalabras, esperar, poner } from '../util.js';
import { reproducir, detenerVoz, hayVoz, hayMicrofono, pedirMicrofono, grabar, hayTranscripcion, transcribir } from '../audio.js';
import { retro } from './comun.js';

let modo = null; // 'mic' | 'voz-alta'

function preguntarMicrofono(zona) {
  if (modo) return Promise.resolve(modo);
  return new Promise((resolve) => {
    limpiar(zona);
    const estado = h('p', { class: 'suave', 'aria-live': 'polite' });
    const activar = h('button', { class: 'boton sonic', type: 'button' }, '🎙  Activar micrófono');
    const sin = h('button', { class: 'boton secundario', type: 'button', onclick: () => resolve((modo = 'voz-alta')) }, 'Practicar sin grabar');
    activar.onclick = async () => {
      try {
        await pedirMicrofono();
        resolve((modo = 'mic'));
      } catch {
        estado.textContent = 'El navegador no dio permiso para usar el micrófono. Puede permitirlo desde el candado de la barra de direcciones, o practicar en voz alta sin grabar.';
      }
    };
    poner(zona, h('div', { class: 'tarjeta plana', style: { maxWidth: '640px' } },
      h('h3', {}, 'Speaking: necesita su voz'),
      h('p', {}, 'Para calificar su respuesta, la plataforma graba su voz y la compara con lo que debía decir. La grabación se queda en su navegador y no se envía a Inglés Latinoamérica. Para convertir la voz en texto, el navegador usa su propio servicio de reconocimiento (en Chrome, el de Google).'),
      hayTranscripcion() ? null : h('p', { class: 'aviso' }, 'Este navegador puede grabar pero no transcribir. Para la calificación automática use Chrome, Edge o Safari.'),
      hayMicrofono() ? null : h('p', { class: 'aviso' }, 'Este navegador no permite grabar. Practique en voz alta y califíquese.'),
      h('div', { class: 'fila-botones', style: { marginTop: '12px' } }, hayMicrofono() ? activar : null, sin),
      estado));
  });
}

const CIRC = 2 * Math.PI * 62;

function svgEl(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function aro() {
  const svg = svgEl('svg', { viewBox: '0 0 140 140', 'aria-hidden': 'true' });
  poner(svg, svgEl('circle', { class: 'fondo-aro', cx: 70, cy: 70, r: 62, fill: 'none', 'stroke-width': 10 }));
  const avance = svgEl('circle', { class: 'avance-aro', cx: 70, cy: 70, r: 62, fill: 'none', 'stroke-width': 10, 'stroke-linecap': 'round', 'stroke-dasharray': CIRC, 'stroke-dashoffset': 0 });
  poner(svg, avance);
  const centro = h('div', { class: 'aro-centro' }, '');
  const caja = h('div', { class: 'aro' }, svg, centro);
  return {
    caja,
    poner(frac, texto) { avance.setAttribute('stroke-dashoffset', String(CIRC * (1 - Math.max(0, Math.min(1, frac))))); centro.textContent = texto; },
    grabando(si) { caja.classList.toggle('grabando', si); },
  };
}

// Graba (y transcribe si se puede) durante `segundos` o hasta que toque "Terminé".
async function tomarRespuesta(zona, segundos, { etiqueta = 'Hable ahora', senal } = {}) {
  const ring = aro();
  const parar = h('button', { class: 'boton secundario chico', type: 'button' }, 'Terminé');
  const leyenda = h('p', { style: { fontWeight: 700, margin: 0 } }, h('span', { class: 'punto-rec' }), etiqueta);
  const panel = h('div', { class: 'microfono' }, ring.caja, leyenda, parar);
  poner(zona, panel);
  ring.grabando(true);

  let grab = null, trans = null;
  if (modo === 'mic') {
    try { grab = grabar(await pedirMicrofono()); } catch { grab = null; }
    if (hayTranscripcion()) trans = transcribir();
  }
  const t0 = performance.now();
  await new Promise((resolve) => {
    const tic = setInterval(() => {
      const pasado = (performance.now() - t0) / 1000;
      ring.poner(1 - pasado / segundos, String(Math.max(0, Math.ceil(segundos - pasado))));
      if (pasado >= segundos) { clearInterval(tic); resolve(); }
    }, 100);
    parar.onclick = () => { clearInterval(tic); resolve(); };
    if (senal) senal.addEventListener('abort', () => { clearInterval(tic); resolve(); });
  });
  const duracion = (performance.now() - t0) / 1000;
  ring.grabando(false);
  leyenda.textContent = 'Procesando…';
  parar.remove();
  grab && grab.detener();
  trans && trans.detener();
  const [audio, texto] = await Promise.all([
    grab ? grab.promesa : Promise.resolve(null),
    trans ? Promise.race([trans.promesa, esperar(4000).then(() => ({ texto: '', error: 'tiempo' }))]) : Promise.resolve(null),
  ]);
  panel.remove();
  return { audio, transcripcion: texto, duracion };
}

function autoMarca(zona, pregunta) {
  return new Promise((resolve) => {
    const opciones = [['Exacta', 5], ['Cambié 1–2 palabras', 4], ['Dije la mitad', 2], ['No pude', 0]];
    poner(zona, h('div', { style: { marginTop: '12px' } },
      h('p', { class: 'pregunta' }, pregunta),
      h('div', { class: 'fila-botones' }, opciones.map(([t, v]) =>
        h('button', { class: 'boton secundario chico', type: 'button', onclick: () => resolve(v) }, t)))));
  });
}

// ---------- Listen and Repeat ----------
// Proporción de palabras repetidas → puntos 0–5, siguiendo la idea de la rúbrica
// de ETS: 5 exacta; 4 cambia 1–2 palabras pequeñas; 3 conserva la mayoría;
// 2 falta una parte grande; 1 unas pocas palabras; 0 nada.
export function puntosRepeticion(frac) {
  if (frac >= 0.999) return 5;
  if (frac >= 0.85) return 4;
  if (frac >= 0.6) return 3;
  if (frac >= 0.35) return 2;
  if (frac > 0) return 1;
  return 0;
}

export async function rp(zona, item, ctx) {
  const frases = item.frases.map((f) => (typeof f === 'string' ? { t: f } : f));
  const puntajes = frases.map(() => 0);
  const detalles = frases.map(() => null);
  const armar = () => ({
    correctas: puntajes.reduce((s, x) => s + x, 0),
    total: frases.length * 5,
    revisar: () => frases.map((f, i) => {
      const d = detalles[i];
      return h('div', { class: 'revision-item' },
        h('p', { lang: 'en', style: { margin: '0 0 4px', fontWeight: 600 } }, `${puntajes[i]}/5 · ${f.t}`),
        d && d.dicho != null ? h('p', { class: 'suave', style: { margin: 0 } }, `Se entendió: “${d.dicho || '—'}”`) : null,
        d && d.audio ? h('audio', { controls: true, src: d.audio.url }) : null);
    }),
    errores: frases.filter((_, i) => puntajes[i] < 4).map((f) => f.t),
  });
  ctx.alAbortar(armar);

  await preguntarMicrofono(zona);

  // El narrador asigna el papel, como en el examen.
  if (item.escena) {
    limpiar(zona);
    poner(zona, h('p', { class: 'consigna' }, 'Listen and repeat.', h('small', {}, 'Escuche cada frase y repítala exactamente igual, una sola vez. Tiene entre 8 y 12 segundos para cada una.')),
      h('div', { class: 'tarjeta plana', lang: 'en' }, h('p', { style: { margin: 0 } }, item.escena)));
    await reproducir([{ g: item.g === 'f' ? 'm' : 'f', t: item.escena }]);
    if (ctx.modo === 'guiada') {
      await new Promise((res) => poner(zona, h('div', { class: 'acciones-tarea' }, h('button', { class: 'boton', type: 'button', onclick: res }, 'Empezar'))));
    }
  }

  for (let i = 0; i < frases.length; i++) {
    if (ctx.senal && ctx.senal.aborted) return armar();
    const f = frases[i];
    limpiar(zona);
    const escucha = h('div', { class: 'reproductor' }, h('span', { style: { fontWeight: 700 } }, `Frase ${i + 1} de ${frases.length}`),
      h('div', { class: 'onda sonando', 'aria-hidden': 'true' }, Array.from({ length: 30 }, (_, k) => h('i', { style: { height: `${20 + ((k * 41) % 70)}%` } }))));
    poner(zona, 
      h('p', { class: 'consigna' }, 'Listen and repeat.', h('small', {}, 'Repita exactamente lo que oye, con el mismo ritmo.')),
      escucha);
    if (ctx.modo === 'guiada' && !hayVoz()) poner(zona, h('p', { class: 'aviso', lang: 'en' }, f.t));
    await reproducir([{ g: f.g || item.g || 'f', t: f.t, audio: f.audio }]);
    if (ctx.senal && ctx.senal.aborted) return armar();
    escucha.querySelector('.onda').classList.remove('sonando');
    const palabras = normalizarPalabras(f.t);
    const tiempo = Math.min(12, Math.max(8, Math.round(palabras.length * 0.6 + 3)));
    const r = await tomarRespuesta(zona, tiempo, { etiqueta: 'Repita ahora', senal: ctx.senal });
    if (ctx.senal && ctx.senal.aborted) return armar();

    let puntaje = null, dicho = null;
    if (r.transcripcion && r.transcripcion.texto) {
      dicho = r.transcripcion.texto;
      const ok = alinear(palabras, normalizarPalabras(dicho));
      puntaje = puntosRepeticion(ok.filter(Boolean).length / palabras.length);
      detalles[i] = { dicho, ok, audio: r.audio };
    } else if (modo === 'mic' && r.transcripcion && r.transcripcion.error === 'no-speech') {
      puntaje = 0;
      detalles[i] = { dicho: '', audio: r.audio };
    } else {
      if (r.audio) poner(zona, h('audio', { controls: true, src: r.audio.url }));
      poner(zona, h('p', { lang: 'en', class: 'modelo', style: { marginTop: '10px' } }, f.t));
      puntaje = await autoMarca(zona, '¿Cómo le salió? Compare con la frase de arriba.');
      detalles[i] = { audio: r.audio };
    }
    puntajes[i] = puntaje;

    if (ctx.modo === 'guiada' && detalles[i] && detalles[i].ok) {
      const ok = detalles[i].ok;
      poner(zona, 
        h('p', { class: 'palabras-dichas', lang: 'en' }, f.t.split(/\s+/).map((w, k) => [h('span', { class: ok[k] ? 'si' : 'no' }, w), ' '])),
        retro(puntaje >= 4 ? true : puntaje <= 2 ? false : null, `${puntaje} de 5`, `Se entendió: “${dicho}”. Las palabras en rojo no se oyeron o cambiaron.`),
        r.audio ? h('audio', { controls: true, src: r.audio.url, style: { marginTop: '10px' } }) : null);
      await new Promise((res) => poner(zona, h('div', { class: 'acciones-tarea' },
        h('button', { class: 'boton', type: 'button', onclick: res }, i < frases.length - 1 ? 'Siguiente frase' : 'Terminar'),
        h('button', { class: 'boton secundario', type: 'button', onclick: () => reproducir([{ g: f.g || item.g || 'f', t: f.t }]) }, '↺ Escuchar de nuevo'))));
    } else if (ctx.modo === 'examen') {
      await esperar(500);
    }
  }
  return armar();
}

// ---------- Take an Interview ----------
const RUBRICA_IV = [
  [5, 'Responde de lleno y desarrolla las ideas; ritmo de conversación con pausas naturales; se entiende sin esfuerzo y la entonación ayuda al sentido; gramática y vocabulario variados y precisos.'],
  [4, 'Responde bien, aunque faltan conectores o hay que hacer un pequeño esfuerzo para seguirle.'],
  [3, 'Desarrollo limitado; ritmo entrecortado y muchas muletillas.'],
  [2, 'Apenas se conecta con la pregunta o casi solo repite sus palabras.'],
  [1, 'Palabras sueltas.'],
  [0, 'Sin respuesta o no se entiende.'],
]
export { RUBRICA_IV };

export async function iv(zona, item, ctx) {
  const respuestas = item.preguntas.map(() => null);
  const estimar = () => {
    const ws = respuestas.filter(Boolean).map((r) => r.palabras);
    if (!ws.length) return 0;
    const prom = ws.reduce((s, x) => s + x, 0) / item.preguntas.length;
    return prom >= 75 ? 4 : prom >= 50 ? 3 : prom >= 25 ? 2 : prom > 0 ? 1 : 0;
  };
  const revisar = () => item.preguntas.map((q, i) => {
    const r = respuestas[i];
    return h('div', { class: 'revision-item' },
      h('p', { class: 'pregunta', lang: 'en', style: { marginBottom: '6px' } }, `${i + 1}. ${q}`),
      r && r.audio ? h('audio', { controls: true, src: r.audio.url }) : null,
      r && r.texto ? h('p', { class: 'suave', lang: 'en', style: { margin: '6px 0' } }, `Transcripción: “${r.texto}” · ${r.palabras} palabras · ${r.ppm} palabras/min`) : null,
      item.modelos && item.modelos[i] ? h('div', { class: 'modelo', lang: 'en', style: { marginTop: '8px' } }, item.modelos[i]) : null);
  });
  // Cada respuesta de la entrevista vale 0–5 en el examen: 4 preguntas = 0–20 puntos.
  const resultado = (s) => ({ correctas: s * 4, total: 20, factor: 4, productivo: true, rubrica: 'iv', revisar });
  ctx.alAbortar(() => resultado(estimar()));

  await preguntarMicrofono(zona);
  const voz = item.g || 'm';

  limpiar(zona);
  poner(zona, 
    h('p', { class: 'consigna' }, 'Take an interview.', h('small', {}, `El entrevistador le hará ${item.preguntas.length} preguntas. Tiene 45 segundos para cada respuesta y no hay tiempo de preparación: empiece a hablar apenas termine la pregunta.`)),
    h('div', { class: 'tarjeta plana', lang: 'en' }, h('p', { class: 'genero' }, item.tema || 'Interview'), h('p', { style: { margin: 0 } }, item.intro)));
  if (item.intro) await reproducir([{ g: voz, t: item.intro }]);
  if (ctx.senal && ctx.senal.aborted) return resultado(0);
  if (ctx.modo === 'guiada') {
    await new Promise((res) => poner(zona, h('div', { class: 'acciones-tarea' }, h('button', { class: 'boton', type: 'button', onclick: res }, 'Empezar la entrevista'))));
  }

  for (let i = 0; i < item.preguntas.length; i++) {
    if (ctx.senal && ctx.senal.aborted) break;
    limpiar(zona);
    const q = item.preguntas[i];
    poner(zona, 
      h('p', { class: 'kicker' }, `Pregunta ${i + 1} de ${item.preguntas.length}`),
      h('div', { class: 'reproductor' }, h('span', { style: { fontWeight: 700 } }, 'Interviewer'),
        h('div', { class: 'onda sonando', 'aria-hidden': 'true' }, Array.from({ length: 30 }, (_, k) => h('i', { style: { height: `${20 + ((k * 29) % 70)}%` } })))),
      ctx.modo === 'guiada' || !hayVoz() ? h('p', { class: 'pregunta', lang: 'en', style: { marginTop: '14px' } }, q) : null);
    await reproducir([{ g: voz, t: q }]);
    if (ctx.senal && ctx.senal.aborted) break;
    zona.querySelector('.onda').classList.remove('sonando');
    const r = await tomarRespuesta(zona, 45, { etiqueta: 'Responda ahora', senal: ctx.senal });
    const texto = r.transcripcion ? r.transcripcion.texto : '';
    const palabras = contarPalabras(texto);
    respuestas[i] = { audio: r.audio, texto, palabras, ppm: r.duracion > 3 ? Math.round((palabras / r.duracion) * 60) : 0 };
    if (ctx.modo === 'guiada') {
      poner(zona, 
        texto ? h('p', { lang: 'en', class: 'suave' }, `Se entendió: “${texto}” (${palabras} palabras)`) : null,
        r.audio ? h('audio', { controls: true, src: r.audio.url }) : null,
        item.modelos && item.modelos[i] ? h('details', { class: 'transcripcion' }, h('summary', {}, 'Ver respuesta modelo'), h('p', { lang: 'en' }, item.modelos[i])) : null);
      await new Promise((res) => poner(zona, h('div', { class: 'acciones-tarea' },
        h('button', { class: 'boton', type: 'button', onclick: res }, i < item.preguntas.length - 1 ? 'Siguiente pregunta' : 'Ver mi entrevista'))));
    }
  }

  if (ctx.modo === 'examen') {
    return resultado(estimar());
  }

  // Cierre guiado: escucharse, comparar con los modelos y calificarse.
  limpiar(zona);
  let elegido = null;
  const seguir = h('button', { class: 'boton', type: 'button', disabled: true }, 'Guardar y seguir');
  const descriptor = h('p', { class: 'suave', style: { minHeight: '3em', marginTop: '8px' } }, 'Escúchese y compare con los modelos antes de calificarse.');
  const escala = h('div', { class: 'escala', role: 'group', 'aria-label': 'Autoevaluación de 0 a 5' },
    RUBRICA_IV.map(([n, d]) => h('button', { type: 'button', 'aria-pressed': 'false', onclick: (e) => {
      elegido = n;
      escala.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
      descriptor.textContent = d;
      seguir.disabled = false;
    } }, String(n))));
  poner(zona, h('h3', {}, 'Su entrevista'), ...revisar(),
    h('h3', { style: { marginTop: '18px' } }, '¿Cuánto le pondría un evaluador? (0–5)'), escala, descriptor,
    h('div', { class: 'acciones-tarea' }, seguir));
  return new Promise((resolve) => {
    seguir.onclick = () => resolve(resultado(elegido));
  });
}

export { detenerVoz };
