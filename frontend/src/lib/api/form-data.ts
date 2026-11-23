import type { FormSchema, Payload, Value } from './registry';

type Resolve = (schema: FormSchema) => FormSchema;

function localDate(value: string) {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function inputShape(schema: FormSchema, resolve: Resolve) {
  const resolved = resolve(schema);
  if (resolved.type || resolved.properties || resolved.enum || resolved.const !== undefined)
    return resolved;
  const members = resolved.variants?.map(resolve).filter((item) => item.type !== 'null') ?? [];
  if (members.length > 1 && members.every((item) => item.enum || item.const !== undefined)) {
    return { enum: members.flatMap((item) => item.enum ?? [item.const!]) };
  }
  return members[0] ?? resolved;
}

export function readInput(
  input: FormData,
  schema: FormSchema,
  name: string,
  resolve: Resolve,
): Value | undefined {
  const original = resolve(schema);
  const shape = inputShape(schema, resolve);
  if (original.variants && input.get(name + '.__null') === 'true') return null;
  if (shape.type === 'object') {
    const output: Payload = {};
    for (const [key, child] of Object.entries(shape.properties ?? {})) {
      const value = readInput(input, child, name ? name + '.' + key : key, resolve);
      if (value !== undefined) output[key] = value;
      else if (shape.required?.includes(key) && inputShape(child, resolve).type === 'array')
        output[key] = [];
    }
    return Object.keys(output).length || !name ? output : undefined;
  }
  if (shape.type === 'array' && shape.items) {
    const values: Value[] = [];
    for (let index = 0; input.has(name + '.' + index + '.__item'); index++) {
      const value = readInput(input, shape.items, name + '.' + index, resolve);
      if (value !== undefined) values.push(value);
    }
    return values.length || input.has(name + '.__array') ? values : undefined;
  }
  const value = input.get(name);
  if (typeof value !== 'string' || !value.trim()) return undefined;
  if (shape.const !== undefined) return shape.const;
  if (shape.type === 'integer' || shape.type === 'number') return Number(value);
  if (shape.type === 'boolean') return value === 'true';
  if (shape.format === 'date-time') return localDate(value);
  if (shape.enum?.some((item) => typeof item === 'number')) {
    return shape.enum.find((item) => String(item) === value);
  }
  return value;
}
