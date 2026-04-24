import { Controller, Get, Post, Delete, UseGuards, Body, Param, Query, ParseIntPipe, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const ADMIN_KEY = 'mp-admin-secret-2024';

@Controller('event-templates')
export class EventTemplatesController {
  constructor(private prisma: PrismaService) {}

  // ── DJ endpoint (requires JWT) ─────────────────────────────────────────
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.prisma.eventTemplate.findMany({
      include: { songs: true }
    });
  }

  // ── ADMIN endpoints (key-protected, no JWT) ────────────────────────────

  @Get('admin-all')
  adminListAll(@Query('key') key: string) {
    if (key !== ADMIN_KEY) throw new ForbiddenException('Clave inválida');
    return this.prisma.eventTemplate.findMany({
      include: { songs: { orderBy: { id: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  @Post('admin-create')
  async adminCreate(
    @Query('key') key: string,
    @Body() body: { name: string; description?: string; songs: { title: string; artist: string; category?: string; bpm?: number }[] },
  ) {
    if (key !== ADMIN_KEY) throw new ForbiddenException('Clave inválida');
    if (!body.name?.trim()) throw new Error('El nombre de la playlist es requerido');
    const template = await this.prisma.eventTemplate.create({
      data: {
        name: body.name.trim(),
        description: body.description?.trim() || null,
        songs: {
          create: (body.songs || []).map(s => ({
            title: s.title,
            artist: s.artist,
            category: s.category || 'General',
            bpm: s.bpm || null,
          })),
        },
      },
      include: { songs: true },
    });
    return template;
  }

  @Post('admin-add-songs/:id')
  async adminAddSongs(
    @Query('key') key: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { songs: { title: string; artist: string; category?: string; bpm?: number }[] },
  ) {
    if (key !== ADMIN_KEY) throw new ForbiddenException('Clave inválida');
    const created = await this.prisma.templateSong.createMany({
      data: (body.songs || []).map(s => ({
        template_id: id,
        title: s.title,
        artist: s.artist,
        category: s.category || 'General',
        bpm: s.bpm || null,
      })),
    });
    return { success: true, added: created.count };
  }

  @Delete('admin-delete-song/:songId')
  async adminDeleteSong(
    @Query('key') key: string,
    @Param('songId', ParseIntPipe) songId: number,
  ) {
    if (key !== ADMIN_KEY) throw new ForbiddenException('Clave inválida');
    await this.prisma.templateSong.delete({ where: { id: songId } });
    return { success: true };
  }

  @Delete('admin-delete/:id')
  async adminDeleteTemplate(
    @Query('key') key: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    if (key !== ADMIN_KEY) throw new ForbiddenException('Clave inválida');
    // Delete songs first (cascade)
    await this.prisma.templateSong.deleteMany({ where: { template_id: id } });
    await this.prisma.eventTemplate.delete({ where: { id } });
    return { success: true };
  }
}
