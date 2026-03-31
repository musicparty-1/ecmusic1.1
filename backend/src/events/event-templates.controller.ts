import { Controller, Get, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('event-templates')
@UseGuards(JwtAuthGuard)
export class EventTemplatesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.eventTemplate.findMany({
      include: { songs: true }
    });
  }
}
