import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { simpleCache } from '../common/simple-cache';

@Injectable()
export class SongsService {
  constructor(private prisma: PrismaService) {}

  async findAllByEvent(eventId: number) {
    const cacheKey = `songs:event:${eventId}:all`;
    const cached = simpleCache.get<any[]>(cacheKey);
    if (cached) return cached;

    const data = await this.prisma.song.findMany({
      where: { event_id: eventId, played: false },
      orderBy: { created_at: 'asc' },
    });
    simpleCache.set(cacheKey, data, 5000);
    return data;
  }

  async getPlayedSongs(eventId: number) {
    const cacheKey = `songs:event:${eventId}:played`;
    const cached = simpleCache.get<any[]>(cacheKey);
    if (cached) return cached;

    const data = await this.prisma.song.findMany({
      where: { event_id: eventId, played: true },
      orderBy: { played_at: 'desc' },
    });
    simpleCache.set(cacheKey, data, 5000);
    return data;
  }

  async markAsPlayed(id: number) {
    const song = await this.prisma.song.findUnique({
      where: { id },
    });

    if (!song) {
      throw new NotFoundException('Canción no encontrada');
    }

    const updated = await this.prisma.song.update({
      where: { id },
      data: { played: true, played_at: new Date() },
    });

    simpleCache.invalidateAllPrefix(`songs:event:${song.event_id}:`);
    return updated;
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
    const deleted = await this.prisma.song.delete({ where: { id } });
    simpleCache.invalidateAllPrefix(`songs:event:${song.event_id}:`);
    return deleted;
  }

  async getRanking(eventId: number) {
    const cacheKey = `songs:event:${eventId}:ranking`;
    const cached = simpleCache.get<any[]>(cacheKey);
    if (cached) return cached;

    const songs = await this.prisma.song.findMany({
      where: { event_id: eventId, played: false },
      include: {
        _count: {
          select: { votes: true },
        },
      },
    });

    const ranking = songs
      .sort((a, b) => b._count.votes - a._count.votes)
      .map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        votes: s._count.votes,
      }));

    simpleCache.set(cacheKey, ranking, 5000);
    return ranking;
  }
}

