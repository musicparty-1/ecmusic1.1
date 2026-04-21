"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function main() {
    const hashedPassword = await bcrypt.hash('dj123456', 10);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);
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
    await prisma.templateSong.deleteMany();
    await prisma.eventTemplate.deleteMany();
    const templates = [
        {
            name: 'Hits 2024',
            description: 'Lo más escuchado del año',
            songs: [
                { title: 'Espresso', artist: 'Sabrina Carpenter' },
                { title: 'Birds of a Feather', artist: 'Billie Eilish' },
                { title: 'A Bar Song (Tipsy)', artist: 'Shaboozey' },
                { title: 'Gata Only', artist: 'FloyyMenor & Cris MJ' },
                { title: 'Million Dollar Baby', artist: 'Tommy Richman' },
            ]
        },
        {
            name: 'Classic Rock',
            description: 'Los himnos del rock',
            songs: [
                { title: 'Bohemian Rhapsody', artist: 'Queen' },
                { title: 'Back in Black', artist: 'AC/DC' },
                { title: 'Sweet Child O Mine', artist: 'Guns N Roses' },
                { title: 'Livin on a Prayer', artist: 'Bon Jovi' },
                { title: 'The Chain', artist: 'Fleetwood Mac' },
            ]
        },
        {
            name: 'Reggaetón Clásico',
            description: 'Perreo de la vieja escuela',
            songs: [
                { title: 'Gasolina', artist: 'Daddy Yankee' },
                { title: 'Dile', artist: 'Don Omar' },
                { title: 'Rakata', artist: 'Wisin & Yandel' },
                { title: 'Pa Que Retoncen', artist: 'Tego Calderón' },
                { title: 'Lo Que Pasó, Pasó', artist: 'Daddy Yankee' },
            ]
        },
    ];
    for (const tData of templates) {
        const { songs, ...t } = tData;
        const template = await prisma.eventTemplate.create({ data: t });
        for (const s of songs) {
            await prisma.templateSong.create({
                data: { ...s, template_id: template.id }
            });
        }
    }
    console.log('Plantillas creadas con canciones.');
    const hots2024 = await prisma.eventTemplate.findFirst({ where: { name: 'Hits 2024' } });
    const event = await prisma.event.create({
        data: {
            name: 'Gran Fiesta EC Music',
            venue: 'Estadio Obras',
            dj_id: dj.id,
            maxVotesPerDevice: 3,
            status: 'ACTIVE'
        }
    });
    const templateSongs = await prisma.templateSong.findMany({ where: { template_id: hots2024.id } });
    for (const ts of templateSongs) {
        await prisma.song.create({
            data: {
                title: ts.title,
                artist: ts.artist,
                event_id: event.id,
                played: false
            }
        });
    }
    console.log('Evento de prueba "Gran Fiesta EC Music" creado con 3 votos de límite.');
    await prisma.catalogSong.deleteMany();
    const catalog = [
        { title: 'Gasolina', artist: 'Daddy Yankee', genre: 'Reggaetón' },
        { title: 'Con Calma', artist: 'Daddy Yankee', genre: 'Reggaetón' },
        { title: 'Lo Que Pasó, Pasó', artist: 'Daddy Yankee', genre: 'Reggaetón' },
        { title: 'Dile', artist: 'Don Omar', genre: 'Reggaetón' },
        { title: 'Rakata', artist: 'Wisin & Yandel', genre: 'Reggaetón' },
        { title: 'Sola', artist: 'Anuel AA', genre: 'Reggaetón' },
        { title: 'China', artist: 'Anuel AA, Daddy Yankee, J Balvin', genre: 'Reggaetón' },
        { title: 'Tusa', artist: 'Karol G & Nicki Minaj', genre: 'Reggaetón' },
        { title: 'Bichota', artist: 'Karol G', genre: 'Reggaetón' },
        { title: 'Provenza', artist: 'Karol G', genre: 'Reggaetón' },
        { title: 'MAMIII', artist: 'Becky G & Karol G', genre: 'Reggaetón' },
        { title: 'Mi Ex Tenía Razón', artist: 'Karol G', genre: 'Reggaetón' },
        { title: 'Gatúbela', artist: 'Karol G & Maluma', genre: 'Reggaetón' },
        { title: 'Con Altura', artist: 'Rosalía & J Balvin', genre: 'Reggaetón' },
        { title: 'Mala Mía', artist: 'Maluma', genre: 'Reggaetón' },
        { title: 'Hawái', artist: 'Maluma', genre: 'Reggaetón' },
        { title: 'Felices los 4', artist: 'Maluma', genre: 'Reggaetón' },
        { title: 'Cardi', artist: 'J Balvin', genre: 'Reggaetón' },
        { title: 'Mi Gente', artist: 'J Balvin & Willy William', genre: 'Reggaetón' },
        { title: 'Safari', artist: 'J Balvin', genre: 'Reggaetón' },
        { title: 'Ginza', artist: 'J Balvin', genre: 'Reggaetón' },
        { title: 'Dákiti', artist: 'Bad Bunny & Jhay Cortez', genre: 'Reggaetón' },
        { title: 'MIA', artist: 'Bad Bunny & Drake', genre: 'Reggaetón' },
        { title: 'Yonaguni', artist: 'Bad Bunny', genre: 'Reggaetón' },
        { title: 'Tití Me Preguntó', artist: 'Bad Bunny', genre: 'Reggaetón' },
        { title: 'Me Porto Bonito', artist: 'Bad Bunny & Chencho Corleone', genre: 'Reggaetón' },
        { title: 'Un Verano Sin Ti', artist: 'Bad Bunny', genre: 'Reggaetón' },
        { title: 'Efecto', artist: 'Bad Bunny', genre: 'Reggaetón' },
        { title: 'Moscow Mule', artist: 'Bad Bunny', genre: 'Reggaetón' },
        { title: 'Ojitos Lindos', artist: 'Bad Bunny & Bomba Estéreo', genre: 'Reggaetón' },
        { title: 'Gata Only', artist: 'FloyyMenor & Cris MJ', genre: 'Reggaetón' },
        { title: 'LINDA', artist: 'Myke Towers', genre: 'Reggaetón' },
        { title: 'La Jeepeta', artist: 'Nio García & Anuel AA', genre: 'Reggaetón' },
        { title: 'Pepas', artist: 'Farruko', genre: 'Reggaetón' },
        { title: 'Soltera', artist: 'Lunay, Daddy Yankee & Bad Bunny', genre: 'Reggaetón' },
        { title: 'Shakira: BZRP Music Sessions #53', artist: 'Bizarrap & Shakira', genre: 'Pop Latino' },
        { title: 'TQG', artist: 'Karol G & Shakira', genre: 'Pop Latino' },
        { title: 'Hips Don\'t Lie', artist: 'Shakira', genre: 'Pop Latino' },
        { title: 'Waka Waka', artist: 'Shakira', genre: 'Pop Latino' },
        { title: 'La Tortura', artist: 'Shakira', genre: 'Pop Latino' },
        { title: 'Despacito', artist: 'Luis Fonsi & Daddy Yankee', genre: 'Pop Latino' },
        { title: 'Échame La Culpa', artist: 'Luis Fonsi & Demi Lovato', genre: 'Pop Latino' },
        { title: 'Sensación del Bloque', artist: 'Enrique Iglesias', genre: 'Pop Latino' },
        { title: 'Bailando', artist: 'Enrique Iglesias', genre: 'Pop Latino' },
        { title: 'Subeme La Radio', artist: 'Enrique Iglesias', genre: 'Pop Latino' },
        { title: 'El Perdón', artist: 'Nicky Jam & Enrique Iglesias', genre: 'Pop Latino' },
        { title: 'X', artist: 'Nicky Jam & J Balvin', genre: 'Pop Latino' },
        { title: 'Travesuras', artist: 'Nicky Jam', genre: 'Pop Latino' },
        { title: 'Quiero', artist: 'Becky G', genre: 'Pop Latino' },
        { title: 'Sin Pijama', artist: 'Becky G & Natti Natasha', genre: 'Pop Latino' },
        { title: 'Mayores', artist: 'Becky G & Bad Bunny', genre: 'Pop Latino' },
        { title: 'Acróstico', artist: 'Shakira', genre: 'Pop Latino' },
        { title: 'Te Felicito', artist: 'Shakira & Rauw Alejandro', genre: 'Pop Latino' },
        { title: 'Mala Fama', artist: 'L-Gante', genre: 'Trap / RKT' },
        { title: 'El Amor de Mi Vida', artist: 'L-Gante', genre: 'Trap / RKT' },
        { title: 'Disciplina', artist: 'Paulo Londra', genre: 'Trap / RKT' },
        { title: 'Adán y Eva', artist: 'Paulo Londra', genre: 'Trap / RKT' },
        { title: 'Cuando te Besé', artist: 'Paulo Londra & Becky G', genre: 'Trap / RKT' },
        { title: 'Adan y Eva', artist: 'Paulo Londra', genre: 'Trap / RKT' },
        { title: 'BZRP Music Sessions #52', artist: 'Bizarrap & Quevedo', genre: 'Trap / RKT' },
        { title: 'BZRP Music Sessions #49', artist: 'Bizarrap & Myke Towers', genre: 'Trap / RKT' },
        { title: 'BZRP Music Sessions #46', artist: 'Bizarrap & Nicki Nicole', genre: 'Trap / RKT' },
        { title: 'Colocao', artist: 'Nicki Nicole', genre: 'Trap / RKT' },
        { title: 'Wapo Traketero', artist: 'Duki', genre: 'Trap / RKT' },
        { title: 'Goteo', artist: 'Duki', genre: 'Trap / RKT' },
        { title: 'Antes', artist: 'Duki', genre: 'Trap / RKT' },
        { title: 'Si te Sentis Sola', artist: 'Khea', genre: 'Trap / RKT' },
        { title: 'Loca', artist: 'Khea & Duki', genre: 'Trap / RKT' },
        { title: 'La Morocha', artist: 'La K\'onga', genre: 'Cumbia' },
        { title: 'Me Enamora', artist: 'La Delio Valdez', genre: 'Cumbia' },
        { title: 'Quiero Más', artist: 'Banda XXI', genre: 'Cumbia' },
        { title: 'Para Olvidarte', artist: 'Rombai', genre: 'Cumbia' },
        { title: 'Qué Hace Ella', artist: 'Agrupación Marilyn', genre: 'Cumbia' },
        { title: 'Recuerdo Inolvidable', artist: 'Los Palmeras', genre: 'Cumbia' },
        { title: 'No Te Vayas', artist: 'Los Auténticos Decadentes', genre: 'Cumbia' },
        { title: 'Sigueme', artist: 'Mr. Don', genre: 'Cumbia' },
        { title: 'Loca', artist: 'Gilda', genre: 'Cumbia' },
        { title: 'No Es Mi Amante', artist: 'Gilda', genre: 'Cumbia' },
        { title: 'La Pollera Colorá', artist: 'Wilson Choperena', genre: 'Cumbia' },
        { title: 'Cariño Malo', artist: 'Américo', genre: 'Cumbia' },
        { title: 'Quién Será', artist: 'Ráfaga', genre: 'Cumbia' },
        { title: 'Te Necesito', artist: 'Ráfaga', genre: 'Cumbia' },
        { title: 'Blinding Lights', artist: 'The Weeknd', genre: 'Pop / Electrónica' },
        { title: 'Save Your Tears', artist: 'The Weeknd', genre: 'Pop / Electrónica' },
        { title: 'Starboy', artist: 'The Weeknd & Daft Punk', genre: 'Pop / Electrónica' },
        { title: 'One More Time', artist: 'Daft Punk', genre: 'Electrónica' },
        { title: 'Get Lucky', artist: 'Daft Punk & Pharrell Williams', genre: 'Electrónica' },
        { title: 'Lose Yourself to Dance', artist: 'Daft Punk', genre: 'Electrónica' },
        { title: 'Titanium', artist: 'David Guetta & Sia', genre: 'Electrónica' },
        { title: 'Without You', artist: 'David Guetta & Usher', genre: 'Electrónica' },
        { title: 'Animals', artist: 'Martin Garrix', genre: 'Electrónica' },
        { title: 'Don\'t You Worry Child', artist: 'Swedish House Mafia', genre: 'Electrónica' },
        { title: 'Levels', artist: 'Avicii', genre: 'Electrónica' },
        { title: 'Wake Me Up', artist: 'Avicii', genre: 'Electrónica' },
        { title: 'Hey Brother', artist: 'Avicii', genre: 'Electrónica' },
        { title: 'Lean On', artist: 'Major Lazer & DJ Snake', genre: 'Electrónica' },
        { title: 'Taki Taki', artist: 'DJ Snake, Selena Gomez, Cardi B, Ozuna', genre: 'Electrónica' },
        { title: 'Turn Down for What', artist: 'DJ Snake & Lil Jon', genre: 'Electrónica' },
        { title: 'Clarity', artist: 'Zedd & Foxes', genre: 'Electrónica' },
        { title: 'Stay the Night', artist: 'Zedd & Hayley Williams', genre: 'Electrónica' },
        { title: 'Faded', artist: 'Alan Walker', genre: 'Electrónica' },
        { title: 'Alone', artist: 'Alan Walker', genre: 'Electrónica' },
        { title: 'Spectre', artist: 'Alan Walker', genre: 'Electrónica' },
        { title: 'I Took a Pill in Ibiza', artist: 'Mike Posner', genre: 'Electrónica' },
        { title: 'Rather Be', artist: 'Clean Bandit', genre: 'Electrónica' },
        { title: 'Rockabye', artist: 'Clean Bandit & Anne-Marie', genre: 'Electrónica' },
        { title: 'Summer', artist: 'Calvin Harris', genre: 'Electrónica' },
        { title: 'Feel So Close', artist: 'Calvin Harris', genre: 'Electrónica' },
        { title: 'We Found Love', artist: 'Calvin Harris & Rihanna', genre: 'Electrónica' },
        { title: 'This Is What You Came For', artist: 'Calvin Harris & Rihanna', genre: 'Electrónica' },
        { title: 'Espresso', artist: 'Sabrina Carpenter', genre: 'Pop' },
        { title: 'Please Please Please', artist: 'Sabrina Carpenter', genre: 'Pop' },
        { title: 'Birds of a Feather', artist: 'Billie Eilish', genre: 'Pop' },
        { title: 'Bad Guy', artist: 'Billie Eilish', genre: 'Pop' },
        { title: 'Happier Than Ever', artist: 'Billie Eilish', genre: 'Pop' },
        { title: 'Shake It Off', artist: 'Taylor Swift', genre: 'Pop' },
        { title: 'Blank Space', artist: 'Taylor Swift', genre: 'Pop' },
        { title: 'Anti-Hero', artist: 'Taylor Swift', genre: 'Pop' },
        { title: 'Cruel Summer', artist: 'Taylor Swift', genre: 'Pop' },
        { title: 'Style', artist: 'Taylor Swift', genre: 'Pop' },
        { title: 'As It Was', artist: 'Harry Styles', genre: 'Pop' },
        { title: 'Watermelon Sugar', artist: 'Harry Styles', genre: 'Pop' },
        { title: 'Levitating', artist: 'Dua Lipa', genre: 'Pop' },
        { title: 'Don\'t Start Now', artist: 'Dua Lipa', genre: 'Pop' },
        { title: 'Physical', artist: 'Dua Lipa', genre: 'Pop' },
        { title: 'New Rules', artist: 'Dua Lipa', genre: 'Pop' },
        { title: 'Break My Heart', artist: 'Dua Lipa', genre: 'Pop' },
        { title: 'Uptown Funk', artist: 'Mark Ronson & Bruno Mars', genre: 'Pop' },
        { title: 'Treasure', artist: 'Bruno Mars', genre: 'Pop' },
        { title: '24K Magic', artist: 'Bruno Mars', genre: 'Pop' },
        { title: 'That\'s What I Like', artist: 'Bruno Mars', genre: 'Pop' },
        { title: 'Leave the Door Open', artist: 'Bruno Mars & Anderson .Paak', genre: 'Pop' },
        { title: 'Peaches', artist: 'Justin Bieber', genre: 'Pop' },
        { title: 'Stay', artist: 'Justin Bieber & The Kid LAROI', genre: 'Pop' },
        { title: 'Love Yourself', artist: 'Justin Bieber', genre: 'Pop' },
        { title: 'Sorry', artist: 'Justin Bieber', genre: 'Pop' },
        { title: 'Shape of You', artist: 'Ed Sheeran', genre: 'Pop' },
        { title: 'Perfect', artist: 'Ed Sheeran', genre: 'Pop' },
        { title: 'Bad Habits', artist: 'Ed Sheeran', genre: 'Pop' },
        { title: 'Shivers', artist: 'Ed Sheeran', genre: 'Pop' },
        { title: 'Blister in the Sun', artist: 'Ed Sheeran', genre: 'Pop' },
        { title: 'Million Dollar Baby', artist: 'Tommy Richman', genre: 'Pop' },
        { title: 'A Bar Song (Tipsy)', artist: 'Shaboozey', genre: 'Pop' },
        { title: 'luther', artist: 'Kendrick Lamar & SZA', genre: 'Pop' },
        { title: 'Die With a Smile', artist: 'Lady Gaga & Bruno Mars', genre: 'Pop' },
        { title: 'APT.', artist: 'ROSE & Bruno Mars', genre: 'Pop' },
        { title: 'Halo', artist: 'Beyoncé', genre: 'R&B' },
        { title: 'Crazy in Love', artist: 'Beyoncé', genre: 'R&B' },
        { title: 'Love on Top', artist: 'Beyoncé', genre: 'R&B' },
        { title: 'Single Ladies', artist: 'Beyoncé', genre: 'R&B' },
        { title: 'Drunk in Love', artist: 'Beyoncé & JAY-Z', genre: 'R&B' },
        { title: 'Golden', artist: 'Jill Scott', genre: 'R&B' },
        { title: 'Good Days', artist: 'SZA', genre: 'R&B' },
        { title: 'Kill Bill', artist: 'SZA', genre: 'R&B' },
        { title: 'Snooze', artist: 'SZA', genre: 'R&B' },
        { title: 'Essence', artist: 'WizKid & Tems', genre: 'R&B' },
        { title: 'SICKO MODE', artist: 'Travis Scott', genre: 'Hip-Hop' },
        { title: 'Goosebumps', artist: 'Travis Scott', genre: 'Hip-Hop' },
        { title: 'God\'s Plan', artist: 'Drake', genre: 'Hip-Hop' },
        { title: 'One Dance', artist: 'Drake', genre: 'Hip-Hop' },
        { title: 'Hotline Bling', artist: 'Drake', genre: 'Hip-Hop' },
        { title: 'HUMBLE.', artist: 'Kendrick Lamar', genre: 'Hip-Hop' },
        { title: 'Not Like Us', artist: 'Kendrick Lamar', genre: 'Hip-Hop' },
        { title: 'Rockstar', artist: 'Post Malone & 21 Savage', genre: 'Hip-Hop' },
        { title: 'Sunflower', artist: 'Post Malone & Swae Lee', genre: 'Hip-Hop' },
        { title: 'Circles', artist: 'Post Malone', genre: 'Hip-Hop' },
        { title: 'La Renga de Tu Querer', artist: 'La Renga', genre: 'Rock' },
        { title: 'Oscura Soledad', artist: 'La Renga', genre: 'Rock' },
        { title: 'Lamento Boliviano', artist: 'Enanitos Verdes', genre: 'Rock' },
        { title: 'La Muralla Verde', artist: 'Enanitos Verdes', genre: 'Rock' },
        { title: 'Quiero', artist: 'Los Fabulosos Cadillacs', genre: 'Rock' },
        { title: 'Matador', artist: 'Los Fabulosos Cadillacs', genre: 'Rock' },
        { title: 'Persiana Americana', artist: 'Soda Stereo', genre: 'Rock' },
        { title: 'De Música Ligera', artist: 'Soda Stereo', genre: 'Rock' },
        { title: 'En la Ciudad de la Furia', artist: 'Soda Stereo', genre: 'Rock' },
        { title: 'Te Hacen Falta Vitaminas', artist: 'Los Auténticos Decadentes', genre: 'Rock' },
        { title: 'Mi Vida Loca', artist: 'Los Auténticos Decadentes', genre: 'Rock' },
        { title: 'Cuando Seas Grande', artist: 'Intoxicados', genre: 'Rock' },
        { title: 'Alta Suciedad', artist: 'Gustavo Cerati', genre: 'Rock' },
        { title: 'Crimen', artist: 'Gustavo Cerati', genre: 'Rock' },
        { title: 'Rayando el Sol', artist: 'Maná', genre: 'Rock' },
        { title: 'Oye Mi Amor', artist: 'Maná', genre: 'Rock' },
        { title: 'En el Muelle de San Blás', artist: 'Maná', genre: 'Rock' },
        { title: 'Clavado en un Bar', artist: 'Maná', genre: 'Rock' },
        { title: 'La Camisa Negra', artist: 'Juanes', genre: 'Rock' },
        { title: 'Me Enamora', artist: 'Juanes', genre: 'Rock' },
        { title: 'A Dios Le Pido', artist: 'Juanes', genre: 'Rock' },
        { title: 'Bohemian Rhapsody', artist: 'Queen', genre: 'Rock Clásico' },
        { title: 'Don\'t Stop Me Now', artist: 'Queen', genre: 'Rock Clásico' },
        { title: 'We Will Rock You', artist: 'Queen', genre: 'Rock Clásico' },
        { title: 'Radio Ga Ga', artist: 'Queen', genre: 'Rock Clásico' },
        { title: 'Back in Black', artist: 'AC/DC', genre: 'Rock Clásico' },
        { title: 'Highway to Hell', artist: 'AC/DC', genre: 'Rock Clásico' },
        { title: 'Thunderstruck', artist: 'AC/DC', genre: 'Rock Clásico' },
        { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', genre: 'Rock Clásico' },
        { title: 'Welcome to the Jungle', artist: 'Guns N\' Roses', genre: 'Rock Clásico' },
        { title: 'November Rain', artist: 'Guns N\' Roses', genre: 'Rock Clásico' },
        { title: 'Livin\' on a Prayer', artist: 'Bon Jovi', genre: 'Rock Clásico' },
        { title: 'It\'s My Life', artist: 'Bon Jovi', genre: 'Rock Clásico' },
        { title: 'Jump', artist: 'Van Halen', genre: 'Rock Clásico' },
        { title: 'Enter Sandman', artist: 'Metallica', genre: 'Rock Clásico' },
        { title: 'Nothing Else Matters', artist: 'Metallica', genre: 'Rock Clásico' },
        { title: 'Smells Like Teen Spirit', artist: 'Nirvana', genre: 'Rock Clásico' },
        { title: 'Come as You Are', artist: 'Nirvana', genre: 'Rock Clásico' },
        { title: 'Seven Nation Army', artist: 'The White Stripes', genre: 'Rock' },
        { title: 'Mr. Brightside', artist: 'The Killers', genre: 'Rock' },
        { title: 'Human', artist: 'The Killers', genre: 'Rock' },
        { title: 'Somebody That I Used to Know', artist: 'Gotye & Kimbra', genre: 'Rock / Pop' },
        { title: 'Creep', artist: 'Radiohead', genre: 'Rock' },
        { title: 'Wonderwall', artist: 'Oasis', genre: 'Rock' },
        { title: 'Don\'t Look Back in Anger', artist: 'Oasis', genre: 'Rock' },
        { title: 'Yellow', artist: 'Coldplay', genre: 'Rock / Pop' },
        { title: 'The Scientist', artist: 'Coldplay', genre: 'Rock / Pop' },
        { title: 'Fix You', artist: 'Coldplay', genre: 'Rock / Pop' },
        { title: 'Viva la Vida', artist: 'Coldplay', genre: 'Rock / Pop' },
        { title: 'A Sky Full of Stars', artist: 'Coldplay', genre: 'Rock / Pop' },
        { title: 'Stayin\' Alive', artist: 'Bee Gees', genre: 'Disco' },
        { title: 'Night Fever', artist: 'Bee Gees', genre: 'Disco' },
        { title: 'Dancing Queen', artist: 'ABBA', genre: 'Disco' },
        { title: 'Waterloo', artist: 'ABBA', genre: 'Disco' },
        { title: 'Super Trouper', artist: 'ABBA', genre: 'Disco' },
        { title: 'Le Freak', artist: 'Chic', genre: 'Disco' },
        { title: 'Good Times', artist: 'Chic', genre: 'Disco' },
        { title: 'I Will Survive', artist: 'Gloria Gaynor', genre: 'Disco' },
        { title: 'Don\'t Stop \'Til You Get Enough', artist: 'Michael Jackson', genre: 'Pop / Funk' },
        { title: 'Billie Jean', artist: 'Michael Jackson', genre: 'Pop / Funk' },
        { title: 'Thriller', artist: 'Michael Jackson', genre: 'Pop / Funk' },
        { title: 'Beat It', artist: 'Michael Jackson', genre: 'Pop / Funk' },
        { title: 'Smooth Criminal', artist: 'Michael Jackson', genre: 'Pop / Funk' },
        { title: 'P.Y.T.', artist: 'Michael Jackson', genre: 'Pop / Funk' },
        { title: 'Like a Prayer', artist: 'Madonna', genre: 'Pop / Dance' },
        { title: 'Material Girl', artist: 'Madonna', genre: 'Pop / Dance' },
        { title: 'Papa Don\'t Preach', artist: 'Madonna', genre: 'Pop / Dance' },
        { title: 'Vogue', artist: 'Madonna', genre: 'Pop / Dance' },
        { title: 'Jump', artist: 'Madonna', genre: 'Pop / Dance' },
        { title: 'Girls Just Want to Have Fun', artist: 'Cyndi Lauper', genre: '80s Pop' },
        { title: 'Time After Time', artist: 'Cyndi Lauper', genre: '80s Pop' },
        { title: 'Take On Me', artist: 'a-ha', genre: '80s Pop' },
        { title: 'Africa', artist: 'Toto', genre: '80s Pop' },
        { title: 'Don\'t You (Forget About Me)', artist: 'Simple Minds', genre: '80s Pop' },
        { title: 'Sweet Dreams (Are Made of This)', artist: 'Eurythmics', genre: '80s Pop' },
        { title: 'Come on Eileen', artist: 'Dexys Midnight Runners', genre: '80s Pop' },
        { title: 'Total Eclipse of the Heart', artist: 'Bonnie Tyler', genre: '80s Pop' },
        { title: 'True', artist: 'Spandau Ballet', genre: '80s Pop' },
        { title: 'Don\'t Stop Believin\'', artist: 'Journey', genre: '80s Rock' },
        { title: 'Pour Some Sugar on Me', artist: 'Def Leppard', genre: '80s Rock' },
        { title: 'Eye of the Tiger', artist: 'Survivor', genre: '80s Rock' },
        { title: 'Pedro Navaja', artist: 'Rubén Blades', genre: 'Salsa' },
        { title: 'El Gran Varón', artist: 'Willie Colón', genre: 'Salsa' },
        { title: 'Que Alguien Me Diga', artist: 'Gilberto Santa Rosa', genre: 'Salsa' },
        { title: 'Vivir lo Nuestro', artist: 'Marc Anthony & La India', genre: 'Salsa' },
        { title: 'Valió la Pena', artist: 'Marc Anthony', genre: 'Salsa' },
        { title: 'Tu Amor me Hace Bien', artist: 'Marc Anthony', genre: 'Salsa' },
        { title: 'Aguanile', artist: 'Marc Anthony', genre: 'Salsa' },
        { title: 'Que Manera de Perder', artist: 'Grupo Niche', genre: 'Salsa' },
        { title: 'Cali Pachanguero', artist: 'Grupo Niche', genre: 'Salsa' },
        { title: 'La Bilirrubina', artist: 'Juan Luis Guerra', genre: 'Merengue' },
        { title: 'Burbujas de Amor', artist: 'Juan Luis Guerra', genre: 'Bachata' },
        { title: 'Propuesta Indecente', artist: 'Romeo Santos', genre: 'Bachata' },
        { title: 'Eres Mía', artist: 'Romeo Santos', genre: 'Bachata' },
        { title: 'Obsesión', artist: 'Aventura', genre: 'Bachata' },
        { title: 'El Perdón', artist: 'Aventura', genre: 'Bachata' },
    ];
    const catalog2025 = [
        { title: 'luther', artist: 'Kendrick Lamar & SZA', genre: 'Hip-Hop 2025' },
        { title: 'squabble up', artist: 'Kendrick Lamar', genre: 'Hip-Hop 2025' },
        { title: 'tv off', artist: 'Kendrick Lamar ft. Lefty Gunplay', genre: 'Hip-Hop 2025' },
        { title: 'reincarnated', artist: 'Kendrick Lamar', genre: 'Hip-Hop 2025' },
        { title: 'Die With a Smile', artist: 'Lady Gaga & Bruno Mars', genre: 'Pop 2025' },
        { title: 'APT.', artist: 'ROSÉ & Bruno Mars', genre: 'Pop 2025' },
        { title: 'Please Please Please', artist: 'Sabrina Carpenter', genre: 'Pop 2025' },
        { title: 'Espresso', artist: 'Sabrina Carpenter', genre: 'Pop 2025' },
        { title: 'Taste', artist: 'Sabrina Carpenter', genre: 'Pop 2025' },
        { title: 'Bed Chem', artist: 'Sabrina Carpenter', genre: 'Pop 2025' },
        { title: 'Good Luck Babe!', artist: 'Chappell Roan', genre: 'Pop 2025' },
        { title: 'Pink Pony Club', artist: 'Chappell Roan', genre: 'Pop 2025' },
        { title: 'Beautiful Things', artist: 'Benson Boone', genre: 'Pop 2025' },
        { title: 'Lose Control', artist: 'Teddy Swims', genre: 'Pop 2025' },
        { title: 'Too Sweet', artist: 'Hozier', genre: 'Pop 2025' },
        { title: 'That\'s So True', artist: 'Gracie Abrams', genre: 'Pop 2025' },
        { title: '360', artist: 'Charli xcx', genre: 'Pop 2025' },
        { title: 'Guess', artist: 'Charli xcx & Billie Eilish', genre: 'Pop 2025' },
        { title: 'lunch', artist: 'Billie Eilish', genre: 'Pop 2025' },
        { title: 'BIRDS OF A FEATHER', artist: 'Billie Eilish', genre: 'Pop 2025' },
        { title: 'yes, and?', artist: 'Ariana Grande', genre: 'Pop 2025' },
        { title: 'we can\'t be friends', artist: 'Ariana Grande', genre: 'Pop 2025' },
        { title: 'TEXAS HOLD \'EM', artist: 'Beyoncé', genre: 'Country Pop 2025' },
        { title: 'Denial Is a River', artist: 'Doechii', genre: 'Hip-Hop 2025' },
        { title: 'Not Like Us', artist: 'Kendrick Lamar', genre: 'Hip-Hop 2025' },
        { title: 'A Bar Song (Tipsy)', artist: 'Shaboozey', genre: 'Country Pop 2025' },
        { title: 'I Had Some Help', artist: 'Post Malone ft. Morgan Wallen', genre: 'Country Pop 2025' },
        { title: 'MILLION DOLLAR BABY', artist: 'Tommy Richman', genre: 'R&B 2025' },
        { title: 'Saturn', artist: 'SZA', genre: 'R&B 2025' },
        { title: 'Snooze', artist: 'SZA', genre: 'R&B 2025' },
        { title: 'Stargazing', artist: 'Myles Smith', genre: 'Pop 2025' },
        { title: 'Messy', artist: 'Lola Young', genre: 'Pop 2025' },
        { title: 'Superhero', artist: 'Family of the Year', genre: 'Pop 2025' },
        { title: 'Who', artist: 'Jimin', genre: 'K-Pop 2025' },
        { title: 'Magnetic', artist: 'ILLIT', genre: 'K-Pop 2025' },
        { title: 'Supernova', artist: 'aespa', genre: 'K-Pop 2025' },
        { title: 'CAFÉ CON LECHE', artist: 'Bad Bunny', genre: 'Reggaetón 2025' },
        { title: 'BAILE INoLVIDABLE', artist: 'Bad Bunny', genre: 'Reggaetón 2025' },
        { title: 'EL CLÚB', artist: 'Bad Bunny', genre: 'Reggaetón 2025' },
        { title: 'NI BIEN NI MAL', artist: 'Bad Bunny', genre: 'Reggaetón 2025' },
        { title: 'PITORRO DE COCO', artist: 'Bad Bunny', genre: 'Reggaetón 2025' },
        { title: 'VOY A LLEVARTE PA PR', artist: 'Bad Bunny', genre: 'Reggaetón 2025' },
        { title: 'LALA', artist: 'Myke Towers', genre: 'Reggaetón 2025' },
        { title: 'ADIVINO', artist: 'Myke Towers ft. Bad Bunny', genre: 'Reggaetón 2025' },
        { title: 'Si Antes Te Hubiera Conocido', artist: 'Karol G', genre: 'Reggaetón 2025' },
        { title: 'Oki Doki', artist: 'Karol G', genre: 'Reggaetón 2025' },
        { title: 'NIÑA BONITA', artist: 'Feid', genre: 'Reggaetón 2025' },
        { title: 'NORMAL', artist: 'Feid', genre: 'Reggaetón 2025' },
        { title: 'LUNA', artist: 'Feid & Young Miko', genre: 'Reggaetón 2025' },
        { title: 'TEKA', artist: 'Peso Pluma & DJ Snake', genre: 'Reggaetón 2025' },
        { title: 'El Azul', artist: 'Peso Pluma & Junior H', genre: 'Reggaetón 2025' },
        { title: 'BELLAKEO', artist: 'Peso Pluma & Anitta', genre: 'Reggaetón 2025' },
        { title: 'Gata Only', artist: 'FloyyMenor & Cris MJ', genre: 'Reggaetón 2025' },
        { title: 'PROBLEMA', artist: 'J Balvin ft. Bad Bunny', genre: 'Reggaetón 2025' },
        { title: 'Junio', artist: 'Maluma', genre: 'Reggaetón 2025' },
        { title: 'Hawái Remix', artist: 'Maluma ft. The Weeknd', genre: 'Reggaetón 2025' },
        { title: 'Vacío', artist: 'Ozuna ft. Jhay Cortez', genre: 'Reggaetón 2025' },
        { title: 'Prometo', artist: 'Jhay Cortez', genre: 'Reggaetón 2025' },
        { title: 'COSA NUESTRA', artist: 'Rauw Alejandro', genre: 'Reggaetón 2025' },
        { title: 'TOUCHING THE SKY', artist: 'Rauw Alejandro', genre: 'Reggaetón 2025' },
        { title: 'Un Verano Sin Ti (Remix)', artist: 'Bad Bunny ft. Mora', genre: 'Reggaetón 2025' },
        { title: 'DICTADURA', artist: 'Anuel AA', genre: 'Reggaetón 2025' },
        { title: 'PANTALLAS', artist: 'Mora', genre: 'Reggaetón 2025' },
        { title: 'SOLTERA', artist: 'Big One', genre: 'Reggaetón 2025' },
        { title: 'QUE PASA', artist: 'L-Gante', genre: 'Reggaetón 2025' },
        { title: 'ROCKSTAR', artist: 'Duki', genre: 'Trap Argentina 2025' },
        { title: 'GOTEO', artist: 'Duki', genre: 'Trap Argentina 2025' },
        { title: 'TUMBANDO EL CLUB', artist: 'Duki', genre: 'Trap Argentina 2025' },
        { title: 'Error 404', artist: 'WOS', genre: 'Trap Argentina 2025' },
        { title: 'Canguro', artist: 'WOS', genre: 'Trap Argentina 2025' },
        { title: 'ELLA NO ES TUYA', artist: 'Tiago PZK & Rusherking', genre: 'Trap Argentina 2025' },
        { title: 'HIGIENE', artist: 'Tiago PZK', genre: 'Trap Argentina 2025' },
        { title: 'COLOCAO', artist: 'María Becerra', genre: 'Pop Argentina 2025' },
        { title: 'QUE SALGA EL SOL', artist: 'María Becerra', genre: 'Pop Argentina 2025' },
        { title: '1, 2, Bebé', artist: 'Emilia Mernes', genre: 'Pop Argentina 2025' },
        { title: 'No Sigo Más', artist: 'Emilia Mernes', genre: 'Pop Argentina 2025' },
        { title: 'Como Tú No Hay Dos', artist: 'Lali', genre: 'Pop Argentina 2025' },
        { title: 'Disciplina', artist: 'Lali', genre: 'Pop Argentina 2025' },
        { title: 'MAMICHULA', artist: 'Trueno ft. Nicki Nicole', genre: 'Trap Argentina 2025' },
        { title: 'ATREVIDA', artist: 'Trueno', genre: 'Trap Argentina 2025' },
        { title: 'Bzrp Music Sessions #58', artist: 'Bizarrap & Duki', genre: 'Trap Argentina 2025' },
        { title: 'Bzrp Music Sessions #57', artist: 'Bizarrap & Emilia', genre: 'Trap Argentina 2025' },
        { title: 'Plan A', artist: 'Paulo Londra', genre: 'Trap Argentina 2025' },
        { title: 'Nicki Nicole Sessions', artist: 'Bizarrap & Nicki Nicole', genre: 'Trap Argentina 2025' },
        { title: 'WAPO TRAKETERO', artist: 'Duki ft. Nicki Nicole', genre: 'Trap Argentina 2025' },
    ];
    const allCatalog = [...catalog, ...catalog2025];
    await prisma.catalogSong.createMany({ data: allCatalog });
    console.log(`Catálogo creado con ${allCatalog.length} canciones.`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map