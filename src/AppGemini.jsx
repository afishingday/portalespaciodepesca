import React, { useState } from 'react';
import { 
  Fish, Waves, Map, Anchor, Crosshair, Droplets, AlertTriangle, 
  BookOpen, Menu, X, ChevronDown, Book, Target, 
  ClipboardList, BrainCircuit, Save, CheckCircle2,
  Sun, CloudRain, Palette, Ruler, Download, Zap, Compass,
  Clock, PlusCircle, Lightbulb, Users, Share2, MessageSquare, Search, Award
} from 'lucide-react';

const SITE_NAME = 'Portal Comunitario Espacio de Pesca';
const SITE_WORDMARK_PRIMARY = 'Portal Comunitario';
const SITE_WORDMARK_ACCENT = 'Espacio de Pesca';
const SITE_DATA_EXPORT_FILENAME = 'Portal_Comunitario_Espacio_de_Pesca_Data.csv';

// --- BASE DE DATOS MOCK DE CAPTURAS ---
const initialCatches = [
  {
    id: 1,
    fishermanName: 'Miembro Espacio de Pesca',
    species: 'Mojarra Azul',
    location: 'Embalse de Playas - San Agustín',
    waterLevel: 'Bajo',
    waterClarity: 'Sucia',
    weather: 'Soleado',
    lureType: 'Cuchara Blue Fox',
    lureSize: '#2',
    lureColor: 'Plata / Verde',
    rod: 'Shimano Medium 6.6ft',
    reel: 'Daiwa 2000',
    lineThickness: '6 lb (0.10mm)',
    notes: 'Pique agresivo barriendo la orilla a velocidad media. Los peces estaban comiendo cerca a la palizada seca.',
    date: '2023-10-12'
  },
  {
    id: 2,
    fishermanName: 'Carlos A. (Espacio de Pesca)',
    species: 'Picuda / Rubio',
    location: 'Río Cauca - Sector Medio',
    waterLevel: 'Medio',
    waterClarity: 'Normal',
    weather: 'Nublado',
    lureType: 'Cucharilla Mepps',
    lureSize: '#4',
    lureColor: 'Plata',
    rod: 'Medium-Heavy 7ft',
    reel: 'Spinning 3000',
    lineThickness: '20 lb Trenzado + Líder Fluorocarbono',
    notes: 'Lanzando hacia la costura donde la corriente rápida choca con el remanso. Pique y salto acrobático inmediato.',
    date: '2023-11-05'
  }
];

const allTips = [
  "En embalses muy claros (>1.5m), aléjate de la orilla 12m y usa fluorocarbono <15 lb.",
  "Embalse con nivel alto: lanza adentro de los matojos usando plásticos sin plomo.",
  "Sábalo Real: Cuando salte, hazle una 'reverencia' (baja la punta de la vara para no reventar la línea).",
  "Ríos: Busca las 'costuras', esa línea invisible donde el agua rápida choca con el agua lenta. Allí cazan los depredadores.",
  "Bass matutino: Usa Poppers de 7-8cm con ritmo de 'bop, bop' lento.",
  "Dorada y Cachama de Río: Lanza tu cebo simulando el sonido 'plop' de una fruta cayendo desde los árboles de la orilla.",
  "Payara: Su boca es puro hueso. Da 2 o 3 tirones fuertes (hooksets) para clavar el anzuelo al sentir el pique.",
  "Agua Sucia: Barrido de orilla con colores vivos (chartreuse) y recogida lenta.",
  "Sabaleta de Río: El sigilo lo es todo. Lanza río arriba y deja que la corriente baje el señuelo hacia las piedras.",
  "El Pirarucú rola (respira) cada 15-20 min. Lanza detrás de la estela que deja en la superficie."
];

