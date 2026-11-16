// Writing: Build a Sentence, Write an Email, Write for an Academic Discussion.
import { h, limpiar, barajar, contarPalabras, mmss, poner } from '../util.js';
import { retro } from './comun.js';
import { registrarEscrito } from '../estado.js';

// ---------- Build a Sentence ----------
// marco: "Could you tell me _ _ _ _?" — cada _ es un espacio; lo demás es fijo.
// fichas: en el orden correcto, una por espacio. distractor: ficha que sobra.
const normal = (s) => s.toLowerCase().replace(/\s+/g, ' ').replace(/\s+([?.!,])/g, '$1').trim();

export function partirMarco(marco) {
  // Devuelve [{ fijo: 'texto' } | { hueco: true }]
  return marco.split(/(\s+)/).filter((t) => t && !/^\s+$/.test(t)).reduce((acc, t) => {
    const m = t.match(/^_([?.!,]?)$/);
    if (m) {
      acc.push({ hueco: true });
      if (m[1]) acc.push({ fijo: m[1], pegado: true });
    } else acc.push({ fijo: t });
    return acc;
  }, []);
}

export function oracionBs(item, piezas = item.fichas) {
  let k = 0;
  const txt = partirMarco(item.marco).map((p) => (p.hueco ? piezas[k++] || '___' : p.fijo)).join(' ');
  const limpio = txt.replace(/\s+([?.!,])/g, '$1');
  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

export function bs(zona, item, ctx) {
  limpiar(zona);
  const partes = partirMarco(item.marco);
  const nHuecos = partes.filter((p) => p.hueco).length;
  const fichas = barajar([...item.fichas, ...(item.distractor ? [item.distractor] : [])].map((t, i) => ({ t, i })));
  const puestas = new Array(nHuecos).fill(null);
  const zonaRanuras = h('div', { class: 'ranuras', lang: 'en' });
  const zonaFichas = h('div', { class: 'fichas', lang: 'en', role: 'group', 'aria-label': 'Palabras disponibles' });
  const caja = h('div', {});
  let cerrado = false;

  const dada = () => puestas.map((p) => (p ? p.t : ''));
  const esCorrecta = () => {
    if (puestas.includes(null)) return false;
    const intento = normal(oracionBs(item, dada()));
    return [item.fichas, ...(item.alternativas || [])].some((alt) => normal(oracionBs(item, alt)) === intento);
  };

  const boton = h('button', { class: 'boton', type: 'button', disabled: true }, ctx.modo === 'guiada' ? 'Comprobar' : 'Siguiente');
  const vaciar = h('button', { class: 'boton secundario chico', type: 'button', onclick: () => { puestas.fill(null); pintar(); } }, 'Vaciar');

  function pintar() {
    limpiar(zonaRanuras);
    let k = 0;
    for (const p of partes) {
      if (p.fijo) { poner(zonaRanuras, h('span', { class: 'fijo' }, p.fijo)); continue; }
      const i = k++;
      const f = puestas[i];
      poner(zonaRanuras, f
        ? h('span', { class: 'ranura llena' }, h('button', { class: 'ficha puesta', type: 'button', disabled: cerrado, 'aria-label': `Quitar “${f.t}”`, onclick: () => { puestas[i] = null; pintar(); } }, f.t))
        : h('span', { class: 'ranura', 'aria-label': 'Espacio vacío' }));
    }
    limpiar(zonaFichas);
    for (const f of fichas) {
      if (puestas.includes(f)) continue;
      poner(zonaFichas, h('button', { class: 'ficha', type: 'button', disabled: cerrado, onclick: () => {
        const libre = puestas.indexOf(null);
        if (libre >= 0) { puestas[libre] = f; pintar(); }
      } }, f.t));
    }
    if (!cerrado) boton.disabled = puestas.includes(null);
  }

  const resultado = () => {
    const ok = esCorrecta();
    const suya = puestas.some(Boolean) ? oracionBs(item, dada()) : '—';
    return {
      correctas: ok ? 1 : 0, total: 1,
      revisar: () => [h('div', { class: 'revision-item' },
        h('p', { class: 'suave', lang: 'en', style: { margin: '0 0 4px' } }, `${item.a.quien}: “${item.a.t}”`),
        h('p', { lang: 'en', style: { margin: '0 0 4px', color: ok ? 'var(--bien)' : 'var(--mal)' } }, `${ok ? '✓' : '✗'} ${suya}`),
        ok ? null : h('p', { lang: 'en', style: { margin: 0, color: 'var(--bien)', fontWeight: 600 } }, `Correcta: ${oracionBs(item)}`),
        item.explicacion ? h('p', { class: 'suave', style: { margin: '4px 0 0' } }, item.explicacion) : null)],
      errores: ok ? [] : [oracionBs(item)],
    };
  };
  ctx.alAbortar(resultado);

  const promesa = new Promise((resolve) => {
    boton.onclick = () => {
      if (ctx.modo !== 'guiada' || cerrado) return resolve(resultado());
      cerrado = true;
      const ok = esCorrecta();
      pintar();
      zonaRanuras.querySelectorAll('.ficha').forEach((b) => b.classList.add(ok ? 'bien' : 'mal'));
      poner(caja, retro(ok, ok ? 'Correcto.' : 'El orden correcto es:', ok ? item.explicacion || '' : `${oracionBs(item)}${item.explicacion ? ' — ' + item.explicacion : ''}`));
      boton.textContent = 'Siguiente';
      boton.disabled = false;
      vaciar.remove();
      boton.focus();
    };
  });

  poner(zona, 
    h('p', { class: 'consigna' }, 'Make an appropriate sentence.',
      h('small', {}, 'Toque las palabras en orden para armar una respuesta correcta. Puede sobrar una. Para quitar una palabra, tóquela de nuevo.')),
    h('div', { class: 'dialogo' },
      h('div', { class: 'burbuja', lang: 'en' }, h('span', { class: 'quien' }, item.a.quien), item.a.t),
      h('div', { class: 'burbuja tuya' }, h('span', { class: 'quien' }, item.b || 'You'), zonaRanuras, zonaFichas)),
    caja,
    h('div', { class: 'acciones-tarea' }, boton, vaciar),
  );
  pintar();
  return promesa;
}

// ---------- Redacción con reloj (Email y Academic Discussion) ----------

// Rúbricas parafraseadas de ETS (writing-rubrics.pdf). No se copian: ETS las licencia.
export const RUBRICA = {
  we: [
    [5, 'El desarrollo sostiene bien el propósito del correo; estructuras variadas; vocabulario preciso e idiomático; cortesía y registro consistentes con el destinatario; casi sin errores.'],
    [4, 'Desarrollo suficiente de los tres puntos; registro casi siempre adecuado; pocos errores.'],
    [3, 'Desarrollo parcial; variedad limitada; errores notorios de estructura, forma de palabras o convenciones sociales.'],
    [2, 'Desarrollo escaso; los errores se acumulan y dificultan la lectura.'],
    [1, 'Lenguaje telegráfico o casi todo tomado de la consigna.'],
    [0, 'En blanco, fuera de tema, copiado o no está en inglés.'],
  ],
  ad: [
    [5, 'Aporte relevante y muy claro a la discusión: explicaciones, ejemplos y detalles bien desarrollados; estructuras variadas y vocabulario preciso; casi sin errores.'],
    [4, 'Aporte relevante y fácil de seguir; desarrollo suficiente; pocos errores.'],
    [3, 'Aporte en general relevante, pero con partes poco desarrolladas o poco claras; errores notorios.'],
    [2, 'Intento de aporte con desarrollo escaso o ideas difíciles de seguir; errores acumulados.'],
    [1, 'Lenguaje telegráfico o casi todo tomado de los mensajes del foro.'],
    [0, 'En blanco, fuera de tema, copiado o no está en inglés.'],
  ],
};

function chequeosAutomaticos(tipo, item, texto) {
  const palabras = contarPalabras(texto);
  const lineas = texto.trim().split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const c = [];
  if (tipo === 'we') {
    c.push([palabras >= 100, `Extensión: ${palabras} palabras. Apunte a 100–150: la muestra de ETS con puntaje 4 tiene unas 118.`]);
    c.push([/^(dear|hi|hello|good (morning|afternoon|evening)|greetings)\b/i.test(lineas[0] || ''), 'Saludo al inicio (Dear…, Hi…, Hello…).']);
    c.push([/(regards|sincerely|best|thank you|thanks|cheers|warmly|respectfully|all the best|take care)/i.test(lineas.slice(-3).join(' ')), 'Despedida al final (Best regards, Thank you, Sincerely…).']);
    c.push([lineas.length >= 3, 'Párrafos separados (saludo, cuerpo y despedida).']);
  } else {
    c.push([palabras >= 100, `Extensión: ${palabras} palabras. ETS pide al menos 100; su muestra con puntaje 5 tiene unas 123.`]);
    const nombres = (item.estudiantes || []).map((e) => e.nombre.split(' ')[0]);
    const menciona = nombres.some((n) => new RegExp(`\\b${n}\\b`, 'i').test(texto));
    c.push([menciona, `Dialoga con un compañero por su nombre (${nombres.join(' o ')}).`]);
    c.push([/\b(i (think|believe|agree|disagree)|in my (view|opinion)|from my perspective|i (would|'d) argue|my view)\b/i.test(texto), 'Expresa su postura de forma explícita.']);
    c.push([/\b(for example|for instance|such as|in my experience|when i|last year|a good example)\b/i.test(texto), 'Incluye un ejemplo concreto.']);
  }
  return { palabras, chequeos: c };
}

function redaccion(tipo) {
  return (zona, item, ctx) => {
    limpiar(zona);
    const segundos = ctx.segundos || (tipo === 'we' ? 7 * 60 : 10 * 60);
    const area = h('textarea', { class: 'redaccion', lang: 'en', spellcheck: 'false', autocapitalize: 'sentences', 'aria-label': 'Su respuesta en inglés' });
    const cuenta = h('span', {}, '0 palabras');
    const reloj = h('span', { style: { fontWeight: 700 } }, mmss(segundos));
    const enviar = h('button', { class: 'boton', type: 'button' }, 'Enviar respuesta');
    let restante = segundos;
    let intervalo = null;
    let terminado = false;

    area.addEventListener('input', () => { cuenta.textContent = `${contarPalabras(area.value)} palabras`; });
    // Igual que en el examen: sin corrector ortográfico ni autocompletado.
    area.addEventListener('paste', (e) => { if (ctx.modo === 'examen') e.preventDefault(); });

    const consigna = tipo === 'we' ? consignaEmail(item) : consignaForo(item);

    let resolver;
    const promesa = new Promise((r) => (resolver = r));

    function cerrar(score) {
      const texto = area.value;
      const auto = chequeosAutomaticos(tipo, item, texto);
      registrarEscrito({ tipo, id: item.id, texto, palabras: auto.palabras, puntaje: score });
      resolver({
        correctas: score ?? 0, total: 5,
        productivo: true,
        revisar: () => [h('div', { class: 'revision-item' },
          h('p', { class: 'pregunta' }, tipo === 'we' ? 'Su email' : 'Su respuesta en el foro'),
          h('div', { class: 'modelo', style: { background: '#fff' }, lang: 'en' }, texto || '—'),
          h('p', { class: 'kicker', style: { marginTop: '14px' } }, 'Respuesta modelo'),
          h('div', { class: 'modelo', lang: 'en' }, item.modelo),
          item.notas ? h('p', { class: 'suave', style: { marginTop: '8px' } }, item.notas) : null)],
      });
    }

    function evaluar() {
      if (terminado) return;
      terminado = true;
      clearInterval(intervalo);
      area.readOnly = true;
      const texto = area.value;
      const auto = chequeosAutomaticos(tipo, item, texto);
      if (ctx.modo === 'examen') {
        // En examen no hay autoevaluación a mitad de camino: se estima con lo automático
        // y la persona califica al final en la revisión.
        const base = auto.chequeos.filter(([ok]) => ok).length;
        const estimado = auto.palabras < 20 ? (auto.palabras ? 1 : 0) : Math.min(5, 1 + base);
        return cerrar(estimado);
      }
      let elegido = null;
      const continuar = h('button', { class: 'boton', type: 'button', disabled: true, onclick: () => cerrar(elegido) }, 'Guardar y seguir');
      const escala = h('div', { class: 'escala', role: 'group', 'aria-label': 'Autoevaluación de 0 a 5' },
        RUBRICA[tipo].map(([n]) => h('button', { type: 'button', 'aria-pressed': 'false', onclick: (e) => {
          elegido = n;
          escala.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === e.currentTarget)));
          descriptor.textContent = RUBRICA[tipo].find(([k]) => k === n)[1];
          continuar.disabled = false;
        } }, String(n))));
      const descriptor = h('p', { class: 'suave', style: { marginTop: '8px', minHeight: '3em' } }, 'Compare su texto con el modelo y elija el puntaje que le daría un evaluador.');
      poner(zona, h('div', { class: 'tarjeta plana', style: { marginTop: '20px' } },
        h('h3', {}, 'Revisión automática'),
        h('ul', { class: 'chequeo-auto' }, auto.chequeos.map(([ok, t]) => h('li', { class: ok ? 'ok' : 'no' }, t))),
        h('h3', { style: { marginTop: '18px' } }, 'Respuesta modelo'),
        h('div', { class: 'modelo', lang: 'en' }, item.modelo),
        item.notas ? h('p', { class: 'suave', style: { marginTop: '10px' } }, item.notas) : null,
        h('h3', { style: { marginTop: '18px' } }, '¿Cuánto le pondría un evaluador? (0–5)'),
        escala, descriptor,
        h('div', { class: 'acciones-tarea' }, continuar)));
      enviar.remove();
      continuar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    ctx.alAbortar(() => {
      clearInterval(intervalo);
      const auto = chequeosAutomaticos(tipo, item, area.value);
      const base = auto.chequeos.filter(([ok]) => ok).length;
      const estimado = auto.palabras < 20 ? (auto.palabras ? 1 : 0) : Math.min(5, 1 + base);
      registrarEscrito({ tipo, id: item.id, texto: area.value, palabras: auto.palabras, puntaje: estimado });
      return { correctas: estimado, total: 5, productivo: true, revisar: () => [h('div', { class: 'modelo', lang: 'en' }, item.modelo)] };
    });

    intervalo = setInterval(() => {
      restante--;
      reloj.textContent = restante >= 0 ? mmss(restante) : `+${mmss(-restante)}`;
      if (restante === 60) reloj.style.color = 'var(--mal)';
      if (restante === 0) {
        if (ctx.modo === 'examen') evaluar();
        else zona.querySelector('.aviso-tiempo')?.removeAttribute('hidden');
      }
    }, 1000);

    if (ctx.senal) ctx.senal.addEventListener('abort', () => clearInterval(intervalo));
    enviar.onclick = evaluar;
    poner(zona, 
      consigna,
      h('div', { style: { marginTop: '16px' } }, area,
        h('div', { class: 'contador' }, cuenta, h('span', {}, 'Tiempo: ', reloj))),
      h('p', { class: 'aviso aviso-tiempo', hidden: true, style: { marginTop: '10px' } }, 'Se acabó el tiempo del examen real. Termine la idea y envíe: lo importante hoy es aprender a cerrar a tiempo.'),
      h('div', { class: 'acciones-tarea' }, enviar),
    );
    setTimeout(() => area.focus({ preventScroll: true }), 60);
    return promesa;
  };
}

function consignaEmail(item) {
  return h('div', {},
    h('p', { class: 'consigna' }, 'Write an email.', h('small', {}, 'Tiene 7 minutos. Responda los tres puntos; el tono depende de a quién le escribe.')),
    h('div', { class: 'consigna-escrita', lang: 'en' },
      h('p', {}, item.situacion),
      h('p', { style: { margin: '10px 0 4px', fontWeight: 600 } }, 'In your email, do the following:'),
      h('ul', {}, item.puntos.map((p) => h('li', {}, p))),
      item.para ? h('p', { class: 'suave', style: { margin: '12px 0 0', fontSize: '14px' } }, `To: ${item.para}`) : null,
      item.asunto ? h('p', { class: 'suave', style: { margin: 0, fontSize: '14px' } }, `Subject: ${item.asunto}`) : null));
}

function consignaForo(item) {
  const iniciales = (n) => n.split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase();
  return h('div', {},
    h('p', { class: 'consigna' }, 'Write for an academic discussion.',
      h('small', {}, 'Tiene 10 minutos. Su profesor hizo una pregunta en el foro de la clase; responda con su opinión, apóyela y aporte algo nuevo. Mínimo 100 palabras.')),
    h('div', { class: 'consigna-escrita foro', lang: 'en' },
      item.curso ? h('p', { class: 'genero', style: { margin: 0 } }, item.curso) : null,
      h('div', { class: 'post' }, h('span', { class: 'avatar profe' }, iniciales(item.profesor.nombre)),
        h('div', {}, h('div', { class: 'quien' }, item.profesor.nombre), h('p', { style: { margin: '2px 0 0' } }, item.profesor.texto))),
      item.estudiantes.map((e) => h('div', { class: 'post' }, h('span', { class: 'avatar' }, iniciales(e.nombre)),
        h('div', {}, h('div', { class: 'quien' }, e.nombre), h('p', { style: { margin: '2px 0 0' } }, e.texto))))));
}

export const we = redaccion('we');
export const ad = redaccion('ad');
