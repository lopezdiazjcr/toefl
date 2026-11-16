// El progreso vive en el navegador de cada estudiante (localStorage).
// Todo acceso va en try/catch: en modo incógnito o con el almacenamiento
// bloqueado la plataforma tiene que seguir funcionando, solo que sin memoria.

const CLAVE = 'toefl-il-v1';
const MAX_INTENTOS = 1500;
const MAX_ESCRITOS = 120;

function vacio() {
  return {
    version: 1,
    perfil: { fechaExamen: '', bandaMeta: 4.5, diasPorSemana: 3, inicio: '' },
    diagnostico: null,          // { fecha, bandas:{lectura,escucha,escritura,habla}, global }
    sesiones: {},               // n -> { fecha, resumen }
    intentos: [],               // { f, tipo, id, c, t, modo }
    vistos: {},                 // itemId -> timestamp
    errores: [],                // { f, tipo, id, nota }
    escritos: [],               // { f, tipo, id, texto, palabras, auto }
    simulacros: [],             // { f, bandas, global }
  };
}

let memoria = null;
let persistente = true;

export function cargar() {
  if (memoria) return memoria;
  try {
    const crudo = localStorage.getItem(CLAVE);
    memoria = crudo ? { ...vacio(), ...JSON.parse(crudo) } : vacio();
  } catch {
    persistente = false;
    memoria = vacio();
  }
  return memoria;
}

export function guardar() {
  if (!memoria) return;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(memoria));
  } catch {
    persistente = false;
  }
}

export const hayMemoria = () => persistente;

export function reiniciar() {
  memoria = vacio();
  try { localStorage.removeItem(CLAVE); } catch { /* sin almacenamiento */ }
}

export function perfil() { return cargar().perfil; }

export function actualizarPerfil(cambios) {
  Object.assign(cargar().perfil, cambios);
  guardar();
}

export function marcarVisto(id) {
  cargar().vistos[id] = Date.now();
}

export function registrarIntento({ tipo, id, correctas, total, modo }) {
  const e = cargar();
  e.intentos.push({ f: Date.now(), tipo, id, c: correctas, t: total, modo });
  if (e.intentos.length > MAX_INTENTOS) e.intentos.splice(0, e.intentos.length - MAX_INTENTOS);
  marcarVisto(id);
}

export function registrarError(tipo, id, nota) {
  const e = cargar();
  e.errores.push({ f: Date.now(), tipo, id, nota });
  if (e.errores.length > 400) e.errores.splice(0, e.errores.length - 400);
}

export function registrarEscrito(reg) {
  const e = cargar();
  e.escritos.push({ f: Date.now(), ...reg });
  if (e.escritos.length > MAX_ESCRITOS) e.escritos.splice(0, e.escritos.length - MAX_ESCRITOS);
}

// sesiones[n] = { bloques: { i: { c, t } }, leccion: bool, completada: ISO | null }
export function progresoSesion(n) {
  const e = cargar();
  return (e.sesiones[n] ||= { bloques: {}, leccion: false, completada: null });
}

export function marcarBloque(n, i, c, t) {
  progresoSesion(n).bloques[i] = { c, t, f: Date.now() };
  guardar();
}

export function marcarLeccion(n) {
  progresoSesion(n).leccion = true;
  guardar();
}

export function completarSesion(n) {
  progresoSesion(n).completada = new Date().toISOString();
  guardar();
}

export function guardarDiagnostico(d) {
  cargar().diagnostico = { fecha: new Date().toISOString(), ...d };
  guardar();
}

export function guardarSimulacro(s) {
  cargar().simulacros.push({ f: new Date().toISOString(), ...s });
  guardar();
}

// Precisión por tipo de tarea sobre los últimos N intentos.
export function precisionPorTipo(ultimos = 40) {
  const por = {};
  for (const i of cargar().intentos) (por[i.tipo] ||= []).push(i);
  const res = {};
  for (const [tipo, lista] of Object.entries(por)) {
    const sel = lista.slice(-ultimos);
    const c = sel.reduce((s, x) => s + x.c, 0);
    const t = sel.reduce((s, x) => s + x.t, 0);
    res[tipo] = { intentos: lista.length, precision: t ? c / t : null };
  }
  return res;
}

export function exportar() {
  return JSON.stringify(cargar(), null, 2);
}
