import { Module } from '@nestjs/common';
import { SongsService } from './songs.service';
import { SongsController, EventSongsController } from './songs.controller';

@Module({
  providers: [SongsService],
  controllers: [SongsController, EventSongsController],
})
export class SongsModule {}
