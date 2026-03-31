import { Controller, Post, Body, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';

import { VotesService } from './votes.service';

@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Throttle({ default: { ttl: 2000, limit: 1 }, burst: { ttl: 60000, limit: 20 } })
  @Post()
  create(@Body() createVoteDto: { song_id: number; device_id: string }, @Req() req: Request) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    const ua = req.headers['user-agent'];
    return this.votesService.create({ ...createVoteDto, ip_address: ip, user_agent: ua });
  }
}


