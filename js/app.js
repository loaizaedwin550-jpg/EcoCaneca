// app.js — Pantallas y comportamiento de EcoCaneca.
//
// La app tiene cinco secciones (las pestañas de abajo):
//   Escanear  → cámara en vivo o foto, y la respuesta de la IA
//   Buscar    → buscador de residuos por nombre
//   Canecas   → guía del código de colores
//   Reto      → juego de preguntas
//   Progreso  → historial, lo que la app aprendió y ajustes

import { CONFIG } from './config.js';
import { CANECAS, ORDEN_CANECAS, RESIDUOS, residuoPorId, buscarResiduos } from './residuos.js';
import * as IA from './clasificador.js';
import * as Memoria from './memoria.js';
import { Camara, MENSAJES_CAMARA } from './camara.js';
import { hablar, callar, vozDisponible } from './voz.js';
import { ICONOS, dibujoCaneca, logo } from './graficos.js';

// ───────────────────────── Utilidades ─────────────────────────
const $ = (selector, raiz = document) => raiz.querySelector(selector);
const $$ = (selector, raiz = document) => Array.from(raiz.querySelectorAll(selector));
const espera = (ms) => new Promise((ok) => setTimeout(ok, ms));
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const limpio = (texto) => String(texto ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
const porciento = (valor) => Math.round(valor * 100) + ' %';

let relojAviso = 0;
function avisar(texto, ms = 2800) {
  const caja = $('#aviso');
  caja.textContent = texto;
  caja.classList.add('visible');
  clearTimeout(relojAviso);
  relojAviso = setTimeout(() => caja.classList.remove('visible'), ms);
}

function hace(momento) {
  const minutos = Math.round((Date.now() - momento) / 60000);
  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias === 1) return 'ayer';
  if (dias < 30) return `hace ${dias} días`;
  return new Date(momento).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
}

function tituloCaneca(caneca) {
  return caneca === 'especial' ? 'Punto de recolección' : CANECAS[caneca].nombre;
}

function fraseDeVoz(residuo) {
  if (residuo.caneca === 'especial') return `${residuo.nombre}. No va en ninguna caneca: llévalo a un punto de recolección.`;
  return `${residuo.nombre}. ${CANECAS[residuo.caneca].frase}.`;
}

function filaResiduo(residuo) {
  return (
    `<button type="button" class="residuo-fila c-${residuo.caneca}" data-id="${residuo.id}">` +
    `<span class="residuo-emoji">${residuo.emoji}</span>` +
    `<span class="residuo-nombre">${limpio(residuo.nombre)}</span>` +
    `<span class="residuo-caneca"><span class="punto"></span>${CANECAS[residuo.caneca].corto}</span>` +
    '</button>'
  );
}

// ───────────────────────── Navegación ─────────────────────────
const VISTAS = ['escanear', 'buscar', 'canecas', 'reto', 'progreso'];
let vistaActual = 'escanear';

function irA(vista, opciones = {}) {
  if (!VISTAS.includes(vista)) return;
  if (vistaActual === 'escanear' && vista !== 'escanear' && sesion.modo === 'camara') cerrarVisor();
  vistaActual = vista;
  for (const nombre of VISTAS) {
    const seccion = $('#vista-' + nombre);
    seccion.hidden = nombre !== vista;
    seccion.classList.toggle('activa', nombre === vista);
  }
  for (const boton of $$('.pestana')) {
    const activa = boton.dataset.vista === vista;
    boton.classList.toggle('activa', activa);
    if (activa) boton.setAttribute('aria-current', 'page');
    else boton.removeAttribute('aria-current');
  }
  if (vista === 'buscar') pintarBuscar(opciones);
  if (vista === 'reto') pintarReto();
  if (vista === 'progreso') pintarProgreso();
  window.scrollTo(0, 0);
  if (location.hash !== '#' + vista) history.replaceState(null, '', '#' + vista);
}

// ───────────────────────── Inteligencia artificial: carga ─────────────────────────
const ia = { estado: 'pendiente', fraccion: 0, cargado: 0, total: 0 }; // pendiente | cargando | lista | error
let promesaIA = null;
let ultimoPorcentaje = -1;

function iniciarIA() {
  if (ia.estado === 'cargando' || ia.estado === 'lista') return promesaIA;
  ia.estado = 'cargando';
  ia.fraccion = 0;
  ia.etapa = '';
  ultimoPorcentaje = -1;
  pintarEstadoIA();
  const quiereGPU = gpuPermitida();
  promesaIA = IA.prepararModelo(
    (avance) => {
      Object.assign(ia, avance);
      const entero = Math.round(ia.fraccion * 100);
      if (entero !== ultimoPorcentaje) {
        ultimoPorcentaje = entero;
        pintarEstadoIA();
      }
    },
    { gpu: quiereGPU },
  ).then(
    (motor) => {
      ia.estado = 'lista';
      Memoria.cambiarAjuste('iaDescargada', true);
      // Si la tarjeta gráfica no funcionó aquí, no se vuelve a intentar (evita descargar dos modelos).
      if (quiereGPU && 'gpu' in navigator && motor.dispositivo !== 'webgpu') Memoria.cambiarAjuste('gpuFalla', true);
      pintarEstadoIA();
    },
    (error) => {
      console.error('No se pudo cargar la IA', error);
      ia.estado = 'error';
      pintarEstadoIA();
      throw error;
    },
  );
  return promesaIA;
}

/** ¿Se puede intentar usar la tarjeta gráfica? (la persona lo permite y no ha fallado antes) */
function gpuPermitida() {
  return Memoria.ajuste('gpu') !== false && !Memoria.ajuste('gpuFalla');
}

function textoDescarga() {
  if (ia.etapa === 'calentando') return 'Ajustando la IA a este dispositivo…';
  if (!ia.total) return 'Solo pasa la primera vez.';
  const mb = (bytes) => Math.round(bytes / 1048576);
  return `${mb(ia.cargado)} de ${mb(ia.total)} MB · solo pasa la primera vez`;
}

