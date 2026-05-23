import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanService } from '../plan/plan.service';
import { simpleCache } from '../common/simple-cache';

@Injectable()
export class VotesService {
  constructor(
    private prisma: PrismaService,
    private planService: PlanService,
  ) {}

  async create(data: { song_id: number; device_id: string; ip_address?: string; user_agent?: string }) {
    // 1. Obtener el evento al que pertenece la canción
    const song = await this.prisma.song.findUnique({
      where: { id: data.song_id },
      include: { event: true }
    });

    if (!song) {
      throw new BadRequestException('Canción no encontrada');
    }

    if (song.event.status === 'FINISHED') {
      throw new BadRequestException('El evento ya ha finalizado');
    }

    // Verificar límite de votos del plan del DJ
    await this.planService.checkCanVote(song.event_id);

    // 2. Verificar si ya votó por ESTA canción
    const existingVote = await this.prisma.vote.findFirst({
      where: {
        song_id: data.song_id,
        device_id: data.device_id,
      },
    });

    if (existingVote) {
      throw new BadRequestException('Ya has votado por esta canción');
    }

    // 3. Verificar límite TOTAL de votos en el evento
    const totalVotesInEvent = await this.prisma.vote.count({
      where: {
        device_id: data.device_id,
        song: {
          event_id: song.event_id
        }
      }
    });

    if (totalVotesInEvent >= song.event.maxVotesPerDevice) {
      throw new BadRequestException(`Has alcanzado el límite de ${song.event.maxVotesPerDevice} votos para este evento`);
    }

    const vote = await this.prisma.vote.create({
      data,
    });

    // Invalidar caché del evento al registrar un nuevo voto
    simpleCache.invalidateAllPrefix(`songs:event:${song.event_id}:`);

    return vote;
  }
}
