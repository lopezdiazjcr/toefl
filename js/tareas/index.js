// Registro de las 11 tareas del TOEFL iBT (formato vigente desde el 21-ene-2026).
// `segundos(item)` es el tiempo que se le da a cada pieza en modo cronometrado;
// sale de los tiempos oficiales por tarea (ver PLAN.md, sección 1).
import * as lectura from './lectura.js';
import * as escucha from './escucha.js';
import * as escritura from './escritura.js';
import * as habla from './habla.js';

export const SECCIONES = {
  lectura: { id: 'lectura', en: 'Reading', es: 'Lectura', clase: 'sec-lectura' },
  escucha: { id: 'escucha', en: 'Listening', es: 'Comprensión auditiva', clase: 'sec-escucha' },
  escritura: { id: 'escritura', en: 'Writing', es: 'Escritura', clase: 'sec-escritura' },
  habla: { id: 'habla', en: 'Speaking', es: 'Expresión oral', clase: 'sec-habla' },
};

export const ORDEN_SECCIONES = ['lectura', 'escucha', 'escritura', 'habla'];

// La voz del navegador habla a ~140 palabras por minuto; el reloj no debe
// comerse el tiempo del audio. +8 s por la línea del narrador.
function duracionAudio(it) {
  const palabras = (it.guion || []).map((l) => l.t).join(' ').split(/\s+/).length;
  return Math.round(palabras / 2.2) + 8;
}

export const TAREAS = {
  cw: {
    id: 'cw', seccion: 'lectura', oficial: 'Complete the Words', es: 'Completar palabras',
    que: 'Un párrafo académico de 70–100 palabras con 10 palabras a medias. Usted escribe las letras que faltan.',
    mide: 'Vocabulario, ortografía y gramática a nivel de palabra.',
    render: lectura.cw, segundos: () => 180,
  },
  dl: {
    id: 'dl', seccion: 'lectura', oficial: 'Read in Daily Life', es: 'Lectura de la vida diaria',
    que: 'Textos del día a día de 15–150 palabras (correos, avisos, menús, mensajes) con 2 o 3 preguntas.',
    mide: 'Entender información práctica, propósito e inferencias simples.',
    render: lectura.dl, segundos: (it) => 40 + 45 * it.preguntas.length,
  },
  ap: {
    id: 'ap', seccion: 'lectura', oficial: 'Read an Academic Passage', es: 'Texto académico',
    que: 'Un texto académico de unas 200 palabras con 5 preguntas: detalle, vocabulario, inferencia, relación entre ideas y propósito.',
    mide: 'Comprensión de textos universitarios.',
    render: lectura.ap, segundos: (it) => 60 + 60 * it.preguntas.length,
  },
  lr: {
    id: 'lr', seccion: 'escucha', oficial: 'Listen and Choose a Response', es: 'Escuchar y elegir la respuesta',
    que: 'Escucha una frase corta (no aparece escrita) y elige la mejor de 4 respuestas escritas.',
    mide: 'Reacción rápida a la lengua hablada cotidiana.',
    render: escucha.lr, segundos: () => 35,
  },
  lc: {
    id: 'lc', seccion: 'escucha', oficial: 'Listen to a Conversation', es: 'Conversación',
    que: 'Una conversación de 8–10 turnos entre dos personas, con 2 preguntas.',
    mide: 'Idea principal, detalles, propósito y actitud de quien habla.',
    render: escucha.lc, segundos: (it) => duracionAudio(it) + 30 * it.preguntas.length,
  },
  la: {
    id: 'la', seccion: 'escucha', oficial: 'Listen to an Announcement', es: 'Anuncio',
    que: 'Un anuncio de 40–85 palabras (campus o lugar público), con 2 preguntas.',
    mide: 'Información clave e intención del anuncio.',
    render: escucha.la, segundos: (it) => duracionAudio(it) + 30 * it.preguntas.length,
  },
  lt: {
    id: 'lt', seccion: 'escucha', oficial: 'Listen to an Academic Talk', es: 'Charla académica',
    que: 'Parte de una clase o charla de 100–250 palabras, con 4 preguntas.',
    mide: 'Ideas principales, ejemplos y organización de una explicación académica.',
    render: escucha.lt, segundos: (it) => duracionAudio(it) + 30 * it.preguntas.length,
  },
  bs: {
    id: 'bs', seccion: 'escritura', oficial: 'Build a Sentence', es: 'Armar la oración',
    que: 'Ordena palabras y frases para armar la respuesta en un diálogo. 10 oraciones, todo o nada.',
    mide: 'Orden de palabras y gramática en contexto.',
    render: escritura.bs, segundos: () => 40,
  },
  we: {
    id: 'we', seccion: 'escritura', oficial: 'Write an Email', es: 'Escribir un email',
    que: 'Escribe un correo para resolver una situación, cubriendo tres puntos. 7 minutos.',
    mide: 'Escritura práctica, tono y organización.',
    render: escritura.we, segundos: () => 7 * 60,
  },
  ad: {
    id: 'ad', seccion: 'escritura', oficial: 'Write for an Academic Discussion', es: 'Discusión académica',
    que: 'Responde en un foro de clase a la pregunta del profesor y a dos compañeros. 10 minutos.',
    mide: 'Argumentar con claridad y aportar una idea propia.',
    render: escritura.ad, segundos: () => 10 * 60,
  },
  rp: {
    id: 'rp', seccion: 'habla', oficial: 'Listen and Repeat', es: 'Escuchar y repetir',
    que: 'Escucha 7 frases que van creciendo y repite cada una exactamente; 8–12 segundos por frase.',
    mide: 'Pronunciación, ritmo y memoria de trabajo en inglés.',
    render: habla.rp, segundos: (it) => 20 * it.frases.length + 15,
  },
  iv: {
    id: 'iv', seccion: 'habla', oficial: 'Take an Interview', es: 'Entrevista',
    que: 'Un entrevistador hace 4 preguntas; responde cada una en 45 segundos, sin tiempo de preparación.',
    mide: 'Fluidez, desarrollo de ideas y precisión al hablar.',
    render: habla.iv, segundos: (it) => 60 * it.preguntas.length + 20,
  },
};

export const TIPOS_POR_SECCION = ORDEN_SECCIONES.reduce((acc, s) => {
  acc[s] = Object.values(TAREAS).filter((t) => t.seccion === s).map((t) => t.id);
  return acc;
}, {});

export { detenerVoz } from '../audio.js';