function pintarEstadoIA() {
  const caja = $('#esc-ia');
  if (caja) {
    caja.className = 'tarjeta ia-estado ia-' + ia.estado;
    if (ia.estado === 'pendiente') {
      caja.innerHTML =
        '<div class="ia-icono">⬇️</div><div class="ia-texto"><strong>La IA se descarga una sola vez</strong>' +
        '<span>Entre 30 y 50 MB. Después funciona sin internet.</span></div>' +
        '<button type="button" class="boton fantasma" data-accion="descargar-ia">Descargar</button>';
    } else if (ia.estado === 'cargando') {
      caja.innerHTML =
        `<div class="ia-icono">⏳</div><div class="ia-texto"><strong>Preparando la IA… ${porciento(ia.fraccion)}</strong>` +
        `<span>${textoDescarga()}</span><div class="barra-progreso"><i style="width:${ia.fraccion * 100}%"></i></div></div>`;
    } else if (ia.estado === 'lista') {
      const rapida = IA.motorActual() && IA.motorActual().dispositivo === 'webgpu';
      caja.innerHTML =
        `<div class="ia-icono">✅</div><div class="ia-texto"><strong>IA lista${rapida ? ' · modo rápido' : ''}</strong>` +
        '<span>Funciona en este dispositivo, también sin internet.</span></div>';
    } else {
      caja.innerHTML =
        '<div class="ia-icono">⚠️</div><div class="ia-texto"><strong>No pude cargar la IA</strong>' +
        '<span>Revisa tu conexión a internet e inténtalo de nuevo.</span></div>' +
        '<button type="button" class="boton fantasma" data-accion="descargar-ia">Reintentar</button>';
    }
  }
  // Si la cámara o una foto están esperando a la IA, se actualiza también ese mensaje.
  if (sesion.modo !== 'inicio' && !sesion.ultimo) {
    sesion.clave = '';
    pintarResultado(null, sesion.modo);
  }
}

// ───────────────────────── Escanear ─────────────────────────
const sesion = {
  modo: 'inicio', // inicio | camara | foto
  corriendo: false,
  pausada: false, // se pausa mientras hay una hoja abierta
  suave: null, // probabilidades suavizadas entre cuadros
  vectorPrevio: null,
  ultimo: null, // { vector, resultado }
  clave: '',
  estable: { id: '', cuenta: 0 },
  registrado: { id: '', t: 0 },
  cuadrosVacios: 0,
  lienzo: document.createElement('canvas'),
};
let camara = null;

function pintarEscanear() {
  $('#vista-escanear').innerHTML = `
    <div id="esc-inicio">
      <div class="portada">
        <div class="portada-canecas">${dibujoCaneca('blanca', 62)}${dibujoCaneca('negra', 62)}${dibujoCaneca('verde', 62)}</div>
        <h1>¿En qué caneca va?</h1>
        <p>Apunta la cámara a un residuo y te digo el color de la caneca correcta.</p>
      </div>
      <div id="esc-ia" class="tarjeta ia-estado"></div>
      <div class="acciones-inicio">
        <button id="btn-camara" type="button" class="boton primario grande">${ICONOS.camara} Abrir cámara</button>
        <button type="button" class="boton secundario grande" data-accion="subir-foto">${ICONOS.imagen} Subir una foto</button>
      </div>
      <p class="nota">Tus fotos no salen de este dispositivo: la IA trabaja aquí mismo.</p>
    </div>
    <div id="esc-visor" hidden>
      <div class="visor">
        <video id="video" playsinline muted autoplay></video>
        <img id="visor-foto" class="visor-foto" alt="Foto analizada" hidden>
        <div class="visor-marco"><i></i><i></i><i></i><i></i></div>
        <div id="visor-linea" class="visor-linea"></div>
        <div class="visor-barra">
          <span id="visor-chip" class="chip-vivo">En vivo</span>
          <span class="espacio"></span>
          <button id="btn-linterna" type="button" class="boton-visor" aria-label="Encender o apagar la linterna" hidden>${ICONOS.linterna}</button>
          <button id="btn-voltear" type="button" class="boton-visor" aria-label="Cambiar de cámara" hidden>${ICONOS.voltear}</button>
          <button id="btn-cerrar-visor" type="button" class="boton-visor" aria-label="Cerrar">${ICONOS.cerrar}</button>
        </div>
      </div>
      <div id="resultado" class="resultado" aria-live="polite"></div>
      <div class="visor-acciones">
        <button type="button" class="boton secundario" data-accion="subir-foto">${ICONOS.imagen} Subir foto</button>
        <button type="button" class="boton secundario" data-accion="buscar-mano">${ICONOS.buscar} Buscar a mano</button>
      </div>
    </div>
    <input id="entrada-foto" type="file" accept="image/*" hidden>`;
  camara = new Camara($('#video'));
}

function mostrarVisor(modo) {
  sesion.modo = modo;
  sesion.clave = '';
  sesion.suave = null;
  sesion.vectorPrevio = null;
  sesion.ultimo = null;
  sesion.estable = { id: '', cuenta: 0 };
  sesion.registrado = { id: '', t: 0 };
  sesion.cuadrosVacios = 0;
  $('#esc-inicio').hidden = modo !== 'inicio';
  $('#esc-visor').hidden = modo === 'inicio';
  $('#video').hidden = modo !== 'camara';
  $('#visor-foto').hidden = modo !== 'foto';
  $('#visor-linea').hidden = modo !== 'camara';
  $('#btn-linterna').hidden = true;
  $('#btn-voltear').hidden = true;
  const chip = $('#visor-chip');
  chip.textContent = modo === 'foto' ? 'Foto' : 'En vivo';
  chip.classList.toggle('quieto', modo === 'foto');
  if (modo === 'inicio') pintarEstadoIA();
}

function cerrarVisor() {
  if (camara) camara.cerrar();
  callar();
  mostrarVisor('inicio');
}

async function abrirCamara() {
  mostrarVisor('camara');
  pintarResultado(null, 'camara');
  iniciarIA().catch(() => {});
  try {
    await camara.abrir();
  } catch (error) {
    mostrarVisor('inicio');
    avisar(MENSAJES_CAMARA[error.tipo] || MENSAJES_CAMARA.otro, 6000);
    return;
  }
  if (sesion.modo !== 'camara') {
    camara.cerrar(); // la persona se fue a otra pantalla mientras se abría
    return;
  }
  actualizarBotonesCamara();
  cicloEnVivo();
}

async function actualizarBotonesCamara() {
  const linterna = $('#btn-linterna');
  linterna.hidden = !camara.tieneLinterna;
  linterna.classList.toggle('encendido', camara.linterna);
  $('#btn-voltear').hidden = !(await camara.variasCamaras());
}

/** Bucle de la cámara en vivo: toma un cuadro, lo analiza, muestra el resultado y repite. */
async function cicloEnVivo() {
  if (sesion.corriendo) return;
  sesion.corriendo = true;
  const video = $('#video');
  let fallosSeguidos = 0;
  while (sesion.modo === 'camara' && camara.activa) {
    if (!sesion.pausada && !document.hidden && IA.modeloListo() && video.readyState >= 2 && video.videoWidth) {
      try {
        IA.recortarAlCentro(video, sesion.lienzo);
        const vector = await IA.vectorDeImagen(sesion.lienzo);
        if (sesion.modo === 'camara' && !sesion.pausada) procesarCuadro(vector);
        fallosSeguidos = 0;
      } catch (error) {
        console.error('Fallo al analizar un cuadro', error);
        fallosSeguidos++;
        if (fallosSeguidos >= 3) {
          sesion.corriendo = false;
          recuperarIA();
          return;
        }
      }
    }
    await espera(CONFIG.pausaEntreAnalisis);
  }
  sesion.corriendo = false;
}

