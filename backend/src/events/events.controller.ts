import { Controller, Post, Put, Patch, Body, Param, Get, Delete, ParseIntPipe, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { EventsService } from './events.service';
import { ActiveDevicesService } from './active-devices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly activeDevices: ActiveDevicesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req: any, @Query('dj_id') djIdParam?: string) {
    const djId = req.user?.id ?? (djIdParam ? parseInt(djIdParam) : undefined);
    return this.eventsService.findAllByDJ(djId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createEventDto: { name: string; venue: string; dj_id: number; template_id?: number; status?: string }) {
    return this.eventsService.create(createEventDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/duplicate')
  duplicate(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.duplicate(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/close')
  close(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.closeEvent(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/suspend')
  suspend(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.suspendEvent(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @Patch(':id')
  updatePut(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string; venue?: string; startDate?: string; status?: string }) {
    return this.eventsService.updateEvent(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/update')
  update(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string; venue?: string; startDate?: string; status?: string }) {
    return this.eventsService.updateEvent(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/launch')
  launch(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.launchEvent(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/toggle-recital')
  toggleRecital(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.toggleRecitalMode(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/max-votes')
  setMaxVotes(@Param('id', ParseIntPipe) id: number, @Body() body: { maxVotesPerDevice: number }) {
    return this.eventsService.setMaxVotes(id, body.maxVotesPerDevice);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/songs')
  addSongs(@Param('id', ParseIntPipe) id: number, @Body() body: { songs: { title: string; artist: string }[] }) {
    return this.eventsService.addSongsToEvent(id, body.songs);
  }

  @Get('admin-all')
  getAdminAllEvents(@Query('key') key: string) {
    if (key !== 'mp-admin-secret-2024') throw new ForbiddenException('Invalid key');
    return this.eventsService.findAll();
  }

  @Get('admin-djs')
  getAdminDJs(@Query('key') key: string) {
    if (key !== 'mp-admin-secret-2024') throw new ForbiddenException('Invalid key');
    return this.eventsService.getDJActivity();
  }

  @Get('admin-logs')
  getAdminLogs(@Query('key') key: string) {
    if (key !== 'mp-admin-secret-2024') throw new ForbiddenException('Invalid key');
    return this.eventsService.getAdminLogs();
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.eventsService.searchActiveEvents(q);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.findOne(id);
  }

  @Get(':id/stats')
  getStats(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.getStats(id);
  }

  @Get(':id/summary')
  getSummary(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.getSummary(id);
  }

  @Get(':id/analytics')
  getAnalytics(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.getAnalytics(id);
  }

  @Get(':id/export')
  getExport(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.getExport(id);
  }

  @Post(':id/heartbeat')
  heartbeat(@Param('id', ParseIntPipe) id: number, @Body() body: { device_id: string }) {
    this.activeDevices.heartbeat(id, body.device_id);
    return { ok: true };
  }

  @Get(':id/active-devices')
  getActiveDevices(@Param('id', ParseIntPipe) id: number) {
    return { count: this.activeDevices.getActiveCount(id) };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.eventsService.delete(id);
  }

  @Post('admin-catalog-import')
  adminImportCatalog(
    @Query('key') key: string,
    @Body() body: { songs: { title: string; artist: string; genre?: string; bpm?: number }[] },
  ) {
    if (key !== 'mp-admin-secret-2024') throw new ForbiddenException('Clave inválida');
    return this.eventsService.importCatalog(body.songs);
  }

  @Get('admin-catalog')
  adminGetCatalog(@Query('key') key: string) {
    if (key !== 'mp-admin-secret-2024') throw new ForbiddenException('Clave inválida');
    return this.eventsService.getCatalog('');
  }
}
