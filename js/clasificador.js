// clasificador.js — El "cerebro" de EcoCaneca.
//
// Cómo decide la app en qué caneca va algo:
//   1. La foto (o el cuadro de la cámara) pasa por el modelo MobileCLIP y sale convertida en un
//      vector de 512 números que resume "lo que se ve".
//   2. Ese vector se compara con los vectores de las frases del catálogo ("a banana peel",
//      "an aluminum soda can"…), que ya vienen calculados en datos/vectores-texto.json.
//   3. Las frases más parecidas ganan probabilidad; se suman por residuo y luego por caneca.
//   4. Si la persona le enseñó ejemplos a la app, los que se parecen a la foto dan un refuerzo extra.
// Todo ocurre dentro del navegador: la foto nunca sale del dispositivo.

import { CONFIG } from './config.js';
import { RESIDUOS } from './residuos.js';

const CANECAS = ['blanca', 'negra', 'verde', 'especial'];
const indiceResiduo = new Map(RESIDUOS.map((r, i) => [r.id, i]));

let libreria = null;
let procesador = null;
let modelo = null;
let motor = null; // { dispositivo: 'webgpu' | 'wasm', precision: 'fp16' | 'fp32' }
let vectores = null;
let cargaModelo = null;
let cargaVectores = null;

function deBase64(texto) {
  const binario = atob(texto);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

/** Lee los vectores de texto precalculados (una sola vez). */
export function cargarVectores() {
  if (!cargaVectores) {
    cargaVectores = (async () => {
      const url = new URL('../datos/vectores-texto.json', import.meta.url);
      const respuesta = await fetch(url);
      if (!respuesta.ok) throw new Error('No se pudo leer datos/vectores-texto.json');
      const paquete = await respuesta.json();
      const aDecimales = (texto) => {
        const enteros = new Int16Array(deBase64(texto).buffer);
        const datos = new Float32Array(enteros.length);
        for (let i = 0; i < enteros.length; i++) datos[i] = enteros[i] / paquete.escala;
        return datos;
      };
      // A qué residuo pertenece cada frase (-1 = "no es un residuo").
      const residuoDeClase = new Int16Array(paquete.clases.length);
      paquete.clases.forEach((clase, i) => {
        residuoDeClase[i] = indiceResiduo.has(clase.r) ? indiceResiduo.get(clase.r) : -1;
      });
      vectores = {
        dim: paquete.dim,
        total: paquete.clases.length,
        datos: aDecimales(paquete.datos),
        residuoDeClase,
        // Vector que debe dar el modelo para la imagen de prueba (sirve para la autoverificación).
        prueba: paquete.prueba ? aDecimales(paquete.prueba) : null,
      };
      return vectores;
    })();
  }
  return cargaVectores;
}

/**
 * Imagen artificial, siempre idéntica, con la que se comprueba que el modelo calcula bien
 * en este dispositivo. Devuelve los píxeles en formato RGBA.
 */
export function imagenDePrueba() {
  const lado = CONFIG.lado;
  const datos = new Uint8ClampedArray(lado * lado * 4);
  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      const i = (y * lado + x) * 4;
      datos[i] = (x * 3 + y) % 256;
      datos[i + 1] = (y * 5 + x * 2) % 256;
      datos[i + 2] = ((x ^ y) * 7) % 256;
      datos[i + 3] = 255;
    }
  }
  return { data: datos, width: lado, height: lado };
}

function conLimite(promesa, ms) {
  return Promise.race([
    promesa,
    new Promise((_, falla) => setTimeout(() => falla(new Error('tardó demasiado')), ms)),
  ]);
}

function crearSesion(candidato, alAvanzar) {
  const archivos = {};
  return libreria.CLIPVisionModelWithProjection.from_pretrained(CONFIG.modelo, {
    device: candidato.dispositivo,
    dtype: candidato.precision,
    progress_callback: (p) => {
      if (p.status !== 'progress' || !p.total) return;
      archivos[p.file] = [p.loaded, p.total];
      let cargado = 0;
      let total = 0;
      for (const [a, b] of Object.values(archivos)) {
        cargado += a;
        total += b;
      }
      alAvanzar({ fraccion: 0.03 + 0.92 * (cargado / total), cargado, total, etapa: 'modelo' });
    },
  });
}

/** Calcula el vector de la imagen de prueba y lo compara con el que debería dar. */
async function autoverificar(candidato) {
  const vector = await enTurno(() => calcularVector(imagenDePrueba()));
  if (!vectores.prueba) return true; // archivo de vectores antiguo: no hay con qué comparar
  const minimo = candidato.minimo ?? CONFIG.parecidoMinimoPrueba;
  return parecido(vector, vectores.prueba) >= minimo;
}

