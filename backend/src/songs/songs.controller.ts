import { Controller, Get, Post, Delete, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { SongsService } from './songs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('songs')
export class SongsController {
  constructor(private readonly songsService: SongsService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.songsService.search(q);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/played')
  markAsPlayed(@Param('id', ParseIntPipe) id: number) {
    return this.songsService.markAsPlayed(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.songsService.remove(id);
  }
}

// Sub-recursos bajo /events
@SkipThrottle()
@Controller('events')
export class EventSongsController {
  constructor(private readonly songsService: SongsService) {}

  @Get(':id/songs')
  findAllByEvent(@Param('id', ParseIntPipe) id: number) {
    return this.songsService.findAllByEvent(id);
  }

  @Get(':id/played')
  getPlayedSongs(@Param('id', ParseIntPipe) id: number) {
    return this.songsService.getPlayedSongs(id);
  }

  @Get(':id/ranking')
  getRanking(@Param('id', ParseIntPipe) id: number) {
    return this.songsService.getRanking(id);
  }
}

