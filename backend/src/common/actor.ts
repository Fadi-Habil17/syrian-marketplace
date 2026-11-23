import { SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import type { RoleCode, RestrictionKind } from '@prisma/client';
export interface Actor {
  id: string;
  sessionId: string;
  roles: RoleCode[];
  verified: boolean;
  restrictions: RestrictionKind[];
  authTime: number;
}
export interface ApiRequest extends Request {
  actor: Actor;
  requestId: string;
}
export const Public = () => SetMetadata('public', true);
export const Roles = (...roles: RoleCode[]) => SetMetadata('roles', roles);
export const Operation = (id: string) => SetMetadata('operation', id);
