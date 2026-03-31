import { Controller, Post, Body, BadRequestException, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  login(@Body() loginDto: { email: string; password: string; pass?: string }) {
    return this.authService.login(loginDto.email, loginDto.password ?? loginDto.pass ?? '');
  }

  @Post('register')
  async register(@Body() dto: { email: string; password?: string; pass?: string; name?: string }) {
    const pass = dto.password ?? dto.pass ?? '';
    try {
      return await this.authService.register(dto.email, pass, dto.name);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }
}

