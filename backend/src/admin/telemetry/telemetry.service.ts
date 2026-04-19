import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActiveDevicesService } from '../../events/active-devices.service';

@Injectable()
export class TelemetryService {
  constructor(
    private prisma: PrismaService,
    private activeDevices: ActiveDevicesService,
  ) {}

  async getOverview() {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));

    const [liveEventsCount, totalDJs, newDJsToday, totalVotes] = await Promise.all([
      this.prisma.event.count({ where: { status: 'ACTIVE' } }),
      this.prisma.dJUser.count(),
      this.prisma.dJUser.count({ where: { created_at: { gte: todayStart } } }),
      this.prisma.vote.count(),
    ]);

    // Calcular usuarios concurrentes sumando los heartbeats de todos los eventos activos
    const liveEvents = await this.prisma.event.findMany({ where: { status: 'ACTIVE' }, select: { id: true } });
    let concurrentUsers = 0;
    liveEvents.forEach(ev => {
      concurrentUsers += this.activeDevices.getActiveCount(ev.id);
    });

    return {
      live_events: liveEventsCount,
      concurrent_users: concurrentUsers,
      votes_last_60s: 0, // TODO: Implement real-time counter if needed
      total_djs: totalDJs,
      new_djs_today: newDJsToday,
      revenue_today_usd: 0, // TODO: Integration with Stripe
      system_status: 'healthy',
    };
  }

  async getUsersMetrics() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, new7d, new30d, active30d] = await Promise.all([
      this.prisma.dJUser.count(),
      this.prisma.dJUser.count({ where: { created_at: { gte: sevenDaysAgo } } }),
      this.prisma.dJUser.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
      this.prisma.dJUser.count({
        where: {
          events: {
            some: { created_at: { gte: thirtyDaysAgo } }
          }
        }
      }),
    ]);

    const byPlan = {
      demo: await this.prisma.dJUser.count({ where: { plan: 'DEMO' } }),
      premium: await this.prisma.dJUser.count({ where: { plan: 'PREMIUM' } }),
    };

    const topDJs = await this.prisma.dJUser.findMany({
      take: 5,
      include: {
        _count: { select: { events: true } }
      },
      orderBy: {
        events: { _count: 'desc' }
      }
    });

    return {
      total_djs: total,
      new_last_7d: new7d,
      new_last_30d: new30d,
      active_last_30d: active30d,
      churned_last_30d: 0,
      by_plan: byPlan,
      top_djs_by_events: topDJs.map(dj => ({
        dj_id: dj.id,
        display_name: dj.name || dj.email,
        total_events: dj._count.events,
      }))
    };
  }

  async getEventsMetrics() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalAllTime, total30d, liveCount] = await Promise.all([
      this.prisma.event.count(),
      this.prisma.event.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
      this.prisma.event.count({ where: { status: 'ACTIVE' } }),
    ]);

    const liveEvents = await this.prisma.event.findMany({
      where: { status: 'ACTIVE' },
      include: {
        dj: { select: { name: true, email: true } },
        _count: { select: { songs: true } }
      }
    });

    const liveEventsDetailed = await Promise.all(liveEvents.map(async ev => {
      const votesCount = await this.prisma.vote.count({
        where: { song: { event_id: ev.id } }
      });
      return {
        event_id: ev.id,
        dj_name: ev.dj.name || ev.dj.email,
        started_at: ev.created_at,
        songs_count: ev._count.songs,
        active_voters: this.activeDevices.getActiveCount(ev.id),
        total_votes: votesCount
      };
    }));

    const allEvents = await this.prisma.event.findMany({
      take: 50,
      orderBy: { created_at: 'desc' },
      include: {
        dj: { select: { name: true, email: true } },
        _count: { select: { songs: true } }
      }
    });

    const allEventsDetailed = await Promise.all(allEvents.map(async ev => {
      const votesCount = await this.prisma.vote.count({
        where: { song: { event_id: ev.id } }
      });
      return {
        event_id: ev.id,
        dj_name: ev.dj.name || ev.dj.email,
        name: ev.name,
        status: ev.status,
        created_at: ev.created_at,
        songs_count: ev._count.songs,
        total_votes: votesCount
      };
    }));

    return {
      total_all_time: totalAllTime,
      total_last_30d: total30d,
      currently_live: liveCount,
      live_events: liveEventsDetailed,
      all_events: allEventsDetailed,
      events_by_day: [] 
    };
  }
}
