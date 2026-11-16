// Voz, grabación y transcripción, todo con APIs del navegador.
//
// Cada línea de los bancos puede traer un campo `audio` (MP3 grabado o
// generado con ElevenLabs). Si lo trae, se usa ese archivo; si no, se lee con
// la síntesis de voz del navegador. Así la plataforma funciona hoy y mejora
// sola cuando se graben los audios, sin tocar el motor.

const NOVEDAD = /bad news|bells|bubbles|jester|whisper|zarvox|trinoids|organ|cellos|boing|bahh|albert|wobble|good news|superstar|junior|ralph|kathy|princess|hysterical|pipe|deranged|grandma|grandpa/i;
const FEMENINAS = /samantha|google us english|aria|jenny|ava|allison|susan|zira|karen|moira|tessa|serena|victoria|joanna|salli|kimberly|emma|libby|sonia|michelle|flo|sandy|shelley|female/i;
const MASCULINAS = /alex|daniel|fred|google uk english male|guy|david|aaron|tom|evan|nathan|reed|rocko|eddy|rishi|matthew|joey|justin|ryan|christopher|eric|male/i;

let voces = null;

function cargarVoces() {
  if (voces) return Promise.resolve(voces);
  if (!('speechSynthesis' in window)) return Promise.resolve((voces = { f: null, m: null, hay: false }));
  return new Promise((resolve) => {
    let listo = false;
    const elegir = () => {
      if (listo) return;
      const todas = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang) && !NOVEDAD.test(v.name));
      if (!todas.length) return;
      listo = true;
      const us = todas.filter((v) => /en[-_]US/i.test(v.lang));
      const base = us.length ? us : todas;
      const f = base.find((v) => FEMENINAS.test(v.name)) || todas.find((v) => FEMENINAS.test(v.name)) || base[0];
      const m = base.find((v) => MASCULINAS.test(v.name) && !/female/i.test(v.name))
        || todas.find((v) => MASCULINAS.test(v.name) && !/female/i.test(v.name))
        || base.find((v) => v !== f) || base[0];
      voces = { f, m, hay: true };
      resolve(voces);
    };
    elegir();
    speechSynthesis.addEventListener('voiceschanged', elegir);
    setTimeout(() => {
      if (!listo) {
        listo = true;
        const todas = speechSynthesis.getVoices();
        voces = { f: todas[0] || null, m: todas[0] || null, hay: todas.length > 0 };
        resolve(voces);
      }
    }, 1500);
  });
}

export const hayVoz = () => 'speechSynthesis' in window;

// Chrome corta los enunciados largos a los ~15 s: se parte por oraciones.
function trozos(texto) {
  return (texto.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g) || [texto]).map((s) => s.trim()).filter(Boolean);
}

const vivos = new Set(); // evita que el recolector de basura se coma el onend

function decir(texto, genero = 'f', velocidad = 0.95) {
  return cargarVoces().then((v) => new Promise((resolve) => {
    if (!v.hay) return resolve();
    const partes = trozos(texto);
    let i = 0;
    const siguiente = () => {
      if (i >= partes.length) return resolve();
      const u = new SpeechSynthesisUtterance(partes[i++]);
      const voz = genero === 'm' ? v.m : v.f;
      if (voz) u.voice = voz;
      u.lang = (voz && voz.lang) || 'en-US';
      u.rate = velocidad;
      // Si el navegador solo tiene una voz, el tono distingue a los hablantes.
      u.pitch = v.f === v.m ? (genero === 'm' ? 0.8 : 1.12) : 1;
      vivos.add(u);
      const fin = () => { vivos.delete(u); siguiente(); };
      u.onend = fin;
      u.onerror = fin;
      speechSynthesis.speak(u);
    };
    siguiente();
  }));
}

function sonarArchivo(url) {
  return new Promise((resolve) => {
    const a = new Audio(url);
    a.onended = resolve;
    a.onerror = resolve;
    a.play().catch(resolve);
  });
}

let cancelado = false;

// lineas: [{ g: 'f'|'m', t: 'texto', audio?: 'url' }]
export async function reproducir(lineas, { velocidad = 0.95, alLinea } = {}) {
  cancelado = false;
  for (let i = 0; i < lineas.length; i++) {
    if (cancelado) break;
    const l = lineas[i];
    alLinea && alLinea(i);
    if (l.audio) await sonarArchivo(l.audio);
    else await decir(l.t, l.g === 'm' ? 'm' : 'f', velocidad);
    if (i < lineas.length - 1) await new Promise((r) => setTimeout(r, 380));
  }
  alLinea && alLinea(-1);
}

export function detenerVoz() {
  cancelado = true;
  try { speechSynthesis.cancel(); } catch { /* nada */ }
}

// ---------- Micrófono ----------

let flujo = null;

export const hayMicrofono = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);

export async function pedirMicrofono() {
  if (flujo && flujo.active) return flujo;
  flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
  return flujo;
}

export function soltarMicrofono() {
  if (flujo) flujo.getTracks().forEach((t) => t.stop());
  flujo = null;
}

export function grabar(stream) {
  const trozosAudio = [];
  const rec = new MediaRecorder(stream);
  const inicio = performance.now();
  rec.ondataavailable = (e) => e.data && e.data.size && trozosAudio.push(e.data);
  const promesa = new Promise((resolve) => {
    rec.onstop = () => {
      const blob = new Blob(trozosAudio, { type: rec.mimeType || 'audio/webm' });
      resolve({ blob, url: URL.createObjectURL(blob), duracion: (performance.now() - inicio) / 1000 });
    };
  });
  rec.start();
  return { detener: () => rec.state !== 'inactive' && rec.stop(), promesa };
}

// ---------- Transcripción (Chrome, Edge, Safari) ----------

const Reconocedor = window.SpeechRecognition || window.webkitSpeechRecognition;
export const hayTranscripcion = () => !!Reconocedor;

export function transcribir() {
  if (!Reconocedor) return { detener() {}, promesa: Promise.resolve({ texto: '', error: 'sin-soporte' }) };
  const r = new Reconocedor();
  r.lang = 'en-US';
  r.continuous = true;
  r.interimResults = true;
  let finales = '';
  let parcial = '';
  let error = null;
  let terminado = false;
  const promesa = new Promise((resolve) => {
    r.onresult = (e) => {
      parcial = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finales += e.results[i][0].transcript + ' ';
        else parcial += e.results[i][0].transcript + ' ';
      }
    };
    r.onerror = (e) => { error = e.error; };
    r.onend = () => {
      if (terminado) return;
      terminado = true;
      resolve({ texto: (finales + parcial).trim(), error });
    };
    try { r.start(); } catch {
      terminado = true;
      resolve({ texto: '', error: 'inicio' });
    }
  });
  return {
    detener: () => { try { r.stop(); } catch { /* ya terminó */ } },
    promesa,
  };
}
