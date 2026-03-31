import { Injectable } from '@nestjs/common';

@Injectable()
export class ActiveDevicesService {
  // Map: `${eventId}:${deviceId}` -> timestamp (ms)
  private readonly seen = new Map<string, number>();

  heartbeat(eventId: number, deviceId: string) {
    this.seen.set(`${eventId}:${deviceId}`, Date.now());
  }

  getActiveCount(eventId: number, windowMs = 30_000): number {
    const cutoff = Date.now() - windowMs;
    const prefix = `${eventId}:`;
    let count = 0;
    for (const [key, ts] of this.seen.entries()) {
      if (key.startsWith(prefix) && ts >= cutoff) count++;
    }
    return count;
  }
}
