import { Controller, Get, Post, Query, Body, ForbiddenException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CatalogService } from './catalog.service';

@SkipThrottle()
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.catalogService.search(q ?? '');
  }

  @Get('all')
  getAll() {
    return this.catalogService.getAll();
  }

  @Get('genres')
  getGenres() {
    return this.catalogService.getGenres();
  }

  @Post('admin-import')
  adminImport(
    @Query('key') key: string,
    @Body() body: { songs: { title: string; artist: string; genre?: string; bpm?: number }[] },
  ) {
    if (key !== 'mp-admin-secret-2024') throw new ForbiddenException('Clave inválida');
    return this.catalogService.importSongs(body.songs);
  }
}
