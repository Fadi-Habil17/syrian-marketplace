import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import type { Response } from 'express';
import { apiContract } from '../infrastructure/http/contract-definition';

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    public readonly status = 409,
    public readonly details: { field?: string; code: string; message?: string }[] = [],
  ) {
    super(code);
  }
}
export function fail(code: string, status = 409): never {
  throw new DomainError(code, status);
}
export function requireValue<T>(value: T | null | undefined): T {
  if (value == null) fail('NOT_FOUND', 404);
  return value;
}
export function apiFailure(error: unknown): DomainError {
  if (error instanceof DomainError) return error;
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    if (/code: "23P01"/.test(error.message)) return new DomainError('BOOKING_NOT_CONFIRMED', 409);
    if (/code: "235(?:03|14)"/.test(error.message))
      return new DomainError('INVALID_TRANSITION', 409);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') return new DomainError('NOT_FOUND', 404);
    if (error.code === 'P2002') return new DomainError('VERSION_CONFLICT', 409);
    if (error.code === 'P2010' && error.meta?.code === '23P01')
      return new DomainError('BOOKING_NOT_CONFIRMED', 409);
    if (
      ['P2003', 'P2004'].includes(error.code) ||
      (error.code === 'P2010' && error.meta?.code === '23514')
    )
      return new DomainError('INVALID_TRANSITION', 409);
    return new DomainError('TEMPORARILY_UNAVAILABLE', 503);
  }
  if (error instanceof HttpException) {
    const status = error.getStatus();
    return new DomainError(
      status === 401
        ? 'AUTH_REQUIRED'
        : status === 403
          ? 'FORBIDDEN'
          : status === 404
            ? 'NOT_FOUND'
            : status === 413
              ? 'FILE_TOO_LARGE'
              : status === 415
                ? 'UNSUPPORTED_MEDIA_TYPE'
                : 'INVALID_INPUT',
      status,
    );
  }
  if (
    error instanceof Error &&
    apiContract.components.schemas.ErrorCode.enum.includes(error.message)
  ) {
    const code = error.message;
    return new DomainError(
      code,
      ['FORBIDDEN', 'ACCOUNT_RESTRICTED', 'WORKSPACE_INACTIVE'].includes(code)
        ? 403
        : [
              'INVALID_ALLOCATION',
              'INVALID_INPUT',
              'INVALID_INSTALLMENT_TOTAL',
              'MIXED_CURRENCY',
              'INVALID_CURSOR',
              'INVALID_IDEMPOTENCY_KEY',
            ].includes(code)
          ? 400
          : ['SIMULATED_FAILURE', 'INSUFFICIENT_FUNDS', 'UNSERVICEABLE_ADDRESS'].includes(code)
            ? 422
            : 409,
    );
  }
  return new DomainError('TEMPORARILY_UNAVAILABLE', 503);
}
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp(),
      res = context.getResponse<Response>();
    const { code, status, details } = apiFailure(error);
    const requestId = String(res.getHeader('X-Request-Id') ?? randomUUID());
    res.setHeader('X-Request-Id', requestId);
    res.status(status).json({ error: { code, message: code, details, requestId } });
  }
}