/** Si la IA falla varias veces seguidas, se reinicia en el modo más compatible. */
function recuperarIA() {
  const motor = IA.motorActual();
  if (motor && motor.dispositivo === 'webgpu') {
    Memoria.cambiarAjuste('gpuFalla', true);
    avisar('Reiniciando la IA en modo compatible…', 2500);
    setTimeout(() => location.reload(), 1500);
  } else {
    cerrarVisor();
    avisar('La IA tuvo un problema. Vuelve a abrir la cámara.', 4500);
  }
}

function procesarCuadro(vector) {
  const puntos = IA.puntuar(vector, Memoria.leerEjemplos());
  // Si la escena cambió mucho (otro objeto), se olvida lo anterior para responder rápido.
  const continuidad = sesion.vectorPrevio ? IA.parecido(vector, sesion.vectorPrevio) : 0;
  sesion.vectorPrevio = vector;
  if (!sesion.suave || continuidad < 0.6) {
    sesion.suave = { porResiduo: Float32Array.from(puntos.porResiduo), nada: puntos.nada };
  } else {
    const peso = 0.6;
    const suave = sesion.suave.porResiduo;
    for (let i = 0; i < suave.length; i++) suave[i] = peso * puntos.porResiduo[i] + (1 - peso) * suave[i];
    sesion.suave.nada = peso * puntos.nada + (1 - peso) * sesion.suave.nada;
  }
  const resultado = IA.resumir(sesion.suave);
  sesion.ultimo = { vector, resultado };
  pintarResultado(resultado, 'camara');

  // Cuando la misma respuesta segura se repite, se da por confirmada: se guarda y se dice en voz alta.
  if (resultado.nivel === 'nada') {
    sesion.cuadrosVacios++;
    if (sesion.cuadrosVacios >= 2) sesion.registrado = { id: '', t: 0 }; // retiraron el objeto
  } else {
    sesion.cuadrosVacios = 0;
  }
  const id = resultado.nivel === 'seguro' ? resultado.residuo.id : '';
  const ahora = performance.now();
  if (id && id === sesion.estable.id) sesion.estable.cuenta++;
  else sesion.estable = { id, cuenta: id ? 1 : 0, desde: ahora, hecho: false };
  const sostenida = sesion.estable.cuenta >= 2 && ahora - sesion.estable.desde >= CONFIG.tiempoParaConfirmar;
  if (id && sostenida && !sesion.estable.hecho) {
    sesion.estable.hecho = true;
    confirmar(resultado, 'camara');
  }
}

function confirmar(resultado, origen) {
  const id = resultado.residuo.id;
  const ahora = Date.now();
  if (origen === 'camara' && sesion.registrado.id === id && ahora - sesion.registrado.t < 20000) return;
  sesion.registrado = { id, t: ahora };
  Memoria.registrarEscaneo(id, resultado.caneca, origen);
  // Los navegadores solo dejan vibrar después de que la persona ha tocado la pantalla.
  if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(60);
  hablar(fraseDeVoz(resultado.residuo));
  const caja = $('#resultado');
  if (caja && !$('.guardado', caja)) {
    caja.insertAdjacentHTML('beforeend', `<div class="guardado">${ICONOS.listo} Sumado a tu progreso</div>`);
  }
}

// ---- Foto ----
function cargarImagen(url) {
  return new Promise((ok, falla) => {
    const imagen = new Image();
    imagen.onload = () => ok(imagen);
    imagen.onerror = () => falla(new Error('imagen no válida'));
    imagen.src = url;
  });
}

async function analizarFoto(archivo) {
  if (!archivo || !archivo.type.startsWith('image/')) {
    avisar('Ese archivo no es una imagen.');
    return;
  }
  if (vistaActual !== 'escanear') irA('escanear');
  if (camara) camara.cerrar();
  callar();
  mostrarVisor('foto');
  const url = URL.createObjectURL(archivo);
  try {
    const imagen = await cargarImagen(url);
    IA.recortarAlCentro(imagen, sesion.lienzo);
    // Se muestra exactamente el recorte cuadrado que ve la IA.
    $('#visor-foto').src = sesion.lienzo.toDataURL('image/jpeg', 0.92);
    pintarResultado(null, 'foto');
    await iniciarIA();
    const vector = await IA.vectorDeImagen(sesion.lienzo);
    if (sesion.modo === 'foto') resolverFoto(vector, true);
  } catch (error) {
    console.error(error);
    if (ia.estado !== 'error') {
      avisar('No pude leer esa imagen. Prueba con otra.');
      mostrarVisor('inicio');
    }
  } finally {
    URL.revokeObjectURL(url);
  }
}

function resolverFoto(vector, primeraVez) {
  const resultado = IA.resumir(IA.puntuar(vector, Memoria.leerEjemplos()));
  sesion.ultimo = { vector, resultado };
  sesion.clave = '';
  pintarResultado(resultado, 'foto');
  if (resultado.nivel === 'seguro') {
    if (primeraVez) confirmar(resultado, 'foto');
    else hablar(fraseDeVoz(resultado.residuo));
  } else if (resultado.nivel === 'probable') {
    hablar(`Probablemente es ${resultado.residuo.nombre}. ${CANECAS[resultado.caneca].frase}.`);
  }
}

// ---- Resultado ----
function htmlEsperando(origen) {
  if (ia.estado === 'error') {
    return (
      '<div class="res-neutro"><div class="res-icono">⚠️</div><div><strong>No pude cargar la IA</strong>' +
      '<span>Revisa tu conexión a internet.</span></div></div>' +
      '<div class="res-botones"><button type="button" class="boton secundario" data-accion="descargar-ia">Reintentar</button>' +
      '<button type="button" class="boton secundario" data-accion="buscar-mano">Buscar a mano</button></div>'
    );
  }
  if (ia.estado === 'cargando' || ia.estado === 'pendiente') {
    return (
      `<div class="res-neutro"><div class="res-icono">⏳</div><div style="flex:1"><strong>Preparando la IA… ${porciento(ia.fraccion)}</strong>` +
      `<span>${textoDescarga()}</span><div class="barra-progreso"><i style="width:${ia.fraccion * 100}%"></i></div></div></div>`
    );
  }
  return (
    '<div class="res-neutro"><div class="res-icono">🔎</div><div><strong>Analizando…</strong>' +
    `<span>${origen === 'foto' ? 'Un momento.' : 'Apunta la cámara a un residuo.'}</span></div></div>`
  );
}

