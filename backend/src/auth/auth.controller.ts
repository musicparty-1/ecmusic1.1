import {
  Controller, Post, Get, Body, BadRequestException,
  HttpCode, Res, Req, UseGuards, Query,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

function setAuthCookies(res: Response, access_token: string, refresh_token: string) {
  res.cookie('jwt', access_token, { ...COOKIE_OPTS, maxAge: 24 * 60 * 60 * 1000 });         // 1 día
  res.cookie('refresh_jwt', refresh_token, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 días
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() loginDto: { email: string; password: string; pass?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.authService.login(
      loginDto.email,
      loginDto.password ?? loginDto.pass ?? '',
    );
    setAuthCookies(res, data.access_token, data.refresh_token);
    // Devolvemos user + token (para mobile/backward compat)
    return { user: data.user, access_token: data.access_token };
  }

  @Post('register')
  async register(
    @Body() dto: { email: string; password?: string; pass?: string; name?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const pass = dto.password ?? dto.pass ?? '';
    try {
      const data = await this.authService.register(dto.email, pass, dto.name);
      setAuthCookies(res, data.access_token, data.refresh_token);
      return { user: data.user, access_token: data.access_token };
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_jwt;
    if (!refreshToken) throw new BadRequestException('No refresh token');
    const data = await this.authService.refreshAccessToken(refreshToken);
    setAuthCookies(res, data.access_token, data.refresh_token);
    return { access_token: data.access_token };
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req.user.id);
    res.clearCookie('jwt', COOKIE_OPTS);
    res.clearCookie('refresh_jwt', COOKIE_OPTS);
    return { message: 'Sesión cerrada' };
  }

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token requerido');
    try {
      return await this.authService.verifyEmail(token);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }

  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(@Body() dto: { email: string }) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: { token: string; password: string }) {
    try {
      return await this.authService.resetPassword(dto.token, dto.password);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }
}