/** Libera el modelo actual (por ejemplo, para cambiar al modo ligero sin recargar la página). */
export async function descartarModelo() {
  const viejo = modelo;
  modelo = null;
  motor = null;
  cargaModelo = null;
  try {
    await turno; // espera a que termine el análisis que estuviera en curso
  } catch (ignorado) {
    /* nada */
  }
  try {
    if (viejo && viejo.dispose) await viejo.dispose();
  } catch (ignorado) {
    /* nada */
  }
}

/**
 * Descarga y prepara el modelo de visión. Se puede llamar muchas veces: solo carga una.
 *
 * Prueba los motores de CONFIG.motores en orden. Primero la tarjeta gráfica (WebGPU), que es
 * mucho más rápida; si el dispositivo no la tiene, falla o calcula mal, usa el procesador (WASM).
 *   alAvanzar({ fraccion, cargado, total, etapa }) → se llama mientras descarga
 *   opciones.gpu = false                           → salta la tarjeta gráfica
 *   opciones.ligero = true                         → usa solo el modelo comprimido (CONFIG.motorLigero)
 */
export function prepararModelo(alAvanzar = () => {}, opciones = {}) {
  if (!cargaModelo) {
    cargaModelo = (async () => {
      alAvanzar({ fraccion: 0, etapa: 'libreria' });
      await cargarVectores();
      libreria = await import(CONFIG.libreria);
      alAvanzar({ fraccion: 0.03, etapa: 'modelo' });
      procesador = await libreria.AutoProcessor.from_pretrained(CONFIG.modelo);

      const conGPU = opciones.gpu !== false && 'gpu' in navigator;
      const candidatos = opciones.ligero
        ? [CONFIG.motorLigero]
        : CONFIG.motores.filter((m) => m.dispositivo !== 'webgpu' || conGPU);
      let ultimoError = null;
      for (const candidato of candidatos) {
        try {
          if (candidato.dispositivo === 'webgpu' && !(await navigator.gpu.requestAdapter())) {
            throw new Error('este dispositivo no ofrece WebGPU');
          }
          modelo = await crearSesion(candidato, alAvanzar);
          alAvanzar({ fraccion: 0.96, etapa: 'calentando' });
          // La primera pasada también deja todo compilado para que el primer escaneo real sea rápido.
          const correcto = await conLimite(autoverificar(candidato), candidato.dispositivo === 'webgpu' ? 60000 : 180000);
          if (!correcto) throw new Error('la autoverificación no coincidió');
          motor = candidato;
          break;
        } catch (error) {
          console.warn(`Motor ${candidato.dispositivo} descartado:`, error);
          ultimoError = error;
          try {
            if (modelo && modelo.dispose) await modelo.dispose();
          } catch (ignorado) {
            /* nada */
          }
          modelo = null;
        }
      }
      if (!modelo) throw ultimoError || new Error('No se pudo iniciar la IA');
      alAvanzar({ fraccion: 1, etapa: 'listo' });
      return motor;
    })().catch((error) => {
      cargaModelo = null; // permite reintentar si falló la descarga
      throw error;
    });
  }
  return cargaModelo;
}

export function modeloListo() {
  return Boolean(modelo && procesador && vectores && motor);
}

/** Motor en uso: { dispositivo: 'webgpu' | 'wasm', precision }. Es null mientras no haya cargado. */
export function motorActual() {
  return motor;
}

// El modelo atiende una imagen a la vez: si llegan dos, la segunda espera su turno.
let turno = Promise.resolve();
function enTurno(tarea) {
  const resultado = turno.then(tarea);
  turno = resultado.catch(() => {});
  return resultado;
}

/** Convierte un lienzo cuadrado en el vector (normalizado) que describe la imagen. */
export function vectorDeImagen(lienzo) {
  // Los píxeles se leen de inmediato, porque el lienzo puede cambiar mientras se espera el turno.
  const contexto = lienzo.getContext('2d', { willReadFrequently: true });
  const pixeles = contexto.getImageData(0, 0, lienzo.width, lienzo.height);
  return enTurno(() => calcularVector(pixeles));
}

async function calcularVector(pixeles) {
  const imagen = new libreria.RawImage(pixeles.data, pixeles.width, pixeles.height, 4).rgb();
  const entradas = await procesador(imagen);
  const salida = await modelo(entradas);
  const crudo = salida.image_embeds.data;
  const vector = new Float32Array(crudo.length);
  let norma = 0;
  for (let i = 0; i < crudo.length; i++) norma += crudo[i] * crudo[i];
  norma = Math.sqrt(norma) || 1;
  for (let i = 0; i < crudo.length; i++) vector[i] = crudo[i] / norma;
  return vector;
}

