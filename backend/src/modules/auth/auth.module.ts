import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.service';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccessStrategy, JwtAccessGuard, PolicyGuard } from './access.strategy';
import { EmailDelivery } from './email-delivery';
@Global()
@Module({
  imports: [UsersModule, JwtModule.register({}), PassportModule],
  controllers: [AuthController],
  providers: [AuthService, AccessStrategy, JwtAccessGuard, PolicyGuard, EmailDelivery],
  exports: [EmailDelivery, AccessStrategy, AuthService, JwtModule, JwtAccessGuard, PolicyGuard],
})
export class AuthModule {}
