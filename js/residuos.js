// residuos.js — Catálogo de canecas y residuos de EcoCaneca.
//
// Código de colores: artículo 4 de la Resolución 2184 de 2019 del Ministerio de Ambiente y
// Desarrollo Sostenible de Colombia (rige desde el 1 de enero de 2021):
//   · Blanco → residuos aprovechables: plástico, vidrio, metales, multicapa, papel y cartón.
//   · Negro  → residuos no aprovechables.
//   · Verde  → residuos orgánicos aprovechables.
// Los residuos peligrosos y posconsumo (pilas, medicamentos, bombillos, aparatos electrónicos…)
// no van en ninguna de las tres canecas: se entregan en puntos de recolección.
//
// Cada residuo tiene:
//   nombre  → lo que lee la persona
//   caneca  → blanca | negra | verde | especial
//   consejo → cómo entregarlo bien
//   claves  → palabras extra para el buscador (sin tildes)
//   ia      → frases EN INGLÉS que describen cómo se ve. El modelo de IA fue entrenado en inglés,
//             por eso estas frases no se traducen. Si agregas o cambias alguna, vuelve a generar
//             los vectores con herramientas/generar-vectores.html.

export const CANECAS = {
  blanca: {
    id: 'blanca',
    nombre: 'Caneca blanca',
    corto: 'Blanca',
    tipo: 'Residuos aprovechables',
    resumen: 'Plástico, vidrio, metales, multicapa, papel y cartón.',
    regla: 'Entrégalos limpios y secos para que sí se puedan reciclar.',
    frase: 'Va en la caneca blanca',
  },
  negra: {
    id: 'negra',
    nombre: 'Caneca negra',
    corto: 'Negra',
    tipo: 'Residuos no aprovechables',
    resumen: 'Papel higiénico, servilletas, papeles y cartones sucios de comida, papeles metalizados.',
    regla: 'Aquí va lo que ya no se puede reciclar ni compostar.',
    frase: 'Va en la caneca negra',
  },
  verde: {
    id: 'verde',
    nombre: 'Caneca verde',
    corto: 'Verde',
    tipo: 'Residuos orgánicos aprovechables',
    resumen: 'Restos de comida, corte de césped, poda de jardín y desechos agrícolas.',
    regla: 'Solo lo orgánico: sin bolsas, empaques ni servilletas.',
    frase: 'Va en la caneca verde',
  },
  especial: {
    id: 'especial',
    nombre: 'Punto de recolección',
    corto: 'Especial',
    tipo: 'Residuos peligrosos o posconsumo',
    resumen: 'Pilas, medicamentos, bombillos, aparatos electrónicos, aceite usado, químicos.',
    regla: 'No va en ninguna caneca: llévalo a un punto de recolección posconsumo.',
    frase: 'No va en ninguna caneca',
  },
};

export const ORDEN_CANECAS = ['blanca', 'negra', 'verde', 'especial'];

