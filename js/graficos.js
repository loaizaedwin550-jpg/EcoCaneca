// graficos.js — Dibujos e iconos de la app, hechos en SVG (no dependen de imágenes externas).

const trazo = (contenido) =>
  `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${contenido}</svg>`;

export const ICONOS = {
  escanear: trazo('<path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3.2"/>'),
  buscar: trazo('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.6-3.6"/>'),
  canecas: trazo('<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M10 11v6M14 11v6"/>'),
  reto: trazo('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'),
  progreso: trazo('<path d="M5 20V11M12 20V4M19 20v-7"/>'),
  camara: trazo('<path d="M4 8a2 2 0 0 1 2-2h1.6l1.2-1.8A1 1 0 0 1 9.6 4h4.8a1 1 0 0 1 .8.4L16.4 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.4"/>'),
  imagen: trazo('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.6"/><path d="M20.5 15.5l-4.6-4.6L6 19.5"/>'),
  cerrar: trazo('<path d="M6 6l12 12M18 6L6 18"/>'),
  voltear: trazo('<path d="M4 9a8 8 0 0 1 14-3.5L20 8M20 4v4h-4M20 15a8 8 0 0 1-14 3.5L4 16M4 20v-4h4"/>'),
  linterna: trazo('<path d="M13 3L5 13.5h6L10 21l9-11.5h-6z"/>'),
  sonido: trazo('<path d="M4 10v4h3.5L12 18V6L7.5 10zM15.5 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>'),
  silencio: trazo('<path d="M4 10v4h3.5L12 18V6L7.5 10zM16 9.5l5 5M21 9.5l-5 5"/>'),
  flecha: trazo('<path d="M9 6l6 6-6 6"/>'),
  atras: trazo('<path d="M15 6l-6 6 6 6"/>'),
  listo: trazo('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  borrar: trazo('<path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13"/>'),
  instalar: trazo('<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 20h14"/>'),
  enseñar: trazo('<path d="M12 4l9 4.5-9 4.5-9-4.5zM7 11v4.5c1.4 1.3 3.1 2 5 2s3.6-.7 5-2V11"/>'),
};

const SIMBOLOS = {
  // Reciclable: dos flechas en ciclo.
  blanca:
    '<g fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M24.5 46a7.6 7.6 0 0 1 13-5.4"/><path d="M39.5 46a7.6 7.6 0 0 1-13 5.4"/><path d="M38.4 35.6l.3 5.2-5.1-.2"/><path d="M25.6 56.4l-.3-5.2 5.1.2"/></g>',
  // No aprovechable: solo las ranuras de la caneca.
  negra: '<g fill="none" stroke-width="2.6" stroke-linecap="round"><path d="M24 33v25M32 33v25M40 33v25"/></g>',
  // Orgánico: una hoja.
  verde:
    '<path class="relleno" d="M23 54.5c-.6-10.5 6-17.8 18.5-18.5.8 11.8-6 19.2-18.5 18.5z"/><path class="vena" fill="none" stroke-width="2" stroke-linecap="round" d="M24 53.5l10.5-10.5"/>',
  // Peligroso / posconsumo: signo de atención.
  especial:
    '<g fill="none" stroke-width="4.4" stroke-linecap="round"><path d="M32 33.5v13"/></g><circle class="relleno" cx="32" cy="55" r="2.8"/>',
};

/** Dibujo de una caneca del color indicado ('blanca' | 'negra' | 'verde' | 'especial'). */
export function dibujoCaneca(caneca, ancho = 64) {
  const alto = Math.round((ancho * 72) / 64);
  return (
    `<svg class="caneca caneca-${caneca}" viewBox="0 0 64 72" width="${ancho}" height="${alto}" aria-hidden="true">` +
    '<rect class="asa" x="25" y="2.5" width="14" height="10" rx="4"/>' +
    '<path class="cuerpo" d="M10.5 21h43l-4 41.6a6.5 6.5 0 0 1-6.5 5.9H21a6.5 6.5 0 0 1-6.5-5.9z"/>' +
    '<rect class="tapa" x="5" y="9.5" width="54" height="11.5" rx="5.5"/>' +
    `<g class="simbolo">${SIMBOLOS[caneca] || ''}</g>` +
    '</svg>'
  );
}

/** Logo de EcoCaneca: una caneca dentro de un marco de escaneo. */
export function logo(tamano = 32) {
  return (
    `<svg viewBox="0 0 64 64" width="${tamano}" height="${tamano}" aria-hidden="true">` +
    '<rect width="64" height="64" rx="15" fill="#0b7a4b"/>' +
    '<g fill="none" stroke="#b7f0c8" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M11 21v-5a5 5 0 0 1 5-5h5M43 11h5a5 5 0 0 1 5 5v5M53 43v5a5 5 0 0 1-5 5h-5M21 53h-5a5 5 0 0 1-5-5v-5"/></g>' +
    '<rect x="21" y="20.5" width="22" height="5.5" rx="2.75" fill="#fff"/>' +
    '<rect x="28.5" y="17" width="7" height="5" rx="2" fill="#fff"/>' +
    '<path d="M23.5 28h17l-1.6 14.6a3 3 0 0 1-3 2.7h-7.8a3 3 0 0 1-3-2.7z" fill="#fff"/>' +
    '</svg>'
  );
}
