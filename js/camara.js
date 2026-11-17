// camara.js — Enciende y apaga la cámara del dispositivo.
// Nota: los navegadores solo prestan la cámara en páginas seguras (https://… o http://localhost).

export class ErrorCamara extends Error {
  constructor(tipo) {
    super(tipo);
    this.tipo = tipo; // 'sin-soporte' | 'permiso' | 'sin-camara' | 'ocupada' | 'insegura' | 'otro'
  }
}

export const MENSAJES_CAMARA = {
  'sin-soporte': 'Este navegador no deja usar la cámara. Prueba con Chrome o sube una foto.',
  insegura: 'La cámara solo funciona en una dirección segura (https o localhost). Mientras tanto puedes subir una foto.',
  permiso: 'No diste permiso para usar la cámara. Actívalo en el candado de la barra de direcciones o sube una foto.',
  'sin-camara': 'No encontré ninguna cámara en este dispositivo. Puedes subir una foto.',
  ocupada: 'Otra aplicación está usando la cámara. Ciérrala e inténtalo de nuevo.',
  otro: 'No pude abrir la cámara. Inténtalo de nuevo o sube una foto.',
};

export class Camara {
  constructor(video) {
    this.video = video;
    this.flujo = null;
    this.frontal = false;
    this.espejo = false;
    this.tieneLinterna = false;
    this.linterna = false;
  }

  get activa() {
    return Boolean(this.flujo);
  }

  async abrir() {
    if (!window.isSecureContext) throw new ErrorCamara('insegura');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new ErrorCamara('sin-soporte');
    this.cerrar();
    try {
      this.flujo = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: this.frontal ? 'user' : 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
    } catch (error) {
      const nombre = error && error.name;
      if (nombre === 'NotAllowedError' || nombre === 'SecurityError') throw new ErrorCamara('permiso');
      if (nombre === 'NotFoundError' || nombre === 'OverconstrainedError') throw new ErrorCamara('sin-camara');
      if (nombre === 'NotReadableError' || nombre === 'AbortError') throw new ErrorCamara('ocupada');
      throw new ErrorCamara('otro');
    }
    this.video.srcObject = this.flujo;
    try {
      await this.video.play();
    } catch (error) {
      /* el atributo autoplay lo inicia igual */
    }
    const pista = this.flujo.getVideoTracks()[0];
    const ajustes = pista && pista.getSettings ? pista.getSettings() : {};
    const capacidades = pista && pista.getCapabilities ? pista.getCapabilities() : {};
    // La cámara frontal se muestra como espejo, que es lo que la gente espera ver.
    this.espejo = ajustes.facingMode === 'user';
    this.video.classList.toggle('espejo', this.espejo);
    this.tieneLinterna = Boolean(capacidades.torch);
    this.linterna = false;
  }

  /** ¿El dispositivo tiene más de una cámara (frontal y trasera)? */
  async variasCamaras() {
    try {
      const dispositivos = await navigator.mediaDevices.enumerateDevices();
      return dispositivos.filter((d) => d.kind === 'videoinput').length > 1;
    } catch (error) {
      return false;
    }
  }

  async voltear() {
    this.frontal = !this.frontal;
    await this.abrir();
  }

  async alternarLinterna() {
    if (!this.flujo || !this.tieneLinterna) return false;
    const pista = this.flujo.getVideoTracks()[0];
    try {
      await pista.applyConstraints({ advanced: [{ torch: !this.linterna }] });
      this.linterna = !this.linterna;
    } catch (error) {
      /* algunos celulares anuncian linterna pero no la dejan encender */
    }
    return this.linterna;
  }

  cerrar() {
    if (this.flujo) {
      for (const pista of this.flujo.getTracks()) pista.stop();
      this.flujo = null;
    }
    this.video.srcObject = null;
    this.linterna = false;
  }
}
