import { Module } from '@nestjs/common';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ActiveDevicesService } from '../../events/active-devices.service';

@Module({
  imports: [PrismaModule],
  controllers: [TelemetryController],
  providers: [TelemetryService, ActiveDevicesService],
})
export class TelemetryModule {}