function htmlResultado(r, origen) {
  if (!r) return htmlEsperando(origen);
  if (r.nivel === 'nada') {
    if (origen === 'foto') {
      return (
        '<div class="res-neutro"><div class="res-icono">🔎</div><div><strong>No veo ningún residuo</strong>' +
        '<span>Prueba con una foto donde se vea de cerca.</span></div></div>' +
        '<div class="res-botones"><button type="button" class="boton secundario" data-accion="subir-foto">Otra foto</button>' +
        '<button type="button" class="boton secundario" data-accion="corregir">Decirle qué es</button></div>'
      );
    }
    return (
      '<div class="res-neutro"><div class="res-icono">🔎</div><div><strong>Apunta a un residuo</strong>' +
      '<span>Acércalo hasta que llene el cuadro.</span></div></div>'
    );
  }
  if (r.nivel === 'dudoso') {
    const chips = r.opciones
      .slice(0, 3)
      .map(
        (o) =>
          `<button type="button" class="opcion c-${o.residuo.caneca}" data-accion="elegir" data-id="${o.residuo.id}">` +
          `<span class="punto"></span>${o.residuo.emoji} ${limpio(o.residuo.nombre)}</button>`,
      )
      .join('');
    return (
      '<div class="res-dudoso"><div><strong>No estoy seguro 🤔</strong><span>¿Es alguno de estos?</span></div>' +
      `<div class="opciones">${chips}<button type="button" class="opcion" data-accion="corregir">Otro…</button></div></div>`
    );
  }
  const esSeguro = r.nivel === 'seguro';
  let sobre = esSeguro ? 'Va en la' : 'Probablemente va en la';
  if (r.caneca === 'especial') sobre = esSeguro ? 'No va en ninguna caneca' : 'Parece que no va en ninguna caneca';
  return (
    `<div class="res-caneca c-${r.caneca} ${r.nivel}">` +
    `<div class="res-dibujo">${dibujoCaneca(r.caneca, 58)}</div>` +
    `<div class="res-texto"><span class="res-sobre">${sobre}</span>` +
    `<strong class="res-titulo">${tituloCaneca(r.caneca)}</strong>` +
    `<span class="res-residuo">${r.residuo.emoji} ${limpio(r.residuo.nombre)}</span></div>` +
    `<div class="res-conf"><b>${porciento(r.confianza)}</b><small>${esSeguro ? 'seguro' : 'probable'}</small></div></div>` +
    `<p class="res-consejo">💡 ${limpio(r.residuo.consejo)}</p>` +
    '<div class="res-botones"><button type="button" class="boton secundario" data-accion="detalle">Ver detalle</button>' +
    '<button type="button" class="boton secundario" data-accion="corregir">No es eso</button></div>'
  );
}

function pintarResultado(r, origen) {
  const caja = $('#resultado');
  if (!caja) return;
  let clave = 'espera|' + ia.estado + '|' + Math.round(ia.fraccion * 100);
  if (r) {
    const visible = r.nivel !== 'nada';
    const dudas = r.nivel === 'dudoso' ? r.opciones.slice(0, 3).map((o) => o.residuo.id).join(',') : '';
    clave = [origen, r.nivel, visible ? r.caneca : '', visible ? r.residuo.id : '', dudas].join('|');
  }
  if (clave === sesion.clave) {
    // Misma respuesta que antes: solo se actualiza el número para que la tarjeta no parpadee.
    const numero = $('.res-conf b', caja);
    if (numero && r) numero.textContent = porciento(r.confianza);
    return;
  }
  sesion.clave = clave;
  caja.innerHTML = htmlResultado(r, origen);
}

// ───────────────────────── Hoja inferior (detalle y corrección) ─────────────────────────
let contextoHoja = null;

function abrirHoja(html, contexto = null) {
  sesion.pausada = true;
  contextoHoja = contexto;
  const hoja = $('#hoja');
  hoja.innerHTML = html;
  hoja.hidden = false;
  $('#telon').hidden = false;
  document.body.style.overflow = 'hidden';
  const cerrar = $('.hoja-cerrar', hoja);
  if (cerrar) cerrar.focus({ preventScroll: true });
}

function cerrarHoja() {
  const hoja = $('#hoja');
  if (hoja.hidden) return;
  hoja.hidden = true;
  hoja.innerHTML = '';
  $('#telon').hidden = true;
  document.body.style.overflow = '';
  contextoHoja = null;
  sesion.pausada = false;
}

function abrirDetalle(residuo, resultado = null) {
  if (!residuo) return;
  const caneca = CANECAS[residuo.caneca];
  const sobre = residuo.caneca === 'especial' ? 'No va en ninguna caneca' : 'Va en la';
  const confianza = resultado
    ? `<div class="hoja-bloque"><small>Qué tan segura está la IA</small>${porciento(resultado.confianza)} · ` +
      `${resultado.nivel === 'seguro' ? 'bastante segura' : 'no del todo segura'}. Si se equivocó, toca «No es eso».</div>`
    : '';
  const segundo = resultado
    ? '<button type="button" class="boton secundario" data-accion="corregir">No es eso</button>'
    : `<button type="button" class="boton secundario" data-accion="ver-caneca" data-caneca="${residuo.caneca}">Ver parecidos</button>`;
  abrirHoja(
    `<div class="c-${residuo.caneca}"><div class="hoja-cab">${dibujoCaneca(residuo.caneca, 72)}` +
      `<div><span class="res-sobre">${sobre}</span><strong class="res-titulo">${tituloCaneca(residuo.caneca)}</strong>` +
      `<span class="res-sobre">${caneca.tipo}</span></div>` +
      `<button type="button" class="hoja-cerrar" data-accion="cerrar-hoja" aria-label="Cerrar">${ICONOS.cerrar}</button></div></div>` +
      '<div class="hoja-cuerpo">' +
      `<div class="hoja-residuo"><span class="residuo-emoji">${residuo.emoji}</span><span>${limpio(residuo.nombre)}</span></div>` +
      `<div class="hoja-bloque"><small>Cómo entregarlo</small>${limpio(residuo.consejo)}</div>` +
      `<div class="hoja-bloque"><small>${limpio(caneca.tipo)}</small>${limpio(caneca.resumen)} ${limpio(caneca.regla)}</div>` +
      confianza +
      '<div class="hoja-botones">' +
      (vozDisponible() ? `<button type="button" class="boton secundario" data-accion="escuchar">${ICONOS.sonido} Escuchar</button>` : '<span></span>') +
      segundo +
      '<button type="button" class="boton primario ancho" data-accion="cerrar-hoja">Entendido</button>' +
      '</div></div>',
    { residuo },
  );
}

