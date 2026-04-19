const { PrismaClient } = require('./node_modules/@prisma/client');
const p = new PrismaClient();

async function main() {
  // ── 1. LIMPIAR DUPLICADOS ──────────────────────────────────────────────────
  const toDelete = [
    { title: "Not Like Us",           artist: "Kendrick Lamar",              genre: "Hip-Hop 2025" },
    { title: "luther",                artist: "Kendrick Lamar & SZA",        genre: "Pop" },
    { title: "Die With a Smile",      artist: "Lady Gaga & Bruno Mars",      genre: "Pop" },
    { title: "A Bar Song (Tipsy)",    artist: "Shaboozey",                   genre: "Pop" },
    { title: "Espresso",              artist: "Sabrina Carpenter",           genre: "Pop" },
    { title: "Please Please Please",  artist: "Sabrina Carpenter",           genre: "Pop" },
    { title: "Gata Only",             artist: "FloyyMenor & Cris MJ",        genre: "Reggaetón" },
    { title: "Adan y Eva",            artist: "Paulo Londra",                genre: "Trap / RKT" },
    { title: "Nicki Nicole Sessions", artist: "Bizarrap & Nicki Nicole",     genre: "Trap Argentina 2025" },
    { title: "BIRDS OF A FEATHER",    artist: "Billie Eilish",               genre: "Pop 2025" },
    { title: "Million Dollar Baby",   artist: "Tommy Richman",               genre: "Pop" },
    { title: "APT.",                  artist: "ROSE & Bruno Mars",           genre: "Pop" },
  ];
  for (const d of toDelete) {
    await p.catalogSong.deleteMany({ where: { title: d.title, artist: d.artist, genre: d.genre } });
  }
  console.log('Duplicados eliminados');

  // ── 2. NUEVAS CANCIONES ────────────────────────────────────────────────────
  const newSongs = [
    // Reggaetón Clásico (2000-2010)
    { title: "Rompe",                         artist: "Daddy Yankee",                       genre: "Reggaetón Clásico" },
    { title: "Llamado de Emergencia",         artist: "Daddy Yankee",                       genre: "Reggaetón Clásico" },
    { title: "El Carro",                      artist: "Daddy Yankee",                       genre: "Reggaetón Clásico" },
    { title: "Lento",                         artist: "Daddy Yankee",                       genre: "Reggaetón Clásico" },
    { title: "Impacto",                       artist: "Daddy Yankee",                       genre: "Reggaetón Clásico" },
    { title: "Que Tengo Que Hacer",           artist: "Daddy Yankee",                       genre: "Reggaetón Clásico" },
    { title: "No Me Dejes Solo",              artist: "Daddy Yankee & Glory",               genre: "Reggaetón Clásico" },
    { title: "Barrio Fino",                   artist: "Daddy Yankee",                       genre: "Reggaetón Clásico" },
    { title: "Machucando",                    artist: "Daddy Yankee",                       genre: "Reggaetón Clásico" },
    { title: "Ella Me Levantó",               artist: "Daddy Yankee",                       genre: "Reggaetón Clásico" },
    { title: "Boom Boom",                     artist: "Daddy Yankee",                       genre: "Reggaetón Clásico" },
    { title: "Reggaetón Latino",              artist: "Don Omar",                           genre: "Reggaetón Clásico" },
    { title: "Calle",                         artist: "Don Omar",                           genre: "Reggaetón Clásico" },
    { title: "Virtual Diva",                  artist: "Don Omar",                           genre: "Reggaetón Clásico" },
    { title: "Hasta Abajo",                   artist: "Don Omar",                           genre: "Reggaetón Clásico" },
    { title: "Taboo",                         artist: "Don Omar",                           genre: "Reggaetón Clásico" },
    { title: "Dutty Love",                    artist: "Don Omar ft. Natti Natasha",          genre: "Reggaetón Clásico" },
    { title: "Mayor Que Yo",                  artist: "Don Omar, Daddy Yankee & Lucenzo",   genre: "Reggaetón Clásico" },
    { title: "Bandolera",                     artist: "Don Omar",                           genre: "Reggaetón Clásico" },
    { title: "Luna Nueva",                    artist: "Don Omar",                           genre: "Reggaetón Clásico" },
    { title: "Dale Don Dale",                 artist: "Don Omar",                           genre: "Reggaetón Clásico" },
    { title: "La Despedida",                  artist: "Don Omar",                           genre: "Reggaetón Clásico" },
    { title: "Perdón",                        artist: "Don Omar",                           genre: "Reggaetón Clásico" },
    { title: "Noche de Sexo",                 artist: "Wisin & Yandel",                     genre: "Reggaetón Clásico" },
    { title: "Algo Me Gusta de Ti",           artist: "Wisin & Yandel ft. Chris Brown",     genre: "Reggaetón Clásico" },
    { title: "Sexy Movimiento",               artist: "Wisin & Yandel",                     genre: "Reggaetón Clásico" },
    { title: "Me Estás Tentando",             artist: "Wisin & Yandel",                     genre: "Reggaetón Clásico" },
    { title: "Abusadora",                     artist: "Wisin & Yandel",                     genre: "Reggaetón Clásico" },
    { title: "Mujeres in the Club",           artist: "Wisin & Yandel",                     genre: "Reggaetón Clásico" },
    { title: "Follow the Leader",             artist: "Wisin & Yandel",                     genre: "Reggaetón Clásico" },
    { title: "Te Siento",                     artist: "Wisin & Yandel",                     genre: "Reggaetón Clásico" },
    { title: "Al Natural",                    artist: "Tego Calderón",                      genre: "Reggaetón Clásico" },
    { title: "Metele Sazón",                  artist: "Tego Calderón",                      genre: "Reggaetón Clásico" },
    { title: "El Abayarde",                   artist: "Tego Calderón",                      genre: "Reggaetón Clásico" },
    { title: "No Tengo Dinero",               artist: "Alexis & Fido",                      genre: "Reggaetón Clásico" },
    { title: "Ven y Dímelo",                  artist: "Alexis & Fido",                      genre: "Reggaetón Clásico" },
    { title: "Cata",                          artist: "Alexis & Fido",                      genre: "Reggaetón Clásico" },
    { title: "Quiero Bailar",                 artist: "Ivy Queen",                          genre: "Reggaetón Clásico" },
    { title: "Papi Te Quiero",                artist: "Ivy Queen",                          genre: "Reggaetón Clásico" },
    { title: "En el Aro",                     artist: "Ivy Queen",                          genre: "Reggaetón Clásico" },
    { title: "Oye Mi Canto",                  artist: "N.O.R.E. ft. Nina Sky",              genre: "Reggaetón Clásico" },
    { title: "Aullando",                      artist: "Zion & Lennox",                      genre: "Reggaetón Clásico" },
    { title: "Yo Voy",                        artist: "Zion & Lennox",                      genre: "Reggaetón Clásico" },
    { title: "Sacude",                        artist: "Zion & Lennox",                      genre: "Reggaetón Clásico" },
    { title: "Candy",                         artist: "Plan B",                             genre: "Reggaetón Clásico" },
    { title: "Ella y Yo",                     artist: "Aventura ft. Don Omar",              genre: "Reggaetón Clásico" },
    { title: "Sensato",                       artist: "Jowell & Randy",                     genre: "Reggaetón Clásico" },
    { title: "El Fenómeno",                   artist: "Arcángel",                           genre: "Reggaetón Clásico" },
    { title: "Si Una Vez",                    artist: "Baby Rasta & Gringo",                genre: "Reggaetón Clásico" },
    { title: "Ese Man Soy Yo",                artist: "Cosculluela",                        genre: "Reggaetón Clásico" },
    { title: "Nadie Se Salva",                artist: "Trébol Clan",                        genre: "Reggaetón Clásico" },
    { title: "Gata Gangster",                 artist: "Voltio",                             genre: "Reggaetón Clásico" },
    { title: "Gasolina",                      artist: "Daddy Yankee",                       genre: "Reggaetón Clásico" },
    { title: "Con Calma",                     artist: "Daddy Yankee",                       genre: "Reggaetón Clásico" },
    { title: "Lo Que Pasó Pasó",              artist: "Daddy Yankee",                       genre: "Reggaetón Clásico" },
    { title: "Dile",                          artist: "Don Omar",                           genre: "Reggaetón Clásico" },
    { title: "Rakata",                        artist: "Wisin & Yandel",                     genre: "Reggaetón Clásico" },
    // Cuarteto
    { title: "El Gato e la Vecina",           artist: "La Mona Jiménez",                    genre: "Cuarteto" },
    { title: "La Banda",                      artist: "La Mona Jiménez",                    genre: "Cuarteto" },
    { title: "Me Va a Extrañar",              artist: "La Mona Jiménez",                    genre: "Cuarteto" },
    { title: "Toro",                          artist: "La Mona Jiménez",                    genre: "Cuarteto" },
    { title: "Así Es la Mona",               artist: "La Mona Jiménez",                    genre: "Cuarteto" },
    { title: "No Te Vayas",                   artist: "La Mona Jiménez",                    genre: "Cuarteto" },
    { title: "Que Se Pare",                   artist: "La Mona Jiménez",                    genre: "Cuarteto" },
    { title: "La Noche",                      artist: "Rodrigo",                            genre: "Cuarteto" },
    { title: "Soy Cordobés",                  artist: "Rodrigo",                            genre: "Cuarteto" },
    { title: "Cómo Te Extraño",              artist: "Rodrigo",                            genre: "Cuarteto" },
    { title: "Amor Postal",                   artist: "Rodrigo",                            genre: "Cuarteto" },
    { title: "Que el Cielo Me Explique",      artist: "Rodrigo",                            genre: "Cuarteto" },
    { title: "Quién Te Conoce",              artist: "Rodrigo",                            genre: "Cuarteto" },
    { title: "Tocando Fondo",                 artist: "Rodrigo",                            genre: "Cuarteto" },
    { title: "Con Sabor a Nada",              artist: "Banda XXI",                          genre: "Cuarteto" },
    { title: "No Volvería",                  artist: "Banda XXI",                          genre: "Cuarteto" },
    { title: "Me Cambiaste",                  artist: "Banda XXI",                          genre: "Cuarteto" },
    { title: "Fiesta de Cuarteto",            artist: "Carlos Torres Vila",                 genre: "Cuarteto" },
    // Folklore
    { title: "Gracias a la Vida",             artist: "Mercedes Sosa",                      genre: "Folklore" },
    { title: "Todo Cambia",                   artist: "Mercedes Sosa",                      genre: "Folklore" },
    { title: "La Maza",                       artist: "Mercedes Sosa",                      genre: "Folklore" },
    { title: "Alfonsina y el Mar",            artist: "Mercedes Sosa",                      genre: "Folklore" },
    { title: "Canción con Todos",             artist: "Mercedes Sosa",                      genre: "Folklore" },
    { title: "Cuando Tenga la Tierra",        artist: "Mercedes Sosa",                      genre: "Folklore" },
    { title: "Solo le Pido a Dios",           artist: "León Gieco",                         genre: "Folklore" },
    { title: "La Memoria",                    artist: "León Gieco",                         genre: "Folklore" },
    { title: "De Igual a Igual",              artist: "León Gieco",                         genre: "Folklore" },
    { title: "Luna Tucumana",                 artist: "Atahualpa Yupanqui",                 genre: "Folklore" },
    { title: "Viene Clareando",               artist: "Atahualpa Yupanqui",                 genre: "Folklore" },
    { title: "El Arreador",                   artist: "Atahualpa Yupanqui",                 genre: "Folklore" },
    { title: "El Humahuaqueño",               artist: "Los Chalchaleros",                   genre: "Folklore" },
    { title: "Zamba de Mi Esperanza",         artist: "Los Fronterizos",                    genre: "Folklore" },
    { title: "Si Se Calla el Cantor",         artist: "Horacio Guarany",                    genre: "Folklore" },
    // Rock Nacional
    { title: "Huelga de Amores",              artist: "Divididos",                          genre: "Rock Nacional" },
    { title: "Tiene Nombre de Mujer",         artist: "Divididos",                          genre: "Rock Nacional" },
    { title: "Guasón",                        artist: "Divididos",                          genre: "Rock Nacional" },
    { title: "Qué Ves",                       artist: "Divididos",                          genre: "Rock Nacional" },
    { title: "Sr. Cobranza",                  artist: "Bersuit Vergarabat",                 genre: "Rock Nacional" },
    { title: "La Bolsa",                      artist: "Bersuit Vergarabat",                 genre: "Rock Nacional" },
    { title: "Vuelta de Página",              artist: "Bersuit Vergarabat",                 genre: "Rock Nacional" },
    { title: "El Tiempo No Para",             artist: "Bersuit Vergarabat",                 genre: "Rock Nacional" },
    { title: "Jijiji",                        artist: "Patricio Rey y sus Redonditos",      genre: "Rock Nacional" },
    { title: "La Mosca y la Sopa",            artist: "Patricio Rey y sus Redonditos",      genre: "Rock Nacional" },
    { title: "Rock del Pedazo",               artist: "Patricio Rey y sus Redonditos",      genre: "Rock Nacional" },
    { title: "Nene Nena",                     artist: "Patricio Rey y sus Redonditos",      genre: "Rock Nacional" },
    { title: "Seguir Viviendo Sin Tu Amor",   artist: "Spinetta",                           genre: "Rock Nacional" },
    { title: "Muchacha (Ojos de Papel)",      artist: "Spinetta",                           genre: "Rock Nacional" },
    { title: "Bajan",                         artist: "Spinetta",                           genre: "Rock Nacional" },
    { title: "El Farolito",                   artist: "Los Piojos",                         genre: "Rock Nacional" },
    { title: "Tan Solo",                      artist: "Los Piojos",                         genre: "Rock Nacional" },
    { title: "Civilización",                  artist: "Los Piojos",                         genre: "Rock Nacional" },
    { title: "Maradó",                        artist: "Los Piojos",                         genre: "Rock Nacional" },
    { title: "Peligrosa",                     artist: "Las Pelotas",                        genre: "Rock Nacional" },
    { title: "Canta",                         artist: "Las Pelotas",                        genre: "Rock Nacional" },
    { title: "Luna de Miel",                  artist: "Fito Páez",                          genre: "Rock Nacional" },
    { title: "El Amor Después del Amor",      artist: "Fito Páez",                          genre: "Rock Nacional" },
    { title: "11 y 6",                        artist: "Fito Páez",                          genre: "Rock Nacional" },
    { title: "Dos Días en la Vida",           artist: "Fito Páez",                          genre: "Rock Nacional" },
    // Cumbia Villera
    { title: "El Paranoico",                  artist: "Pibes Chorros",                      genre: "Cumbia Villera" },
    { title: "Arriba Las Manos",              artist: "Pibes Chorros",                      genre: "Cumbia Villera" },
    { title: "Qué Pasa Morena",              artist: "Yerba Brava",                        genre: "Cumbia Villera" },
    { title: "El Maquinero",                  artist: "Yerba Brava",                        genre: "Cumbia Villera" },
    { title: "Un Ramito de Violetas",         artist: "Yerba Brava",                        genre: "Cumbia Villera" },
    { title: "Qué Lindo es el Amor",         artist: "Meta Guacha",                        genre: "Cumbia Villera" },
    { title: "La Ruta de la Cumbia",          artist: "Meta Guacha",                        genre: "Cumbia Villera" },
    { title: "Ganas de Amarte",               artist: "El Polaco",                          genre: "Cumbia Villera" },
    { title: "Quiero Volverme a Enamorar",    artist: "El Polaco",                          genre: "Cumbia Villera" },
    { title: "El Chaky",                      artist: "Damas Gratis",                       genre: "Cumbia Villera" },
    { title: "Soy Pobre",                     artist: "Damas Gratis",                       genre: "Cumbia Villera" },
    { title: "La Barra de los Trapos",        artist: "Flor de Piedra",                     genre: "Cumbia Villera" },
    // Tango
    { title: "Por Una Cabeza",                artist: "Carlos Gardel",                      genre: "Tango" },
    { title: "El Día que Me Quieras",         artist: "Carlos Gardel",                      genre: "Tango" },
    { title: "Volver",                        artist: "Carlos Gardel",                      genre: "Tango" },
    { title: "Mi Buenos Aires Querido",       artist: "Carlos Gardel",                      genre: "Tango" },
    { title: "Tomo y Obligo",                 artist: "Carlos Gardel",                      genre: "Tango" },
    { title: "Libertango",                    artist: "Astor Piazzolla",                    genre: "Tango" },
    { title: "Adiós Nonino",                 artist: "Astor Piazzolla",                    genre: "Tango" },
    { title: "Verano Porteño",               artist: "Astor Piazzolla",                    genre: "Tango" },
    { title: "Balada Para un Loco",           artist: "Astor Piazzolla",                    genre: "Tango" },
    { title: "Sur",                           artist: "Aníbal Troilo",                      genre: "Tango" },
    { title: "Barrio de Tango",               artist: "Aníbal Troilo",                      genre: "Tango" },
    { title: "La Yumba",                      artist: "Osvaldo Pugliese",                   genre: "Tango" },
    { title: "La Cumparsita",                 artist: "Gerardo Matos Rodríguez",            genre: "Tango" },
    { title: "El Choclo",                     artist: "Ángel Villoldo",                     genre: "Tango" },
    // Electrónica 2025
    { title: "Jungle",                        artist: "Fred again..",                       genre: "Electrónica 2025" },
    { title: "Turn On the Lights again..",    artist: "Fred again.. & Swedish House Mafia", genre: "Electrónica 2025" },
    { title: "Escape",                        artist: "Dom Dolla",                          genre: "Electrónica 2025" },
    { title: "Take It",                       artist: "Dom Dolla",                          genre: "Electrónica 2025" },
    { title: "Lose My Mind",                  artist: "John Summit",                        genre: "Electrónica 2025" },
    { title: "La Femme",                      artist: "John Summit",                        genre: "Electrónica 2025" },
    { title: "Losing It",                     artist: "Fisher",                             genre: "Electrónica 2025" },
    { title: "Eternity",                      artist: "Anyma",                              genre: "Electrónica 2025" },
    { title: "Explore Your Future",           artist: "Anyma",                              genre: "Electrónica 2025" },
    { title: "Freed from Desire 2025",        artist: "Gala",                               genre: "Electrónica 2025" },
  ];

  let added = 0;
  for (const s of newSongs) {
    const exists = await p.catalogSong.findFirst({ where: { title: s.title, artist: s.artist } });
    if (!exists) {
      await p.catalogSong.create({ data: s });
      added++;
    }
  }
  console.log(added + " canciones nuevas agregadas");

  // Mover canciones de Reggaetón clásico que ya estaban en "Reggaetón"
  await p.catalogSong.updateMany({
    where: { genre: "Reggaetón", title: { in: ["Gasolina","Con Calma","Lo Que Pasó, Pasó","Dile","Rakata"] } },
    data: { genre: "Reggaetón Clásico" }
  });

  const total = await p.catalogSong.count();
  console.log("Total catálogo: " + total + " canciones");
  await p.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
