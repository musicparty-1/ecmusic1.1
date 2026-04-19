import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private generateTokens(dj: { id: number; email: string }) {
    const payload = { email: dj.email, sub: dj.id };
    const access_token = this.jwtService.sign(payload, { expiresIn: '1d' });
    const refresh_token = this.jwtService.sign(payload, {
      expiresIn: '7d',
      secret: (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refreshSecret') + '_refresh',
    });
    return { access_token, refresh_token };
  }

  async register(email: string, pass: string, name?: string) {
    const existing = await this.prisma.dJUser.findUnique({ where: { email } });
    if (existing) throw new Error('Email ya registrado');
    const password = await bcrypt.hash(pass, 10);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const dj = await this.prisma.dJUser.create({
      data: {
        email,
        password,
        name: name ?? null,
        plan: 'DEMO',
        subscriptionStatus: 'TRIAL',
        trialEndsAt,
        emailVerificationToken: verificationToken,
        emailVerified: false,
      },
    });
    // TODO: enviar email con link /auth/verify-email?token=${verificationToken}
    console.log(`[AUTH] EMAIL_VERIFICATION TOKEN for ${email}: ${verificationToken}`);

    const { access_token, refresh_token } = this.generateTokens(dj);
    await this.prisma.dJUser.update({
      where: { id: dj.id },
      data: { refreshToken: await bcrypt.hash(refresh_token, 10) },
    });
    const { password: _, refreshToken: _rt2, emailVerificationToken: _evt2, ...user } = dj;
    return { user, access_token, refresh_token };
  }

  async login(email: string, pass: string) {
    console.log('LOGIN_ATTEMPT_FOR:', email);
    let dj = await this.prisma.dJUser.findUnique({ where: { email } });
    if (!dj) {
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30);
      const verificationToken = crypto.randomBytes(32).toString('hex');
      dj = await this.prisma.dJUser.create({
        data: {
          email,
          password: await bcrypt.hash(pass, 10),
          name: email.split('@')[0],
          plan: 'DEMO',
          subscriptionStatus: 'TRIAL',
          trialEndsAt,
          emailVerificationToken: verificationToken,
          emailVerified: false,
        },
      });
      console.log(`[AUTH] EMAIL_VERIFICATION TOKEN for ${email}: ${verificationToken}`);
    }

    const { access_token, refresh_token } = this.generateTokens(dj);
    await this.prisma.dJUser.update({
      where: { id: dj.id },
      data: { refreshToken: await bcrypt.hash(refresh_token, 10) },
    });
    const { password, refreshToken: _rt, emailVerificationToken: _evt, ...user } = dj;
    return { user, access_token, refresh_token };
  }

  async refreshAccessToken(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refreshSecret') + '_refresh',
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const dj = await this.prisma.dJUser.findUnique({ where: { id: payload.sub } });
    if (!dj?.refreshToken) throw new UnauthorizedException('Sesión expirada');

    const valid = await bcrypt.compare(refreshToken, dj.refreshToken);
    if (!valid) throw new UnauthorizedException('Refresh token inválido');

    const { access_token, refresh_token: new_refresh } = this.generateTokens(dj);
    await this.prisma.dJUser.update({
      where: { id: dj.id },
      data: { refreshToken: await bcrypt.hash(new_refresh, 10) },
    });
    return { access_token, refresh_token: new_refresh };
  }

  async logout(userId: number) {
    await this.prisma.dJUser.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async verifyEmail(token: string) {
    const dj = await this.prisma.dJUser.findFirst({
      where: { emailVerificationToken: token },
    });
    if (!dj) throw new UnauthorizedException('Token de verificación inválido');
    await this.prisma.dJUser.update({
      where: { id: dj.id },
      data: { emailVerified: true, emailVerificationToken: null },
    });
    return { message: 'Email verificado correctamente' };
  }

  async forgotPassword(email: string) {
    const dj = await this.prisma.dJUser.findUnique({ where: { email } });
    if (!dj) {
      return { message: 'Si existe una cuenta con ese email, recibirás las instrucciones.' };
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000);
    await this.prisma.dJUser.update({
      where: { id: dj.id },
      data: { resetToken: token, resetTokenExpiresAt: expiresAt },
    });
    // TODO: Enviar email con link: /dj/reset-password?token=${token}
    console.log(`[AUTH] RESET TOKEN for ${email}: ${token}`);
    return { message: 'Si existe una cuenta con ese email, recibirás las instrucciones.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const dj = await this.prisma.dJUser.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiresAt: { gte: new Date() },
      },
    });
    if (!dj) throw new UnauthorizedException('Token inválido o expirado');
    const password = await bcrypt.hash(newPassword, 10);
    await this.prisma.dJUser.update({
      where: { id: dj.id },
      data: { password, resetToken: null, resetTokenExpiresAt: null },
    });
    return { message: 'Contraseña actualizada correctamente' };
  }
}
