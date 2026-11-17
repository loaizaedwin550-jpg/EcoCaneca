// voz.js — Lee el resultado en voz alta con la voz en español del dispositivo.
// Sirve para personas con baja visión y para no tener que mirar la pantalla al botar algo.
//
// Detalles de Safari (iPhone/iPad):
//   · No deja hablar hasta que la página "estrena" la voz durante un toque en la pantalla.
//     Por eso desbloquearVoz() se llama en el primer toque (ver app.js).
//   · Si se cancela una frase y se dice otra de inmediato, a veces no suena: se espera un instante.
//   · Si la frase no queda guardada en una variable, Safari puede borrarla antes de decirla.

import { ajuste } from './memoria.js';

const PREFERIDAS = ['es-CO', 'es-419', 'es-US', 'es-MX', 'es-ES', 'es'];
let voz = null;
let desbloqueada = false;
let fraseActual = null; // referencia para que el navegador no la descarte antes de decirla

function elegirVoz() {
  if (!('speechSynthesis' in window)) return;
  const voces = speechSynthesis.getVoices();
  for (const idioma of PREFERIDAS) {
    const encontrada = voces.find((v) => v.lang && v.lang.replace('_', '-').toLowerCase().startsWith(idioma.toLowerCase()));
    if (encontrada) {
      voz = encontrada;
      return;
    }
  }
}

if ('speechSynthesis' in window) {
  elegirVoz();
  speechSynthesis.addEventListener?.('voiceschanged', elegirVoz);
}

export function vozDisponible() {
  return 'speechSynthesis' in window;
}

/** Se llama dentro de un toque en la pantalla: "estrena" la voz con una frase en silencio. */
export function desbloquearVoz() {
  if (desbloqueada || !vozDisponible()) return;
  desbloqueada = true;
  try {
    const silencio = new SpeechSynthesisUtterance(' ');
    silencio.volume = 0;
    fraseActual = silencio;
    speechSynthesis.speak(silencio);
    if (!voz) elegirVoz();
  } catch (error) {
    desbloqueada = false;
  }
}

function decir(texto) {
  const frase = new SpeechSynthesisUtterance(texto);
  if (!voz) elegirVoz();
  if (voz) frase.voice = voz;
  frase.lang = voz ? voz.lang : 'es-ES';
  frase.rate = 1.05;
  frase.volume = 1;
  fraseActual = frase;
  if (speechSynthesis.paused) speechSynthesis.resume();
  speechSynthesis.speak(frase);
}

/** Dice el texto. Con `forzar` habla aunque la voz automática esté apagada (botón "Escuchar"). */
export function hablar(texto, forzar = false) {
  if (!vozDisponible() || (!forzar && !ajuste('voz'))) return;
  try {
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
      setTimeout(() => decir(texto), 120);
    } else {
      decir(texto);
    }
  } catch (error) {
    /* algunos navegadores bloquean la voz hasta que la persona toca la pantalla */
  }
}

export function callar() {
  if (vozDisponible() && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
}
