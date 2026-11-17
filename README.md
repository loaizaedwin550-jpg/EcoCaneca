# EcoCaneca ♻️

**Apunta la cámara a un residuo y la app te dice en qué caneca va**, según el código de colores de
Colombia (Resolución 2184 de 2019): **blanca** (aprovechables), **negra** (no aprovechables) o
**verde** (orgánicos). Si es un residuo peligroso o posconsumo (pilas, medicamentos, bombillos…),
avisa que no va en ninguna caneca y dónde entregarlo.

> 🌐 **Pruébala ya:** https://loaizaedwin550-jpg.github.io/EcoCaneca/

> 📖 **¿Primera vez aquí?** Abre [`GUIA DEL PROYECTO.html`](GUIA%20DEL%20PROYECTO.html) con doble clic:
> explica todo el proyecto paso a paso, en lenguaje sencillo.

## Qué hace

- **Escanea en vivo** con la cámara del celular o del computador, o analiza una **foto**.
- Responde con el **color de la caneca**, el nombre del residuo, un consejo y **voz**.
- **Aprende**: si se equivoca, tocas «No es eso», eliges el residuo correcto y lo recuerda.
- **Buscador** de 66 residuos comunes, **guía** del código de colores y un **reto** para aprender jugando.
- Funciona **sin internet** después de la primera vez y **no envía las fotos** a ningún servidor:
  la inteligencia artificial corre dentro del navegador.

## Probarla en el computador

1. Doble clic en **`Abrir EcoCaneca.bat`** (necesita [Python](https://www.python.org/downloads/), que ya viene instalado en muchos equipos).
2. Se abre el navegador en `http://localhost:8765/app/`.
3. Toca **Abrir cámara** (o **Subir una foto**). La primera vez descarga la IA (entre 30 y 50 MB).

La cámara del navegador solo funciona en direcciones seguras (`https://…` o `localhost`); por eso
la app se abre con ese pequeño servidor local en vez de abrir `index.html` directamente.

## Ponerla en internet (para usarla en el celular)

La carpeta **`app/`** es un sitio web estático: se puede publicar gratis en GitHub Pages, Netlify o
cualquier hosting con HTTPS. El paso a paso está en la guía, sección «Usarla en el celular».

## Cómo está hecha

| Parte | Tecnología |
|---|---|
| Interfaz | HTML, CSS y JavaScript puro (sin frameworks ni compilación) |
| Inteligencia artificial | [MobileCLIP-S0](https://huggingface.co/Xenova/mobileclip_s0) (modelo de visión-lenguaje) |
| Motor de la IA | [Transformers.js 4](https://huggingface.co/docs/transformers.js) (WebGPU, con respaldo en WebAssembly) |
| Sin conexión | Aplicación web progresiva (PWA) con *service worker* |
| Datos del usuario | `localStorage` del navegador (nada sale del dispositivo) |

**Idea central (clasificación *zero-shot*):** el modelo convierte la imagen en un vector de 512
números y lo compara con los vectores de 259 frases: 235 describen residuos («a banana peel»,
«an aluminum soda can»…) y 24 describen escenas sin residuos, para saber decir «no veo nada».
Las frases más parecidas ganan; sus probabilidades se suman por residuo y por caneca. Los vectores de texto se calculan una sola vez y van guardados en
`app/datos/vectores-texto.json`, así el celular solo necesita la mitad «visual» del modelo.

## Estructura

```
Proyecto de Ambiental/
├── GUIA DEL PROYECTO.html      ← toda la información del proyecto (empieza aquí)
├── Abrir EcoCaneca.bat         ← abre la app en este computador
├── README.md                   ← este archivo
├── app/                        ← LA APLICACIÓN (esto es lo que se publica)
│   ├── index.html
│   ├── manifest.webmanifest    ← datos para instalarla como app
│   ├── sw.js                   ← funcionamiento sin internet
│   ├── css/estilos.css
│   ├── js/
│   │   ├── app.js              ← pantallas y comportamiento
│   │   ├── clasificador.js     ← la IA: del píxel a la caneca
│   │   ├── residuos.js         ← catálogo de residuos y canecas
│   │   ├── config.js           ← ajustes (modelo, umbrales)
│   │   ├── camara.js · voz.js · memoria.js · graficos.js
│   ├── datos/vectores-texto.json
│   └── iconos/
└── herramientas/               ← utilidades de desarrollo (no se publican)
    ├── servidor.py             ← servidor local
    ├── generar-vectores.html   ← recalcula los vectores al cambiar el catálogo
    ├── generar-iconos.html
    ├── evaluacion.html         ← mide la precisión con fotos reales
    ├── casos-evaluacion.js
    └── resultados-evaluacion.json
```

## Agregar o cambiar un residuo

1. Edita `app/js/residuos.js` (copia un bloque y cambia nombre, caneca, consejo y las frases `ia` en inglés).
2. Con la app abierta, entra a `http://localhost:8765/herramientas/generar-vectores.html` y pulsa **Generar vectores**.
3. Recarga la app.

## Pruebas

Medida con **150 fotografías reales** de Wikimedia Commons (63 búsquedas; de 228 imágenes se
descartaron a mano 78 que no mostraban el residuo, no eran fotos o estaban repetidas). Cubren 40 de
los 66 residuos del catálogo.

| Grupo | Aciertos |
|---|---|
| **Caneca correcta, todas las fotos** | **136 de 150 (90,7 %)** |
| Caneca blanca | 36 de 42 (85,7 %) |
| Caneca negra | 32 de 36 (88,9 %) |
| Caneca verde | 20 de 22 (90,9 %) |
| Punto de recolección | 48 de 50 (96,0 %) |
| Cuando la app dijo «seguro» | 125 de 134 (93,3 %) |
| Cuando dijo «probablemente» | 11 de 15 (73,3 %) |

El resultado fue el mismo con el procesador (WebAssembly) y con la tarjeta gráfica (WebGPU): 136 de 150.
Son fotos de internet; con la cámara de un celular y residuos reales puede variar, y esa prueba aún
no se ha hecho. Para repetirla: `http://localhost:8765/herramientas/evaluacion.html`. El detalle
foto por foto queda en `herramientas/resultados-evaluacion.json`.

## Fuentes y licencias

- Código de colores: [Resolución 2184 de 2019](https://normas.cra.gov.co/Gestor/Docs/resolucion_minambienteds_2184_2019.htm), art. 4, Ministerio de Ambiente y Desarrollo Sostenible.
- Modelo: *MobileCLIP: Fast Image-Text Models through Multi-Modal Reinforced Training* (Vasu et al., CVPR 2024). Pesos con licencia **apple-amlr** (uso académico y de investigación); conversión ONNX de Xenova.
- Librería: Transformers.js (Hugging Face), licencia Apache 2.0.
- La IA puede equivocarse: ante la duda, consulta a la empresa de aseo de tu municipio.
