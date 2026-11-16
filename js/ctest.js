// Complete the Words a partir de un párrafo normal, con la regla de ETS:
// la primera oración queda intacta; desde la 2.ª palabra de la 2.ª oración se
// borra la segunda mitad de cada segunda palabra hasta tener 10 huecos; el
// resto del párrafo queda intacto. Se ve la primera mitad (redondeando hacia
// abajo): "they" → "th__", "summer" → "sum___", "and" → "a__".
//
// Devuelve el texto con lo que falta entre llaves: "Th{ey} vi{sit} ..."
// Sin DOM: lo usa el navegador y también tests/validar.mjs con Node.

export const HUECOS = 10;

export function generarCtest(parrafo, huecos = HUECOS) {
  const texto = parrafo.trim().replace(/\s+/g, ' ');
  const finPrimera = texto.search(/[.!?]["')\]]?\s/);
  if (finPrimera < 0) return { texto, huecos: 0 };
  const corte = texto.indexOf(' ', finPrimera) + 1;
  const primera = texto.slice(0, corte);
  const tokens = texto.slice(corte).split(' ');

  let i = 1; // segunda palabra de la segunda oración
  let n = 0;
  while (i < tokens.length && n < huecos) {
    const m = tokens[i].match(/^([^A-Za-z]*)([A-Za-z]+)([^A-Za-z]*)$/);
    if (m && m[2].length >= 2) {
      const [, pre, palabra, post] = m;
      const ver = Math.floor(palabra.length / 2);
      tokens[i] = `${pre}${palabra.slice(0, ver)}{${palabra.slice(ver)}}${post}`;
      n++;
      i += 2;
    } else {
      i += 1; // palabras de una letra, con números o apóstrofos: se pasa a la siguiente
    }
  }
  return { texto: primera + tokens.join(' '), huecos: n };
}

export function contarPalabrasPlano(t) {
  return (t || '').trim().split(/\s+/).filter(Boolean).length;
}
