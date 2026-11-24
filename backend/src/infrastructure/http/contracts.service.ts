import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import Ajv2020, { ValidateFunction } from 'ajv/dist/2020';
import formats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { DomainError } from '../../common/errors';
import type { ApiRequest } from '../../common/actor';
import { map } from 'rxjs/operators';

// One canonical DTO definition for HTTP, sockets and generated clients.
import { apiContract } from './contract-definition';
export { apiContract } from './contract-definition';
@Injectable()
export class ContractsService {
  private readonly ajv = new Ajv2020({ strict: false, allErrors: true, coerceTypes: false });
  private readonly validators = new Map<string, ValidateFunction>();
  constructor() {
    formats(this.ajv);
    this.ajv.addFormat('binary', true);
    this.ajv.addSchema({ $id: 'marketplace', components: apiContract.components });
  }
  validate(schema: Record<string, unknown>, input: unknown) {
    const key = JSON.stringify(schema);
    let validator = this.validators.get(key);
    if (!validator) {
      validator = this.ajv.compile(
        JSON.parse(
          JSON.stringify(schema).replaceAll('"#/components/', '"marketplace#/components/'),
        ),
      );
      this.validators.set(key, validator);
    }
    if (!validator(input))
      throw new DomainError(
        'INVALID_INPUT',
        400,
        (validator.errors ?? []).map((e) => ({ field: e.instancePath, code: e.keyword })),
      );
  }
  schema(name: string, input: unknown) {
    this.validate({ $ref: `#/components/schemas/${name}` }, input);
  }
  project(schema: any, data: any): any {
    if (data == null) return data;
    if (schema.$ref)
      return this.project(apiContract.components.schemas[schema.$ref.split('/').pop()], data);
    if (schema.anyOf || schema.oneOf) {
      const choices = schema.anyOf ?? schema.oneOf;
      for (const choice of choices) {
        if (choice.type === 'null') continue;
        const projected = this.project(
          { ...schema, ...choice, anyOf: undefined, oneOf: undefined },
          data,
        );
        try {
          this.validate(choice, projected);
          return projected;
        } catch {
          /* Select the actual DTO branch, without fabricating missing fields. */
        }
      }
      return this.project({ ...schema, ...choices[0], anyOf: undefined, oneOf: undefined }, data);
    }
    if (data instanceof Date) return data.toISOString();
    if (typeof data === 'bigint') return data.toString();
    if (schema.type === 'array') return data.map((v: unknown) => this.project(schema.items, v));
    if (schema.type === 'object') {
      const output: Record<string, unknown> =
        schema.additionalProperties === true ? { ...data } : {};
      for (const [key, value] of Object.entries(schema.properties ?? {}))
        if (data[key] !== undefined) output[key] = this.project(value, data[key]);
      return output;
    }
    return data;
  }
}
@Injectable()
export class ContractValidationInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly contracts: ContractsService,
  ) {}
  intercept(context: ExecutionContext, next: CallHandler) {
    const operation = this.reflector.get<string>('operation', context.getHandler());
    let responseSchema: any;
    if (operation) {
      const req = context.switchToHttp().getRequest<ApiRequest>();
      const route = Object.values(apiContract.paths)
        .flatMap((v: any) => Object.values(v))
        .find((v: any) => v.operationId === operation) as any;
      if (route?.security?.length !== 0 || operation === 'searchLocal')
        context.switchToHttp().getResponse().setHeader('Cache-Control', 'private, no-store');
      const body = route?.requestBody?.content?.['application/json']?.schema;
      responseSchema =
        route?.responses?.[Object.keys(route?.responses ?? {}).find((x) => x.startsWith('2'))!]
          ?.content?.['application/json']?.schema;
      if (body) this.contracts.validate(body, req.body);
      const queryProps: Record<string, unknown> = {},
        required: string[] = [];
      for (const raw of route?.parameters ?? []) {
        const p = raw.$ref ? apiContract.components.parameters[raw.$ref.split('/').pop()] : raw;
        if (p.in === 'path') this.contracts.validate(p.schema, req.params[p.name]);
        if (p.in === 'header' && p.required && !req.headers[p.name.toLowerCase()])
          throw new DomainError('INVALID_INPUT', 400, [{ field: p.name, code: 'required' }]);
        if (p.in === 'header' && req.headers[p.name.toLowerCase()] !== undefined)
          this.contracts.validate(p.schema, req.headers[p.name.toLowerCase()]);
        if (p.in === 'query') {
          if (p.schema.type === 'boolean' && ['true', 'false'].includes(String(req.query[p.name])))
            (req.query as Record<string, unknown>)[p.name] = req.query[p.name] === 'true';
          queryProps[p.name] = p.schema;
          if (p.required) required.push(p.name);
          if (
            ['integer', 'number'].includes(p.schema.type) &&
            typeof req.query[p.name] === 'string' &&
            /^\d+(?:\.\d+)?$/.test(req.query[p.name] as string)
          )
            (req.query as Record<string, unknown>)[p.name] = Number(req.query[p.name]);
        }
      }
      this.contracts.validate(
        { type: 'object', additionalProperties: false, properties: queryProps, required },
        req.query,
      );
    }
    return next.handle().pipe(
      map((data) => {
        if (!responseSchema) return data;
        const projected = this.contracts.project(responseSchema, data);
        try {
          this.contracts.validate(responseSchema, projected);
        } catch {
          throw new DomainError('TEMPORARILY_UNAVAILABLE', 503);
        }
        return projected;
      }),
    );
  }
}
