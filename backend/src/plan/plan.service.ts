import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PLANS, PlanKey } from './plan.constants';

@Injectable()
export class PlanService {
  constructor(private prisma: PrismaService) {}

  getLimits(plan: string) {
    return PLANS[(plan as PlanKey) in PLANS ? (plan as PlanKey) : 'DEMO'];
  }

  async getDJPlan(djId: number) {
    const dj = await this.prisma.dJUser.findUnique({ where: { id: djId } });
    if (!dj) throw new ForbiddenException('DJ no encontrado');

    const now = new Date();

    // Si está en trial, verificar si expiró
    if (dj.subscriptionStatus === 'TRIAL' && dj.trialEndsAt && dj.trialEndsAt < now) {
      await this.prisma.dJUser.update({
        where: { id: djId },
        data: { subscriptionStatus: 'EXPIRED' },
      });
      return { ...dj, subscriptionStatus: 'EXPIRED', plan: 'DEMO' };
    }

    return dj;
  }

  async checkCanCreateEvent(djId: number) {
    const dj = await this.getDJPlan(djId);
    if (dj.subscriptionStatus === 'EXPIRED') {
      throw new ForbiddenException({
        code: 'PLAN_EXPIRED',
        message: 'Tu período de prueba expiró. Elegí un plan para continuar.',
      });
    }

    const limits = this.getLimits(dj.plan);
    if (limits.maxEvents === Infinity) return;

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const eventCount = await this.prisma.event.count({
      where: {
        dj_id: djId,
        created_at: { gte: currentMonth },
        status: { not: 'FINISHED' },
      },
    });

    if (eventCount >= limits.maxEvents) {
      throw new ForbiddenException({
        code: 'EVENT_LIMIT',
        message: `Alcanzaste el límite de ${limits.maxEvents} eventos para tu plan ${dj.plan}. Hacé upgrade para continuar.`,
        limit: limits.maxEvents,
        plan: dj.plan,
      });
    }
  }

  async checkCanVote(eventId: number) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return;

    const dj = await this.getDJPlan(event.dj_id);
    const limits = this.getLimits(dj.plan);
    if (limits.maxVotesPerEvent === Infinity) return;

    const voteCount = await this.prisma.vote.count({
      where: { song: { event_id: eventId } },
    });

    if (voteCount >= limits.maxVotesPerEvent) {
      throw new ForbiddenException({
        code: 'VOTE_LIMIT',
        message: `Este evento alcanzó el límite de ${limits.maxVotesPerEvent} votos (plan ${dj.plan}).`,
        limit: limits.maxVotesPerEvent,
      });
    }
  }

  async checkFeature(djId: number, feature: keyof typeof PLANS.DEMO) {
    const dj = await this.getDJPlan(djId);
    if (dj.subscriptionStatus === 'EXPIRED') {
      throw new ForbiddenException({
        code: 'PLAN_EXPIRED',
        message: 'Tu período de prueba expiró. Elegí un plan para continuar.',
      });
    }
    const limits = this.getLimits(dj.plan);
    if (!limits[feature]) {
      throw new ForbiddenException({
        code: 'FEATURE_LOCKED',
        feature,
        message: `Esta función no está disponible en el plan ${dj.plan}. Hacé upgrade para acceder.`,
        plan: dj.plan,
      });
    }
  }

  trialDaysLeft(trialEndsAt: Date | null): number {
    if (!trialEndsAt) return 0;
    const diff = trialEndsAt.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}
