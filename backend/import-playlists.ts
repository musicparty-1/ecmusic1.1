import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando importación COMPLETA de Playlists Boliche Misiones (10/10) ---');

  // Limpiamos las anteriores para no duplicar si es necesario (opcional)
  // await prisma.eventTemplate.deleteMany({}); 

  const playlists = [
    {
      name: '1. RKT & Cachengue — pista principal',
      description: 'El motor de la noche. Cachengue, RKT y enganchados.',
      songs: [
        { title: 'Hola Perdida', artist: 'Luck Ra, Khea' },
        { title: 'Amor de Vago', artist: 'La T y La M, Malandro' },
        { title: 'Parte y Choke', artist: 'Alex Krack, Jombriel' },
        { title: 'Piel', artist: 'Tiago PZK, Ke Personajes' },
        { title: 'La Plena', artist: 'W Sound' },
        { title: 'Lokita', artist: 'Ke Personajes' },
        { title: 'Típico', artist: 'Luck Ra' },
        { title: 'No Te Enamores', artist: 'Ke Personajes, Emilia' },
        { title: 'Enganchado RKT vol.8', artist: 'Fer Palacio' },
        { title: 'Enganchado RKT vol.12', artist: 'DJ Pirata' },
      ]
    },
    {
      name: '2. Reggaeton — clásicos y nuevos',
      description: 'Los temas que piden todos: Karol G, Bad Bunny, Feid.',
      songs: [
        { title: 'Si Antes Te Hubiera Conocido', artist: 'Karol G' },
        { title: 'BAILE INoLVIDABLE', artist: 'Bad Bunny' },
        { title: 'Luna', artist: 'Feid' },
        { title: 'DEGENERE', artist: 'Myke Towers' },
        { title: 'Hawái', artist: 'Maluma' },
        { title: 'Tusa', artist: 'Karol G, Nicki Minaj' },
        { title: 'Ella Baila Sola', artist: 'Peso Pluma' },
        { title: 'Pepas', artist: 'Farruko' },
      ]
    },
    {
      name: '3. Cuarteto — bloque cordobés',
      description: 'Luck Ra como eje + clásicos del cuarteto revivido.',
      songs: [
        { title: 'Luck Ra BZRP Session #61', artist: 'Bizarrap, Luck Ra' },
        { title: 'Que No Quede Nada', artist: 'Luck Ra' },
        { title: 'Ya No Me Duele', artist: 'Luck Ra' },
        { title: 'Beso de Mentira', artist: 'Luck Ra' },
        { title: 'El Breve Espacio (remix cuarteto)', artist: 'Rodrigo ft. Luck Ra' },
        { title: 'La Miedosa', artist: 'Grupo La Miedosa' },
        { title: 'Enganchado Cuarteto 2025', artist: 'DJ Nico Cuarteto' },
        { title: 'Quiero Más', artist: 'Marama' },
      ]
    },
    {
      name: '4. Cumbia urbana — neo cumbia',
      description: 'El cruce entre cumbia y urbano. Ke Personajes, Emilia.',
      songs: [
        { title: 'Olvidarte', artist: 'Gordo, Emilia' },
        { title: 'Ojos Verdes', artist: 'Nicki Nicole' },
        { title: 'Los Depuro', artist: 'Myke Towers, L-Gante' },
        { title: 'Qué Chimba', artist: 'L-Gante, Emilia' },
        { title: 'Perdonarte ¿Para Qué?', artist: 'Los Ángeles Azules, Emilia' },
        { title: 'Cómo Mirarte', artist: 'Ke Personajes' },
        { title: 'Cumbia que Pega', artist: 'La Mosca Tsé-Tsé' },
        { title: 'Mi Fata', artist: 'La Delio Valdez' },
      ]
    },
    {
      name: '5. Trap & urbano argentino',
      description: 'Duki, Milo J, YSY A, María Becerra — sonido nacional.',
      songs: [
        { title: 'Antes de Mí', artist: 'Duki' },
        { title: 'Givenchy', artist: 'Duki' },
        { title: 'Goteo', artist: 'Milo J' },
        { title: 'TRaP MaFIa', artist: 'YSY A' },
        { title: 'No Me Llores', artist: 'María Becerra' },
        { title: 'High', artist: 'María Becerra' },
        { title: 'Valentino', artist: 'Paulo Londra' },
      ]
    },
    {
      name: '6. Guaracha & electro latino',
      description: 'Energía pura (+47% streams 2025). Guaracha y fusión.',
      songs: [
        { title: 'FASHONISTA', artist: 'Martinwhite' },
        { title: 'El Mundo es Tuyo', artist: 'NEMJ' },
        { title: 'Fulanito', artist: 'El Alfa, CJ' },
        { title: 'Enganchado Guaracha 2025', artist: 'DJ NEA' },
        { title: 'Mix Guaracha vol.1', artist: 'DJ Varo' },
        { title: 'Picky', artist: 'J Balvin' },
      ]
    },
    {
      name: '7. Retro — reggaeton viejo',
      description: 'Daddy Yankee, Wisin & Yandel, Don Omar. Los clásicos.',
      songs: [
        { title: 'Gasolina', artist: 'Daddy Yankee' },
        { title: 'Danza Kuduro', artist: 'Don Omar' },
        { title: 'Suavemente', artist: 'Elvis Crespo' },
        { title: 'Despacito', artist: 'Luis Fonsi' },
        { title: 'Rompe', artist: 'Daddy Yankee' },
        { title: 'Ven Bailalo', artist: 'Wisin & Yandel' },
        { title: '6 AM', artist: 'J Balvin' },
        { title: 'El Perdón', artist: 'Nicky Jam' },
      ]
    },
    {
      name: '8. Rock nacional — bloque nostalgia',
      description: 'Soda Stereo, Los Piojos, Viejas Locas. Himnos argentinos.',
      songs: [
        { title: 'De Música Ligera', artist: 'Soda Stereo' },
        { title: 'Persiana Americana', artist: 'Soda Stereo' },
        { title: 'La Ciudad de la Furia', artist: 'Soda Stereo' },
        { title: 'Loco (Tu Forma de Ser)', artist: 'Viejas Locas' },
        { title: 'Sin Documentos', artist: 'Los Rodríguez' },
        { title: 'La Excepción', artist: 'Los Piojos' },
        { title: 'Jijiji', artist: 'Charly García' },
        { title: 'Mil Horas', artist: 'Los Abuelos de la Nada' },
      ]
    },
    {
      name: '9. Cierre de noche — after final',
      description: 'Enganchados y temazos para las últimas horas de pista.',
      songs: [
        { title: 'Enganchado fiestero vol.13', artist: 'Flow Kings DJ' },
        { title: 'Mix Bolichero cierre 2025', artist: 'DJ Pirata NEA' },
        { title: 'Lean On', artist: 'Major Lazer, DJ Snake' },
        { title: 'Te Boté', artist: 'Nio García' },
        { title: 'Amor de Vago (live edit)', artist: 'La T y La M' },
        { title: 'Mix RKT 2026 cierre', artist: 'Facu Guevara' },
      ]
    },
    {
      name: '10. Apertura — primera hora',
      description: 'Entrada suave para calentar la pista. Hits conocidos.',
      songs: [
        { title: 'Si Antes Te Hubiera Conocido', artist: 'Karol G' },
        { title: 'Luna', artist: 'Feid' },
        { title: 'Felices los 4', artist: 'Maluma' },
        { title: 'No Me Llores', artist: 'María Becerra' },
        { title: 'Valentino', artist: 'Paulo Londra' },
        { title: 'High', artist: 'María Becerra' },
      ]
    }
  ];

  // Primero borramos las de la prueba anterior para que estén limpias y ordenadas
  await prisma.templateSong.deleteMany({});
  await prisma.eventTemplate.deleteMany({});

  for (const pl of playlists) {
    await prisma.eventTemplate.create({
      data: {
        name: pl.name,
        description: pl.description,
        songs: {
          create: pl.songs
        }
      }
    });
  }

  console.log('--- Importación completada: 10 Playlists cargadas con éxito ---');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
