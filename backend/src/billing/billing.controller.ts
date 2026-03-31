import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BillingService } from './billing.service';
import { PlanKey } from '../plan/plan.constants';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(JwtAuthGuard)
  @Get('status')
  getStatus(@Req() req: any) {
    return this.billingService.getStatus(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('checkout/:plan')
  createCheckout(@Req() req: any, @Param('plan') plan: string) {
    return this.billingService.createCheckout(req.user.id, plan.toUpperCase() as PlanKey);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  cancel(@Req() req: any) {
    return this.billingService.cancelSubscription(req.user.id);
  }

  // MercadoPago llama este endpoint — no tiene auth JWT
  @SkipThrottle()
  @Post('webhook')
  webhook(@Body() body: any) {
    return this.billingService.handleWebhook(body);
  }
}