export function parecido(a, b) {
  let suma = 0;
  for (let i = 0; i < a.length; i++) suma += a[i] * b[i];
  return suma;
}

/**
 * Calcula la probabilidad de cada residuo para un vector de imagen.
 * `ejemplos` = lo que la persona le ha enseñado: [{ residuo: 'id', vector: Float32Array }].
 * `aprendizaje` = { fuerza, nitidez } del refuerzo (por defecto, los de config.js).
 */
export function puntuar(vector, ejemplos = [], aprendizaje = CONFIG.aprendizaje) {
  const { dim, total, datos, residuoDeClase } = vectores;
  const logits = new Float32Array(total);
  for (let c = 0; c < total; c++) {
    let suma = 0;
    const base = c * dim;
    for (let d = 0; d < dim; d++) suma += vector[d] * datos[base + d];
    logits[c] = CONFIG.escala * suma;
  }

  // Refuerzo por ejemplos enseñados: entre más se parezca la foto al ejemplo, más pesa.
  if (ejemplos.length) {
    const refuerzo = new Float32Array(RESIDUOS.length);
    const { fuerza, nitidez } = aprendizaje;
    for (const ejemplo of ejemplos) {
      const r = indiceResiduo.get(ejemplo.residuo);
      if (r === undefined) continue;
      const valor = fuerza * Math.exp(-nitidez * (1 - parecido(vector, ejemplo.vector)));
      if (valor > refuerzo[r]) refuerzo[r] = valor;
    }
    for (let c = 0; c < total; c++) {
      const r = residuoDeClase[c];
      if (r >= 0) logits[c] += refuerzo[r];
    }
  }

  // Softmax: convierte los puntajes en probabilidades que suman 1.
  let maximo = -Infinity;
  for (let c = 0; c < total; c++) if (logits[c] > maximo) maximo = logits[c];
  let suma = 0;
  for (let c = 0; c < total; c++) {
    logits[c] = Math.exp(logits[c] - maximo);
    suma += logits[c];
  }
  const porResiduo = new Float32Array(RESIDUOS.length);
  let nada = 0;
  for (let c = 0; c < total; c++) {
    const p = logits[c] / suma;
    const r = residuoDeClase[c];
    if (r >= 0) porResiduo[r] += p;
    else nada += p;
  }
  return { porResiduo, nada };
}

/**
 * Convierte las probabilidades por residuo en una respuesta para la persona.
 * nivel: 'seguro' | 'probable' | 'dudoso' | 'nada'
 */
export function resumir({ porResiduo, nada }) {
  const canecas = { blanca: 0, negra: 0, verde: 0, especial: 0 };
  for (let r = 0; r < RESIDUOS.length; r++) canecas[RESIDUOS[r].caneca] += porResiduo[r];
  const masa = Math.max(1e-9, 1 - nada);

  let caneca = CANECAS[0];
  for (const c of CANECAS) if (canecas[c] > canecas[caneca]) caneca = c;
  const confianza = canecas[caneca] / masa;

  const orden = Array.from(porResiduo.keys()).sort((a, b) => porResiduo[b] - porResiduo[a]);
  const opciones = orden.slice(0, 5).map((r) => ({ residuo: RESIDUOS[r], p: porResiduo[r] / masa }));
  // El residuo que se muestra es el más probable DENTRO de la caneca elegida.
  const residuo = RESIDUOS[orden.find((r) => RESIDUOS[r].caneca === caneca)];

  let nivel = 'dudoso';
  if (nada >= 0.5) nivel = 'nada';
  else if (confianza >= CONFIG.umbralSeguro) nivel = 'seguro';
  else if (confianza >= CONFIG.umbralDudoso) nivel = 'probable';

  for (const c of CANECAS) canecas[c] /= masa;
  return { nivel, caneca, confianza, residuo, opciones, canecas, nada };
}

/**
 * Dibuja el cuadrado central de una imagen o video en un lienzo del tamaño que pide el modelo.
 * Es lo mismo que hace CLIP: recortar al centro y reducir.
 */
export function recortarAlCentro(fuente, lienzo) {
  const ancho = fuente.videoWidth || fuente.naturalWidth || fuente.width;
  const alto = fuente.videoHeight || fuente.naturalHeight || fuente.height;
  const lado = Math.min(ancho, alto);
  lienzo.width = lienzo.height = CONFIG.lado;
  const contexto = lienzo.getContext('2d', { willReadFrequently: true });
  contexto.imageSmoothingEnabled = true;
  contexto.imageSmoothingQuality = 'high';
  contexto.drawImage(fuente, (ancho - lado) / 2, (alto - lado) / 2, lado, lado, 0, 0, CONFIG.lado, CONFIG.lado);
  return lienzo;
}
