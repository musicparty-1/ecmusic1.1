import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // 1. Cookie httpOnly (web)
        (req: Request) => req?.cookies?.jwt ?? null,
        // 2. Bearer header (mobile / APIs externas)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey',
    });
  }

  async validate(payload: any) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