export const RESIDUOS = [
  // ───────────────────────── BLANCA · aprovechables ─────────────────────────
  {
    id: 'botella-plastica', nombre: 'Botella de plástico', emoji: '🧴', caneca: 'blanca',
    consejo: 'Vacíala, enjuágala y aplástala para que ocupe menos. Puedes dejarle la tapa.',
    claves: ['pet', 'gaseosa', 'agua', 'jugo', 'envase', 'botella plastica'],
    ia: ['a plastic bottle', 'an empty plastic water bottle', 'a plastic soda bottle', 'a crushed plastic bottle', 'a plastic bottle with a little leftover drink'],
  },
  {
    id: 'tapa-plastica', nombre: 'Tapas plásticas', emoji: '🔘', caneca: 'blanca',
    consejo: 'Júntalas dentro de una botella o entrégalas en campañas de recolección de tapitas.',
    claves: ['tapita', 'tapas', 'tapa de gaseosa'],
    ia: ['a plastic bottle cap', 'a pile of plastic bottle caps'],
  },
  {
    id: 'envase-plastico', nombre: 'Envase de champú, jabón o detergente', emoji: '🧴', caneca: 'blanca',
    consejo: 'Escúrrelo bien y enjuágalo. Va con todo y tapa.',
    claves: ['shampoo', 'champu', 'detergente', 'suavizante', 'limpido', 'cloro', 'tarro', 'galon', 'garrafa'],
    ia: ['a plastic shampoo bottle', 'a plastic detergent bottle', 'an empty plastic jug', 'a plastic bottle of cleaning product'],
  },
  {
    id: 'bolsa-plastica', nombre: 'Bolsa plástica limpia', emoji: '🛍️', caneca: 'blanca',
    consejo: 'Solo si está limpia y seca. Mete varias dentro de una sola para que no se vuelen.',
    claves: ['bolsa', 'chuspa', 'talego', 'plastico', 'empaque', 'envoltura transparente', 'vinipel'],
    ia: ['a plastic bag', 'a plastic shopping bag', 'a crumpled plastic bag', 'a transparent plastic bag'],
  },
  {
    id: 'bolsa-leche', nombre: 'Bolsa de leche', emoji: '🥛', caneca: 'blanca',
    consejo: 'Ábrela, enjuágala y déjala escurrir antes de guardarla con el plástico.',
    claves: ['leche', 'bolsa de leche', 'bolsa de agua', 'bolsa de yogurt'],
    ia: ['a plastic bag of milk', 'an empty plastic milk pouch'],
  },
  {
    id: 'recipiente-plastico', nombre: 'Vasos y recipientes plásticos limpios', emoji: '🥤', caneca: 'blanca',
    consejo: 'Enjuágalos. Si están muy sucios de comida y no puedes lavarlos, van a la negra.',
    claves: ['vaso', 'tarrina', 'portacomidas', 'coca', 'yogurt', 'desechable limpio', 'envase de helado', 'tarro'],
    ia: ['a clear plastic cup', 'an empty plastic food container', 'an empty yogurt cup', 'a plastic takeout container with a lid'],
  },
  {
    id: 'plastico-rigido', nombre: 'Baldes, platones y juguetes de plástico', emoji: '🧸', caneca: 'blanca',
    consejo: 'El plástico duro sí se recicla. Quítale las pilas o partes metálicas si las tiene.',
    claves: ['balde', 'platon', 'juguete', 'silla plastica', 'gancho de ropa', 'canasta', 'plastico duro'],
    ia: ['a plastic bucket', 'a broken plastic toy', 'a plastic basin', 'a plastic clothes hanger'],
  },
  {
    id: 'botella-vidrio', nombre: 'Botella de vidrio', emoji: '🍾', caneca: 'blanca',
    consejo: 'Vacíala y enjuágala. Entrégala entera, con cuidado de no romperla.',
    claves: ['cerveza', 'vino', 'aguardiente', 'gaseosa de vidrio', 'envase de vidrio', 'vidrio'],
    ia: ['a glass bottle', 'an empty beer bottle', 'an empty wine bottle', 'a glass soda bottle'],
  },
  {
    id: 'frasco-vidrio', nombre: 'Frasco de vidrio', emoji: '🍯', caneca: 'blanca',
    consejo: 'Lávalo y quítale los restos de comida. La tapa metálica también va en la blanca.',
    claves: ['mermelada', 'salsa', 'conserva', 'compota', 'cafe', 'tarro de vidrio', 'vidrio'],
    ia: ['a glass jar', 'an empty glass jar with a metal lid', 'an empty jam jar'],
  },
  {
    id: 'lata-bebida', nombre: 'Lata de gaseosa o cerveza', emoji: '🥫', caneca: 'blanca',
    consejo: 'Vacíala y aplástala. El aluminio se puede reciclar una y otra vez.',
    claves: ['aluminio', 'lata', 'cerveza', 'gaseosa', 'energizante', 'metal'],
    ia: ['an aluminum soda can', 'an empty beer can', 'a crushed aluminum can', 'an empty soft drink can'],
  },
  {
    id: 'lata-conserva', nombre: 'Lata de atún o enlatados', emoji: '🥫', caneca: 'blanca',
    consejo: 'Enjuágala para quitarle el aceite o la salsa y ten cuidado con el borde.',
    claves: ['atun', 'sardinas', 'enlatado', 'hojalata', 'leche condensada', 'salchichas', 'metal', 'lata'],
    ia: ['an empty tin can', 'an open tuna can', 'a steel food can', 'an empty sardine tin'],
  },
  {
    id: 'papel-aluminio', nombre: 'Papel aluminio limpio', emoji: '✨', caneca: 'blanca',
    consejo: 'Hazlo una bola. Si quedó con grasa o comida pegada, va a la negra.',
    claves: ['aluminio', 'foil', 'bandeja de aluminio'],
    ia: ['a ball of aluminum foil', 'a crumpled sheet of aluminum foil', 'an aluminum foil tray'],
  },
  {
    id: 'chatarra', nombre: 'Ollas, sartenes y chatarra', emoji: '🍳', caneca: 'blanca',
    consejo: 'Los metales se reciclan. Si es muy grande, entrégaselo directamente al reciclador.',
    claves: ['olla', 'sarten', 'metal', 'hierro', 'cobre', 'alambre', 'tornillos', 'cubiertos metalicos', 'llaves', 'puntillas'],
    ia: ['an old metal cooking pot', 'an old frying pan', 'a pile of scrap metal', 'metal wire and screws'],
  },
  {
    id: 'papel', nombre: 'Hojas de papel', emoji: '📄', caneca: 'blanca',
    consejo: 'Limpio y seco. Mejor sin arrugar: así le sirve más al reciclador.',
    claves: ['hoja', 'papel bond', 'impresion', 'fotocopia', 'sobre', 'carpeta', 'papel de archivo', 'papel arrugado'],
    ia: ['a sheet of white paper', 'a stack of printed office paper', 'a crumpled ball of white paper', 'a paper envelope'],
  },
  {
    id: 'periodico', nombre: 'Periódicos y revistas', emoji: '📰', caneca: 'blanca',
    consejo: 'Amárralos o guárdalos en una bolsa para que no se mojen.',
    claves: ['periodico', 'revista', 'volante', 'catalogo', 'directorio', 'papel'],
    ia: ['an old newspaper', 'a stack of newspapers', 'a magazine', 'a printed flyer'],
  },
  {
    id: 'cuaderno', nombre: 'Cuadernos y libros viejos', emoji: '📚', caneca: 'blanca',
    consejo: 'Si todavía sirven, dónalos. Si no, van completos a la blanca.',
    claves: ['cuaderno', 'libro', 'agenda', 'libreta', 'papel'],
    ia: ['an old spiral notebook', 'an old worn book', 'a used school notebook'],
  },
  {
    id: 'carton', nombre: 'Caja de cartón', emoji: '📦', caneca: 'blanca',
    consejo: 'Desármala y aplánala. Tiene que estar seca y sin restos de comida.',
    claves: ['carton', 'caja', 'empaque', 'corrugado', 'caja de zapatos', 'caja de cereal'],
    ia: ['a cardboard box', 'a flattened cardboard box', 'a piece of corrugated cardboard', 'an empty cereal box'],
  },
  {
    id: 'cubeta-huevos', nombre: 'Cubeta de huevos de cartón', emoji: '📦', caneca: 'blanca',
    consejo: 'Si está limpia y seca se recicla como cartón.',
    claves: ['cubeta', 'panal de huevos', 'bandeja de huevos', 'carton'],
    ia: ['an empty cardboard egg carton', 'a cardboard egg tray'],
  },
  {
    id: 'tubo-carton', nombre: 'Tubo de cartón del papel higiénico', emoji: '📜', caneca: 'blanca',
    consejo: 'El tubo sí se recicla; el papel higiénico usado no.',
    claves: ['tubo', 'rollo', 'canuto', 'carton del papel'],
    ia: ['an empty cardboard toilet paper tube', 'a cardboard paper towel tube'],
  },
  {
    id: 'bolsa-papel', nombre: 'Bolsa de papel', emoji: '🛍️', caneca: 'blanca',
    consejo: 'Limpia y seca. Si quedó con grasa de comida, va a la negra.',
    claves: ['bolsa de papel', 'papel kraft', 'bolsa de pan'],
    ia: ['a brown paper bag', 'a paper shopping bag'],
  },
  {
    id: 'tetrapak', nombre: 'Caja de leche o jugo (Tetra Pak)', emoji: '🧃', caneca: 'blanca',
    consejo: 'Es un envase multicapa: enjuágalo, escúrrelo y aplánalo.',
    claves: ['tetrapak', 'tetra pak', 'multicapa', 'caja de leche', 'caja de jugo', 'carton de leche'],
    ia: ['a milk carton', 'a juice box', 'an empty Tetra Pak beverage carton', 'a flattened milk carton'],
  },

  // ───────────────────────── NEGRA · no aprovechables ─────────────────────────
  {
    id: 'papel-higienico', nombre: 'Papel higiénico', emoji: '🧻', caneca: 'negra',
    consejo: 'Usado nunca se recicla. Va siempre a la negra, en bolsa bien cerrada.',
    claves: ['papel de bano', 'papel sanitario', 'bano', 'papel higienico'],
    ia: ['used toilet paper', 'a wad of used toilet paper', 'a roll of toilet paper'],
  },
  {
    id: 'servilleta', nombre: 'Servilletas y pañuelos usados', emoji: '🤧', caneca: 'negra',
    consejo: 'El papel sucio o mojado ya no se puede reciclar.',
    claves: ['servilleta', 'panuelo', 'kleenex', 'papel de cocina', 'toalla de papel', 'toalla de manos'],
    ia: ['a used paper napkin', 'a dirty crumpled napkin', 'a used tissue', 'a used paper towel'],
  },
  {
    id: 'panal', nombre: 'Pañales y pañitos húmedos', emoji: '👶', caneca: 'negra',
    consejo: 'Envuelve el pañal sobre sí mismo y ciérralo con sus cintas.',
    claves: ['panal', 'panal desechable', 'panitos humedos', 'toallitas humedas'],
    ia: ['a used disposable diaper', 'a rolled up dirty diaper', 'used wet wipes'],
  },
  {
    id: 'toalla-higienica', nombre: 'Toallas higiénicas y protectores', emoji: '🚺', caneca: 'negra',
    consejo: 'Envuélvelas en su empaque o en papel antes de botarlas.',
    claves: ['toalla higienica', 'tampon', 'protector', 'toalla sanitaria'],
    ia: ['a sanitary pad', 'a used sanitary napkin', 'a tampon'],
  },
  {
    id: 'colilla', nombre: 'Colillas de cigarrillo', emoji: '🚬', caneca: 'negra',
    consejo: 'Apágala bien antes de botarla. Nunca al piso ni al sifón.',
    claves: ['cigarrillo', 'colilla', 'cenizas', 'chicote'],
    ia: ['a cigarette butt', 'a pile of cigarette butts', 'an ashtray full of cigarette butts'],
  },
  {
    id: 'chicle', nombre: 'Chicle', emoji: '🍬', caneca: 'negra',
    consejo: 'Envuélvelo en un papelito y a la negra. Nunca al piso.',
    claves: ['chicle', 'goma de mascar'],
    ia: ['a piece of chewed gum', 'chewed chewing gum in a wrapper'],
  },
  {
    id: 'paquete-mecato', nombre: 'Paquetes de mecato y envolturas', emoji: '🍫', caneca: 'negra',
    consejo: 'Los empaques metalizados de papas, galletas y dulces no se reciclan en la ruta normal.',
    claves: ['mecato', 'papas', 'paquete', 'envoltura', 'dulce', 'galletas', 'chocolatina', 'metalizado', 'empaque de papas', 'bombon'],
    ia: ['an empty potato chip bag', 'a shiny snack wrapper', 'a candy wrapper', 'an empty chocolate bar wrapper', 'an empty cookie package'],
  },
  {
    id: 'icopor', nombre: 'Icopor (bandejas, vasos, portacomidas)', emoji: '🥡', caneca: 'negra',
    consejo: 'Casi nunca se recicla y suele estar sucio de comida. Si en tu ciudad lo reciben limpio, entrégalo aparte.',
    claves: ['icopor', 'poliestireno', 'bandeja', 'caja de almuerzo', 'vaso de icopor'],
    ia: ['a styrofoam food container', 'a white styrofoam tray', 'a styrofoam cup', 'a dirty foam takeout box'],
  },
  {
    id: 'vaso-cafe', nombre: 'Vaso de cartón para café o gaseosa', emoji: '☕', caneca: 'negra',
    consejo: 'Tiene una capa plástica por dentro y queda sucio: no se recicla.',
    claves: ['vaso de carton', 'vaso de cafe', 'vaso desechable', 'tinto'],
    ia: ['a disposable paper coffee cup', 'a used paper cup with a plastic lid', 'a fast food paper cup'],
  },
  {
    id: 'desechables-sucios', nombre: 'Cubiertos, platos y pitillos desechables', emoji: '🍴', caneca: 'negra',
    consejo: 'Usados y sucios no se reciclan. Mejor evita los de un solo uso.',
    claves: ['cubiertos', 'tenedor', 'cuchara', 'pitillo', 'plato desechable', 'mezclador', 'palillos'],
    ia: ['a used plastic fork', 'dirty plastic cutlery', 'a plastic drinking straw', 'a dirty disposable plate'],
  },
  {
    id: 'carton-sucio', nombre: 'Caja de pizza o cartón con grasa', emoji: '🍕', caneca: 'negra',
    consejo: 'El papel y el cartón sucios de comida no se reciclan. Si la tapa está limpia, sepárala y llévala a la blanca.',
    claves: ['pizza', 'carton sucio', 'papel sucio', 'grasa', 'papel parafinado', 'empaque de hamburguesa'],
    ia: ['a greasy pizza box', 'an empty pizza box with grease stains', 'a greasy paper food wrapper', 'a dirty fast food box'],
  },
  {
    id: 'vidrio-roto', nombre: 'Vidrio roto, espejos y cerámica', emoji: '⚠️', caneca: 'negra',
    consejo: 'Envuélvelo en papel o cartón y márcalo «vidrio roto» para que nadie se corte.',
    claves: ['vidrio roto', 'espejo', 'ceramica', 'porcelana', 'plato roto', 'vaso roto', 'pocillo', 'loza'],
    ia: ['broken glass shards', 'a broken ceramic plate', 'a broken mirror', 'a broken coffee mug'],
  },
  {
    id: 'tapabocas', nombre: 'Tapabocas', emoji: '😷', caneca: 'negra',
    consejo: 'Córtale las tiras para que no enreden animales y bótalo en la negra.',
    claves: ['tapabocas', 'mascarilla', 'cubrebocas', 'n95'],
    ia: ['a used surgical face mask', 'a disposable face mask', 'a used N95 mask'],
  },
  {
    id: 'guantes', nombre: 'Guantes desechables', emoji: '🧤', caneca: 'negra',
    consejo: 'Quítatelos al revés para que lo sucio quede por dentro.',
    claves: ['guantes', 'latex', 'nitrilo'],
    ia: ['a used disposable latex glove', 'blue nitrile gloves'],
  },
  {
    id: 'cepillo-dientes', nombre: 'Cepillo de dientes y crema dental', emoji: '🦷', caneca: 'negra',
    consejo: 'Mezclan varios materiales que no se pueden separar.',
    claves: ['cepillo', 'crema dental', 'tubo de crema', 'seda dental', 'hilo dental'],
    ia: ['an old toothbrush', 'an empty toothpaste tube', 'dental floss'],
  },
  {
    id: 'esponja', nombre: 'Esponjas y trapos sucios', emoji: '🧽', caneca: 'negra',
    consejo: 'Cuando ya no sirven para limpiar, van a la negra.',
    claves: ['esponja', 'esponjilla', 'trapo', 'limpion', 'bayetilla', 'sabra'],
    ia: ['a dirty kitchen sponge', 'a dirty cleaning rag', 'a worn out scouring pad'],
  },
  {
    id: 'barrido', nombre: 'Polvo y barrido', emoji: '🧹', caneca: 'negra',
    consejo: 'Lo que recoges con la escoba va a la negra.',
    claves: ['polvo', 'barrido', 'mugre', 'tierra', 'pelusa', 'cabello'],
    ia: ['a pile of dust and dirt swept from the floor', 'a dustpan full of dust', 'a clump of hair and lint'],
  },
  {
    id: 'algodon', nombre: 'Algodón, copitos y curitas', emoji: '🩹', caneca: 'negra',
    consejo: 'Los residuos de aseo personal y curaciones del hogar van a la negra.',
    claves: ['algodon', 'copitos', 'curita', 'gasa', 'esparadrapo', 'hisopo'],
    ia: ['used cotton swabs', 'used cotton balls', 'a used adhesive bandage', 'a used gauze pad'],
  },
  {
    id: 'afeitadora', nombre: 'Máquina de afeitar desechable', emoji: '🪒', caneca: 'negra',
    consejo: 'Ponle el protector o envuélvela para que no corte a nadie.',
    claves: ['afeitar', 'cuchilla', 'rasuradora', 'prestobarba'],
    ia: ['a disposable razor', 'a used plastic shaving razor'],
  },
  {
    id: 'lapicero', nombre: 'Lapiceros y marcadores', emoji: '🖊️', caneca: 'negra',
    consejo: 'Mezclan plástico, metal y tinta, por eso no entran en la ruta de reciclaje.',
    claves: ['lapicero', 'esfero', 'marcador', 'resaltador', 'boligrafo', 'lapiz', 'colores', 'borrador'],
    ia: ['a ballpoint pen', 'a dried out marker pen', 'a pile of old pens and pencils'],
  },
  {
    id: 'recibo', nombre: 'Recibos y papel plastificado', emoji: '🧾', caneca: 'negra',
    consejo: 'El papel térmico de las facturas, el plastificado y las fotos no se reciclan.',
    claves: ['recibo', 'factura', 'tirilla', 'papel termico', 'foto', 'papel carbon', 'stickers', 'cinta'],
    ia: ['a paper receipt', 'a crumpled store receipt', 'a long cash register receipt'],
  },
  {
    id: 'ropa-vieja', nombre: 'Ropa y zapatos muy dañados', emoji: '👟', caneca: 'negra',
    consejo: 'Si todavía sirven, dónalos o regálalos. Solo lo que ya no tiene arreglo va a la negra.',
    claves: ['ropa', 'zapatos', 'tenis', 'camiseta', 'medias', 'tela', 'textil', 'retazos'],
    ia: ['an old worn out shoe', 'a torn old t-shirt', 'a pile of old clothes', 'a pair of old socks'],
  },
  {
    id: 'desechos-mascota', nombre: 'Desechos de mascotas', emoji: '🐶', caneca: 'negra',
    consejo: 'Recógelos en una bolsa bien amarrada. La arena del gato también va aquí.',
    claves: ['popo', 'excremento', 'perro', 'gato', 'arena de gato', 'heces'],
    ia: ['a tied bag of dog poop', 'used cat litter'],
  },

  // ───────────────────────── VERDE · orgánicos aprovechables ─────────────────────────
  {
    id: 'cascara-banano', nombre: 'Cáscara de banano o plátano', emoji: '🍌', caneca: 'verde',
    consejo: 'Sirve para hacer compost o abono.',
    claves: ['banano', 'platano', 'cascara', 'guineo', 'topocho'],
    ia: ['a banana peel', 'a brown banana peel', 'a plantain peel'],
  },
  {
    id: 'cascaras-fruta', nombre: 'Cáscaras de fruta', emoji: '🍊', caneca: 'verde',
    consejo: 'Naranja, mandarina, limón, mango, piña, sandía… todas van a la verde.',
    claves: ['naranja', 'mandarina', 'limon', 'mango', 'pina', 'sandia', 'papaya', 'maracuya', 'cascaras', 'fruta'],
    ia: ['orange peels', 'a pile of fruit peels', 'squeezed lemon halves', 'a mango peel', 'a watermelon rind'],
  },
  {
    id: 'fruta-danada', nombre: 'Fruta dañada o sobrante', emoji: '🍎', caneca: 'verde',
    consejo: 'Sin stickers ni bolsas. El corazón de la manzana también va aquí.',
    claves: ['fruta', 'manzana', 'podrida', 'pasada', 'corazon de manzana', 'tomate'],
    ia: ['a rotten apple', 'an apple core', 'a rotten fruit', 'a half eaten fruit', 'a moldy tomato'],
  },
  {
    id: 'restos-verdura', nombre: 'Restos de verduras', emoji: '🥬', caneca: 'verde',
    consejo: 'Cáscaras de papa, yuca, zanahoria o cebolla y hojas de lechuga: todo a la verde.',
    claves: ['verdura', 'papa', 'yuca', 'zanahoria', 'cebolla', 'lechuga', 'repollo', 'tomate', 'cascara de papa', 'ahuyama'],
    ia: ['vegetable scraps', 'potato peels', 'onion skins', 'carrot peelings', 'wilted lettuce leaves'],
  },
  {
    id: 'cascara-huevo', nombre: 'Cáscaras de huevo', emoji: '🥚', caneca: 'verde',
    consejo: 'Trituradas le aportan calcio al compost.',
    claves: ['huevo', 'cascara de huevo', 'cascaron'],
    ia: ['broken eggshells', 'a cracked empty eggshell', 'a pile of eggshells'],
  },
  {
    id: 'restos-comida', nombre: 'Sobras de comida', emoji: '🍛', caneca: 'verde',
    consejo: 'Arroz, pasta, pan, arepa… Escurre los líquidos y no las mezcles con empaques.',
    claves: ['sobras', 'comida', 'arroz', 'pasta', 'pan', 'arepa', 'sopa', 'almuerzo', 'sobrados', 'lavaza'],
    ia: ['leftover food scraps on a plate', 'leftover rice', 'leftover pasta', 'a piece of stale bread', 'food waste'],
  },
  {
    id: 'huesos', nombre: 'Huesos y espinas', emoji: '🍗', caneca: 'verde',
    consejo: 'Son restos de comida. Si tu ruta de orgánicos solo recibe vegetales, bótalos en la negra.',
    claves: ['hueso', 'huesos de pollo', 'espinas', 'pescado', 'costilla'],
    ia: ['chicken bones on a plate', 'leftover meat bones', 'fish bones'],
  },
  {
    id: 'cuncho-cafe', nombre: 'Cuncho de café y bolsitas de té', emoji: '🍵', caneca: 'verde',
    consejo: 'El cuncho y el filtro de papel son muy buenos para el compost.',
    claves: ['cafe', 'cuncho', 'borra', 'filtro', 'te', 'aromatica', 'bolsita de te'],
    ia: ['used coffee grounds', 'a used paper coffee filter with grounds', 'a used tea bag'],
  },
  {
    id: 'poda', nombre: 'Hojas secas, flores y poda', emoji: '🍂', caneca: 'verde',
    consejo: 'Césped cortado, ramas pequeñas, hojas y flores marchitas.',
    claves: ['hojas', 'flores', 'pasto', 'cesped', 'poda', 'ramas', 'jardin', 'planta', 'matas'],
    ia: ['a pile of dry leaves', 'wilted flowers', 'grass clippings', 'cut tree branches', 'a dead dried plant'],
  },
  {
    id: 'tusa', nombre: 'Tusas y amero de mazorca', emoji: '🌽', caneca: 'verde',
    consejo: 'Son desechos agrícolas: van a la verde.',
    claves: ['mazorca', 'tusa', 'amero', 'maiz', 'choclo', 'capacho'],
    ia: ['a corn cob', 'an eaten corn cob', 'corn husks'],
  },
  {
    id: 'semillas', nombre: 'Pepas y semillas', emoji: '🥑', caneca: 'verde',
    consejo: 'Pepa de aguacate o de mango, semillas y cáscaras de maní o de coco.',
    claves: ['pepa', 'semilla', 'aguacate', 'mango', 'durazno', 'mani', 'coco', 'cascara de mani'],
    ia: ['an avocado pit', 'a mango seed', 'peanut shells', 'fruit pits and seeds'],
  },

  // ───────────────────────── ESPECIAL · peligrosos y posconsumo ─────────────────────────
  {
    id: 'pilas', nombre: 'Pilas y baterías pequeñas', emoji: '🔋', caneca: 'especial',
    consejo: 'Guárdalas en un frasco y llévalas a un contenedor de «Pilas con el Ambiente» (hay en supermercados y almacenes).',
    claves: ['pila', 'bateria', 'pilas', 'aa', 'aaa', 'pila de reloj', 'recargable', 'bateria de celular'],
    ia: ['AA batteries', 'a small cylindrical alkaline battery', 'a pile of old batteries', 'a button cell battery', 'a 9 volt battery'],
  },
  {
    id: 'medicamentos', nombre: 'Medicamentos vencidos', emoji: '💊', caneca: 'especial',
    consejo: 'Con todo y empaque, llévalos a un contenedor «Punto Azul» en droguerías y supermercados.',
    claves: ['medicamento', 'pastillas', 'remedio', 'jarabe', 'droga', 'blister', 'vencido', 'pastas', 'ampolletas'],
    ia: ['a blister pack of pills', 'a medicine bottle', 'a box of expired medicine', 'a bottle of cough syrup', 'loose pills and capsules'],
  },
  {
    id: 'bombillos', nombre: 'Bombillos y tubos fluorescentes', emoji: '💡', caneca: 'especial',
    consejo: 'Sin romperlos, llévalos a un punto del programa «Lúmina». Los ahorradores y los tubos contienen mercurio.',
    claves: ['bombillo', 'bombilla', 'foco', 'lampara', 'tubo fluorescente', 'ahorrador', 'led'],
    ia: ['a light bulb', 'a compact fluorescent light bulb', 'a fluorescent tube lamp', 'a burnt out LED bulb'],
  },
  {
    id: 'celulares', nombre: 'Celulares, cargadores y cables', emoji: '📱', caneca: 'especial',
    consejo: 'Son residuos electrónicos (RAEE). Llévalos a un punto de recolección de aparatos; muchas tiendas de tecnología los reciben.',
    claves: ['celular', 'telefono', 'cargador', 'cable', 'audifonos', 'raee', 'electronico', 'control remoto', 'usb', 'tablet'],
    ia: ['an old broken cell phone', 'a phone charger and tangled cables', 'a pair of old earphones', 'a TV remote control', 'a smartphone with a cracked screen'],
  },
  {
    id: 'computadores', nombre: 'Computadores, impresoras y periféricos', emoji: '💻', caneca: 'especial',
    consejo: 'Entrégalos al programa «EcoCómputo» o en jornadas de recolección de residuos electrónicos.',
    claves: ['computador', 'portatil', 'teclado', 'mouse', 'impresora', 'monitor', 'cartucho', 'toner', 'tarjeta', 'cpu', 'disco duro', 'raee'],
    ia: ['an old broken laptop', 'a computer keyboard', 'a computer mouse', 'a green circuit board', 'a printer ink cartridge'],
  },
  {
    id: 'electrodomesticos', nombre: 'Electrodomésticos dañados', emoji: '🔌', caneca: 'especial',
    consejo: 'Licuadoras, planchas, ventiladores o neveras: entrégalos a un programa posconsumo como «Red Verde» o a un gestor autorizado.',
    claves: ['licuadora', 'plancha', 'nevera', 'ventilador', 'televisor', 'microondas', 'secador', 'radio', 'electrodomestico', 'raee'],
    ia: ['a broken blender', 'an old clothes iron', 'a broken electric fan', 'an old television', 'a broken hair dryer'],
  },
  {
    id: 'aceite-cocina', nombre: 'Aceite de cocina usado', emoji: '🛢️', caneca: 'especial',
    consejo: 'Nunca por el sifón. Déjalo enfriar, guárdalo en una botella plástica con tapa y llévalo a un punto de recolección de aceite usado.',
    claves: ['aceite', 'aceite usado', 'fritura', 'manteca', 'grasa'],
    // Sin la palabra "bottle": si no, cualquier botella con un resto de gaseosa parecería aceite.
    ia: ['a frying pan full of used cooking oil', 'a container of dark used frying oil'],
  },
  {
    id: 'jeringas', nombre: 'Jeringas y agujas', emoji: '💉', caneca: 'especial',
    consejo: 'Guárdalas en un recipiente duro con tapa (un tarro plástico grueso) y pregunta en tu droguería o centro de salud dónde entregarlas.',
    claves: ['jeringa', 'aguja', 'lanceta', 'insulina', 'cortopunzante'],
    ia: ['a used syringe', 'a hypodermic needle', 'insulin syringes'],
  },
  {
    id: 'quimicos', nombre: 'Insecticidas, pinturas y químicos', emoji: '🧪', caneca: 'especial',
    consejo: 'Son residuos peligrosos. No los vacíes ni los quemes: entrégalos en un punto posconsumo o en una jornada de recolección.',
    claves: ['insecticida', 'veneno', 'plaguicida', 'quimico', 'thinner', 'pintura', 'aerosol', 'varsol', 'pegante', 'matacucarachas'],
    ia: ['a can of insecticide spray', 'a pesticide container', 'an old paint can', 'an aerosol spray can', 'a metal can of paint thinner'],
  },
  {
    id: 'llantas', nombre: 'Llantas usadas', emoji: '🚗', caneca: 'especial',
    consejo: 'Devuélvelas en el montallantas o almacén donde compres las nuevas, o en un punto de recolección de llantas.',
    claves: ['llanta', 'neumatico', 'caucho', 'rueda'],
    ia: ['an old car tire', 'a pile of used tires', 'a worn motorcycle tire'],
  },
  {
    id: 'bateria-carro', nombre: 'Batería de carro o moto', emoji: '🚙', caneca: 'especial',
    consejo: 'Contiene plomo y ácido. Entrégala donde compres la nueva.',
    claves: ['bateria de carro', 'bateria de moto', 'plomo', 'acumulador'],
    ia: ['a car battery', 'an old lead acid battery', 'a motorcycle battery'],
  },
];

