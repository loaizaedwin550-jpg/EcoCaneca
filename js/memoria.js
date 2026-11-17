// memoria.js — Todo lo que la app recuerda en este dispositivo (nada se envía a internet).
//   · ajustes     → voz encendida/apagada, si la IA ya se descargó
//   · historial   → los últimos residuos escaneados y los totales por caneca
//   · ejemplos    → lo que la persona le enseñó a la app (vector + miniatura)
//   · reto        → mejor puntaje del juego

import { CONFIG } from './config.js';

const PREFIJO = 'ecocaneca.';
const MAX_HISTORIAL = 200;

function leer(clave, porDefecto) {
  try {
    const crudo = localStorage.getItem(PREFIJO + clave);
    return crudo === null ? porDefecto : JSON.parse(crudo);
  } catch (error) {
    return porDefecto;
  }
}

function escribir(clave, valor) {
  try {
    localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
    return true;
  } catch (error) {
    return false; // almacenamiento lleno o bloqueado (modo incógnito): la app sigue funcionando
  }
}

// ───────────── Ajustes ─────────────
//   voz           → leer el resultado en voz alta
//   iaDescargada  → la IA ya se descargó alguna vez (se carga sola al abrir)
//   gpu           → la persona permite usar la tarjeta gráfica
//   gpuFalla      → la tarjeta gráfica falló en este dispositivo: no se vuelve a intentar
//   ligero        → modelo comprimido (null = decide la app: encendido en iPhone/iPad)
//   ultimoError   → último problema registrado { t, texto }, se ve en Progreso → Acerca de
const ajustes = {
  voz: true,
  iaDescargada: false,
  gpu: true,
  gpuFalla: false,
  ligero: null,
  ultimoError: null,
  ...leer('ajustes', {}),
};

export function ajuste(nombre) {
  return ajustes[nombre];
}

export function cambiarAjuste(nombre, valor) {
  ajustes[nombre] = valor;
  escribir('ajustes', ajustes);
}

// ───────────── Historial ─────────────
let historial = leer('historial', []);
let totales = { blanca: 0, negra: 0, verde: 0, especial: 0, ...leer('totales', {}) };

export function registrarEscaneo(residuoId, caneca, origen) {
  historial.unshift({ t: Date.now(), r: residuoId, c: caneca, o: origen });
  if (historial.length > MAX_HISTORIAL) historial.length = MAX_HISTORIAL;
  totales[caneca] = (totales[caneca] || 0) + 1;
  escribir('historial', historial);
  escribir('totales', totales);
}

export function leerHistorial() {
  return historial;
}

export function leerTotales() {
  return { ...totales };
}

// ───────────── Ejemplos enseñados ─────────────
function aBase64(vector) {
  const bytes = new Uint8Array(vector.buffer, vector.byteOffset, vector.byteLength);
  let binario = '';
  for (let i = 0; i < bytes.length; i++) binario += String.fromCharCode(bytes[i]);
  return btoa(binario);
}

function deBase64(texto) {
  const binario = atob(texto);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return new Float32Array(bytes.buffer);
}

let ejemplos = leer('ejemplos', [])
  .map((e) => {
    try {
      return { id: e.id, residuo: e.residuo, mini: e.mini, t: e.t, vector: deBase64(e.v) };
    } catch (error) {
      return null;
    }
  })
  .filter(Boolean);

function guardarEjemplos() {
  return escribir(
    'ejemplos',
    ejemplos.map((e) => ({ id: e.id, residuo: e.residuo, mini: e.mini, t: e.t, v: aBase64(e.vector) })),
  );
}

export function leerEjemplos() {
  return ejemplos;
}

export function agregarEjemplo(residuoId, vector, miniatura) {
  ejemplos.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    residuo: residuoId,
    mini: miniatura || '',
    t: Date.now(),
    vector: Float32Array.from(vector),
  });
  if (ejemplos.length > CONFIG.aprendizaje.maximoEjemplos) ejemplos.length = CONFIG.aprendizaje.maximoEjemplos;
  if (!guardarEjemplos()) {
    // Sin espacio: se guardan sin miniaturas, que es lo que más pesa.
    for (const e of ejemplos) e.mini = '';
    guardarEjemplos();
  }
}

export function borrarEjemplo(id) {
  ejemplos = ejemplos.filter((e) => e.id !== id);
  guardarEjemplos();
}

// ───────────── Reto ─────────────
export function mejorPuntaje() {
  return leer('reto', { mejor: 0, partidas: 0 });
}

export function guardarPuntaje(aciertos) {
  const actual = mejorPuntaje();
  const nuevo = { mejor: Math.max(actual.mejor, aciertos), partidas: actual.partidas + 1 };
  escribir('reto', nuevo);
  return nuevo;
}

// ───────────── Borrar todo ─────────────
export function borrarTodo() {
  historial = [];
  totales = { blanca: 0, negra: 0, verde: 0, especial: 0 };
  ejemplos = [];
  for (const clave of ['historial', 'totales', 'ejemplos', 'reto']) {
    try {
      localStorage.removeItem(PREFIJO + clave);
    } catch (error) {
      /* nada */
    }
  }
}
