import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SongsService {
  constructor(private prisma: PrismaService) {}

  async findAllByEvent(eventId: number) {
    return this.prisma.song.findMany({
      where: { event_id: eventId, played: false },
      orderBy: { created_at: 'asc' },
    });
  }

  async getPlayedSongs(eventId: number) {
    return this.prisma.song.findMany({
      where: { event_id: eventId, played: true },
      orderBy: { played_at: 'desc' },
    });
  }

  async markAsPlayed(id: number) {
    const song = await this.prisma.song.findUnique({
      where: { id },
    });

    if (!song) {
      throw new NotFoundException('Canción no encontrada');
    }

    return this.prisma.song.update({
      where: { id },
      data: { played: true, played_at: new Date() },
    });
  }

  async search(q: string) {
    return this.prisma.song.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { artist: { contains: q } },

        ],
      },
      distinct: ['title', 'artist'],
      take: 10,
    });
  }

  async remove(id: number) {
    const song = await this.prisma.song.findUnique({ where: { id } });
    if (!song) throw new NotFoundException('Canción no encontrada');
    await this.prisma.vote.deleteMany({ where: { song_id: id } });
    return this.prisma.song.delete({ where: { id } });
  }

  async getRanking(eventId: number) {
    const songs = await this.prisma.song.findMany({
      where: { event_id: eventId, played: false },
      include: {
        _count: {
          select: { votes: true },
        },
      },
    });

    return songs
      .sort((a, b) => b._count.votes - a._count.votes)
      .map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        votes: s._count.votes,
      }));
  }
}

