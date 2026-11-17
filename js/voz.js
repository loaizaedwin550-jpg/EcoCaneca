// voz.js — Lee el resultado en voz alta con la voz en español del dispositivo.
// Sirve para personas con baja visión y para no tener que mirar la pantalla al botar algo.

import { ajuste } from './memoria.js';

const PREFERIDAS = ['es-CO', 'es-419', 'es-US', 'es-MX', 'es-ES', 'es'];
let voz = null;

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

/** Dice el texto. Con `forzar` habla aunque la voz automática esté apagada (botón "Escuchar"). */
export function hablar(texto, forzar = false) {
  if (!vozDisponible() || (!forzar && !ajuste('voz'))) return;
  try {
    speechSynthesis.cancel();
    const frase = new SpeechSynthesisUtterance(texto);
    if (voz) frase.voice = voz;
    frase.lang = voz ? voz.lang : 'es-ES';
    frase.rate = 1.05;
    speechSynthesis.speak(frase);
  } catch (error) {
    /* algunos navegadores bloquean la voz hasta que la persona toca la pantalla */
  }
}

export function callar() {
  if (vozDisponible()) speechSynthesis.cancel();
}
