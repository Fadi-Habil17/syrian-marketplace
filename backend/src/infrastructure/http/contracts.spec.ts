import { ContractsService } from './contracts.service';
describe('Canonical DTO projection', () => {
  const contracts = new ContractsService();
  it('retains allowlisted audit metadata while stripping undeclared response fields', () => {
    const schema = {
      type: 'object',
      additionalProperties: false,
      properties: { metadata: { type: 'object', additionalProperties: true } },
    };
    expect(
      contracts.project(schema, {
        metadata: { reason: 'Audited reason' },
        passwordHash: 'private',
      }),
    ).toEqual({ metadata: { reason: 'Audited reason' } });
  });
  it('selects a matching structured union branch instead of projecting the first shape', () => {
    const schema = {
      anyOf: [
        {
          type: 'object',
          additionalProperties: false,
          properties: { kind: { const: 'profile' }, title: { type: 'string' } },
          required: ['kind', 'title'],
        },
        {
          type: 'object',
          additionalProperties: false,
          properties: { kind: { const: 'product' }, price: { type: 'string' } },
          required: ['kind', 'price'],
        },
      ],
    };
    expect(
      contracts.project(schema, { kind: 'product', price: '100', internal: 'private' }),
    ).toEqual({ kind: 'product', price: '100' });
  });
});
