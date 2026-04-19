import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { EventsModule } from './events/events.module';
import { SongsModule } from './songs/songs.module';
import { VotesModule } from './votes/votes.module';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { PlanModule } from './plan/plan.module';
import { BillingModule } from './billing/billing.module';
import { TelemetryModule } from './admin/telemetry/telemetry.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 10000, limit: 40 },
      { name: 'burst', ttl: 60000, limit: 100 },
    ]),
    PrismaModule, EventsModule, SongsModule, VotesModule, AuthModule, CatalogModule, PlanModule, BillingModule, TelemetryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