// --- CATÁLOGO COMPLETO Y EXACTO: INSTITUTO ALEXANDER VON HUMBOLDT (78 Especies Combinadas) ---
const nationalSpecies = [
  { name: "Sábalo, tarpón", scientific: "Megalops atlanticus", habitat: "Cuencas del Caribe, Magdalena-Cauca y Pacífico.", description: "Este pez que alcanza un gran tamaño es considerado como el mayor trofeo para un pescador deportivo en agua dulce o salada de climas tropicales. El sábalo cumple ciertas etapas de su vida en agua dulce o salobre antes de salir definitivamente al mar, aunque algunos ejemplares permanecen en los ríos, manglares o ciénagas del área del Caribe y el Magdalena. Ha sido pescado intensamente para consumo, de modo que sus poblaciones no son abundantes y sí de concurrencia esporádica, aunque es posible encontrarlos en etapas inmaduras e incluso algunos ejemplares de gran tamaño, en las ciénagas y ríos que tengan un acceso libre desde el mar. En agua dulce se alimenta principalmente de peces. Se captura principalmente con moscas y señuelos que imiten peces, siempre con anzuelos grandes y fuertes.", methods: "Lanzamiento, pesca con mosca y troleo" },
  { name: "Pirarucú, paiche, arapaima", scientific: "Arapaima gigas", habitat: "Cuenca del Amazonas. Trasplantada a Magdalena-Cauca, Orinoco y Pacífico.", description: "Habitante de los lagos y zonas de los ríos con poca corriente de la Amazonia, sus migraciones son muy cortas de modo que suele pescarse en los mismos sitios. No hay registros de pesca deportiva en su medio natural en Colombia, aunque en Brasil, Guyana y Perú es el objetivo estrella de la pesca en la Amazonia. Se han capturado ejemplares en aguas de la cuenca Magdalena-Cauca, muy probablemente producto de liberaciones voluntarias o involuntarias provenientes de lagunas o estanques de piscicultura o de acuarios, cuando alcanzan un tamaño mediano. Ataca señuelos y moscas que imiten peces pequeños, con líneas y anzuelos fuertes. Su pesca se realiza a pez visto.", methods: "Lanzamiento, pesca con mosca, troleo y fondeo" },
  { name: "Arawana plateada", scientific: "Osteoglossum bicirrhosum", habitat: "Cuenca del Amazonas.", description: "Este pez amazónico ha sido muy apreciado para el consumo y exportación como especie ornamental, también constituye un atractivo significativo para la pesca deportiva en sus aguas nativas. Gran peleador, ataca rápidamente los señuelos y moscas. Se alimenta de peces, invertebrados acuáticos, insectos terrestres y cualquier animal pequeño. Se pesca con señuelos de media agua o de superficie que tengan brillo e imiten peces pequeños, también con moscas que imiten peces o insectos.", methods: "Lanzamiento, pesca con mosca y troleo" },
  { name: "Arawana azul", scientific: "Osteoglossum ferreirai", habitat: "Cuenca del Orinoco (Ríos Bita, Orinoco, Tomo, Tuparro y Vichada).", description: "Es una especie protegida (está en veda) dada su distribución restringida y porque ha sido diezmada por la sobrepesca. Se alimenta de peces pequeños e insectos acuáticos de la superficie del agua, por lo que pesca con señuelos que imiten peces o con moscas que imiten peces o insectos. Algunos pescadores la capturan ocasionalmente en el río Bita y Tomo.", methods: "Lanzamiento, pesca con mosca y troleo" },
  { name: "Sardinata real", scientific: "Pellona castelnaeana", habitat: "Cuencas del Amazonas y Orinoco.", description: "Este pez se encuentra en las partes rápidas de los ríos cerca de las payaras (Hydrolycus spp) y los payarines (Rhaphiodon vulpinus), con quienes realiza sus migraciones. Suele confundirse con Pellona flavipinnis que es de un tamaño menor pero que tiene características morfológicas muy similares, de modo que es difícil diferenciar estas dos especies a simple vista. Se alimenta principalmente de pequeños peces cerca de la superficie o en la parte media de la columna de agua. Es un pez delicado que sufre mucho al ser extraído del agua, se recomienda mucho cuidado y rapidez en su manipulación para liberarlo.", methods: "Lanzamiento, pesca con mosca y troleo" },
  { name: "Sardinata amarilla", scientific: "Pellona flavipinnis", habitat: "Cuencas del Amazonas y Orinoco.", description: "Similar a la sardinata real pero de menor tamaño. Voraz depredador de peces pequeños en corrientes medias.", methods: "Lanzamiento, pesca con mosca, troleo" },
  { name: "Carpa", scientific: "Cyprinus carpio", habitat: "Cuencas del Caribe, Magdalena-Cauca, Orinoco y Pacífico. Altamente presente en el altiplano cundiboyacense.", description: "La carpa fue introducida inicialmente a las represas del altiplano cundiboyacense con el fin de poder capturar un pez de buen tamaño para el consumo humano, y de ahí se dispersó a los ríos y fue llevada a otras represas en Colombia. Es común en casi toda el área del Magdalena-Cauca y en el piedemonte llanero en la Orinoquia. Se adapta a todos los climas, pero no ha prosperado abundantemente en otras cuencas. Es omnívora y se alimenta principalmente de insectos acuáticos, invertebrados, plantas y peces pequeños, sobre todo en etapa larval. Se usa la lombriz de tierra o masas preparadas, aunque con mosca ha tenido cada vez más adeptos. No obstante, se captura principalmente con ninfas e imitaciones de crustáceos en el fondo.", methods: "Pesca con mosca y fondeo" },
  { name: "Mohino, dentón", scientific: "Megaleporinus muyscorum", habitat: "Cuencas del Caribe y Magdalena-Cauca.", description: "Rara vez ataca señuelos debido a la forma en que se alimenta, ya que busca pequeñas presas en las piedras o en el fondo de los ríos, aunque eventualmente come peces muy pequeños que pueden ser imitados con una cuchara o un señuelo pequeño. La pesca a mosca con ninfas suele dar buenos resultados. También come cadáveres de peces que se encuentren en el fondo. El principal método de pesca es con carnada natural (carne, lombriz o insectos), montada en un anzuelo pequeño.", methods: "Lanzamiento, pesca con mosca y fondeo" },
  { name: "Yamú, bocón, sábalo", scientific: "Brycon amazonicus", habitat: "Cuencas del Amazonas y Orinoco.", description: "Aunque es un pez omnívoro, se identifica como una especie deportiva debido a la fuerza de su pelea. Como todos los yamus o bocones, comen mediante mordiscos a sus presas o a los frutos que caen al agua, gracias a sus fuertes dientes. Se le captura con cualquier modalidad de pesca deportiva y con casi cualquier tipo de señuelo o mosca, inclusive con las imitaciones de frutos que caen al agua. Los ejemplares pequeños y medianos que viven en cardúmenes, atacan imitaciones de pequeños peces y de insectos acuáticos. Se encuentran en todo tipo de aguas, aunque son más frecuentes en los ríos, bien sea en pozos o zonas de media corriente. En sus migraciones enfrentan saltos y zonas de aguas blancas pero solo como vías de tránsito.", methods: "Lanzamiento, pesca con mosca, troleo y fondeo" },
  { name: "Sabaleta", scientific: "Brycon henni", habitat: "Cuenca del Magdalena-Cauca y Pacífico.", description: "Es la especie de pez deportivo por excelencia en aguas rápidas de climas medio y medio cálido, con un área de distribución bastante amplia en las tres cordilleras, en los ríos y quebradas de las montañas de los valles del Magdalena y el Cauca. La sabaleta es un pez pequeño y agresivo que ofrece buena pelea con equipos livianos convencionales (spinning o casting) o de mosqueo. Come pequeños peces o invertebrados acuáticos, su pesca deportiva se realiza con cucharillas brillantes pequeñas, señuelos rígidos o con moscas que imiten insectos en etapas inmaduras bajo el agua, aunque también atacan moscas secas que imiten insectos adultos que se han posado en la superficie del agua. Son especialmente productivas las imitaciones de grillos y saltamontes. Localmente en algunas zonas las pescan con largas varas de bambú a las que les amarran una línea de nylon con un anzuelo pequeño en la punta al que le ponen grillos u otros insectos que dejan derivar por la corriente. Esta pesca con anzuelo y carnada natural normalmente se practica para pesca de consumo, no es considerada pesca deportiva.", methods: "Lanzamiento y pesca con mosca" },
  { name: "Sábalo del Patía", scientific: "Brycon meeki", habitat: "Cuencas del Caribe y Pacífico.", description: "Se captura en un intervalo amplio de aguas con temperaturas y caudales diversos, desde quebradas de montaña de aguas templadas hasta ríos grandes de aguas más cálidas en la vertiente del Pacífico. Atacan especialmente señuelos y moscas que imiten peces pequeños o insectos acuáticos.", methods: "Lanzamiento y pesca con mosca" },
  { name: "Dorada, mueluda", scientific: "Brycon moorei", habitat: "Cuencas del Caribe y Magdalena-Cauca.", description: "El famoso ictiólogo Cecil Miles en su libro sobre Los peces del río Magdalena, la describe como '…el pez deportivo por excelencia y en contraste con otros peces del río… ofrece una formidable lucha, digna del más experto aficionado a la caña. Crece a tamaños considerables…' En sus procesos migratorios suele detenerse en los pozos profundos y tranquilos de los ríos en donde puede alimentarse y descansar, y es ahí en donde mejor es su pesca. Se alimenta principalmente de material vegetal que cae al río como frutos y semillas, pero ataca ávidamente señuelos y moscas que imiten pequeños peces, invertebrados o insectos. En donde se prevea que puede haber doradas de buen tamaño, se debe usar un equipo fuerte que permita dominarla en su enérgica pelea ya que tienden a desplazarse con la corriente y hacia zonas rápidas del río cuando han sido clavadas. La mayoría de las doradas adultas y juveniles se desplazan río abajo con las crecientes de la época de lluvias hasta las aguas tranquilas de las ciénagas y lagunas, e inician su migración río arriba cuando las aguas empiezan a descender, aunque algunos ejemplares permanecen en los ríos en la época de lluvias, debido a lo cual su pesca se lleva a cabo en temporada de sequía.", methods: "Lanzamiento, pesca con mosca, troleo y fondeo" },
  { name: "Sabaleta, sábalo", scientific: "Brycon oligolepis", habitat: "Cuencas del Caribe y Pacífico.", description: "Se captura principalmente en ríos pequeños y medianos de aguas limpias y rápidas de la vertiente del Pacífico. Atacan especialmente señuelos y moscas que imiten peces pequeños o insectos acuáticos. Ofrecen una fuerte pelea en relación con su tamaño.", methods: "Lanzamiento y pesca con mosca" },
  { name: "Sabaleta paloma, paloma", scientific: "Brycon rubricauda", habitat: "Cuencas del Magdalena-Cauca.", description: "Es un pez pequeño y agresivo que da una buena pelea con equipos livianos de Spinning o de mosqueo. Se alimenta de peces pequeños e invertebrados acuáticos, por lo tanto su pesca deportiva se realiza usualmente con cucharillas brillantes pequeñas o con moscas que imiten insectos acuáticos.", methods: "Lanzamiento y pesca con mosca" },
  { name: "Sardinata, mueluda llanera", scientific: "Brycon whitei", habitat: "Cuencas del Orinoco.", description: "Se encuentra principalmente en las zonas pedregosas de los ríos del piedemonte llanero antes de que éstos se adentren en la planicie. De hábitos similares a la dorada, es un pez omnívoro que frecuenta los pozos y zonas menos corrientosas de los ríos. Se captura con señuelos y moscas que imiten peces pequeños, insectos acuáticos, crustáceos y frutos que caen al agua, así como señuelos o moscas de colores vivos. Es necesario utilizar equipos, líneas y anzuelos fuertes para su pesca.", methods: "Lanzamiento, pesca con mosca, troleo y fondeo" },
  { name: "Cherna, cachama negra", scientific: "Colossoma macropomum", habitat: "Cuencas del Amazonas y Orinoco. Trasplantada a Magdalena-Cauca.", description: "Este pez que alcanza pesos y medidas considerables, ofrece mucha resistencia al pescador deportivo, lo que la ha convertido en una especie muy buscada. La cherna no suele atacar moscas o señuelos, se pesca normalmente con carnada viva, lombriz o frutos, ya que es un pez omnívoro. Habita las zonas profundas de los ríos grandes en temporada seca, que suelen ser las mismas zonas en que se detiene durante sus migraciones de aguas altas.", methods: "Fondeo" },
  { name: "Cachama, pacu", scientific: "Piaractus brachypomus", habitat: "Cuencas del Amazonas.", description: "Este pez omnívoro, aunque especializado en comer frutos y semillas, se alimenta de pequeños peces e invertebrados. Se le pesca mayormente en fondeo con carnada viva, lombriz o frutos, pero también ataca moscas y señuelos pequeños que imiten peces pequeños, crustáceos o frutos que han caído al agua.", methods: "Lanzamiento, pesca con mosca y fondeo" },
  { name: "Cachama, morocoto", scientific: "Piaractus orinoquensis", habitat: "Cuencas del Orinoco. Trasplantada a Magdalena-Cauca.", description: "Especie utilizada en gran medida para investigación y reproducción en cautiverio para piscicultura de consumo en todo el territorio colombiano. Ha sido trasplantado a las demás áreas hidrográficas con fines de comercialización, pero que prospera en muchos de esos ríos. Se le pesca principalmente con carnada viva, lombriz o frutos pequeños de palma, aunque ataca señuelos y moscas pequeños que imiten peces o frutos.", methods: "Lanzamiento, pesca con mosca y fondeo" },
  { name: "Picuda", scientific: "Salminus affinis", habitat: "Cuencas del Caribe y Magdalena-Cauca.", description: "La picuda es el máximo trofeo para el pescador deportivo en estos ríos debido al tamaño que alcanza y a su fiereza en la pelea. Es el depredador que se encuentra en la cima de la pirámide alimenticia en esta vertiente, de modo que casi cualquier señuelo le llamará la atención ya que se alimenta de peces , anfibios, larvas de insectos acuáticos, crustáceos y hasta pequeños mamíferos. Usualmente se pesca con señuelos y moscas de entre 5 y 15 mm de longitud, que imiten pequeños peces, aunque los colores vivos las atraen igualmente. Son depredadores muy activos que localizan su presa visualmente a una distancia considerable y la atacan a gran velocidad, a veces tras una persecución intensa, de modo que señuelos y moscas de colores y brillos similares a los peces forrajeros, recogidos de manera que simulen uno de estos que huye, van a ser muy productivos. Cuando se alimentan de peces pequeños, normalmente atacan la cola para impedirles que escapen y luego arremeten para comerlos ya inmovilizados, por lo que es importante el uso de un anzuelo en la parte posterior del señuelo o una mosca atada sobre un anzuelo relativamente largo. Los señuelos de superficie que imiten peces heridos o que huyen, o señuelos y moscas que imiten ranas u otros animales terrestres, son una buena opción. Las picudas se desplazan constantemente dentro de una zona del río y tienden a preferir aguas rápidas en donde puedan seguir y capturar peces que no adviertan fácilmente su presencia, no obstante, sus lugares habituales de alimentación son aquellos que provean de algún tipo de cambio en la fuerza del agua.", methods: "Lanzamiento, pesca con mosca y troleo" },
  { name: "Picuda llanera, chojo", scientific: "Salminus hilarii", habitat: "Cuencas del Amazonas y Orinoco.", description: "Habita en los ríos de la Amazonia y la Orinoquia que provienen del piedemonte. Aunque se encuentra en toda la extensión de estas cuencas, los ejemplares adultos de buen tamaño suelen ser capturados en la parte de esos ríos que aún transcurre cerca de las montañas, cuando aún tienen fondos de piedra. Es una especie migratoria que se alimenta principalmente de peces. Al igual que S. affinis, es apreciada por los pescadores deportivos debido a que su pesca y su pelea son muy similares. Se captura con señuelos o moscas que imiten peces locales, aunque también atacan señuelos atractores de colores vivos y fuertes.", methods: "Lanzamiento, pesca con mosca y troleo" },
  { name: "Agujeto", scientific: "Boulengerella cuvieri", habitat: "Cuencas del Amazonas y Orinoco.", description: "Es un cazador agresivo que se encuentra usualmente en los ríos cerca de estructuras como bocas de caños, piedras o ramas, no es visitante habitual de lagunas o esteros. Relativamente común, se pesca simultáneamente con payaras o payarines. Alcanza tallas grandes de hasta un metro de longitud, aunque es frecuente capturarlos de tamaños menores. Ataca señuelos y moscas que imiten peces pequeños o que tengan colores fuertes y llamativos, en la superficie o a media agua.", methods: "Lanzamiento, pesca con mosca y troleo" },
  { name: "Payara", scientific: "Hydrolycus armatus", habitat: "Cuencas del Orinoco.", description: "Pez que habita principalmente en aguas rápidas. Caza por persecución localizando sus presas por la vista, generalmente en los puntos de cambios de aguas al inicio de los correntales o cuando estos se abren a zonas de aguas más tranquilas. Usualmente muerde a sus presas en el abdomen o la cabeza con el fin de inutilizarlas gracias a las heridas que causan sus dientes frontales, para luego asirlas por la cabeza para tragarlas. Se alimenta principalmente de peces de hasta tres cuartas partes de su tamaño, aunque ataca cualquier animal acuático o terrestre que esté en su zona de caza y que pueda identificar como alimento. Se pesca con señuelos y moscas grandes que imiten peces pequeños, y con aquellos que tengan colores fuertes con alto contraste. Realiza migraciones durante la temporada de aguas altas para llegar a afluentes menores en donde se reproduce.", methods: "Lanzamiento, pesca con mosca y troleo" },
  { name: "Payarín, machete", scientific: "Rhaphiodon vulpinus", habitat: "Cuencas del Amazonas y Orinoco.", description: "Erróneamente es considerado como el macho de la payara, cuando en realidad pertenecen a géneros diferentes. Se pescan en las zonas rápidas con señuelos o moscas que imiten peces pequeños, generalmente brillantes. Ofrecen una pelea emocionante con equipo liviano, lo que no siempre se da, ya que suele capturarse accidentalmente cuando se pesca payara, algo que se realiza con equipos más fuertes y pesados.", methods: "Lanzamiento, pesca con mosca y troleo" },
  { name: "Guabina, perro, moncholo", scientific: "Hoplias malabaricus", habitat: "Cuencas del Amazonas, Caribe, Magdalena Cauca, Orinoco y Pacífico.", description: "La especie se distribuye por toda la geografía colombiana. Habita principalmente aguas lénticas o zonas de muy poco caudal de los ríos, en donde se alimenta de pequeños peces y crustáceos que viven en el fondo y en zonas someras. Ataca a sus presas asiéndolas con su enorme boca y sus dientes afilados, y no las suelta hasta que puede engullirlas. Es un pez muy agresivo que atacará casi cualquier mosca o señuelo y que morderá casi cualquier carnada de origen animal que le llegue cerca.", methods: "Lanzamiento, pesca con mosca y fondeo" },
  { name: "Pataló, jetón", scientific: "Ichthyoelephas longirostris", habitat: "Cuencas del Caribe y Magdalena-Cauca.", description: "Se alimenta principalmente de algas y detritos en el fondo de los ríos de aguas rápidas, aunque también se alimenta de peces pequeños e invertebrados, por ello, se pesca con moscas y señuelos pequeños que se dejan derivar por el fondo de las zonas corrientosas y con piedras de los ríos. Debido a que alcanza tamaños considerables y a que se pesca con señuelos pequeños y equipos livianos, su pesca es una de las más demandantes y que requiere de mayor dominio técnico.", methods: "Lanzamiento, pesca con mosca y fondeo" },
  { name: "Chancleto", scientific: "Ageneiosus inermis", habitat: "Cuencas del Amazonas y Orinoco.", description: "Habita zonas profundas y medias de los ríos, es de los pocos silúridos (bagres) que persigue activamente señuelos artificiales o moscas, aunque es común atraparlos con carnada viva a fondo.", methods: "Lanzamiento, fondeo" },
  { name: "Doncella", scientific: "Ageneiosus pardalis", habitat: "Cuencas del Caribe y Magdalena-Cauca.", description: "A diferencia de la mayoría de los Silúridos (bagres) bentónicos, este bagre es pelágico/nadador y ataca señuelos en movimiento, aportando una buena pelea deportiva y carreras veloces.", methods: "Lanzamiento, fondeo, troleo" },
  { name: "Sierra palmera, matacaimán, Sierra negra", scientific: "Oxydoras niger / Megalodoras uranoscopus", habitat: "Cuencas del Amazonas y Orinoco.", description: "Este es un pez de fondo que habita en los pozos profundos y remansos de los grandes ríos. Debido a su dieta basada en detritos, pequeños crustáceos y materia vegetal en descomposición, rara vez ataca señuelos artificiales. Su pesca es netamente a fondo, utilizando carnadas naturales como trozos de pescado, lombrices grandes o vísceras. Ofrece una pelea pesada, apoyándose en la corriente y en su propio peso. Se debe tener extrema precaución al manipularlo debido a la hilera de escudos óseos con espinas afiladas que recorren sus costados, las cuales pueden causar heridas profundas al pescador.", methods: "Fondeo" },
  { name: "Valentón, plumita", scientific: "Brachyplatystoma filamentosum", habitat: "Cuencas del Amazonas y Orinoco.", description: "Es considerado el gigante de los ríos de la Orinoquia y la Amazonia y el trofeo máximo para los pescadores de fondo. Habita en los pozos más profundos, remolinos y debajo de grandes raudales. Su pesca requiere equipos de la más alta resistencia (Heavy Duty), similares a los usados en la pesca de mar, con líneas trenzadas o de monofilamento de gran libraje. Se pesca fondeando grandes carnadas vivas o muertas, como peces enteros (pirañas, nicuros o yamu). La pelea con un valentón adulto es una prueba extrema de fuerza y resistencia, ya que el pez utiliza la fuerte corriente del río a su favor y realiza corridas largas y sostenidas que pueden vaciar un carrete si el freno no está bien calibrado.", methods: "Fondeo" },
  { name: "Apuy", scientific: "Brachyplatystoma juruense", habitat: "Cuencas del Amazonas y Orinoco.", description: "Se encuentra habitualmente en los canales arenosos y pozos profundos de los ríos de llanura y selva. Aunque no alcanza las dimensiones del valentón, es un pez muy fuerte que exige equipos medianos a pesados. Se pesca fondeando trozos de pescado fresco o carnada viva. Durante la pelea, el apuy tiende a buscar el fondo y tratar de enredar la línea en troncos y palizadas sumergidas, por lo que el pescador debe mantener tensión constante.", methods: "Fondeo" },
  { name: "Baboso", scientific: "Brachyplatystoma platynemum", habitat: "Cuencas del Amazonas y Orinoco.", description: "Este bagre es conocido por las grandes distancias que recorre durante sus migraciones reproductivas. Se pesca en las zonas de mayor corriente de los cauces principales usando equipos de fondeo. Una de las particularidades más notables para el pescador deportivo es la textura de su piel, la cual segrega una mucosidad muy abundante y resbaladiza que hace extremadamente difícil su manipulación para la fotografía y posterior liberación. Se recomienda usar guantes especiales y tratar de no sacarlo completamente del agua.", methods: "Fondeo" },
  { name: "Dorado", scientific: "Brachyplatystoma rousseauxii", habitat: "Cuencas del Amazonas y Orinoco.", description: "Un pez migratorio por excelencia que remonta los grandes ríos desde los estuarios hasta el piedemonte andino. Es muy apetecido por su coloración brillante plateada y dorada. Se pesca en las zonas correntosas y pozos utilizando equipos de fondo con carnada blanca (trozos de pez). Su pelea es fuerte y veloz, ofreciendo una excelente experiencia deportiva antes de ser liberado.", methods: "Fondeo" },
  { name: "Camiseto cebra", scientific: "Brachyplatystoma tigrinum", habitat: "Cuenca del Amazonas.", description: "Uno de los bagres más hermosos y buscados por los pescadores deportivos y acuaristas debido a su patrón de rayas oscuras sobre un fondo claro. Frecuenta pozos profundos, aguas sombreadas bajo barrancos y estructuras de madera sumergida. Se pesca a fondo con carnada viva o muerta. Requiere paciencia y a menudo pica mejor en horas de baja luminosidad (amanecer, atardecer o noche).", methods: "Fondeo" },
  { name: "Blancopobre", scientific: "Brachyplatystoma vaillantii", habitat: "Cuencas del Amazonas y Orinoco.", description: "Es un bagre migratorio muy abundante que a menudo se desplaza en grandes cardúmenes. Para el pescador deportivo, ofrece la oportunidad de mantener la actividad constante y obtener múltiples capturas en equipos medianos mientras se está a la espera de los grandes bagres trofeo. Se pesca a fondo usando carnada natural.", methods: "Fondeo" },
  { name: "Mapurito", scientific: "Calophysus macropterus", habitat: "Cuencas del Amazonas y Orinoco.", description: "Pez de fondo de tamaño medio, conocido por su carácter carroñero y oportunista. Es el primero en detectar y llegar a las carnadas que desprenden aceite o sangre en el agua. Ataca rápidamente casi cualquier cebo fondeado (trozos de pescado, vísceras, carne). Es ideal para la pesca con equipos livianos o medianos.", methods: "Fondeo" },
  { name: "Yaque", scientific: "Leiarius marmoratus", habitat: "Cuencas del Amazonas y Orinoco.", description: "Bagre de aspecto inconfundible gracias a su aleta dorsal muy desarrollada y su patrón de coloración moteado. De hábitos predominantemente nocturnos, se refugia durante el día entre palizadas y rocas. La pesca se realiza a fondo con carnada natural y es mucho más productiva en la noche o en aguas de muy baja visibilidad. Ofrece combates intensos con arranques cortos y fuertes.", methods: "Fondeo" },
  { name: "Cajaro", scientific: "Phractocephalus hemioliopterus", habitat: "Cuencas del Amazonas y Orinoco.", description: "Uno de los trofeos bentónicos más emblemáticos de la pesca deportiva debido a su gran volumen, peso y su llamativa coloración oscura en el dorso con una franja lateral y vientre blancos. Se asienta en los pozos profundos y zonas lodosas. Su pesca es estrictamente de fondeo con carnadas grandes (trozos de carne, corazón, peces enteros). Su táctica de pelea consiste en aferrarse al fondo del río con todo su peso, requiriendo que el pescador bombee pacientemente la caña para lograr despegarlo del lecho del río.", methods: "Fondeo" },
  { name: "Nicuro", scientific: "Pimelodus blochii", habitat: "Todas las cuencas.", description: "Es una especie de tamaño pequeño pero de enorme importancia cultural y de subsistencia, protagonista de las famosas 'subiendas'. Deportivamente es muy entretenido para los pescadores principiantes y niños debido a su abundancia y disposición a picar rápidamente carnadas pequeñas fondeadas (lombriz o masas). Se debe tener especial cuidado al desengancharlo por las espinas aserradas en sus aletas que producen heridas dolorosas.", methods: "Fondeo" },
  { name: "Capaz", scientific: "Pimelodus grosskopfii", habitat: "Cuenca del Magdalena-Cauca.", description: "Especie emblemática del Magdalena que, al igual que el nicuro, forma grandes bancos migratorios. Se captura en corrientes medias y rápidas con equipos ligeros de fondo. Su carne es muy apreciada, pero deportivamente ofrece una pesca activa y entretenida con aparejos sutiles.", methods: "Fondeo" },
  { name: "Barbiancho", scientific: "Pinirampus pirinampu", habitat: "Cuencas del Amazonas y Orinoco.", description: "Bagre de coloración plateada que se distingue por sus extensos y aplanados barbillones. A diferencia de otros peces de fondo, es muy activo y veloz. Muerde carnadas vivas o muertas a fondo y en su pelea realiza carreras sorprendentemente rápidas, ofreciendo gran entretenimiento al pescador deportivo.", methods: "Fondeo" },
  { name: "Tigrito", scientific: "Platynematichthys notatus", habitat: "Cuencas del Amazonas y Orinoco.", description: "Es un predador activo que además de ser capturado con carnadas naturales a fondo, tiene la particularidad de atacar señuelos artificiales (especialmente jigs o cranckbaits de hundimiento profundo) que se trabajen cerca del lecho del río. Esta característica lo hace muy atractivo para los pescadores de lanzamiento que buscan variedad de especies.", methods: "Fondeo, Lanzamiento" },
  { name: "Bagre, bagre rayado", scientific: "Pseudoplatystoma magdaleniatum / P. metaense / P. orinocoense / P. tigrinum", habitat: "Cuenca del Magdalena-Cauca, Orinoco y Amazonas.", description: "Grupo de grandes depredadores bentónicos. En el Magdalena (P. magdaleniatum) es una especie amenazada que requiere captura y liberación estricta. Las variantes llaneras y amazónicas ofrecen fuerte pelea en pozos lentos y son trofeos hermosos (algunos con rayas atigradas). Se pescan en remansos, ciénagas y pozos profundos mediante el uso de carnadas vivas, y eventualmente atacan grandes señuelos plásticos rebotados lentamente en el fondo.", methods: "Fondeo, Lanzamiento" },
  { name: "Pintadillo, bagre, bagre rayado", scientific: "Pseudoplatystoma punctifer", habitat: "Cuenca del Amazonas.", description: "Especie amazónica de hermosas manchas. Busca aguas profundas y fondos sombreados.", methods: "Fondeo" },
  { name: "Blanquillo", scientific: "Sorubim cuspicaudus", habitat: "Cuencas del Magdalena-Cauca y Caribe.", description: "Bagre con hocico achatado que se oculta bajo troncos y palizadas.", methods: "Fondeo" },
  { name: "Cucharo", scientific: "Sorubim lima", habitat: "Cuencas del Amazonas y Orinoco.", description: "Primo amazónico/orinocense del blanquillo. Hábitos similares.", methods: "Fondeo" },
  { name: "Paletón", scientific: "Sorubimichthys planiceps", habitat: "Cuencas del Amazonas y Orinoco.", description: "Bagre de hocico muy ancho y aplanado, predador de fondo de inmensa boca.", methods: "Fondeo" },
  { name: "Amarillo, toruno, chontaduro", scientific: "Zungaro zungaro", habitat: "Cuencas del Amazonas y Orinoco.", description: "Coloso de los pozos. Su inmensa masa corporal lo hace uno de los peces más difíciles de subir.", methods: "Fondeo" },
  { name: "Bagresapo", scientific: "Pseudopimelodus schultzi", habitat: "Cuenca del Magdalena-Cauca.", description: "Bagre corto, ancho y muy fuerte para su tamaño. Vive bajo piedras.", methods: "Fondeo" },
  { name: "Capitán", scientific: "Eremophilus mutisii", habitat: "Cuenca del Magdalena-Cauca (altiplano).", description: "Especie de aguas frías sin aletas pélvicas. Caza en el fondo limoso.", methods: "Fondeo" },
  { name: "Trucha", scientific: "Oncorhynchus mykiss", habitat: "Andes, aguas frías de alta montaña.", description: "Especie introducida. Ícono de la pesca con mosca (secas, ninfas). Es ágil y salta fuera del agua.", methods: "Lanzamiento, pesca con mosca" },
  { name: "Oscar, apaiari", scientific: "Astronotus sp.", habitat: "Cuencas del Amazonas y Orinoco.", description: "Es un cíclido territorial y muy voraz que frecuenta las orillas pantanosas y zonas de vegetación colgante en lagunas mansas. Su pesca es muy entretenida con equipos ligeros y ultraligeros, ya que ataca con ferocidad casi cualquier cosa que caiga al agua cerca de su territorio, confundiendo los señuelos con insectos o frutos. Ofrece una pelea tenaz y persistente nadando en círculos.", methods: "Lanzamiento, pesca con mosca" },
  { name: "Mojarra amarilla", scientific: "Caquetaia kraussii", habitat: "Cuencas del Magdalena-Cauca y Caribe.", description: "Depredador implacable de las ciénagas y partes bajas lentas de los ríos. Acecha camuflado entre la maleza acuática y utiliza su inmensa boca protráctil para succionar rápidamente a sus presas. Proporciona una excelente experiencia de pesca deportiva en orillas utilizando equipos ligeros y señuelos pequeños.", methods: "Lanzamiento, pesca con mosca" },
  { name: "Pavón real", scientific: "Cichla intermedia", habitat: "Cuenca del Orinoco.", description: "A diferencia de los demás pavones, esta especie prefiere aguas puras, transparentes y en movimiento (corrientes de morichales y ríos). Es un extraordinario peleador que, al ser enganchado, busca inmediatamente refugio entre las piedras y palizadas del fondo, exigiendo destreza al pescador para evitar que la línea se reviente.", methods: "Lanzamiento, pesca con mosca" },
  { name: "Pavón", scientific: "Cichla monoculus", habitat: "Cuenca del Amazonas.", description: "Típico tucunaré de lagunas aisladas y esteros inundados. Es altamente territorial y brinda un gran espectáculo visual al perseguir agresivamente el señuelo y realizar ataques explosivos en la superficie del agua.", methods: "Lanzamiento, pesca con mosca" },
  { name: "Pavón mariposo", scientific: "Cichla orinocensis", habitat: "Cuenca del Orinoco.", description: "Muy común en morichales y lagunas en forma de herradura (madre-viejas). Es un celoso cuidador de sus nidos y crías, por lo que atacará violentamente por territorialidad. Su pelea es tenaz y sus tres ocelos característicos lo hacen un trofeo muy fotogénico.", methods: "Lanzamiento, pesca con mosca" },
  { name: "Pavón, tucunaré", scientific: "Cichla pleiozona", habitat: "Cuenca del Amazonas.", description: "De hábitos casi idénticos al C. monoculus, es un agresivo habitante de las aguas amazónicas. Su táctica de pelea se basa en dar cabezazos fuertes en la superficie intentando zafarse del anzuelo.", methods: "Lanzamiento, pesca con mosca" },
  { name: "Pavón cinchado, pinta de lapa", scientific: "Cichla temensis", habitat: "Cuencas del Amazonas y Orinoco.", description: "El gigante absoluto de los cíclidos y uno de los peces deportivos más famosos del mundo. Ataca con una violencia sin igual en la superficie, siendo capaz de romper equipos no preparados y enderezar anzuelos triples. Exige el uso de cañas rígidas (Heavy), sedales trenzados de alto libraje (50-80 lbs) y señuelos de gran tamaño (grandes paseantes, hélices ruidosas o woodchoppers) trabajados a gran velocidad.", methods: "Lanzamiento, pesca con mosca" },
  { name: "Mataguaro", scientific: "Crenicichla sp.", habitat: "Todas las cuencas.", description: "Cíclido de cuerpo tubular y alargado que caza exclusivamente por emboscada desde escondites fijos (rocas o troncos), saltando hacia su presa como un resorte. Se pesca con equipos ultraligeros, pasando pequeños minnows o moscas muy cerca de las estructuras.", methods: "Lanzamiento, pesca con mosca" },
  { name: "Mojarra azul", scientific: "Kronoheros umbriferus", habitat: "Cuencas del Magdalena-Cauca y Caribe.", description: "Crece a un tamaño inusual para una mojarra (pudiendo superar los 3 kg), lo que la convierte en un extraordinario trofeo de los ríos claros y ciénagas del Magdalena. Pelea de forma pesada y persistente en círculos concéntricos hacia las profundidades.", methods: "Lanzamiento, pesca con mosca" },
  { name: "Macho, mojarra amarilla", scientific: "Mesoheros atromaculatus", habitat: "Cuencas del Pacífico y Magdalena.", description: "Cíclido fuertemente adaptado a nadar en la corriente de ríos limpios y piscinas rocosas. Ofrece combates muy intensos y dinámicos utilizando las líneas de agua a su favor, ideal para cañas livianas.", methods: "Lanzamiento, pesca con mosca" },
  { name: "Pemá, mojarra pemá", scientific: "Mesoheros ornatus", habitat: "Cuenca del Pacífico.", description: "Fuerte peleador endémico de los ríos rocosos y cristalinos del Chocó biogeográfico. Debido a la extrema claridad del agua donde habita, exige mucho sigilo en la aproximación del pescador y lances largos para no asustarlo.", methods: "Lanzamiento, pesca con mosca" },
  { name: "Tilapia negra", scientific: "Oreochromis mossambicus", habitat: "Todas las cuencas.", description: "Especie introducida muy resistente a cuerpos de agua estancados y con bajo oxígeno. Deportivamente es caprichosa para morder señuelos artificiales; su captura se logra principalmente fondeando masas, lombrices o utilizando la pesca con mosca imitando alimento hundido.", methods: "Pesca con mosca, fondeo" },
  { name: "Mojarra plateada, tilapia", scientific: "Oreochromis niloticus", habitat: "Todas las cuencas.", description: "Especie introducida que forma densos cardúmenes. En represas, los ejemplares asilvestrados alcanzan grandes tallas y se tornan muy desconfiados, ofreciendo un reto técnico para la pesca con mosca (usando pequeñas ninfas) o fondeo ligero con cebos pequeños.", methods: "Pesca con mosca, fondeo" },
  { name: "Tilapia roja", scientific: "Oreochromis híbrido rojo", habitat: "Todas las cuencas.", description: "Híbrido de cultivo frecuentemente encontrado en lagos artificiales de pesca deportiva o escapado a cauces naturales. Sus hábitos alimenticios y métodos de captura son idénticos a los de la tilapia nilótica.", methods: "Pesca con mosca, fondeo" },
  { name: "Nayo", scientific: "Agonostomus monticola", habitat: "Cuencas del Caribe y Pacífico.", description: "Pez que sube velozmente por los ríos torrenciales desde el estuario. Como su alimento se basa en algas e insectos, su captura exige una pesca a mosca hiper-técnica, haciendo derivar de forma natural pequeñas ninfas e imitaciones de algas en la espuma de la corriente.", methods: "Lanzamiento, pesca con mosca" },
  { name: "Bass, Black Bass, Lobina negra", scientific: "Micropterus salmoides", habitat: "Embalses y lagos de Colombia (introducida).", description: "Es la especie introducida más importante para la pesca de lanzamiento deportivo en aguas quietas. Es un experto emboscador que vive asociado a coberturas (troncos, rocas, algas). Revolucionó el uso de plásticos blandos (arreglos Texas, Carolina), spinnerbaits y señuelos de superficie. Sus saltos acrobáticos para intentar soltar el anzuelo son un espectáculo clásico de la pesca.", methods: "Lanzamiento, pesca con mosca" },
  { name: "Jojorro", scientific: "Rhonciscus bayanus", habitat: "Cuenca del Pacífico.", description: "Especie que entra a los ríos limpios desde el mar (estuarios). Es sumamente agresivo, ataca en manadas a los señuelos de media agua o brillantes que pasan rápido, y ofrece una resistencia persistente hasta el final de la pelea.", methods: "Lanzamiento, pesca con mosca" },
  { name: "Curvinata, pácora", scientific: "Plagioscion magdalenae", habitat: "Cuencas del Magdalena-Cauca y Caribe.", description: "Pez carnívoro y pelágico de las ciénagas profundas. Su picada es un golpe seco característico que arrastra la línea hacia el fondo. Responde excepcionalmente bien a los jigs de plomo con cola de silicona rebotados en el lecho del río o a los cranckbaits de profundidad.", methods: "Lanzamiento, fondeo" },
  { name: "Curvinata, burra", scientific: "Plagioscion squamosissimus", habitat: "Cuencas del Amazonas y Orinoco.", description: "Especie agresiva y abundante que caza en grandes cardúmenes. Durante los frenesíes alimenticios en la superficie (acorralando peces forrajeros), muerden casi cualquier señuelo lanzado, ofreciendo una pesca vertiginosa. Tienen la boca blanda, por lo que no se debe forzar demasiado la línea para evitar rasgarles el hocico.", methods: "Lanzamiento, fondeo" },
  { name: "Chango", scientific: "Cynopotamus magdalenae", habitat: "Cuencas del Caribe y Magdalena-Cauca. Ríos y zonas de planicie inundable.", description: "Es una especie de tamaño medio (considerada secundaria en el libro) pero es un depredador muy agresivo que caza en cardúmenes. Gran opción para pesca ultraligera.", methods: "Lanzamiento (spinning ultraligero con cucharillas pequeñas y minnows). Pesca con mosca (pequeños streamers)." },
  { name: "Pámpano", scientific: "Myloplus rubripinnis", habitat: "Cuencas del Amazonas y Orinoco. Ríos, zonas de inundación y remansos.", description: "Especie secundaria, omnívora y frugívora (come frutos e insectos). Ofrece combates rápidos y saltos. Frecuenta aguas someras en bosques inundados.", methods: "Lanzamiento (jigs y señuelos muy pequeños). Pesca con mosca (imitaciones de semillas, ninfas y secas). Fondeo con frutos." },
  { name: "Palometa", scientific: "Mylossoma duriventre", habitat: "Cuencas del Amazonas y Orinoco. Lagunas, remansos y planicies inundables.", description: "Especie de tamaño mediano/pequeño (secundaria). Al igual que el pámpano, es muy activa en los esteros y se alimenta de frutos e insectos que caen al agua.", methods: "Fondeo (anzuelos muy pequeños con masa o trozos de fruta). Pesca con mosca (equipos #2 a #4 con moscas secas diminutas)." }
];

