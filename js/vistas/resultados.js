// Pantalla de resultados: bandas estimadas, aciertos por tarea y la revisión
// pieza por pieza. En las tareas productivas (email, foro, entrevista) la
// persona puede ajustar su puntaje con la rúbrica, y las bandas se recalculan.
import { h, limpiar, poner } from '../util.js';
import { TAREAS, SECCIONES, ORDEN_SECCIONES } from '../tareas/index.js';
import { bandasDe, mcer } from '../bandas.js';
import { tarjetaClases } from './cta.js';

export function tarjetasBandas(bandas, global) {
  return h('div', { class: 'bandas' },
    h('div', { class: 'banda global' },
      h('div', { class: 'suave', style: { fontSize: '13px', fontWeight: 700 } }, 'Global estimado'),
      h('div', { class: 'valor' }, global != null ? global.toFixed(1) : '—'),
      h('div', { class: 'mcer' }, global != null ? `≈ ${mcer(global)}` : 'Sin datos')),
    ORDEN_SECCIONES.map((s) => h('div', { class: 'banda' },
      h('div', { class: 'suave', style: { fontSize: '13px', fontWeight: 700 } }, SECCIONES[s].en),
      h('div', { class: 'valor' }, bandas[s] != null ? bandas[s].toFixed(1) : '—'),
      h('div', { class: 'mcer' }, bandas[s] != null ? `≈ ${mcer(bandas[s])}` : 'No evaluada'))));
}

const RUB = {
  we: ['0 · sin respuesta', '1 · muy breve o fuera de tema', '2 · omite puntos, errores frecuentes', '3 · parcial, errores notorios', '4 · cumple, errores menores', '5 · completo y preciso'],
  ad: ['0 · sin respuesta', '1 · muy breve', '2 · poco desarrollo', '3 · relevante pero desigual', '4 · bien explicado', '5 · muy desarrollado y preciso'],
  iv: ['0 · sin respuesta', '1 · apenas responde', '2 · respuestas muy cortas', '3 · desarrollo limitado', '4 · bien, con pausas menores', '5 · fluido y desarrollado'],
};

// opciones: { titulo, resultados, conBandas, alCambiar(bandas), acciones: [nodos] }
export function pintarResultados(cont, { titulo, resultados, conBandas = false, alCambiar, acciones = [], nota }) {
  limpiar(cont);
  const zonaBandas = h('div', {});
  const resumen = h('div', {});
  const zonaClases = h('div', {});

  function recalcular() {
    const { bandas, global } = bandasDe(resultados);
    limpiar(zonaBandas);
    if (conBandas) {
      poner(zonaBandas, tarjetasBandas(bandas, global),
        h('p', { class: 'suave', style: { fontSize: '13px', marginTop: '10px' } },
          'Estimación de práctica en la escala 1–6 del TOEFL iBT. El examen real es adaptativo y lo califica ETS: use este número para ver tendencia, no como promesa.'));
    }
    pintarResumen();
    limpiar(zonaClases);
    poner(zonaClases, tarjetaClases({ extra: conBandas && global != null ? `En la plataforma mi banda global estimada es ${global.toFixed(1)}.` : '' }));
    alCambiar && alCambiar({ bandas, global });
    return { bandas, global };
  }

  function pintarResumen() {
    limpiar(resumen);
    const porTipo = {};
    for (const r of resultados) {
      if (!r) continue;
      const p = (porTipo[r.tipo] ||= { c: 0, t: 0 });
      p.c += r.correctas || 0;
      p.t += r.total || 0;
    }
    poner(resumen, h('div', { class: 'rejilla cuatro' }, Object.entries(porTipo).map(([tipo, p]) => {
      const t = TAREAS[tipo];
      const frac = p.t ? p.c / p.t : 0;
      return h('div', { class: 'tarjeta plana' },
        h('span', { class: `etiqueta ${SECCIONES[t.seccion].clase}` }, SECCIONES[t.seccion].en),
        h('p', { style: { fontWeight: 700, margin: '8px 0 2px' } }, t.oficial),
        h('div', { class: 'dato' }, `${Math.round(frac * 100)}%`, h('small', {}, ` ${fmt(p.c)}/${p.t}${['we', 'ad', 'iv'].includes(tipo) ? ' pts' : ''}`)),
        h('div', { class: 'medidor', style: { marginTop: '8px' } }, h('i', { style: { width: `${Math.round(frac * 100)}%` } })));
    })));
  }

  const revision = h('div', { class: 'tarjeta plana', style: { marginTop: '22px' } },
    h('h2', {}, 'Revisión pieza por pieza'),
    h('p', { class: 'suave' }, 'Aquí está cada pregunta con su respuesta correcta y la explicación. Los errores ya quedaron en su lista de Progreso.'),
    resultados.map((r, i) => {
      if (!r) return null;
      const t = TAREAS[r.tipo];
      const ajustable = r.productivo && RUB[r.rubrica || r.tipo];
      let selector = null;
      if (ajustable) {
        selector = h('label', { style: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', margin: '8px 0' } },
          h('span', { style: { fontWeight: 600 } }, 'Su puntaje con la rúbrica:'),
          h('select', {
            style: { padding: '8px 10px', borderRadius: '10px', border: '1.5px solid var(--linea-fuerte)', background: '#fff', font: 'inherit' },
            onchange: (e) => { r.correctas = Number(e.target.value) * (r.factor || 1); recalcular(); },
          }, RUB[r.rubrica || r.tipo].map((txt, n) => {
            const o = h('option', { value: n }, txt);
            if (n === Math.round((r.correctas || 0) / (r.factor || 1))) o.selected = true;
            return o;
          })));
      }
      return h('details', { class: 'revision-item', open: false },
        h('summary', { style: { cursor: 'pointer', fontWeight: 700 } },
          `${i + 1}. ${t.oficial} — ${fmt(r.correctas || 0)}/${r.total}${r.sinResponder ? ' (sin responder)' : ''}`),
        h('div', { style: { padding: '8px 0 0' } }, selector, r.revisar ? r.revisar() : null));
    }));

  poner(cont, h('section', { class: 'seccion' }, h('div', { class: 'contenedor' },
    h('p', { class: 'kicker' }, 'Resultados'),
    h('h1', {}, titulo),
    nota ? h('p', { class: 'aviso', style: { margin: '10px 0 18px' } }, nota) : null,
    zonaBandas,
    h('div', { style: { marginTop: '20px' } }, resumen),
    acciones.length ? h('div', { class: 'fila-botones', style: { marginTop: '22px' } }, acciones) : null,
    zonaClases,
    revision)));
  return recalcular();
}

function fmt(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}
