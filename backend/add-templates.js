const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const newTemplates = [
  {
    name: 'Billboard Hot 100',
    description: 'Los más escuchados del chart global',
    songs: [
      { title: 'Espresso', artist: 'Sabrina Carpenter' },
      { title: 'Not Like Us', artist: 'Kendrick Lamar' },
      { title: 'Birds of a Feather', artist: 'Billie Eilish' },
      { title: 'A Bar Song (Tipsy)', artist: 'Shaboozey' },
      { title: 'Taste', artist: 'Sabrina Carpenter' },
      { title: 'Die With a Smile', artist: 'Lady Gaga & Bruno Mars' },
      { title: 'Good Luck, Babe!', artist: 'Chappell Roan' },
      { title: 'Beautiful Things', artist: 'Benson Boone' },
      { title: 'Lose Control', artist: 'Teddy Swims' },
      { title: 'Please Please Please', artist: 'Sabrina Carpenter' },
      { title: 'Flowers', artist: 'Miley Cyrus' },
      { title: 'vampire', artist: 'Olivia Rodrigo' },
    ]
  },
  {
    name: 'Misiones - Hits Locales',
    description: 'Los favoritos de las fiestas misioneras',
    songs: [
      { title: 'La Morocha', artist: "La K'onga" },
      { title: 'Wacho', artist: 'L-Gante' },
      { title: 'Mala Fama', artist: 'L-Gante' },
      { title: 'El Amor de Mi Vida', artist: 'L-Gante' },
      { title: 'Gata Only', artist: 'FloyyMenor & Cris MJ' },
      { title: 'Loca', artist: 'Gilda' },
      { title: 'No Es Mi Amante', artist: 'Gilda' },
      { title: 'Quiero Más', artist: 'Banda XXI' },
      { title: 'Tití Me Preguntó', artist: 'Bad Bunny' },
      { title: 'BZRP Music Sessions #53', artist: 'Bizarrap & Shakira' },
      { title: 'TQG', artist: 'Karol G & Shakira' },
      { title: 'Bichota', artist: 'Karol G' },
    ]
  },
];

async function main() {
  for (const tData of newTemplates) {
    const existing = await prisma.eventTemplate.findFirst({ where: { name: tData.name } });
    if (existing) {
      console.log(`Plantilla "${tData.name}" ya existe, saltando.`);
      continue;
    }
    const { songs, ...t } = tData;
    const template = await prisma.eventTemplate.create({ data: t });
    for (const s of songs) {
      await prisma.templateSong.create({ data: { ...s, template_id: template.id } });
    }
    console.log(`Plantilla "${tData.name}" creada con ${songs.length} canciones.`);
  }
  console.log('Listo.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
