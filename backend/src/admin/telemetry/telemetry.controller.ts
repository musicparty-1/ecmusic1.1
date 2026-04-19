import { Controller, Get, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('admin/telemetry')
export class TelemetryController {
  constructor(private readonly telemetryService: TelemetryService) {}

  private checkAdmin(req: any) {
    const masterEmail = 'ecmusic@eventos.com';
    if (req.user?.role !== 'ADMIN' || req.user?.email !== masterEmail) {
      throw new ForbiddenException('Access restricted to Master Admin');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('overview')
  async getOverview(@Request() req: any) {
    this.checkAdmin(req);
    return this.telemetryService.getOverview();
  }

  @UseGuards(JwtAuthGuard)
  @Get('users')
  async getUsers(@Request() req: any) {
    this.checkAdmin(req);
    return this.telemetryService.getUsersMetrics();
  }

  @UseGuards(JwtAuthGuard)
  @Get('events')
  async getEvents(@Request() req: any) {
    this.checkAdmin(req);
    return this.telemetryService.getEventsMetrics();
  }
}