// Plantillas con las que se arma cada frase antes de convertirla en vector.
// Promediar varias plantillas ("prompt ensembling") hace más estable al modelo.
export const PLANTILLAS = [
  'a photo of {}.',
  'a close-up photo of {}.',
  'a photo of a hand holding {}.',
  'a photo of {} thrown away as garbage.',
  'a photo of {} on a table.',
];

// Escenas que NO son un residuo. Sirven para que la app sepa decir "no veo nada que botar".
export const FONDO = [
  'a photo of an empty floor.',
  'a photo of a tiled floor.',
  'a photo of a blank wall.',
  'a photo of an empty table.',
  'a photo of a ceiling.',
  'a photo of a room interior.',
  'a photo of a window.',
  'a photo of a door.',
  'a photo of a chair.',
  'a photo of a bed.',
  "a photo of a person's face.",
  'a selfie of a person.',
  'a photo of a person standing.',
  'a photo of an empty open hand.',
  'a photo of a street with buildings.',
  'a photo of the sky.',
  'a photo of a living tree in a garden.',
  'a photo of a pet dog.',
  'a photo of a cat.',
  'a photo of a car.',
  'a photo of a trash can.',
  'a photo of colored recycling bins.',
  'a blurry out of focus photo.',
  'a completely dark photo.',
];

