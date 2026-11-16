// Utilidades sin dependencias. Todo el sitio se arma con h(), así no hay
// innerHTML con texto de los bancos (que podría traer < o &).

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'value') el.value = v;
    else if (k === 'html') el.innerHTML = v; // solo para SVG propio, nunca para datos
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, String(v));
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

// append que ignora null/false (Node.append los pinta como texto "null").
export function poner(padre, ...hijos) {
  for (const c of hijos.flat(Infinity)) {
    if (c == null || c === false) continue;
    padre.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return padre;
}

export const $ = (sel, root = document) => root.querySelector(sel);

export function limpiar(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
  return el;
}

export function barajar(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function mmss(seg) {
  const s = Math.max(0, Math.round(seg));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function contarPalabras(texto) {
  const t = (texto || '').trim();
  if (!t) return 0;
  return t.split(/\s+/).filter((w) => /[A-Za-zÀ-ÿ0-9]/.test(w)).length;
}

// Palabras normalizadas para comparar lo que se dijo con lo que se pedía.
// La transcripción del navegador escribe "8" donde se dijo "eight": se pasa a
// palabras para no marcar mal una repetición correcta.
const UNIDADES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const DECENAS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function numeroEnPalabras(n) {
  if (n < 20) return UNIDADES[n];
  if (n < 100) return DECENAS[Math.floor(n / 10)] + (n % 10 ? ' ' + UNIDADES[n % 10] : '');
  return String(n);
}

export function normalizarPalabras(texto) {
  return (texto || '')
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/\b\d{1,2}\b/g, (d) => numeroEnPalabras(Number(d)))
    .replace(/-/g, ' ')
    .replace(/[^a-z0-9' ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// Subsecuencia común más larga: qué palabras del original aparecen, en orden,
// en lo que la persona dijo. Devuelve un arreglo de booleanos por palabra.
export function alinear(original, dicho) {
  const a = original, b = dicho;
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const ok = new Array(n).fill(false);
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { ok[i] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return ok;
}

export function fechaCorta(iso) {
  try {
    return new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

export function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function anunciar(texto) {
  const viva = document.getElementById('anuncio-vivo');
  if (viva) { viva.textContent = ''; setTimeout(() => (viva.textContent = texto), 30); }
}
