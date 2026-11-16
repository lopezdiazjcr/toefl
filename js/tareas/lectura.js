// Reading: Complete the Words, Read in Daily Life, Read an Academic Passage.
import { h, limpiar, poner } from '../util.js';
import { opcionMultiple, resultadoPreguntas, retro } from './comun.js';
import { generarCtest } from '../ctest.js';

// ---------- Complete the Words ----------
// El texto del banco marca lo que falta con llaves: "Th{ey} vi{sit} flowers".
// Se muestra "Th" y un hueco de 2 letras; se escribe "ey".
export function partirHuecos(texto) {
  const partes = [];
  const re = /\{([^}]+)\}/g;
  let ultimo = 0, m;
  while ((m = re.exec(texto))) {
    partes.push({ texto: texto.slice(ultimo, m.index) });
    partes.push({ falta: m[1] });
    ultimo = m.index + m[0].length;
  }
  partes.push({ texto: texto.slice(ultimo) });
  return partes;
}

// Los bancos traen el párrafo limpio; los huecos los pone la regla de ETS.
export const textoCw = (item) => item.texto || generarCtest(item.parrafo).texto;

function cw(zona, item, ctx) {
  const partes = partirHuecos(textoCw(item));
  const entradas = [];
  const parrafo = h('p', { class: 'ctest', lang: 'en' });
  for (const p of partes) {
    if (p.texto != null) {
      // La parte visible de la palabra va pegada al hueco (sin espacio).
      poner(parrafo, p.texto);
      continue;
    }
    const n = p.falta.length;
    const input = h('input', {
      type: 'text', maxlength: n, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
      'aria-label': `Faltan ${n} letra${n > 1 ? 's' : ''}`,
      placeholder: '_'.repeat(n), style: { width: `${n * 1.18 + 0.9}em` },
    });
    const caja = h('span', { class: 'hueco' }, input);
    entradas.push({ input, caja, falta: p.falta });
    // El texto anterior termina con la mitad visible de la palabra; se mueve
    // dentro del contenedor para que no se separe al saltar de línea.
    const previo = parrafo.lastChild;
    if (previo && previo.nodeType === 3) {
      const m = previo.textContent.match(/(\S+)$/);
      if (m) {
        previo.textContent = previo.textContent.slice(0, -m[1].length);
        caja.prepend(m[1]);
      }
    }
    poner(parrafo, caja);
  }
  entradas.forEach((e, i) => {
    e.input.addEventListener('input', () => {
      if (e.input.value.length >= e.falta.length && entradas[i + 1]) entradas[i + 1].input.focus();
    });
    e.input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Backspace' && !e.input.value && entradas[i - 1]) {
        ev.preventDefault();
        entradas[i - 1].input.focus();
      }
    });
  });

  const resultado = () => {
    const detalle = entradas.map((e) => ({ dado: e.input.value.trim(), falta: e.falta, ok: e.input.value.trim().toLowerCase() === e.falta.toLowerCase() }));
    return detalle;
  };

  return new Promise((resolve) => {
    const cerrar = () => {
      const d = resultado();
      resolve({
        correctas: d.filter((x) => x.ok).length,
        total: d.length,
        revisar: () => revisarCw(item, d),
        errores: d.filter((x) => !x.ok).map((x) => `${x.falta} (escribió “${x.dado || '—'}”)`),
      });
    };
    ctx.alAbortar(() => { const d = resultado(); return { correctas: d.filter((x) => x.ok).length, total: d.length, revisar: () => revisarCw(item, d) }; });

    const caja = h('div', {});
    const boton = h('button', { class: 'boton', type: 'button' }, ctx.modo === 'guiada' ? 'Comprobar' : 'Siguiente');
    let comprobado = false;
    boton.onclick = () => {
      if (ctx.modo !== 'guiada' || comprobado) return cerrar();
      comprobado = true;
      const d = resultado();
      d.forEach((x, i) => {
        const e = entradas[i];
        e.input.readOnly = true;
        e.caja.classList.add(x.ok ? 'bien' : 'mal');
        if (!x.ok) poner(e.caja, h('span', { class: 'solucion' }, x.falta));
      });
      const c = d.filter((x) => x.ok).length;
      poner(caja, retro(c === d.length ? true : c >= d.length * 0.6 ? null : false, `${c} de ${d.length} palabras completas.`, item.explicacion || 'Fíjese en la categoría de cada palabra (verbo, sustantivo, preposición) y en la concordancia con lo que la rodea.'));
      boton.textContent = 'Siguiente';
    };

    limpiar(zona);
    poner(zona, 
      h('p', { class: 'consigna' }, 'Fill in the missing letters in the paragraph.',
        h('small', {}, 'Complete las letras que faltan en cada palabra. El número de guiones es el número de letras.')),
      h('div', { class: 'texto-fuente' }, parrafo),
      caja,
      h('div', { class: 'acciones-tarea' }, boton),
    );
    setTimeout(() => entradas[0] && entradas[0].input.focus({ preventScroll: true }), 50);
  });
}

function revisarCw(item, detalle) {
  const partes = partirHuecos(textoCw(item));
  let k = 0;
  const p = h('p', { lang: 'en', style: { lineHeight: 1.9 } });
  for (const x of partes) {
    if (x.texto != null) { poner(p, x.texto); continue; }
    const d = detalle[k++];
    poner(p, h('b', { style: { color: d.ok ? 'var(--bien)' : 'var(--mal)' } }, d.ok ? x.falta : `${x.falta}`));
    if (!d.ok) poner(p, h('small', { style: { color: 'var(--mal)' } }, ` (${d.dado || '—'})`));
  }
  return [h('div', { class: 'revision-item' }, p)];
}

// ---------- Textos con preguntas (Daily Life y Academic Passage) ----------
function conTexto(zona, item, ctx, { academico }) {
  limpiar(zona);
  const fuente = h('article', { class: 'texto-fuente', lang: 'en' },
    item.genero ? h('div', { class: 'genero' }, item.genero) : null,
    item.titulo ? h('h3', {}, item.titulo) : null,
    academico
      ? item.texto.split(/\n\s*\n/).map((par) => h('p', {}, par))
      : h('div', { class: 'documento' }, item.texto));
  const lado = h('div', {});
  poner(zona, 
    h('p', { class: 'consigna' }, academico ? 'Read the passage and answer the questions.' : 'Read the text and answer the questions.',
      h('small', {}, academico ? 'Lea el texto académico y responda.' : 'Lea el texto de la vida diaria y responda.')),
    h('div', { class: 'doble' }, fuente, lado),
  );
  return opcionMultiple(lado, item.preguntas, ctx, { envolver: (resp) => resultadoPreguntas(item.preguntas, resp) });
}

export const dl = (zona, item, ctx) => conTexto(zona, item, ctx, { academico: false });
export const ap = (zona, item, ctx) => conTexto(zona, item, ctx, { academico: true });
export { cw };
