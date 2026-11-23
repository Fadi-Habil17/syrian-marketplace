import type { ApiOperations } from './contracts';
import registry from './registry.json';

export type Operation = keyof ApiOperations;
type Primitive = string | number | boolean | null;
export type Value = Primitive | Value[] | { [key: string]: Value };
export type Payload = Record<string, Value>;
export type Parameters = Record<string, string | number | boolean | undefined>;
export type FormSchema = {
  ref?: string;
  type?: string;
  format?: string;
  enum?: Primitive[];
  const?: Primitive;
  required?: string[];
  properties?: Record<string, FormSchema>;
  variants?: FormSchema[];
  items?: FormSchema;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  description?: string;
};

type Route = {
  path: string;
  method: string;
  public: boolean;
  route: string[];
  headers: string[];
  query: Record<string, FormSchema>;
  requiredQuery: string[];
  body: FormSchema | null;
};

export const operations: Record<Operation, Route> = registry.operations;
const schemas: Record<string, FormSchema> = registry.schemas;

export function resolve(schema: FormSchema): FormSchema {
  if (!schema.ref) return schema;
  const referenced = schemas[schema.ref];
  if (!referenced) throw new Error('Missing OpenAPI form schema: ' + schema.ref);
  return referenced;
}

export function location(name: Operation, params: Parameters = {}, query: Parameters = {}) {
  const route = operations[name];
  const path = route.path.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = params[key];
    if (value === undefined || String(value) === '') throw new Error('Missing route parameter');
    return encodeURIComponent(String(value));
  });
  const search = new URLSearchParams();
  for (const key of Object.keys(route.query)) {
    const value = query[key];
    if (value !== undefined && String(value) !== '') search.set(key, String(value));
  }
  return search.size ? `${path}?${search}` : path;
}
