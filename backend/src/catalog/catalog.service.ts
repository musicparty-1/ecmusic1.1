import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  search(q: string) {
    if (!q || q.trim().length < 2) return Promise.resolve([]);
    return this.prisma.catalogSong.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { artist: { contains: q } },
        ],
      },
      take: 10,
      orderBy: { title: 'asc' },
    });
  }

  getAll() {
    return this.prisma.catalogSong.findMany({
      orderBy: { title: 'asc' },
    });
  }

  async getGenres() {
    const genres = await this.prisma.catalogSong.groupBy({
      by: ['genre'],
      _count: {
        _all: true,
      },
    });
    return genres.map(g => ({
      genre: g.genre || 'General',
      count: g._count._all,
    }));
  }

  async importSongs(songs: { title: string; artist: string; genre?: string; bpm?: number }[]) {
    let imported = 0;
    for (const song of songs) {
      const existing = await this.prisma.catalogSong.findFirst({
        where: {
          title: { equals: song.title, mode: 'insensitive' },
          artist: { equals: song.artist, mode: 'insensitive' },
        },
      });
      if (!existing) {
        await this.prisma.catalogSong.create({
          data: {
            title: song.title,
            artist: song.artist,
            genre: song.genre || 'General',
            bpm: song.bpm || null,
          },
        });
        imported++;
      } else if (!existing.bpm && song.bpm) {
        await this.prisma.catalogSong.update({
          where: { id: existing.id },
          data: { bpm: song.bpm },
        });
      }
    }
    return { success: true, imported };
  }
}
