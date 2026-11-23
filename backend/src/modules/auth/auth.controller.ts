import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Operation, Public, ApiRequest } from '../../common/actor';
import { AuthService } from './auth.service';
import { EmailDto, LoginDto, RefreshDto, RegisterDto, ResetDto, TokenDto } from './auth.dto';
import { UsersService } from '../users/users.service';
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}
  @Public() @Post('register') @Operation('register') register(@Body() b: RegisterDto) {
    return this.auth.register(b);
  }
  @Public() @Post('login') @HttpCode(200) @Operation('login') login(@Body() b: LoginDto) {
    return this.auth.login(b);
  }
  @Public() @Post('refresh') @HttpCode(200) @Operation('refreshSession') refresh(
    @Body() b: RefreshDto,
  ) {
    return this.auth.refresh(b.refreshToken);
  }
  @Public() @Post('verify-email') @HttpCode(200) @Operation('verifyEmail') verify(
    @Body() b: TokenDto,
  ) {
    return this.auth.verify(b.token);
  }
  @Public() @Post('forgot-password') @HttpCode(200) @Operation('forgotPassword') forgot(
    @Body() b: EmailDto,
  ) {
    return this.auth.forgot(b.email);
  }
  @Public() @Post('reset-password') @HttpCode(200) @Operation('resetPassword') reset(
    @Body() b: ResetDto,
  ) {
    return this.auth.reset(b.token, b.password);
  }
  @Post('logout') @HttpCode(200) @Operation('logout') logout(
    @Req() r: ApiRequest,
    @Body() b: RefreshDto,
  ) {
    return this.auth.logout(r.actor.id, b.refreshToken);
  }
  @Get('me') @Operation('getSessionUser') me(@Req() r: ApiRequest) {
    return this.users.dto(r.actor.id);
  }
}
