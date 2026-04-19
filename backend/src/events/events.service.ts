import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanService } from '../plan/plan.service';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private planService: PlanService,
  ) {}

  private async logAction(eventId: number, djId: number, action: string, details?: any) {
    try {
      await (this.prisma as any).eventLog.create({
        data: {
          event_id: eventId,
          dj_id: djId,
          action,
          details: details ? JSON.stringify(details) : null
        }
      });
    } catch (e) {
      console.error('Error logging action:', e);
    }
  }

  async findAllByDJ(djId: number) {
    const events = await this.prisma.event.findMany({
      where: { dj_id: djId },
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { songs: true }
        }
      },
    });

    // Enriquecemos cada evento con el conteo real de votos
    return Promise.all(
      events.map(async (event) => {
        const votesCount = await this.prisma.vote.count({
          where: { song: { event_id: event.id } },
        });
        return {
          ...event,
          _count: {
            ...event._count,
            votes: votesCount,
          },
        };
      }),
    );
  }

  async create(data: { name: string; venue: string; dj_id: number; template_id?: number; status?: string; event_date?: string }) {
    await this.planService.checkCanCreateEvent(data.dj_id);

    const { template_id, status, event_date, ...eventData } = data;

    const event = await this.prisma.event.create({
      data: {
        ...eventData,
        status: status ?? 'ACTIVE',
        startDate: event_date ? new Date(event_date) : new Date(),
        maxVotesPerDevice: 3
      },
    });

    await this.logAction(event.id, data.dj_id, 'CREATE', { template_id });

    if (template_id) {
      const template = await this.prisma.eventTemplate.findUnique({
        where: { id: template_id },
        include: { songs: true },
      });

      if (template) {
        const songsToCreate = template.songs.map((s) => ({
          title: s.title,
          artist: s.artist,
          event_id: event.id,
        }));

        await this.prisma.song.createMany({
          data: songsToCreate,
        });
      }
    }

    return event;
  }

  async findOne(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { songs: true },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');
    return event;
  }

  async getStats(id: number) {
    const [totalVotes, uniqueVoters] = await Promise.all([
      this.prisma.vote.count({
        where: { song: { event_id: id } }
      }),
      this.prisma.vote.groupBy({
        by: ['device_id'],
        where: { song: { event_id: id } }
      })
    ]);

    return {
      totalVotes,
      uniqueVoters: uniqueVoters.length,
      engagement: uniqueVoters.length > 0 ? (totalVotes / uniqueVoters.length).toFixed(1) : 0
    };
  }

  async closeEvent(id: number) {
    const event = await this.prisma.event.update({
      where: { id },
      data: { status: 'FINISHED' }
    });
    await this.logAction(id, event.dj_id, 'FINISH');
    return event;
  }

  async suspendEvent(id: number) {
    const event = await this.prisma.event.update({
      where: { id },
      data: { status: 'SUSPENDED' }
    });
    await this.logAction(id, event.dj_id, 'SUSPEND');
    return event;
  }

  async updateEvent(id: number, data: { name?: string; venue?: string; event_date?: string; status?: string }) {
    const { event_date, ...rest } = data;
    const updateData: any = { ...rest };
    if (event_date) updateData.startDate = new Date(event_date);
    
    const event = await this.prisma.event.update({
      where: { id },
      data: updateData
    });
    await this.logAction(id, event.dj_id, 'UPDATE', data);
    return event;
  }

  async launchEvent(id: number) {
    const event = await this.prisma.event.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });
    await this.logAction(id, event.dj_id, 'LAUNCH');
    return event;
  }

  async setMaxVotes(id: number, maxVotesPerDevice: number) {
    return this.prisma.event.update({ where: { id }, data: { maxVotesPerDevice } });
  }

  async toggleRecitalMode(id: number) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Evento no encontrado');
    return this.prisma.event.update({
      where: { id },
      data: { isRecitalMode: !event.isRecitalMode }
    });
  }

  async addSongsToEvent(eventId: number, songs: { title: string; artist: string }[]) {
    return this.prisma.song.createMany({
      data: songs.map(s => ({ ...s, event_id: eventId }))
    });
  }

  async getSummary(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { songs: { include: { votes: true } } },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');

    const allVotes = event.songs.flatMap((s) => s.votes);
    const totalVotes = allVotes.length;
    const uniqueVoters = new Set(allVotes.map((v) => v.device_id)).size;

    const topSongs = [...event.songs]
      .sort((a, b) => b.votes.length - a.votes.length)
      .slice(0, 5)
      .map((s) => ({ id: s.id, title: s.title, artist: s.artist, votes: s.votes.length }));

    const playedCount = event.songs.filter((s) => s.played).length;

    return {
      event: { id: event.id, name: event.name, venue: event.venue, status: event.status, created_at: event.created_at },
      totalVotes,
      uniqueVoters,
      engagement: uniqueVoters > 0 ? (totalVotes / uniqueVoters).toFixed(1) : '0',
      topSongs,
      playedCount,
      totalSongs: event.songs.length,
    };
  }

  async getAnalytics(id: number) {
    const [allVotes, songs] = await Promise.all([
      this.prisma.vote.findMany({
        where: { song: { event_id: id } },
        select: { created_at: true, device_id: true, song_id: true },
      }),
      this.prisma.song.findMany({
        where: { event_id: id },
        include: { _count: { select: { votes: true } } },
      }),
    ]);

    const totalVotes = allVotes.length;

    const songStats = songs
      .map((s) => ({
        id: s.id,
        title: s.title,
        artist: s.artist,
        votes: s._count.votes,
        percentage: totalVotes > 0 ? Math.round((s._count.votes / totalVotes) * 100) : 0,
        played: s.played,
      }))
      .sort((a, b) => b.votes - a.votes);

    const hourMap: Record<string, number> = {};
    for (const vote of allVotes) {
      const hour = new Date(vote.created_at).getHours().toString().padStart(2, '0');
      hourMap[hour] = (hourMap[hour] || 0) + 1;
    }

    const hourlyVotes = Object.entries(hourMap)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    const mostActiveHour = hourlyVotes.reduce(
      (max, h) => (h.count > (max?.count || 0) ? h : max),
      hourlyVotes[0],
    );

    return {
      totalVotes,
      songStats,
      hourlyVotes,
      mostActiveHour: mostActiveHour ? `${mostActiveHour.hour}:00` : null,
    };
  }

  async getExport(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { songs: { where: { played: true }, orderBy: { created_at: 'asc' } } },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');

    const rows = [
      ['#', 'Artista', 'Titulo', 'Evento', 'Venue', 'Fecha'],
      ...event.songs.map((s, i) => [
        String(i + 1),
        s.artist,
        s.title,
        event.name,
        event.venue,
        new Date().toLocaleDateString('es-AR'),
      ]),
    ];

    const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
    const content = rows.map(r => r.map(escape).join(',')).join('\n');
    return { content, filename: `${event.name.replace(/\s+/g, '_')}.csv` };
  }

  async duplicate(id: number) {
    const originalEvent = await this.prisma.event.findUnique({
      where: { id },
      include: { songs: true },
    });

    if (!originalEvent) {
      throw new NotFoundException('Evento no encontrado');
    }

    const newEvent = await this.prisma.event.create({
      data: {
        name: `${originalEvent.name} (Copia)`,
        venue: originalEvent.venue,
        dj_id: originalEvent.dj_id,
        status: 'ACTIVE',
        maxVotesPerDevice: originalEvent.maxVotesPerDevice,
        isRecitalMode: originalEvent.isRecitalMode
      },
    });

    const songsToCreate = originalEvent.songs.map((s) => ({
      title: s.title,
      artist: s.artist,
      event_id: newEvent.id,
    }));

    await this.prisma.song.createMany({
      data: songsToCreate,
    });

    return newEvent;
  }

  async delete(id: number) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Evento no encontrado');
    return this.prisma.event.delete({ where: { id } });
  }

  async getAdminLogs(limit = 150) {
    try {
      const logs = await (this.prisma as any).eventLog.findMany({
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          event: { select: { name: true, venue: true } },
          dj: { select: { email: true, name: true } },
        },
      });
      return logs;
    } catch {
      return [];
    }
  }
}