const porId = new Map(RESIDUOS.map((r) => [r.id, r]));

export function residuoPorId(id) {
  return porId.get(id) || null;
}

/** Quita tildes y mayúsculas para comparar textos ("Cáscara" → "cascara"). */
export function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const indice = RESIDUOS.map((r) => ({
  residuo: r,
  nombre: normalizar(r.nombre),
  claves: r.claves.map(normalizar),
}));

/**
 * Buscador por texto. Devuelve los residuos ordenados del más al menos parecido.
 * `caneca` (opcional) limita la búsqueda a una sola caneca.
 */
export function buscarResiduos(consulta, caneca = null) {
  const q = normalizar(consulta);
  const palabras = q.split(' ').filter(Boolean);
  const resultados = [];
  for (const item of indice) {
    if (caneca && item.residuo.caneca !== caneca) continue;
    if (!palabras.length) {
      resultados.push({ residuo: item.residuo, puntos: 0 });
      continue;
    }
    let puntos = 0;
    let todas = true;
    for (const p of palabras) {
      let mejor = 0;
      if (item.nombre.startsWith(p)) mejor = 5;
      else if (item.nombre.split(' ').some((w) => w.startsWith(p))) mejor = 4;
      else if (item.nombre.includes(p)) mejor = 3;
      for (const c of item.claves) {
        if (c === p) mejor = Math.max(mejor, 4);
        else if (c.startsWith(p) || c.split(' ').some((w) => w.startsWith(p))) mejor = Math.max(mejor, 3);
        else if (p.length >= 3 && c.includes(p)) mejor = Math.max(mejor, 2);
      }
      if (!mejor) {
        todas = false;
        break;
      }
      puntos += mejor;
    }
    if (todas) resultados.push({ residuo: item.residuo, puntos });
  }
  resultados.sort((a, b) => b.puntos - a.puntos);
  return resultados.map((x) => x.residuo);
}
