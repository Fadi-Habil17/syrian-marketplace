import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { BusinessType } from '@prisma/client';
export class RegisterDto {
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(12) @MaxLength(72) password!: string;
  @IsString() @MinLength(1) @MaxLength(120) displayName!: string;
  @IsEnum({ ar: 'ar', en: 'en' }) locale!: 'ar' | 'en';
  @IsOptional() @IsEnum(BusinessType) businessRole?: BusinessType | null;
}
export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(1) @MaxLength(72) password!: string;
  @IsEnum({ WEB: 'WEB', IOS: 'IOS', ANDROID: 'ANDROID' }) client!: 'WEB' | 'IOS' | 'ANDROID';
}
export class RefreshDto {
  @IsString() @MinLength(1) @MaxLength(8192) refreshToken!: string;
}
export class TokenDto {
  @IsString() @MinLength(1) @MaxLength(512) token!: string;
}
export class ResetDto extends TokenDto {
  @IsString() @MinLength(12) @MaxLength(72) password!: string;
}
export class EmailDto {
  @IsEmail() email!: string;
}
