import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, pass: string, name?: string) {
    const existing = await this.prisma.dJUser.findUnique({ where: { email } });
    if (existing) throw new Error('Email ya registrado');
    const password = await bcrypt.hash(pass, 10);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);
    const dj = await this.prisma.dJUser.create({
      data: {
        email,
        password,
        name: name ?? null,
        plan: 'DEMO',
        subscriptionStatus: 'TRIAL',
        trialEndsAt,
      },
    });
    const payload = { email: dj.email, sub: dj.id, role: dj.role };
    const { password: _, ...user } = dj;
    return { user, access_token: this.jwtService.sign(payload) };
  }

  async login(email: string, pass: string) {
    const dj = await this.prisma.dJUser.findUnique({
      where: { email },
    });

    if (!dj) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(pass, dj.password);

    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { email: dj.email, sub: dj.id, role: dj.role };
    const { password, ...user } = dj;
    
    return {
      user,
      access_token: this.jwtService.sign(payload),
    };
  }
}

