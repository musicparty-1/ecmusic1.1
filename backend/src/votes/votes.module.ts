import { Module } from '@nestjs/common';
import { VotesService } from './votes.service';
import { VotesController } from './votes.controller';
import { PlanModule } from '../plan/plan.module';

@Module({
  imports: [PlanModule],
  providers: [VotesService],
  controllers: [VotesController],
})
export class VotesModule {}