function miniatura() {
  const lienzo = document.createElement('canvas');
  lienzo.width = lienzo.height = 96;
  lienzo.getContext('2d').drawImage(sesion.lienzo, 0, 0, 96, 96);
  return lienzo.toDataURL('image/jpeg', 0.6);
}

function abrirCorreccion() {
  if (!sesion.ultimo) return;
  const captura = { vector: sesion.ultimo.vector, mini: miniatura(), modo: sesion.modo };
  const sugeridos = sesion.ultimo.resultado.opciones.map((o) => o.residuo);
  abrirHoja(
    '<div class="hoja-simple"><h2 class="hoja-titulo">¿Qué es entonces?</h2>' +
      '<p class="hoja-ayuda">Elige el residuo correcto y lo recordaré la próxima vez que vea algo parecido.</p>' +
      `<button type="button" class="hoja-cerrar" data-accion="cerrar-hoja" aria-label="Cerrar">${ICONOS.cerrar}</button>` +
      `<div class="buscador">${ICONOS.buscar}<input id="corr-texto" type="search" placeholder="Busca: botella, cáscara, pila…" autocomplete="off"></div></div>` +
      '<div class="hoja-cuerpo"><div id="corr-lista" class="lista-residuos" style="margin-top:0"></div></div>',
    { captura },
  );
  const pintar = (texto) => {
    let lista = buscarResiduos(texto);
    if (!texto.trim()) lista = [...sugeridos, ...RESIDUOS.filter((r) => !sugeridos.includes(r))];
    $('#corr-lista').innerHTML = lista.length
      ? lista.map(filaResiduo).join('')
      : '<p class="vacio"><b>🤷</b>No encontré ese residuo. Prueba con otra palabra.</p>';
  };
  pintar('');
  $('#corr-texto').addEventListener('input', (evento) => pintar(evento.target.value));
}

/** La persona dice cuál era el residuo correcto: se guarda como ejemplo y se vuelve a calcular. */
function aprender(residuoId, captura) {
  const residuo = residuoPorId(residuoId);
  if (!residuo || !captura) return;
  Memoria.agregarEjemplo(residuoId, captura.vector, captura.mini);
  cerrarHoja();
  avisar('¡Gracias! Lo voy a recordar 🧠');
  if (captura.modo === 'foto' && sesion.modo === 'foto') {
    resolverFoto(captura.vector, false);
  } else {
    sesion.suave = null;
    sesion.estable = { id: '', cuenta: 0 };
    hablar(fraseDeVoz(residuo));
  }
}

// ───────────────────────── Buscar ─────────────────────────
const busqueda = { texto: '', caneca: null };

function pintarBuscar(opciones = {}) {
  const vista = $('#vista-buscar');
  if (opciones.caneca !== undefined) busqueda.caneca = opciones.caneca;
  if (!vista.dataset.lista) {
    vista.dataset.lista = '1';
    vista.innerHTML =
      '<h1 class="titulo-vista">Buscar un residuo</h1>' +
      '<p class="subtitulo-vista">Escribe qué vas a botar y te digo la caneca.</p>' +
      `<div class="buscador">${ICONOS.buscar}<input id="buscar-texto" type="search" placeholder="Ej.: icopor, pilas, cáscara…" autocomplete="off" enterkeyhint="search" aria-label="Buscar un residuo"></div>` +
      '<div id="buscar-filtros" class="filtros"></div>' +
      '<div id="buscar-lista" class="lista-residuos"></div>';
    $('#buscar-texto').addEventListener('input', (evento) => {
      busqueda.texto = evento.target.value;
      pintarListaBuscar();
    });
    $('#buscar-filtros').addEventListener('click', (evento) => {
      const boton = evento.target.closest('[data-filtro]');
      if (!boton) return;
      busqueda.caneca = boton.dataset.filtro || null;
      pintarFiltros();
      pintarListaBuscar();
    });
    $('#buscar-lista').addEventListener('click', (evento) => {
      const fila = evento.target.closest('[data-id]');
      if (fila) abrirDetalle(residuoPorId(fila.dataset.id));
    });
  }
  pintarFiltros();
  pintarListaBuscar();
}

function pintarFiltros() {
  const chips = [`<button type="button" class="filtro ${busqueda.caneca ? '' : 'activo'}" data-filtro="">Todas</button>`];
  for (const id of ORDEN_CANECAS) {
    chips.push(
      `<button type="button" class="filtro c-${id} ${busqueda.caneca === id ? 'activo' : ''}" data-filtro="${id}">` +
        `<span class="punto"></span>${CANECAS[id].corto}</button>`,
    );
  }
  $('#buscar-filtros').innerHTML = chips.join('');
}

function pintarListaBuscar() {
  const lista = buscarResiduos(busqueda.texto, busqueda.caneca);
  $('#buscar-lista').innerHTML = lista.length
    ? lista.map(filaResiduo).join('')
    : `<p class="vacio"><b>🤷</b>No encontré «${limpio(busqueda.texto)}». Prueba con otra palabra o escanéalo con la cámara.</p>`;
}

// ───────────────────────── Canecas (guía) ─────────────────────────
const EJEMPLOS_GUIA = {
  blanca: ['botella-plastica', 'lata-bebida', 'botella-vidrio', 'carton', 'papel', 'tetrapak', 'bolsa-plastica'],
  negra: ['papel-higienico', 'servilleta', 'paquete-mecato', 'icopor', 'colilla', 'tapabocas', 'carton-sucio'],
  verde: ['cascara-banano', 'cascaras-fruta', 'restos-comida', 'cascara-huevo', 'cuncho-cafe', 'poda'],
  especial: ['pilas', 'medicamentos', 'bombillos', 'celulares', 'aceite-cocina', 'quimicos'],
};

