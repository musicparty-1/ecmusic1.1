import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Sincronizando Catálogo Ampliado de Misiones (Versión 2.0) ---');

  const playlists = [
    {
      name: '1. RKT & Cachengue — pista principal',
      description: 'Callejero Fino, BM, L-Gante y éxitos RKT 2024-2026.',
      songs: [
        { title: 'Hola Perdida', artist: 'Luck Ra, Khea' },
        { title: 'M.A (Remix)', artist: 'BM, Callejero Fino, La Joaqui' },
        { title: 'En la Intimidad', artist: 'Callejero Fino, Emilia' },
        { title: 'Ni Una Ni Dos', artist: 'BM' },
        { title: 'Una Foto (Remix)', artist: 'Mesita, Nicki Nicole, Tiago PZK' },
        { title: 'Amor de Vago', artist: 'La T y La M, Malandro' },
        { title: 'Tu Turrito', artist: 'Callejero Fino, Rei' },
        { title: 'Parte y Choke', artist: 'Alex Krack, Jombriel' },
        { title: 'La Plena', artist: 'W Sound' },
        { title: 'Mission 08', artist: 'Lauty Gram' },
        { title: 'Enganchado RKT vol.8', artist: 'Fer Palacio' },
        { title: 'Enganchado RKT vol.12', artist: 'DJ Pirata' },
        { title: 'RKT 420', artist: 'L-Gante' },
        { title: 'Bar', artist: 'Tini, L-Gante' },
        { title: 'Piel', artist: 'Tiago PZK, Ke Personajes' },
      ]
    },
    {
      name: '2. Reggaeton — lo más nuevo',
      description: 'Quevedo, Karol G, Bad Bunny, Mora y tendencias 2026.',
      songs: [
        { title: 'Si Antes Te Hubiera Conocido', artist: 'Karol G' },
        { title: 'Columbia', artist: 'Quevedo' },
        { title: 'BAILE INoLVIDABLE', artist: 'Bad Bunny' },
        { title: 'Gata Only', artist: 'Cris MJ, FloyyMenor' },
        { title: 'Classy 101', artist: 'Feid, Young Miko' },
        { title: 'Memorias', artist: 'Mora, Jhayco' },
        { title: 'Provenza', artist: 'Karol G' },
        { title: 'Moscow Mule', artist: 'Bad Bunny' },
        { title: 'Lala', artist: 'Myke Towers' },
        { title: 'Reina', artist: 'Mora, Saiko' },
        { title: 'BZRP Session 52', artist: 'Bizarrap, Quevedo' },
        { title: 'BZRP Session 53', artist: 'Bizarrap, Shakira' },
        { title: 'Luna', artist: 'Feid' },
        { title: 'DtMF', artist: 'Bad Bunny' },
        { title: 'Provenza (Remix)', artist: 'Karol G, Tiësto' },
      ]
    },
    {
      name: '3. Cuarteto — bloque misionero',
      description: 'Luck Ra, Q Lokura, Ulises Bueno y los himnos cordobeses.',
      songs: [
        { title: 'Luck Ra BZRP Session 61', artist: 'Bizarrap, Luck Ra' },
        { title: 'Que No Quede Nada', artist: 'Luck Ra' },
        { title: 'Disfruto (Remix)', artist: 'Q Lokura' },
        { title: 'Ya No Vuelvas', artist: 'Luck Ra, La K\'onga' },
        { title: 'Universo Paralelo', artist: 'La K\'onga, Nahuel Pennisi' },
        { title: 'Intento', artist: 'Ulises Bueno' },
        { title: 'Yo No Te Pido La Luna', artist: 'Q Lokura' },
        { title: 'Te Mentiría', artist: 'Luck Ra' },
        { title: 'Beso de Mentira', artist: 'Luck Ra' },
        { title: 'Infiel', artist: 'Ulises Bueno' },
        { title: 'Cuarteto Mix 2025', artist: 'DJ Nico' },
        { title: 'Hola Perdida (Versión Cuarteto)', artist: 'Luck Ra' },
        { title: 'La Miedosa', artist: 'Grupo La Miedosa' },
        { title: 'Que No Quede Nada (Live)', artist: 'Luck Ra' },
        { title: 'Ya No Me Duele', artist: 'Luck Ra' },
      ]
    }
  ];

  // Limpiamos las plantillas de Misiones existentes para actualizarlas
  // Buscamos por nombre parcial para no borrar Billboard
  const existingTemplates = await prisma.eventTemplate.findMany({
    where: { OR: [
      { name: { contains: 'RKT' } },
      { name: { contains: 'Reggaeton' } },
      { name: { contains: 'Cuarteto' } }
    ]}
  });

  for (const t of existingTemplates) {
    await prisma.templateSong.deleteMany({ where: { template_id: t.id } });
    await prisma.eventTemplate.delete({ where: { id: t.id } });
  }

  // Creamos las nuevas plantillas con el catálogo ampliado
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

  console.log('--- Sincronización exitosa: Catálogo ampliado cargado en Neon ---');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
