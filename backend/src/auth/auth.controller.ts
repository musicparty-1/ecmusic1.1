import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: { email: string; pass: string }) {
    return this.authService.login(loginDto.email, loginDto.pass);
  }

  @Post('register')
  async register(@Body() dto: { email: string; pass: string; name?: string }) {
    try {
      return await this.authService.register(dto.email, dto.pass, dto.name);
    } catch (err: any) {
      throw new BadRequestException(err.message);
    }
  }
}