function pintarCanecas() {
  const tarjeta = (id) => {
    const caneca = CANECAS[id];
    const ejemplos = EJEMPLOS_GUIA[id].map(residuoPorId).filter(Boolean);
    return (
      `<article class="caneca-tarjeta c-${id}"><div class="caneca-cab">${dibujoCaneca(id, 60)}` +
      `<div><h2>${caneca.nombre}</h2><span>${caneca.tipo}</span></div></div>` +
      `<div class="caneca-cuerpo"><p>${caneca.resumen}</p><p class="regla">${caneca.regla}</p>` +
      `<div class="caneca-ejemplos">${ejemplos.map((r) => `<span>${r.emoji} ${limpio(r.nombre)}</span>`).join('')}</div>` +
      `<button type="button" class="boton fantasma" data-ver-caneca="${id}">Ver todo lo que va aquí ${ICONOS.flecha}</button></div></article>`
    );
  };
  $('#vista-canecas').innerHTML =
    '<h1 class="titulo-vista">Las canecas de Colombia</h1>' +
    '<p class="subtitulo-vista">Desde 2021 todo el país separa los residuos con el mismo código de tres colores.</p>' +
    tarjeta('blanca') +
    tarjeta('negra') +
    tarjeta('verde') +
    '<h2 class="titulo-seccion">¿Y lo que no va en ninguna?</h2>' +
    tarjeta('especial') +
    '<h2 class="titulo-seccion">Tres reglas de oro</h2>' +
    '<div class="tarjeta"><ol class="reglas">' +
    '<li><span><strong>Limpio y seco.</strong> Enjuaga y escurre lo reciclable antes de llevarlo a la blanca.</span></li>' +
    '<li><span><strong>Lo orgánico va solo.</strong> Sin bolsas, empaques ni servilletas.</span></li>' +
    '<li><span><strong>Lo peligroso no va a la caneca.</strong> Pilas, medicamentos y aparatos van a un punto de recolección.</span></li>' +
    '</ol></div>' +
    '<p class="fuente">Fuente: código de colores adoptado en el artículo 4 de la <strong>Resolución 2184 de 2019</strong> del ' +
    'Ministerio de Ambiente y Desarrollo Sostenible, vigente desde el 1 de enero de 2021 ' +
    '(<a href="https://www.minambiente.gov.co/colombia-iniciara-el-2021-con-nuevo-codigo-de-colores-para-la-separacion-de-residuos/" target="_blank" rel="noopener">ver comunicado oficial</a>). ' +
    'Tu municipio o tu empresa de aseo pueden dar indicaciones adicionales.</p>';
}

// ───────────────────────── Reto ─────────────────────────
const reto = { estado: 'portada', preguntas: [], indice: 0, aciertos: 0, respondida: null };
const ETIQUETA_RETO = { blanca: 'Blanca', negra: 'Negra', verde: 'Verde', especial: 'Ninguna' };

function barajar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function nuevoReto() {
  const tomar = (caneca, cuantos) => barajar(RESIDUOS.filter((r) => r.caneca === caneca)).slice(0, cuantos);
  reto.preguntas = barajar([...tomar('blanca', 3), ...tomar('negra', 3), ...tomar('verde', 2), ...tomar('especial', 2)]);
  reto.indice = 0;
  reto.aciertos = 0;
  reto.respondida = null;
  reto.estado = 'jugando';
}

