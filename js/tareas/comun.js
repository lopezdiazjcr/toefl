// Piezas que comparten varias tareas: la pregunta de opción múltiple,
// la retroalimentación y el botón de avanzar.
import { h, limpiar, poner } from '../util.js';

const LETRAS = ['A', 'B', 'C', 'D', 'E'];

export function retro(bien, titulo, texto) {
  return h('div', { class: `retro ${bien === true ? 'bien' : bien === false ? 'mal' : ''}`, role: 'status' },
    h('strong', {}, titulo),
    texto ? h('span', {}, texto) : null);
}

// Muestra las preguntas una por una (como el examen: no se puede volver atrás).
// En modo guiada hay "Comprobar" con explicación; en modo examen solo "Siguiente".
// `envolver(respuestas)` arma el resultado final; se usa también si el reloj
// se acaba a mitad de camino. respuestas = [{ elegida, correcta }].
export function opcionMultiple(zona, preguntas, ctx, { titulo, envolver = (r) => r } = {}) {
  const respuestas = preguntas.map(() => ({ elegida: null, correcta: null }));
  let actual = 0;
  let resolver;
  const promesa = new Promise((r) => (resolver = (resp) => r(envolver(resp))));

  ctx.alAbortar(() => envolver(respuestas));

  function pintar() {
    const p = preguntas[actual];
    limpiar(zona);
    let elegida = null;
    let comprobada = false;
    const botones = p.opciones.map((op, i) =>
      h('button', {
        class: 'opcion', type: 'button', 'aria-pressed': 'false',
        onclick: () => {
          if (comprobada) return;
          elegida = i;
          botones.forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
          avanzar.disabled = false;
        },
      }, h('span', { class: 'letra', 'aria-hidden': 'true' }, LETRAS[i]), h('span', {}, op)));

    const caja = h('div', {});
    const avanzar = h('button', { class: 'boton', type: 'button', disabled: true }, ctx.modo === 'guiada' ? 'Comprobar' : 'Siguiente');
    const ultima = actual === preguntas.length - 1;

    avanzar.onclick = () => {
      if (elegida == null) return;
      respuestas[actual] = { elegida, correcta: elegida === p.correcta };
      if (ctx.modo === 'guiada' && !comprobada) {
        comprobada = true;
        botones.forEach((b, j) => {
          b.disabled = true;
          if (j === p.correcta) b.classList.add('correcta');
          else if (j === elegida) b.classList.add('incorrecta');
        });
        const ok = elegida === p.correcta;
        poner(caja, retro(ok, ok ? 'Correcto.' : `La respuesta es ${LETRAS[p.correcta]}.`, p.explicacion || ''));
        avanzar.textContent = ultima ? 'Terminar' : 'Siguiente pregunta';
        avanzar.focus();
        return;
      }
      if (ultima) resolver(respuestas);
      else { actual++; pintar(); }
    };

    poner(zona, 
      titulo ? h('p', { class: 'kicker' }, titulo) : null,
      preguntas.length > 1 ? h('p', { class: 'suave', style: { fontSize: '13px', margin: '0 0 6px' } }, `Pregunta ${actual + 1} de ${preguntas.length}`) : null,
      h('p', { class: 'pregunta' }, p.enunciado),
      h('div', { class: 'opciones' }, botones),
      caja,
      h('div', { class: 'acciones-tarea' }, avanzar),
    );
  }

  pintar();
  return promesa;
}

// Revisión al final: pregunta, lo que eligió, la correcta y por qué.
export function revisarPreguntas(preguntas, respuestas) {
  return preguntas.map((p, i) => {
    const r = respuestas[i] || {};
    const ok = r.correcta === true;
    return h('div', { class: 'revision-item' },
      h('p', { class: 'pregunta', style: { marginBottom: '6px' } }, `${ok ? '✓' : '✗'} ${p.enunciado}`),
      r.elegida != null && !ok ? h('p', { style: { color: 'var(--mal)', margin: '0 0 4px' } }, `Su respuesta: ${LETRAS[r.elegida]}. ${p.opciones[r.elegida]}`) : null,
      r.elegida == null ? h('p', { style: { color: 'var(--mal)', margin: '0 0 4px' } }, 'Sin responder.') : null,
      h('p', { style: { color: 'var(--bien)', margin: '0 0 4px', fontWeight: 600 } }, `Correcta: ${LETRAS[p.correcta]}. ${p.opciones[p.correcta]}`),
      p.explicacion ? h('p', { class: 'suave', style: { margin: 0 } }, p.explicacion) : null);
  });
}

export function resultadoPreguntas(preguntas, resp, extra) {
  return {
    ...contar(resp),
    revisar: () => [extra ? extra() : null, ...revisarPreguntas(preguntas, resp)],
    errores: preguntas.filter((_, i) => !(resp[i] && resp[i].correcta)).map((p) => p.enunciado),
  };
}

export function contar(respuestas) {
  return {
    correctas: respuestas.filter((r) => r && r.correcta).length,
    total: respuestas.length,
  };
}
