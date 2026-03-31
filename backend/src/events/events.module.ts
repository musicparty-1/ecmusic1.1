import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventTemplatesController } from './event-templates.controller';
import { ActiveDevicesService } from './active-devices.service';
import { PlanModule } from '../plan/plan.module';

@Module({
  imports: [PlanModule],
  providers: [EventsService, ActiveDevicesService],
  controllers: [EventsController, EventTemplatesController],
  exports: [ActiveDevicesService],
})
export class EventsModule {}