const App = () => {
  const [activeTab, setActiveTab] = useState('inicio');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [catches, setCatches] = useState(initialCatches);
  const [showSuccess, setShowSuccess] = useState(false);
  const [randomTip, setRandomTip] = useState(allTips[0]);
  const [isTipAnimating, setIsTipAnimating] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); 
  
  const [formData, setFormData] = useState({
    fishermanName: '', species: 'Mojarra Azul', location: '', waterLevel: 'Medio',
    waterClarity: 'Cristalina', weather: 'Soleado', lureType: '', lureSize: '',
    lureColor: '', rod: '', reel: '', lineThickness: '', notes: ''
  });

  const exportToCSV = () => {
    const headers = ['ID', 'Fecha', 'Pescador', 'Especie', 'Lugar', 'Clima', 'Nivel Agua', 'Claridad', 'Señuelo', 'Tamaño', 'Color', 'Vara', 'Carretel', 'Línea', 'Notas'];
    const csvRows = catches.map(c => [
      c.id, c.date, c.fishermanName || 'Anónimo', c.species, c.location, c.weather, c.waterLevel, c.waterClarity, 
      c.lureType, c.lureSize, c.lureColor, c.rod, c.reel, c.lineThickness, `"${(c.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...csvRows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.setAttribute('download', SITE_DATA_EXPORT_FILENAME);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const generateRandomTip = () => {
    setIsTipAnimating(true);
    setTimeout(() => {
      const currentIdx = allTips.indexOf(randomTip);
      let newIdx = Math.floor(Math.random() * allTips.length);
      while(newIdx === currentIdx) newIdx = Math.floor(Math.random() * allTips.length);
      setRandomTip(allTips[newIdx]);
      setIsTipAnimating(false);
    }, 400);
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    const newCatch = { ...formData, id: Date.now(), date: new Date().toISOString().split('T')[0] };
    setCatches([newCatch, ...catches]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setFormData({ ...formData, location: '', notes: '', lureType: '', lureSize: '', lureColor: '' });
  };

  const generateAIInsight = () => {
    if (catches.length === 0) return "Registra tus capturas para compartir tu aprendizaje con la comunidad.";
    const last = catches[0];
    const lureColor = (last.lureColor || '').toLowerCase();
    const location = (last.location || '').toLowerCase();
    if (last.waterClarity === 'Sucia' && (lureColor.includes('blanco') || lureColor.includes('amarillo') || lureColor.includes('plata'))) {
       return `💡 Aprendizaje Compartido: Has usado "${last.lureColor}" en agua Sucia. Los registros confirman que colores vivos son la clave con poca visibilidad.`;
    }
    if (location.includes('rio') || location.includes('río')) {
       return `💡 Lección de Río: ¡Buena captura! Recuerda compartir si pescaste en una 'costura' de corriente o cerca de árboles frutales.`;
    }
    if (last.species === 'Mojarra Azul' && last.waterLevel === 'Alto') {
      return "💡 Lección de Embalse: Mojarra pescada con nivel Alto. Esto confirma que se refugian bajo la vegetación inundada buscando calor.";
    }
    return `💡 Análisis Comunitario: Vemos que tu línea principal para ${last.species} es de ${last.lineThickness}. Si notas rechazos en aguas cristalinas, intenta bajar el libraje.`;
  };

  // Filtro de Especies (Buscador Activo por nombre, científico, hábitat o método)
  const filteredSpecies = nationalSpecies.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.scientific.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.habitat.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.methods.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SectionHeader = ({ title, icon: Icon, description }) => (
    <div className="mb-8 md:mb-10 border-b border-slate-800 pb-5 md:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3">
        <Icon className="text-emerald-500 shrink-0" size={36} strokeWidth={1.5} />
        <h1 className="text-3xl sm:text-4xl xl:text-[2.5rem] 2xl:text-5xl font-bold text-slate-100 leading-tight">{title}</h1>
      </div>
      {description && <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-prose xl:max-w-3xl 2xl:max-w-[52rem]">{description}</p>}
    </div>
  );

  const CatalogCard = ({ species }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden transition-all hover:bg-slate-800 mb-4 sm:mb-6 h-full min-h-0">
        <div onClick={() => setIsOpen(!isOpen)} className="p-4 sm:p-5 flex justify-between items-center cursor-pointer select-none gap-3">
          <div className="flex items-center gap-3 sm:gap-4 w-full min-w-0">
            <Fish className="text-emerald-500 flex-shrink-0" size={28} />
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-slate-100 break-words">{species.name}</h3>
              <p className="text-emerald-400 text-xs sm:text-sm font-medium italic mt-1 break-words">{species.scientific}</p>
            </div>
          </div>
          <ChevronDown className={`text-slate-500 transition-transform ml-4 ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
        </div>
        
        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="p-4 sm:p-6 pt-0 text-slate-300 leading-relaxed border-t border-slate-700/50 mt-2 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 text-sm bg-slate-900/40 p-4 sm:p-5 rounded-xl border border-slate-700/50">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-emerald-500 border-b border-slate-700 pb-2">
                    <Map size={18}/> <span className="font-bold uppercase tracking-wider text-xs">Lugares donde se encuentra</span>
                  </div> 
                  <p className="leading-relaxed text-slate-300">{species.habitat}</p>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-emerald-500 border-b border-slate-700 pb-2">
                    <Anchor size={18}/> <span className="font-bold uppercase tracking-wider text-xs">Métodos de Pesca</span>
                  </div> 
                  <p className="leading-relaxed text-slate-300">{species.methods}</p>
                </div>
              </div>

              <div className="mt-2 p-5 bg-emerald-900/10 border-l-4 border-emerald-500 rounded-r-lg shadow-inner flex items-start gap-4">
                <Target className="text-emerald-400 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h4 className="text-emerald-400 font-bold mb-2 uppercase text-xs tracking-wider">Información sobre Pesca Deportiva</h4>
                  <p className="text-slate-300 text-[15px] sm:text-base leading-relaxed max-w-prose 2xl:max-w-none">{species.description}</p>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    );
  };

  const BasicCard = ({ title, icon: Icon, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden transition-all hover:bg-slate-800 mb-4 sm:mb-6">
        <div onClick={() => setIsOpen(!isOpen)} className="p-4 sm:p-5 flex justify-between items-center cursor-pointer select-none gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Icon className="text-emerald-500 shrink-0" size={24} />
            <h3 className="text-lg sm:text-xl font-semibold text-slate-200 break-words">{title}</h3>
          </div>
          <ChevronDown className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180 text-emerald-500' : ''}`} />
        </div>
        <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="p-4 sm:p-5 pt-0 text-slate-300 leading-relaxed border-t border-slate-700/50 mt-2 space-y-4 text-[15px] sm:text-base">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const InputField = ({ label, name, value, type="text", placeholder, options, required }) => (
    <div className="w-full">
      <label className="block text-sm font-semibold text-slate-400 mb-2">{label}</label>
      {options ? (
        <select name={name} value={value} onChange={handleInputChange} className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 rounded-lg p-3 focus:border-emerald-500 focus:outline-none transition-colors">
          {options.map((opt, i) => (
             opt.isGroup ? <optgroup key={i} label={opt.label} className="text-slate-400 bg-slate-900">{opt.items.map(sub => <option key={sub} value={sub} className="text-slate-200">{sub}</option>)}</optgroup>
             : <option key={i} value={opt} className="bg-slate-900">{opt}</option>
          ))}
        </select>
      ) : (
        <input type={type} name={name} value={value} onChange={handleInputChange} placeholder={placeholder} required={required}
          className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 rounded-lg p-3 placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors" />
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return (
          <div className="animate-fade-in space-y-6 sm:space-y-8 w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto">
            <SectionHeader title={`Comunidad: ${SITE_NAME}`} icon={Users} description={`Bienvenido a ${SITE_NAME}. El espacio colaborativo donde nuestra mayor captura es el conocimiento que compartimos.`} />
            
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center shadow-lg relative overflow-hidden">
               <div className="absolute right-0 top-0 opacity-5 p-4"><Share2 size={150} /></div>
               <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/30 relative z-10">
                 <Lightbulb className="text-emerald-500" size={32} />
               </div>
               <div className="flex-1 text-center sm:text-left relative z-10">
                  <h3 className="text-emerald-500 font-semibold text-sm uppercase tracking-wider mb-2">Conocimiento Compartido</h3>
                  <p className={`text-lg text-slate-200 transition-opacity duration-300 ${isTipAnimating ? 'opacity-0' : 'opacity-100'} italic font-serif`}>"{randomTip}"</p>
               </div>
               <button onClick={generateRandomTip} className="relative z-10 px-5 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-semibold transition-colors border border-slate-600 hover:border-slate-500 flex-shrink-0">
                 Siguiente Lección
               </button>
            </div>
            
            <div className="pt-4 sm:pt-6 space-y-4 text-slate-400 text-base md:text-lg leading-relaxed max-w-prose xl:max-w-none 2xl:max-w-[52rem]">
               <p>Nacidos de la colaboración entre <b>A Fishing Day</b> y la <b>comunidad Espacio de Pesca</b>, hemos consolidado las lecciones de expertos locales sobre <b>Embalses</b> y la ciencia de la <b>Guía de Especies del Instituto Alexander von Humboldt</b> en esta plataforma.</p>
               <p>Un manual no está vivo sin tu experiencia. Utiliza el menú lateral para aprender sobre el agua, explorar el vasto catálogo enciclopédico de {nationalSpecies.length} especies, o dirigirte a la sección <b>"Compartir Experiencia"</b> para que tu captura ayude a otros miembros a entender mejor nuestra pasión.</p>
            </div>
          </div>
        );

      case 'equipos':
        return (
          <div className="animate-fade-in w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto space-y-6">
            <SectionHeader title="Equipos y Fundamentos" icon={Anchor} description="Aprender a preparar tu equipo y tu comportamiento en la embarcación es el primer paso antes de hacer un lance." />
            <BasicCard title="La Vara Correcta (Evita el Ultra Light)" icon={Crosshair}>
              <p>Para embalses, ríos y señuelos pequeños, muchos asumen erróneamente que lo mejor es una vara Ultra Light. <b>La experiencia nos ha enseñado que esto es un error.</b></p>
              <p>Las varas tan flexibles botan el lance para cualquier lado y vibran demasiado. Usa una vara tipo <b>Medium, preferiblemente de 6.6 a 7.4 pies.</b> Su cuerpo rígido te permite "cargar" la energía del lance perfecto.</p>
            </BasicCard>
            <BasicCard title="Líneas y Calibres Recomendados" icon={Anchor}>
              <ul className="list-disc pl-5 space-y-2 text-slate-400">
                <li><b>Embalses regulares:</b> Seda Kastking negra/roja de 6 lb (0.10 mm) o Nylon de 0.22 mm. El grosor delgado engaña a los peces cautelosos.</li>
                <li><b>Ríos y Grandes Embalses:</b> Obligatorio subir el libraje (15 a 40lb) y utilizar siempre <b>Líder de Fluorocarbono grueso o de acero (guaya)</b> para especies dentadas.</li>
              </ul>
            </BasicCard>
          </div>
        );

      case 'embalses':
        return (
          <div className="animate-fade-in w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto space-y-6">
            <SectionHeader title="Aprende de los Embalses" icon={Waves} description="El agua en un embalse parece quieta, pero hemos aprendido que obedece a corrientes térmicas, niveles de inundación y circuitos interconectados." />
            <BasicCard title="El Circuito Hídrico (Ej: Guatapé a Punchiná)" icon={Map}>
              <p>Los embalses rara vez son islas. En Antioquia, el agua de Guatapé alimenta a Playas por el fondo a 14°C, convirtiendo la zona de llegada en un escenario de contrastes térmicos drásticos.</p>
              <p>Al final de la cadena (Punchiná), el agua ha recorrido distancias expuesta al sol, siendo mucho más cálida y creando el hábitat ideal para que las especies alcancen tamaños monstruosos.</p>
            </BasicCard>
            <BasicCard title="Entendiendo los Niveles" icon={Waves}>
              <p><b>Embalse Alto:</b> El agua invade la orilla. Lanza literalmente <b>adentro de la vegetación (matojos)</b> usando plásticos sin plomo.</p>
              <p><b>Embalse Bajo:</b> El agua se calienta y los peces pierden escondites. Es el momento para pasar a <b>señuelos duros de media agua</b> (Shad Raps) y barrer paralelo a la orilla expuesta.</p>
            </BasicCard>
            <BasicCard title="Claridad y Visibilidad" icon={Droplets}>
              <p><b>Agua Muy Clara:</b> Mantén el bote alejado de la orilla (12 metros) y usa colores oscuros o transparentes con fluorocarbono.</p>
              <p><b>Agua Turbia/Sucia:</b> Pesca orillado. Usa colores vivos (chartreuse, blanco) que destaquen visualmente en el lodo, y recoge el señuelo más lento de lo normal.</p>
            </BasicCard>
          </div>
        );

      case 'mojarra':
        return (
          <div className="animate-fade-in w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto space-y-6">
            <SectionHeader title="Estudiando la Mojarra Azul" icon={Fish} description="La reina de los embalses cálidos. Entender y compartir sus patrones de alimentación es el camino hacia capturas consistentes." />
            <BasicCard title="Ubicación Estratégica" icon={Map}>
              <p>La mojarra odia el agua fría. Cuando el embalse sube, se refugian <b>debajo de los árboles en las orillas</b>, buscando el calor de la vegetación.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-slate-900/50 p-4 rounded-lg border-l-2 border-emerald-500">
                  <p className="text-emerald-400 font-bold text-sm mb-1">Si buscas Cantidad:</p>
                  <p className="text-sm text-slate-300">Concéntrate en la llegada de los ríos principales. <b>San Agustín (en Playas)</b> es excelente porque el agua del río baja derecha, oxigenada y cálida.</p>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-lg border-l-2 border-emerald-500">
                  <p className="text-emerald-400 font-bold text-sm mb-1">Si buscas Tamaño:</p>
                  <p className="text-sm text-slate-300">Ve a las profundidades rocosas. <b>San Antonio (Jaguas)</b>, o <b>Puente Caído</b>. En Punchiná, búscala en las peñas rocosas cuando el nivel está bajo; allí alcanzan hasta 54 cm.</p>
                </div>
              </div>
            </BasicCard>
            <BasicCard title="Patrones de Alimentación (Match the Hatch)" icon={Clock}>
              <p className="mb-3 text-slate-300">El conocimiento compartido en la comunidad nos dice: si logras imitar lo que está cayendo al agua, el éxito es rotundo. Los peces tienen memoria fotográfica de su comida:</p>
              <ul className="list-disc pl-5 space-y-3 text-slate-400">
                <li><b>El Caracol Negro:</b> Al bajar el agua de represas como Playas, las orillas revelan caracoles negros. Usa <b>pequeños plásticos negros sin peso (tipo tiny/grubs)</b>.</li>
                <li><b>Las Mariposas Blancas:</b> Faltando un cuarto para las 6:00 PM salen nubes de mariposas generando un frenesí en la superficie. Un señuelo blanco pequeño (popper o mosca) a esa hora es letal.</li>
                <li><b>Caída de Insectos (Hormigas):</b> Si notas una caída masiva (ej. hormigas culonas), toma tu señuelo metálico pequeño y píntalo de oscuro con un marcador indeleble. El pez lo atacará por memoria visual.</li>
              </ul>
            </BasicCard>
            <BasicCard title="Técnica: Punto Cero, Vara y El Señuelo Universal" icon={Target}>
              <div className="space-y-5">
                <div>
                  <h4 className="text-emerald-400 font-bold mb-1">El Punto Cero y Ángulo</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">De la tierra nacen los insectos y caen al agua. Haz lanzamientos diagonales precisos intentando que tu señuelo caiga <b>mitad en tierra y mitad en agua</b>. Esta presentación de entrada al agua (el punto cero) simula la naturaleza a la perfección.</p>
                </div>
                <div>
                  <h4 className="text-emerald-400 font-bold mb-1">Posición de la Vara</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">¡No recojas con la vara apuntando hacia arriba (el famoso 'trululu')! La punta de tu caña debe mirar de frente, directo hacia el señuelo. Así chuzas más fácil, sientes menos la tensión en la muñeca y el señuelo nada de forma natural.</p>
                </div>
                <div>
                  <h4 className="text-emerald-400 font-bold mb-1">¿Plástico pequeño o señuelo grande?</h4>
                  <p className="text-slate-300 text-sm leading-relaxed">Lo pequeño da cantidad constante. Pero hay días, especialmente con represa alta, donde un señuelo duro de 7cm (como un Yo-Zuri Clow) bien manejado barrerá a los pequeños y atraerá a los verdaderos trofeos. En lugares de monstruos como Punchiná, usa duros de 6 a 9cm sin miedo al tamaño.</p>
                </div>
                <div className="bg-emerald-900/10 p-5 rounded-lg border border-emerald-500/30 mt-4 shadow-inner">
                  <p className="text-emerald-400 font-bold mb-3 flex items-center gap-2"><Anchor size={20}/> El Señuelo Universal: La Cuchara</p>
                  <p className="text-slate-300 text-sm leading-relaxed mb-3">La cuchara giratoria (marcas como Mepps o Blue Fox #2, de hoja plateada y cuerpo verde) es el comodín que no falla en ningún embalse nacional.</p>
                  <p className="text-emerald-200 text-sm leading-relaxed"><b>El Secreto de Oro:</b> Como la mojarra ataca principalmente arriba y la cuchara profundiza 1 metro por segundo, si la dejas caer, la mojarra no la verá. Por lo tanto, debes aprovechar la primera vuelta de tu carrete para <b>empezar a recoger en la fracción de segundo en que el señuelo toca el agua</b>, obligándolo a entrar nadando en la superficie inmediatamente sin que alcance a hundirse.</p>
                </div>
              </div>
            </BasicCard>
          </div>
        );

      case 'bass':
        return (
          <div className="animate-fade-in w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto space-y-6">
            <SectionHeader title="Estudiando al Bass (Lobina)" icon={Crosshair} description="Un depredador introducido que prospera en nuestros embalses. Aprender a leer su cacería activa cambiará tus jornadas." />
            <BasicCard title="Comportamiento: Agua Inundada vs. Cristalina" icon={Waves}>
              <p><b>Con Agua Alta/Sucia:</b> El Bass entra a orillas inundadas a cazar activamente. Barre rápido la zona con spinnerbaits.</p>
              <p className="mt-3"><b>Con Agua Baja/Cristalina:</b> Cambia a modo "francotirador". Se fondea inmóvil en estructuras desnudas (troncos sumergidos) y ataca presas desde el fondo.</p>
            </BasicCard>
          </div>
        );

      case 'rios_lectura':
        return (
          <div className="animate-fade-in w-full max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto space-y-6">
            <SectionHeader title="Sabiduría de Ríos" icon={Compass} description="En la pesca de río, el agua está en constante movimiento. Saber leer este flujo es un conocimiento muy valioso para compartir." />
            <BasicCard title="Las Costuras (Seams): El restaurante de depredadores" icon={Waves}>
              <p>Una <b>"costura"</b> es la línea donde el agua rápida choca con el agua lenta.</p>
              <p className="mt-3">Especies como la <b>Picuda</b> o la <b>Payara</b> se ubican en el lado lento de la costura, esperando que la corriente rápida les traiga alimento. Lanza tu señuelo a la corriente rápida y deja que cruce hacia la zona lenta.</p>
            </BasicCard>
            <BasicCard title="Vegetación Riparia" icon={Map}>
              <p>Muchos peces (como la <b>Dorada</b> y la <b>Cachama</b>) son omnívoros. Si observas árboles dejando caer frutos al agua, acércate sigilosamente. El pez está condicionado al sonido del "plop".</p>
            </BasicCard>
          </div>
        );

      case 'catalogo':
        return (
          <div className="animate-fade-in w-full max-w-4xl xl:max-w-6xl 2xl:max-w-[min(100rem,100%)] mx-auto space-y-6">
            <SectionHeader title="El Archivo Humboldt" icon={Book} description={`La enciclopedia definitiva. Explora las características, hábitats y técnicas de pesca de las ${nationalSpecies.length} especies de agua dulce documentadas en el índice oficial.`} />
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 sm:p-8 rounded-2xl border border-emerald-500/30 shadow-2xl relative overflow-hidden mb-8 sm:mb-10">
               <div className="absolute right-0 bottom-0 opacity-10 p-2 transform rotate-12 scale-150"><Award size={150} /></div>
               <div className="flex items-center gap-4 mb-4 relative z-10">
                 <div className="p-3 bg-emerald-500 text-slate-900 rounded-lg"><BookOpen size={24} strokeWidth={2}/></div>
                 <h2 className="text-xl sm:text-2xl lg:text-[1.65rem] xl:text-[1.75rem] font-black text-white uppercase tracking-wider">Créditos de Autoría Institucional</h2>
               </div>
               <p className="text-slate-300 text-base md:text-lg leading-relaxed relative z-10 mb-6 border-l-4 border-emerald-500 pl-4 max-w-prose xl:max-w-3xl">
                 La integridad científica, taxonomía y listado de especies de este inmenso catálogo reconocen en su totalidad a la obra oficial: <br/>
                 <span className="text-emerald-400 font-bold">"XVIII. La Pesca Deportiva Continental en Colombia: guía de las especies de agua dulce"</span>.
               </p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10 bg-slate-900/50 p-6 rounded-xl border border-slate-700">
                 <div>
                   <h4 className="text-emerald-500 font-bold uppercase text-xs mb-2 flex items-center gap-2"><Users size={14}/> Autores Científicos</h4>
                   <ul className="text-slate-300 space-y-1 font-medium">
                     <li>• Carlos A. Lasso</li>
                     <li>• Carlos R. Heinsohn</li>
                     <li>• Steven Jensen</li>
                     <li>• Monica A. Morales-Betancourt</li>
                   </ul>
                 </div>
                 <div>
                   <h4 className="text-emerald-500 font-bold uppercase text-xs mb-2 flex items-center gap-2"><Book size={14}/> Edición y Publicación</h4>
                   <p className="text-slate-300 font-medium">Instituto de Investigación de Recursos Biológicos Alexander von Humboldt</p>
                   <p className="text-slate-400 text-sm mt-1">Fundación Orinoquía (2019)</p>
                 </div>
               </div>
            </div>
            <div className="relative mb-6 sm:mb-8 bg-slate-900 p-2 rounded-2xl border border-slate-700 shadow-inner">
               <Search className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 text-emerald-500 pointer-events-none" size={22} />
               <input 
                 type="text" 
                 placeholder={`Buscar en las ${nationalSpecies.length} especies por nombre, método, hábitat...`} 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-transparent text-slate-200 rounded-xl py-3.5 sm:py-4 pl-12 sm:pl-16 pr-3 sm:pr-4 focus:outline-none text-base sm:text-lg placeholder-slate-500"
               />
            </div>
            <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 sm:gap-6 2xl:gap-x-8 2xl:gap-y-2 mb-10 sm:mb-12 items-start">
              {filteredSpecies.length > 0 ? (
                filteredSpecies.map((s, i) => (
                  <CatalogCard key={i} species={s} />
                ))
              ) : (
                <div className="text-center py-16 bg-slate-800/50 rounded-2xl border border-slate-700">
                  <Fish size={48} className="mx-auto text-slate-600 mb-4 opacity-50"/>
                  <h3 className="text-xl font-bold text-slate-400 mb-2">Especie no encontrada</h3>
                  <p className="text-slate-500">Intenta buscar con otro nombre común o científico en la base de datos de {nationalSpecies.length} especies.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'bitacora':
        return (
          <div className="animate-fade-in w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto space-y-10 sm:space-y-12 pb-8 sm:pb-10">
            <SectionHeader title="Compartir Experiencia" icon={Share2} description="El conocimiento se forja en el agua. Registra tu captura y comparte tu aprendizaje para que toda la comunidad crezca." />
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-2"><PlusCircle className="text-emerald-500"/> Añadir mi Aprendizaje</h2>
              {showSuccess && (
                <div className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 p-4 mb-6 rounded-xl flex items-center gap-3">
                  <CheckCircle2 size={24} /> <span>¡Gracias por compartir! Desliza hacia abajo para ver las experiencias de todos.</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputField label="Pescador (Miembro/Invitado)" name="fishermanName" value={formData.fishermanName} placeholder="Ej: Carlos (Espacio de Pesca)" />
                  <InputField label="Especie" name="species" value={formData.species} options={[
                    {isGroup: true, label: "Comunes", items: ["Mojarra Azul", "Bass / Lobina", "Sabaleta Andina"]},
                    {isGroup: true, label: "Catálogo Humboldt", items: nationalSpecies.map(s => s.name)}
                  ]} />
                  <InputField label="Ubicación (Río o Embalse) *" name="location" value={formData.location} placeholder="Ej: Río Cauca, Represa Playas" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/30 p-5 rounded-xl border border-slate-700/50">
                  <InputField label="Clima" name="weather" value={formData.weather} options={["Soleado", "Nublado", "Lluvioso"]} />
                  <InputField label="Agua / Corriente" name="waterLevel" value={formData.waterLevel} options={["Alto / Corriente Fuerte", "Medio", "Bajo / Pozos quietos"]} />
                  <InputField label="Claridad" name="waterClarity" value={formData.waterClarity} options={["Cristalina", "Normal", "Sucia / Turbia"]} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputField label="Señuelo / Tipo *" name="lureType" value={formData.lureType} placeholder="Popper, Jig, Cucharilla..." required />
                  <InputField label="Tamaño y Color" name="lureColor" value={formData.lureColor} placeholder="7cm, Blanco, Plata..." />
                  <InputField label="Grosor Línea *" name="lineThickness" value={formData.lineThickness} placeholder="12lb / 0.14mm..." required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-400 mb-2 flex items-center gap-2"><MessageSquare size={16}/> Conocimiento Adquirido (Notas y Patrones)</label>
                  <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows="3" 
                    placeholder="Ej: Hoy aprendí que el pique ocurre cruzando la costura de corriente... o lanzando justo debajo de las ramas..." 
                    className="w-full bg-slate-900/50 border border-slate-700 text-slate-200 rounded-lg p-3 focus:border-emerald-500 focus:outline-none resize-none"
                  ></textarea>
                </div>
                <button type="submit" className="w-full md:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors flex justify-center items-center gap-2 shadow-lg shadow-emerald-900/30">
                  <Share2 size={20} /> Compartir mi Experiencia
                </button>
              </form>
            </div>
            <div>
              <div className="flex flex-col md:flex-row justify-between items-center mb-6 mt-12">
                <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2"><Users className="text-emerald-500"/> Bitácora de la Comunidad</h2>
                <button onClick={exportToCSV} className="mt-4 md:mt-0 flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-emerald-400 text-sm font-bold rounded-lg transition-colors shadow-lg">
                  <Download size={18} /> Descargar Archivo (CSV)
                </button>
              </div>
              <div className="bg-slate-800 border border-emerald-500/30 p-6 rounded-xl mb-8 flex gap-4 items-start shadow-md relative overflow-hidden">
                 <div className="absolute right-0 top-0 opacity-5 p-4"><BrainCircuit size={100}/></div>
                 <Lightbulb className="text-emerald-400 mt-1 flex-shrink-0 relative z-10" size={28} />
                 <div className="relative z-10">
                   <h4 className="text-emerald-400 font-bold mb-1 uppercase tracking-wider text-xs">Análisis Automático de la Comunidad</h4>
                   <p className="text-slate-300 text-sm md:text-base leading-relaxed">{generateAIInsight()}</p>
                 </div>
              </div>
              <div className="space-y-4">
                {catches.map(c => (
                  <div key={c.id} className="bg-slate-800 border border-slate-700 p-5 rounded-xl flex flex-col md:flex-row gap-6 hover:border-slate-600 transition-colors">
                    <div className="md:w-1/4 border-b md:border-b-0 md:border-r border-slate-700 pb-4 md:pb-0 md:pr-4 flex flex-col justify-center">
                      <h4 className="text-xl font-bold text-emerald-400">{c.species}</h4>
                      <p className="text-slate-400 text-sm mt-1">{c.location}</p>
                      <p className="text-slate-500 text-xs mt-3 uppercase tracking-wider">{c.date} <br/> <b>Por: {c.fishermanName || 'Anónimo'}</b></p>
                    </div>
                    <div className="md:w-3/4 flex flex-col justify-center">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 bg-slate-900 rounded text-xs text-slate-300 border border-slate-700">Clima: {c.weather}</span>
                        <span className="px-2 py-1 bg-slate-900 rounded text-xs text-slate-300 border border-slate-700">Agua: {c.waterLevel} / {c.waterClarity}</span>
                        <span className="px-2 py-1 bg-emerald-900/20 text-emerald-300 rounded text-xs font-semibold border border-emerald-500/30">Señuelo: {c.lureType} {c.lureColor}</span>
                        <span className="px-2 py-1 bg-slate-900 rounded text-xs text-slate-300 border border-slate-700">Línea: {c.lineThickness}</span>
                      </div>
                      {c.notes && (
                        <div className="bg-slate-900/50 p-3 rounded-lg border-l-2 border-emerald-500/50">
                          <p className="text-slate-300 text-sm italic">"{c.notes}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  const navItems = [
    { id: 'inicio', label: 'Inicio', group: 'general', icon: Users },
    { id: 'equipos', label: 'Equipos y Fundamentos', group: 'general', icon: Anchor },
    { id: 'embalses', label: 'Aprende de los Embalses', group: 'embalses', icon: Waves },
    { id: 'mojarra', label: 'Estudiando la Mojarra', group: 'embalses', icon: Droplets },
    { id: 'bass', label: 'Entendiendo al Bass', group: 'embalses', icon: Crosshair },
    { id: 'rios_lectura', label: 'Sabiduría de Ríos', group: 'rios', icon: Compass },
    { id: 'catalogo', label: 'El Archivo Humboldt', group: 'catalogo', icon: Book },
    { id: 'bitacora', label: 'Compartir Experiencia', group: 'tools', icon: Share2 }
  ];

  return (
    <div className="flex h-[100dvh] min-h-0 bg-slate-950 font-sans text-slate-300 selection:bg-emerald-500/30 text-[15px] sm:text-base antialiased">
      {isMobileMenuOpen && <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />}

      <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 z-50 w-[min(100%,18rem)] sm:w-72 md:w-[17rem] lg:w-72 xl:w-80 2xl:w-96 shrink-0 bg-slate-900 border-r border-slate-800 transition-transform duration-300 flex flex-col md:max-h-[100dvh]`}>
        <div className="p-4 sm:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight flex items-start gap-2">
              <Fish className="text-emerald-500 shrink-0 mt-0.5" size={22} />
              <span>
                <span className="block">{SITE_WORDMARK_PRIMARY}</span>
                <span className="text-[11px] text-emerald-500 font-mono mt-1 tracking-widest uppercase block">{SITE_WORDMARK_ACCENT}</span>
              </span>
            </h2>
          </div>
          <button className="md:hidden text-slate-500" onClick={() => setIsMobileMenuOpen(false)}><X size={24} /></button>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 pb-6 md:pb-8 overscroll-contain">
          <div className="px-4 mt-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-2">Aprender</p>
            {navItems.filter(i => i.group === 'general').map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 text-left ${activeTab === item.id ? 'bg-slate-800 text-emerald-400 font-semibold border border-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <item.icon size={18} className={activeTab === item.id ? "text-emerald-500" : "text-slate-500"} /><span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="px-4 mt-6">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-2">Pesca en Embalses</p>
            {navItems.filter(i => i.group === 'embalses').map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 text-left ${activeTab === item.id ? 'bg-slate-800 text-emerald-400 font-semibold border border-slate-700' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <item.icon size={18} className={activeTab === item.id ? "text-emerald-500" : "text-slate-500"} /><span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="px-4 mt-6">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-3 pl-2">Pesca en Ríos</p>
            {navItems.filter(i => i.group === 'rios').map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 text-left ${activeTab === item.id ? 'bg-emerald-900/30 text-emerald-400 font-semibold border border-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <item.icon size={18} className={activeTab === item.id ? "text-emerald-500" : "text-slate-500"} /><span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
          <div className="px-4 mt-6 pt-6 border-t border-slate-800">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 pl-2">Compartir</p>
            {navItems.filter(i => i.group === 'catalogo' || i.group === 'tools').map(item => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 text-left ${activeTab === item.id ? 'bg-emerald-600 text-white font-semibold shadow-lg shadow-emerald-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                <item.icon size={18} className={activeTab === item.id ? "text-white" : "text-slate-500"} /><span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 min-w-0 min-h-0">
        <div className="bg-slate-900 border-b border-slate-800 p-3 sm:p-4 flex items-center justify-between md:hidden z-20 shrink-0">
          <h1 className="font-bold text-white flex items-center gap-2 text-sm leading-tight min-w-0"><Users className="text-emerald-500 shrink-0" size={20}/> <span className="min-w-0">{SITE_NAME}</span></h1>
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-400 hover:text-white"><Menu size={24} /></button>
        </div>
        <main className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-5 sm:py-8 md:px-8 md:py-10 lg:px-10 lg:py-11 xl:px-12 xl:py-12 2xl:px-16 2xl:py-14 relative scroll-smooth">
          <div className="mx-auto w-full max-w-[min(100%,1920px)] 2xl:max-w-[2200px] min-h-0">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;

