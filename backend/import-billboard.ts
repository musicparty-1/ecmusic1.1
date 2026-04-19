import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Agregando Playlist Billboard Argentina Hot 100 ---');

  const billboardPlaylist = {
    name: '11. Billboard AR Hot 100 — Top de la Semana',
    description: 'Los temas más escuchados en Argentina según Billboard (Abril 2026).',
    songs: [
      { title: 'Cuando No Era Cantante', artist: 'El Bogueto & Yung Beef' },
      { title: 'LA VILLA', artist: 'Ryan Castro, Kapo' },
      { title: 'Soy Favela', artist: 'LA T Y LA M' },
      { title: 'Puñaladas', artist: 'Amigo de Artistas, Lauta' },
      { title: 'La Perla', artist: 'ROSALÍA & YAHRITZA Y SU ESENCIA' },
      { title: 'UWAIE (versión cumbia)', artist: 'Max Carra' },
      { title: 'Tu Jardin Con Enanitos', artist: 'Roze Oficial, Max Carra' },
      { title: 'TU MISTERIOSO ALGUIEN', artist: 'Luck Ra Feat. Miranda!' },
      { title: 'BAILE INoLVIDABLE', artist: 'Bad Bunny' },
      { title: 'JETSKI', artist: 'Emilia Mernes, Melody' },
      { title: 'FOREVER TU GANTEL', artist: 'Omar Courtz, Ñengo Flow' },
      { title: 'DtMF', artist: 'Bad Bunny' },
      { title: 'J Balvin: Bzrp Music Sessions, Vol. 62/66', artist: 'Bizarrap, J Balvin' },
      { title: 'Tu Vas Sin (Fav)', artist: 'Rels B' },
      { title: 'Daddy Yankee: Bzrp Music Sessions, Vol. 0/66', artist: 'Bizarrap & Daddy Yankee' },
      { title: 'Cambiaré', artist: 'Feid, Luis Fonsi' },
      { title: 'No Tiene Sentido', artist: 'Beéle' },
      { title: 'W Sound 05 "LA PLENA"', artist: 'Beéle, Westcol' },
      { title: 'Hasta Que Me Enamoro', artist: 'Maria Becerra, Tini' },
      { title: 'VOY A LLeVARTE PA PR', artist: 'Bad Bunny' },
    ]
  };

  // Insertamos la nueva playlist sin borrar las anteriores
  await prisma.eventTemplate.create({
    data: {
      name: billboardPlaylist.name,
      description: billboardPlaylist.description,
      songs: {
        create: billboardPlaylist.songs
      }
    }
  });

  console.log('--- Playlist Billboard agregada con éxito ---');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
