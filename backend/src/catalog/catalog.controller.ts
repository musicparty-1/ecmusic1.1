import { Controller, Get, Query } from '@nestjs/common';
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
}
