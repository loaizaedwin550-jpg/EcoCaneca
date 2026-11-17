// config.js — Ajustes generales de EcoCaneca.
// Si quieres cambiar el modelo de IA o los umbrales de confianza, este es el único archivo que debes tocar.

export const CONFIG = {
  nombre: 'EcoCaneca',
  version: '1.0.0',

  // --- Inteligencia artificial ---
  // MobileCLIP-S0 (Apple, CVPR 2024): modelo de visión-lenguaje hecho para celulares.
  // Licencia del modelo: apple-amlr (uso académico y de investigación).
  modelo: 'Xenova/mobileclip_s0',
  // Transformers.js: la librería que ejecuta el modelo dentro del navegador.
  libreria: 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2',
  // Motores que se prueban, en orden. El primero que funcione y pase la autoverificación se queda.
  //   webgpu = tarjeta gráfica (muy rápido, versión de 23 MB)
  //   wasm   = procesador (funciona en cualquier dispositivo, versión de 45 MB)
  motores: [
    { dispositivo: 'webgpu', precision: 'fp16' },
    { dispositivo: 'wasm', precision: 'fp32' },
  ],
  // Modo ligero: versión de media precisión del modelo (22 MB) en el procesador, sin tarjeta gráfica.
  // Es el modo por defecto en iPhone y iPad, donde Safari cierra las páginas que fallan o gastan mucho.
  // Medido el 17-nov-2026: da el mismo resultado que la versión completa (parecido 1,00).
  // OJO: las versiones de 8 bits (q8, uint8, int8) de este modelo están dañadas (parecido 0,2–0,4).
  motorLigero: { dispositivo: 'wasm', precision: 'fp16' },
  // Qué tanto debe parecerse el resultado de la imagen de prueba al valor de referencia (1 = idéntico).
  parecidoMinimoPrueba: 0.98,
  // Lado (en píxeles) de la imagen cuadrada que recibe el modelo.
  lado: 256,
  // Qué tanto "exagera" el modelo las diferencias entre frases (valor estándar de CLIP).
  escala: 100,

  // --- Decisión ---
  // Probabilidad mínima para afirmar la caneca con seguridad.
  umbralSeguro: 0.6,
  // Por debajo de este valor la app prefiere preguntar antes que equivocarse.
  umbralDudoso: 0.4,

  // --- Aprendizaje con ejemplos del usuario ---
  // refuerzo = fuerza * exp(-nitidez * (1 - parecido))
  aprendizaje: { fuerza: 25, nitidez: 12, maximoEjemplos: 150 },

  // --- Cámara ---
  // Pausa entre un análisis y el siguiente cuando la cámara está en vivo (milisegundos).
  pausaEntreAnalisis: 150,
  // Tiempo que debe sostenerse la misma respuesta segura para darla por confirmada (milisegundos).
  tiempoParaConfirmar: 700,
};