function pintarReto() {
  const vista = $('#vista-reto');
  if (reto.estado === 'portada') {
    const { mejor, partidas } = Memoria.mejorPuntaje();
    vista.innerHTML =
      '<h1 class="titulo-vista">Reto de las canecas</h1>' +
      '<p class="subtitulo-vista">10 residuos y 4 opciones. ¿Cuántos separas bien?</p>' +
      '<div class="tarjeta reto-portada"><div class="reto-emoji">🏆</div>' +
      `<h2>${partidas ? `Tu mejor puntaje: ${mejor} de 10` : '¿Listo para jugar?'}</h2>` +
      `<p>${partidas ? `Has jugado ${partidas} ${partidas === 1 ? 'vez' : 'veces'}.` : 'Aprende jugando en qué caneca va cada cosa.'}</p>` +
      '<button type="button" class="boton primario grande" data-reto="jugar">Jugar</button></div>';
    return;
  }
  const total = reto.preguntas.length;
  if (reto.estado === 'final') {
    let mensaje = 'A practicar: dale una mirada a la guía de canecas.';
    let emoji = '🌱';
    if (reto.aciertos === total) [mensaje, emoji] = ['¡Perfecto! Separas como un experto.', '🏆'];
    else if (reto.aciertos >= 7) [mensaje, emoji] = ['¡Muy bien! Ya casi no se te escapa ninguna.', '🎉'];
    else if (reto.aciertos >= 4) [mensaje, emoji] = ['Vas por buen camino. ¡Otra ronda!', '💪'];
    vista.innerHTML =
      '<h1 class="titulo-vista">Resultado</h1>' +
      `<div class="tarjeta reto-portada"><div class="reto-emoji">${emoji}</div>` +
      `<h2>${reto.aciertos} de ${total}</h2><p>${mensaje}</p>` +
      '<button type="button" class="boton primario grande" data-reto="jugar">Jugar otra vez</button>' +
      '<button type="button" class="boton fantasma" data-reto="guia" style="margin-top:8px">Ver la guía de canecas</button></div>';
    return;
  }
  const residuo = reto.preguntas[reto.indice];
  const respondida = reto.respondida;
  const avance = ((reto.indice + (respondida ? 1 : 0)) / total) * 100;
  const opciones = ORDEN_CANECAS.map((id) => {
    let clase = '';
    if (respondida) clase = id === residuo.caneca ? 'correcta' : id === respondida ? 'incorrecta' : 'apagada';
    return (
      `<button type="button" class="reto-opcion c-${id} ${clase}" data-reto="responder" data-caneca="${id}" ${respondida ? 'disabled' : ''}>` +
      `${dibujoCaneca(id, 44)}<span>${ETIQUETA_RETO[id]}</span></button>`
    );
  }).join('');
  let respuesta = '';
  if (respondida) {
    const acerto = respondida === residuo.caneca;
    const donde = residuo.caneca === 'especial' ? 'No va en ninguna caneca' : CANECAS[residuo.caneca].frase;
    respuesta =
      `<div class="reto-respuesta ${acerto ? 'bien' : 'mal'}" role="status">` +
      `<strong>${acerto ? '¡Correcto! 🎉' : `Casi… ${donde}.`}</strong>${limpio(residuo.consejo)}` +
      `<button type="button" class="boton primario" data-reto="siguiente">${reto.indice + 1 === total ? 'Ver resultado' : 'Siguiente'}</button></div>`;
  }
  vista.innerHTML =
    `<div class="reto-marcador"><span>Pregunta ${reto.indice + 1} de ${total}</span><span>✔ ${reto.aciertos}</span></div>` +
    `<div class="barra-progreso"><i style="width:${avance}%"></i></div>` +
    `<div class="tarjeta reto-pregunta"><div class="reto-emoji">${residuo.emoji}</div><h2>${limpio(residuo.nombre)}</h2><p>¿En cuál caneca va?</p></div>` +
    `<div class="reto-opciones">${opciones}</div>${respuesta}`;
  if (respondida) $('.reto-respuesta', vista).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function manejarReto(evento) {
  const boton = evento.target.closest('[data-reto]');
  if (!boton) return;
  const accion = boton.dataset.reto;
  if (accion === 'jugar') {
    nuevoReto();
  } else if (accion === 'guia') {
    reto.estado = 'portada';
    irA('canecas');
    return;
  } else if (accion === 'responder' && !reto.respondida) {
    reto.respondida = boton.dataset.caneca;
    if (reto.respondida === reto.preguntas[reto.indice].caneca) reto.aciertos++;
  } else if (accion === 'siguiente') {
    reto.respondida = null;
    reto.indice++;
    if (reto.indice >= reto.preguntas.length) {
      reto.estado = 'final';
      Memoria.guardarPuntaje(reto.aciertos);
    }
  }
  pintarReto();
}

// ───────────────────────── Progreso ─────────────────────────
let instalador = null; // evento que permite instalar la app (Chrome/Edge/Android)

function pintarProgreso() {
  const totales = Memoria.leerTotales();
  const total = ORDEN_CANECAS.reduce((suma, id) => suma + (totales[id] || 0), 0);
  const maximo = Math.max(1, ...ORDEN_CANECAS.map((id) => totales[id] || 0));
  const historial = Memoria.leerHistorial().slice(0, 12);
  const ejemplos = Memoria.leerEjemplos();

  const barras = ORDEN_CANECAS.map(
    (id) =>
      `<div class="barra-fila c-${id}"><span>${CANECAS[id].corto}</span><div class="pista">` +
      (totales[id] ? `<i style="width:${(totales[id] / maximo) * 100}%"></i>` : '') +
      `</div><b>${totales[id] || 0}</b></div>`,
  ).join('');

  const filas = historial
    .map((h) => {
      const residuo = residuoPorId(h.r);
      if (!residuo) return '';
      return (
        `<div class="historial-fila c-${residuo.caneca}"><span class="residuo-emoji">${residuo.emoji}</span>` +
        `<span class="residuo-nombre">${limpio(residuo.nombre)}<small>${hace(h.t)} · ${h.o === 'foto' ? 'foto' : 'cámara'}</small></span>` +
        `<span class="residuo-caneca"><span class="punto"></span>${CANECAS[residuo.caneca].corto}</span></div>`
      );
    })
    .join('');

  const aprendidos = ejemplos
    .map((e) => {
      const residuo = residuoPorId(e.residuo);
      if (!residuo) return '';
      const imagen = e.mini ? `<img src="${e.mini}" alt="">` : `<div class="sin-mini">${residuo.emoji}</div>`;
      return (
        `<div class="ejemplo">${imagen}<span>${limpio(residuo.nombre)}</span>` +
        `<button type="button" data-progreso="olvidar" data-id="${e.id}" aria-label="Olvidar este ejemplo">${ICONOS.cerrar}</button></div>`
      );
    })
    .join('');

  $('#vista-progreso').innerHTML =
    '<h1 class="titulo-vista">Mi progreso</h1>' +
    '<p class="subtitulo-vista">Todo se guarda únicamente en este dispositivo.</p>' +
    `<div class="tarjeta total-grande"><b>${total}</b><span>${total === 1 ? 'residuo escaneado' : 'residuos escaneados'}</span>` +
    `<div class="barras">${barras}</div></div>` +
    '<h2 class="titulo-seccion">Últimos escaneos</h2>' +
    (filas ? `<div class="historial">${filas}</div>` : '<p class="vacio"><b>📷</b>Todavía no has escaneado nada.</p>') +
    `<h2 class="titulo-seccion">Lo que me has enseñado (${ejemplos.length})</h2>` +
    (aprendidos
      ? `<div class="ejemplos">${aprendidos}</div>`
      : '<div class="tarjeta acerca"><p>Cuando me equivoque, toca <strong>«No es eso»</strong> y elige el residuo correcto. Así aprendo a reconocer justo las cosas que tú botas.</p></div>') +
    '<h2 class="titulo-seccion">Ajustes</h2><div class="tarjeta">' +
    (vozDisponible()
      ? `<div class="ajuste-fila"><div><strong>Voz</strong><span>Leer el resultado en voz alta</span></div><button type="button" class="interruptor" role="switch" aria-checked="${Boolean(Memoria.ajuste('voz'))}" aria-label="Voz" data-progreso="voz"></button></div>`
      : '') +
    ('gpu' in navigator
      ? `<div class="ajuste-fila"><div><strong>Modo rápido (GPU)</strong><span>${Memoria.ajuste('gpuFalla') ? 'No funcionó en este dispositivo. Actívalo para reintentar.' : 'Usa la tarjeta gráfica para escanear más rápido'}</span></div><button type="button" class="interruptor" role="switch" aria-checked="${gpuPermitida()}" aria-label="Modo rápido con la tarjeta gráfica" data-progreso="gpu"></button></div>`
      : '') +
    (instalador
      ? '<div class="ajuste-fila"><div><strong>Instalar EcoCaneca</strong><span>Ábrela como una app, sin el navegador</span></div><button type="button" class="boton secundario" data-progreso="instalar">Instalar</button></div>'
      : '') +
    '<div class="ajuste-fila"><div><strong>Borrar mis datos</strong><span>Historial, puntajes y lo que me enseñaste</span></div><button type="button" class="boton peligro" data-progreso="borrar">Borrar</button></div>' +
    '</div>' +
    '<h2 class="titulo-seccion">Acerca de</h2><div class="tarjeta acerca">' +
    `<p><strong>${CONFIG.nombre} ${CONFIG.version}</strong> · Proyecto académico de educación ambiental.</p>` +
    '<p>Clasifica con el código de colores de la <strong>Resolución 2184 de 2019</strong> del Ministerio de Ambiente y Desarrollo Sostenible de Colombia.</p>' +
    '<p>La inteligencia artificial (modelo MobileCLIP-S0, ejecutado con Transformers.js) funciona dentro de tu navegador: las fotos <strong>no se envían</strong> a ningún servidor.</p>' +
    `<p>Motor de la IA en este dispositivo: <strong>${textoMotor()}</strong>.</p>` +
    '<p>La IA puede equivocarse. Si tienes dudas, consulta a tu empresa de aseo.</p></div>';
}

function textoMotor() {
  const motor = IA.motorActual();
  if (!motor) return ia.estado === 'cargando' ? 'cargando…' : 'todavía sin cargar';
  return motor.dispositivo === 'webgpu' ? 'tarjeta gráfica (WebGPU)' : 'procesador (WebAssembly)';
}

async function manejarProgreso(evento) {
  const boton = evento.target.closest('[data-progreso]');
  if (!boton) return;
  const accion = boton.dataset.progreso;
  if (accion === 'voz') {
    alternarVoz();
  } else if (accion === 'gpu') {
    Memoria.cambiarAjuste('gpu', !gpuPermitida());
    Memoria.cambiarAjuste('gpuFalla', false);
    avisar('Reiniciando la app para aplicar el cambio…', 1500);
    setTimeout(() => location.reload(), 900);
  } else if (accion === 'olvidar') {
    Memoria.borrarEjemplo(boton.dataset.id);
    avisar('Ejemplo olvidado.');
  } else if (accion === 'borrar') {
    if (!window.confirm('¿Borrar tu historial, tus puntajes y todo lo que me enseñaste? No se puede deshacer.')) return;
    Memoria.borrarTodo();
    reto.estado = 'portada';
    avisar('Datos borrados.');
  } else if (accion === 'instalar' && instalador) {
    instalador.prompt();
    try {
      await instalador.userChoice;
    } catch (error) {
      /* la persona cerró el cuadro */
    }
    instalador = null;
  }
  pintarProgreso();
}

// ───────────────────────── Voz ─────────────────────────
function pintarBotonVoz() {
  const boton = $('#btn-voz');
  if (!vozDisponible()) {
    boton.hidden = true;
    return;
  }
  const activa = Boolean(Memoria.ajuste('voz'));
  boton.innerHTML = activa ? ICONOS.sonido : ICONOS.silencio;
  boton.setAttribute('aria-pressed', String(activa));
  boton.title = activa ? 'Voz activada' : 'Voz desactivada';
}

function alternarVoz() {
  const activa = !Memoria.ajuste('voz');
  Memoria.cambiarAjuste('voz', activa);
  pintarBotonVoz();
  if (activa) hablar('Voz activada');
  else callar();
  avisar(activa ? 'Voz activada 🔊' : 'Voz desactivada 🔇', 1600);
}

// ───────────────────────── Eventos ─────────────────────────
function conectarEventos() {
  $('.pestanas').addEventListener('click', (evento) => {
    const boton = evento.target.closest('.pestana');
    if (boton) irA(boton.dataset.vista);
  });
  $('#btn-voz').addEventListener('click', () => {
    alternarVoz();
    if (vistaActual === 'progreso') pintarProgreso();
  });

  // Escanear
  const escanear = $('#vista-escanear');
  $('#btn-camara').addEventListener('click', abrirCamara);
  $('#btn-cerrar-visor').addEventListener('click', cerrarVisor);
  $('#btn-voltear').addEventListener('click', async () => {
    try {
      await camara.voltear();
      sesion.suave = null;
      actualizarBotonesCamara();
    } catch (error) {
      avisar(MENSAJES_CAMARA[error.tipo] || MENSAJES_CAMARA.otro);
      cerrarVisor();
    }
  });
  $('#btn-linterna').addEventListener('click', async () => {
    const encendida = await camara.alternarLinterna();
    $('#btn-linterna').classList.toggle('encendido', encendida);
  });
  $('#entrada-foto').addEventListener('change', (evento) => {
    const archivo = evento.target.files && evento.target.files[0];
    evento.target.value = '';
    if (archivo) analizarFoto(archivo);
  });
  escanear.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-accion]');
    if (!boton) return;
    const accion = boton.dataset.accion;
    if (accion === 'subir-foto') $('#entrada-foto').click();
    else if (accion === 'buscar-mano') irA('buscar');
    else if (accion === 'descargar-ia') iniciarIA().catch(() => {});
    else if (accion === 'detalle' && sesion.ultimo) abrirDetalle(sesion.ultimo.resultado.residuo, sesion.ultimo.resultado);
    else if (accion === 'corregir') abrirCorreccion();
    else if (accion === 'elegir' && sesion.ultimo) {
      aprender(boton.dataset.id, { vector: sesion.ultimo.vector, mini: miniatura(), modo: sesion.modo });
    }
  });

  // Hoja inferior
  $('#telon').addEventListener('click', cerrarHoja);
  $('#hoja').addEventListener('click', (evento) => {
    const fila = evento.target.closest('.residuo-fila');
    if (fila && contextoHoja && contextoHoja.captura) {
      aprender(fila.dataset.id, contextoHoja.captura);
      return;
    }
    const boton = evento.target.closest('[data-accion]');
    if (!boton) return;
    const accion = boton.dataset.accion;
    if (accion === 'cerrar-hoja') cerrarHoja();
    else if (accion === 'escuchar' && contextoHoja) hablar(fraseDeVoz(contextoHoja.residuo) + ' ' + contextoHoja.residuo.consejo, true);
    else if (accion === 'corregir') abrirCorreccion();
    else if (accion === 'ver-caneca') {
      const caneca = boton.dataset.caneca;
      cerrarHoja();
      irA('buscar', { caneca });
    }
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') cerrarHoja();
  });

  // Canecas, reto y progreso
  $('#vista-canecas').addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-ver-caneca]');
    if (boton) irA('buscar', { caneca: boton.dataset.verCaneca });
  });
  $('#vista-reto').addEventListener('click', manejarReto);
  $('#vista-progreso').addEventListener('click', manejarProgreso);

  // En el computador también se puede pegar (Ctrl+V) o arrastrar una imagen.
  document.addEventListener('paste', (evento) => {
    const archivo = Array.from(evento.clipboardData ? evento.clipboardData.files : []).find((f) => f.type.startsWith('image/'));
    if (archivo) analizarFoto(archivo);
  });
  document.addEventListener('dragover', (evento) => evento.preventDefault());
  document.addEventListener('drop', (evento) => {
    evento.preventDefault();
    const archivo = Array.from(evento.dataTransfer ? evento.dataTransfer.files : []).find((f) => f.type.startsWith('image/'));
    if (archivo) analizarFoto(archivo);
  });

  // Al salir de la app se apaga la cámara (ahorra batería y cuida la privacidad).
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && sesion.modo === 'camara') cerrarVisor();
  });
  window.addEventListener('pagehide', () => camara && camara.cerrar());
  window.addEventListener('hashchange', () => {
    const vista = location.hash.slice(1);
    if (VISTAS.includes(vista) && vista !== vistaActual) irA(vista);
  });
  window.addEventListener('beforeinstallprompt', (evento) => {
    evento.preventDefault();
    instalador = evento;
    if (vistaActual === 'progreso') pintarProgreso();
  });
}

// ───────────────────────── Arranque ─────────────────────────
function iniciar() {
  $('#marca-logo').innerHTML = logo(34);
  for (const hueco of $$('[data-icono]')) hueco.innerHTML = ICONOS[hueco.dataset.icono] || '';
  pintarEscanear();
  pintarCanecas();
  pintarBotonVoz();
  pintarEstadoIA();
  conectarEventos();

  const inicial = location.hash.slice(1);
  if (VISTAS.includes(inicial) && inicial !== 'escanear') irA(inicial);

  // Si la IA ya se descargó antes, se carga sola desde la memoria del navegador.
  if (Memoria.ajuste('iaDescargada')) iniciarIA().catch(() => {});

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
}

iniciar();
