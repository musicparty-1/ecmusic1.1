import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanService } from '../plan/plan.service';
import { PlanKey, PLANS } from '../plan/plan.constants';
import MercadoPagoConfig, { PreApprovalPlan, PreApproval } from 'mercadopago';

const MP_PRICES: Record<string, number> = {
  STARTER: 11999,
  PRO: 23999,
  AGENCY: 47999,
};

@Injectable()
export class BillingService {
  private mp: MercadoPagoConfig;

  constructor(
    private prisma: PrismaService,
    private planService: PlanService,
  ) {
    this.mp = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN ?? '',
    });
  }

  async getStatus(djId: number) {
    const dj = await this.planService.getDJPlan(djId);
    const limits = this.planService.getLimits(dj.plan);
    const daysLeft = this.planService.trialDaysLeft(dj.trialEndsAt ?? null);

    // Contar eventos del mes actual
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const eventsThisMonth = await this.prisma.event.count({
      where: { dj_id: djId, created_at: { gte: monthStart }, status: { not: 'FINISHED' } },
    });

    return {
      plan: dj.plan,
      subscriptionStatus: dj.subscriptionStatus,
      trialEndsAt: dj.trialEndsAt,
      daysLeft,
      limits: {
        maxEvents: limits.maxEvents === Infinity ? null : limits.maxEvents,
        maxVotesPerEvent: limits.maxVotesPerEvent === Infinity ? null : limits.maxVotesPerEvent,
        analytics: limits.analytics,
        export: limits.export,
        preEvent: limits.preEvent,
        duplicate: limits.duplicate,
      },
      usage: { eventsThisMonth },
    };
  }

  async createCheckout(djId: number, planKey: PlanKey) {
    if (planKey === 'DEMO') throw new BadRequestException('Plan inválido');

    const dj = await this.prisma.dJUser.findUnique({ where: { id: djId } });
    if (!dj) throw new BadRequestException('DJ no encontrado');

    const price = MP_PRICES[planKey];
    const planName = PLANS[planKey].name;

    // Crear Preapproval Plan si no existe, o usar el preconfigurado
    const envPlanId = process.env[`MP_PLAN_${planKey}_ID`];

    let planId = envPlanId;

    if (!planId) {
      // Auto-crear el plan en MP (útil para sandbox)
      const mpPlan = new PreApprovalPlan(this.mp);
      const created = await mpPlan.create({
        body: {
          reason: `EC Music ${planName}`,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: price,
            currency_id: 'ARS',
          },
          back_url: `${process.env.FRONTEND_URL}/dj/billing?status=success`,
          status: 'active',
        },
      });
      planId = created.id;
    }

    // Crear suscripción para este DJ
    const preApproval = new PreApproval(this.mp);
    const subscription = await preApproval.create({
      body: {
        preapproval_plan_id: planId,
        payer_email: dj.email,
        back_url: `${process.env.FRONTEND_URL}/dj/billing?status=success`,
        reason: `EC Music ${planName}`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: price,
          currency_id: 'ARS',
        },
        status: 'pending',
      },
    });

    // Guardar el ID de suscripción pendiente
    await this.prisma.dJUser.update({
      where: { id: djId },
      data: { subscriptionId: subscription.id },
    });

    return {
      checkoutUrl: subscription.init_point,
      subscriptionId: subscription.id,
    };
  }

  async handleWebhook(body: any) {
    if (body.type !== 'subscription_preapproval') return { ok: true };

    const subscriptionId = body.data?.id;
    if (!subscriptionId) return { ok: true };

    try {
      const preApproval = new PreApproval(this.mp);
      const subscription = await preApproval.get({ id: subscriptionId });

      const dj = await this.prisma.dJUser.findFirst({
        where: { subscriptionId },
      });

      if (!dj) return { ok: true };

      if (subscription.status === 'authorized') {
        // Detectar qué plan por el monto
        const amount = subscription.auto_recurring?.transaction_amount;
        let plan: PlanKey = 'STARTER';
        if (amount === MP_PRICES.PRO) plan = 'PRO';
        else if (amount === MP_PRICES.AGENCY) plan = 'AGENCY';

        const planExpiresAt = new Date();
        planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);

        await this.prisma.dJUser.update({
          where: { id: dj.id },
          data: {
            plan,
            subscriptionStatus: 'ACTIVE',
            customerId: String(subscription.payer_id ?? ''),
            planExpiresAt,
          },
        });
      } else if (['cancelled', 'paused'].includes(subscription.status ?? '')) {
        await this.prisma.dJUser.update({
          where: { id: dj.id },
          data: { plan: 'DEMO', subscriptionStatus: 'CANCELLED' },
        });
      }
    } catch (err) {
      console.error('Webhook MP error:', err);
    }

    return { ok: true };
  }

  async cancelSubscription(djId: number) {
    const dj = await this.prisma.dJUser.findUnique({ where: { id: djId } });
    if (!dj?.subscriptionId) throw new BadRequestException('No tenés suscripción activa');

    const preApproval = new PreApproval(this.mp);
    await preApproval.update({
      id: dj.subscriptionId,
      body: { status: 'cancelled' },
    });

    await this.prisma.dJUser.update({
      where: { id: djId },
      data: { plan: 'DEMO', subscriptionStatus: 'CANCELLED', subscriptionId: null },
    });

    return { ok: true };
  }
}
