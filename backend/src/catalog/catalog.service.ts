import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  search(q: string) {
    if (!q || q.trim().length < 2) return Promise.resolve([]);
    return this.prisma.catalogSong.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { artist: { contains: q } },
        ],
      },
      take: 10,
      orderBy: { title: 'asc' },
    });
  }

  getAll() {
    return this.prisma.catalogSong.findMany({
      orderBy: { title: 'asc' },
    });
  }
}
