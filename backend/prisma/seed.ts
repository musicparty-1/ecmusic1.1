import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('dj123456', 10);

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 30);

  // 1. Crear DJ de prueba
  const dj = await prisma.dJUser.upsert({
    where: { email: 'dj@ecmusic.com' },
    update: { password: hashedPassword },
    create: {
      email: 'dj@ecmusic.com',
      name: 'DJ Demo',
      password: hashedPassword,
      plan: 'DEMO',
      subscriptionStatus: 'TRIAL',
      trialEndsAt,
    },
  });

  console.log('DJ creado:', dj.email);

  // 2. Limpiar templates y catálogo previos
  await prisma.templateSong.deleteMany();
  await prisma.eventTemplate.deleteMany();
  await prisma.catalogSong.deleteMany();

  // 3. Catálogo de canciones con BPM
  const catalog = [
    // Reggaetón / Urbano
    { title: 'Gasolina', artist: 'Daddy Yankee', genre: 'Reggaetón', bpm: 96 },
    { title: 'Con Calma', artist: 'Daddy Yankee', genre: 'Reggaetón', bpm: 94 },
    { title: 'Lo Que Pasó, Pasó', artist: 'Daddy Yankee', genre: 'Reggaetón', bpm: 96 },
    { title: 'Dile', artist: 'Don Omar', genre: 'Reggaetón', bpm: 94 },
    { title: 'Rakata', artist: 'Wisin & Yandel', genre: 'Reggaetón', bpm: 96 },
    { title: 'China', artist: 'Anuel AA, Daddy Yankee, J Balvin', genre: 'Reggaetón', bpm: 105 },
    { title: 'Tusa', artist: 'Karol G & Nicki Minaj', genre: 'Reggaetón', bpm: 101 },
    { title: 'Bichota', artist: 'Karol G', genre: 'Reggaetón', bpm: 164 },
    { title: 'Provenza', artist: 'Karol G', genre: 'Reggaetón', bpm: 111 },
    { title: 'MAMIII', artist: 'Becky G & Karol G', genre: 'Reggaetón', bpm: 94 },
    { title: 'Mi Ex Tenía Razón', artist: 'Karol G', genre: 'Reggaetón', bpm: 105 },
    { title: 'Con Altura', artist: 'Rosalía & J Balvin', genre: 'Reggaetón', bpm: 98 },
    { title: 'Hawái', artist: 'Maluma', genre: 'Reggaetón', bpm: 90 },
    { title: 'Mi Gente', artist: 'J Balvin & Willy William', genre: 'Reggaetón', bpm: 105 },
    { title: 'Dákiti', artist: 'Bad Bunny & Jhay Cortez', genre: 'Reggaetón', bpm: 110 },
    { title: 'Tití Me Preguntó', artist: 'Bad Bunny', genre: 'Reggaetón', bpm: 111 },
    { title: 'Me Porto Bonito', artist: 'Bad Bunny & Chencho Corleone', genre: 'Reggaetón', bpm: 92 },
    { title: 'Ojitos Lindos', artist: 'Bad Bunny & Bomba Estéreo', genre: 'Reggaetón', bpm: 80 },
    { title: 'Gata Only', artist: 'FloyyMenor & Cris MJ', genre: 'Reggaetón', bpm: 100 },
    { title: 'Pepas', artist: 'Farruko', genre: 'Reggaetón', bpm: 130 },

    // Pop Latino
    { title: 'Shakira: BZRP Music Sessions #53', artist: 'Bizarrap & Shakira', genre: 'Pop Latino', bpm: 122 },
    { title: 'TQG', artist: 'Karol G & Shakira', genre: 'Pop Latino', bpm: 100 },
    { title: 'Hips Don\'t Lie', artist: 'Shakira', genre: 'Pop Latino', bpm: 100 },
    { title: 'Despacito', artist: 'Luis Fonsi & Daddy Yankee', genre: 'Pop Latino', bpm: 89 },
    { title: 'Bailando', artist: 'Enrique Iglesias', genre: 'Pop Latino', bpm: 91 },
    { title: 'X', artist: 'Nicky Jam & J Balvin', genre: 'Pop Latino', bpm: 90 },
    { title: 'Sin Pijama', artist: 'Becky G & Natti Natasha', genre: 'Pop Latino', bpm: 94 },

    // Trap / RKT
    { title: 'Mala Fama', artist: 'L-Gante', genre: 'Trap / RKT', bpm: 92 },
    { title: 'El Amor de Mi Vida', artist: 'L-Gante', genre: 'Trap / RKT', bpm: 90 },
    { title: 'BZRP Music Sessions #52', artist: 'Bizarrap & Quevedo', genre: 'Trap / RKT', bpm: 128 },
    { title: 'Colocao', artist: 'Nicki Nicole', genre: 'Trap / RKT', bpm: 115 },
    { title: 'Goteo', artist: 'Duki', genre: 'Trap / RKT', bpm: 130 },
    { title: 'Loca', artist: 'Khea & Duki', genre: 'Trap / RKT', bpm: 90 },
    { title: 'MAMICHULA', artist: 'Trueno ft. Nicki Nicole', genre: 'Trap / RKT', bpm: 95 },
    { title: 'Plan A', artist: 'Paulo Londra', genre: 'Trap / RKT', bpm: 174 },

    // Cumbia / Cuarteto
    { title: 'La Morocha', artist: 'La K\'onga', genre: 'Cumbia', bpm: 95 },
    { title: 'Me Enamora', artist: 'La Delio Valdez', genre: 'Cumbia', bpm: 100 },
    { title: 'Recuerdo Inolvidable', artist: 'Los Palmeras', genre: 'Cumbia', bpm: 92 },
    { title: 'No Te Vayas', artist: 'Los Auténticos Decadentes', genre: 'Cumbia', bpm: 105 },
    { title: 'Loca', artist: 'Gilda', genre: 'Cumbia', bpm: 100 },
    { title: 'La Pollera Colorá', artist: 'Wilson Choperena', genre: 'Cumbia', bpm: 110 },
    { title: 'Quién Será', artist: 'Ráfaga', genre: 'Cumbia', bpm: 105 },

    // Electrónica / House
    { title: 'Blinding Lights', artist: 'The Weeknd', genre: 'Pop / Electrónica', bpm: 171 },
    { title: 'One More Time', artist: 'Daft Punk', genre: 'Electrónica', bpm: 119 },
    { title: 'Titanium', artist: 'David Guetta & Sia', genre: 'Electrónica', bpm: 126 },
    { title: 'Levels', artist: 'Avicii', genre: 'Electrónica', bpm: 126 },
    { title: 'Wake Me Up', artist: 'Avicii', genre: 'Electrónica', bpm: 124 },
    { title: 'Lean On', artist: 'Major Lazer & DJ Snake', genre: 'Electrónica', bpm: 98 },
    { title: 'Faded', artist: 'Alan Walker', genre: 'Electrónica', bpm: 90 },
    { title: 'Summer', artist: 'Calvin Harris', genre: 'Electrónica', bpm: 128 },
    { title: 'We Found Love', artist: 'Calvin Harris & Rihanna', genre: 'Electrónica', bpm: 128 },

    // Pop Internacional
    { title: 'Espresso', artist: 'Sabrina Carpenter', genre: 'Pop', bpm: 104 },
    { title: 'Please Please Please', artist: 'Sabrina Carpenter', genre: 'Pop', bpm: 107 },
    { title: 'Bad Guy', artist: 'Billie Eilish', genre: 'Pop', bpm: 135 },
    { title: 'Cruel Summer', artist: 'Taylor Swift', genre: 'Pop', bpm: 170 },
    { title: 'As It Was', artist: 'Harry Styles', genre: 'Pop', bpm: 174 },
    { title: 'Levitating', artist: 'Dua Lipa', genre: 'Pop', bpm: 103 },
    { title: 'Uptown Funk', artist: 'Mark Ronson & Bruno Mars', genre: 'Pop', bpm: 115 },
    { title: 'Shape of You', artist: 'Ed Sheeran', genre: 'Pop', bpm: 96 },
    { title: 'Die With a Smile', artist: 'Lady Gaga & Bruno Mars', genre: 'Pop', bpm: 108 },
    { title: 'APT.', artist: 'ROSÉ & Bruno Mars', genre: 'Pop', bpm: 110 },

    // Rock / Rock Clásico / Pop 80s
    { title: 'Bohemian Rhapsody', artist: 'Queen', genre: 'Rock Clásico', bpm: 71 },
    { title: 'Back in Black', artist: 'AC/DC', genre: 'Rock Clásico', bpm: 94 },
    { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', genre: 'Rock Clásico', bpm: 125 },
    { title: 'Livin\' on a Prayer', artist: 'Bon Jovi', genre: 'Rock Clásico', bpm: 118 },
    { title: 'Smells Like Teen Spirit', artist: 'Nirvana', genre: 'Rock Clásico', bpm: 117 },
    { title: 'Mr. Brightside', artist: 'The Killers', genre: 'Rock', bpm: 148 },
    { title: 'Wonderwall', artist: 'Oasis', genre: 'Rock', bpm: 87 },
    { title: 'Viva la Vida', artist: 'Coldplay', genre: 'Rock', bpm: 138 },
    { title: 'Take On Me', artist: 'a-ha', genre: '80s Pop', bpm: 169 },
    { title: 'Billie Jean', artist: 'Michael Jackson', genre: '80s Pop', bpm: 117 },
    { title: 'De Música Ligera', artist: 'Soda Stereo', genre: 'Rock Nacional', bpm: 130 },
    { title: 'Lamento Boliviano', artist: 'Enanitos Verdes', genre: 'Rock Nacional', bpm: 90 },
    { title: 'Matador', artist: 'Los Fabulosos Cadillacs', genre: 'Rock Nacional', bpm: 114 }
  ];

  await prisma.catalogSong.createMany({ data: catalog });
  console.log(`Catálogo creado con ${catalog.length} canciones con BPM.`);

  // 4. Crear "Súper Plantillas"
  const templates = [
    { 
      name: 'Cachengue Boliche 🔥', 
      description: 'Reggaetón moderno, RKT y Pop Latino para romper la pista',
      genres: ['Reggaetón', 'Trap / RKT', 'Pop Latino']
    },
    { 
      name: 'Retro & Clásicos 🪩', 
      description: 'Reggaetón Old School, 80s Pop y Cumbia Clásica',
      genres: ['80s Pop', 'Cumbia', 'Rock Nacional']
    },
    {
      name: 'Electrónica & Pop ⚡',
      description: 'EDM, House y los hits Internacionales del momento',
      genres: ['Electrónica', 'Pop / Electrónica', 'Pop']
    },
    {
      name: 'Rock & Pop Internacional 🎸',
      description: 'Clásicos del Rock, Himnos de estadios',
      genres: ['Rock', 'Rock Clásico']
    }
  ];

  for (const t of templates) {
    const template = await prisma.eventTemplate.create({ 
      data: { name: t.name, description: t.description } 
    });

    // Filtramos las canciones del catálogo que coincidan con los géneros de la plantilla
    // También agregamos algunas manuales si es necesario para dar el "flavor" correcto.
    const matchingSongs = catalog.filter(s => t.genres.includes(s.genre));
    
    // Si la plantilla es "Retro", agregamos reggaeton viejo manualmente
    if (t.name === 'Retro & Clásicos 🪩') {
      const viejos = catalog.filter(s => ['Gasolina', 'Con Calma', 'Dile', 'Rakata', 'Lo Que Pasó, Pasó'].includes(s.title));
      matchingSongs.push(...viejos);
    }

    for (const s of matchingSongs) {
      await prisma.templateSong.create({
        data: { 
          title: s.title, 
          artist: s.artist, 
          bpm: s.bpm,
          template_id: template.id 
        }
      });
    }
  }

  console.log('Súper Plantillas creadas.');

  // 5. Crear Evento de Prueba
  const cachengue = await prisma.eventTemplate.findFirst({ where: { name: 'Cachengue Boliche 🔥' } });
  
  const event = await prisma.event.create({
    data: {
      name: 'Gran Fiesta EC Music',
      venue: 'Estadio Obras',
      dj_id: dj.id,
      maxVotesPerDevice: 3,
      status: 'ACTIVE'
    }
  });

  const templateSongs = await prisma.templateSong.findMany({ where: { template_id: cachengue!.id } });
  for (const ts of templateSongs) {
    await prisma.song.create({
      data: {
        title: ts.title,
        artist: ts.artist,
        bpm: ts.bpm,
        event_id: event.id,
        played: false
      }
    });
  }

  console.log('Evento de prueba creado con canciones y BPM.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
