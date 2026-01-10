import { describe, it, expect } from 'vitest';
import {
  OperationType,
  StatusType,
  ComputationMode,
  ResultSchema,
  ComputationSchema,
  CreateComputationInput,
  JobPayload,
} from './schemas';

describe('OperationType', () => {
  it('accepts valid operation types', () => {
    expect(OperationType.parse('add')).toBe('add');
    expect(OperationType.parse('subtract')).toBe('subtract');
    expect(OperationType.parse('multiply')).toBe('multiply');
    expect(OperationType.parse('divide')).toBe('INTENTIONALLY_BROKEN'); // INTENTIONAL FAILURE - Remove this to fix
  });

  it('rejects invalid operation types', () => {
    expect(() => OperationType.parse('modulo')).toThrow();
    expect(() => OperationType.parse('')).toThrow();
    expect(() => OperationType.parse(123)).toThrow();
  });
});

describe('StatusType', () => {
  it('accepts valid status types', () => {
    expect(StatusType.parse('pending')).toBe('pending');
    expect(StatusType.parse('processing')).toBe('processing');
    expect(StatusType.parse('completed')).toBe('completed');
    expect(StatusType.parse('failed')).toBe('failed');
  });

  it('rejects invalid status types', () => {
    expect(() => StatusType.parse('running')).toThrow();
    expect(() => StatusType.parse('')).toThrow();
  });
});

describe('ComputationMode', () => {
  it('accepts valid computation modes', () => {
    expect(ComputationMode.parse('classic')).toBe('classic');
    expect(ComputationMode.parse('ai')).toBe('ai');
  });

  it('rejects invalid computation modes', () => {
    expect(() => ComputationMode.parse('quantum')).toThrow();
    expect(() => ComputationMode.parse('')).toThrow();
  });
});

describe('ResultSchema', () => {
  it('validates a complete valid result', () => {
    const result = {
      operation: 'add',
      progress: 50,
      result: 42,
      status: 'processing',
      error: null,
      completedAt: null,
    };
    expect(ResultSchema.parse(result)).toEqual(result);
  });

  it('validates a completed result with date', () => {
    const completedAt = new Date();
    const result = {
      operation: 'multiply',
      progress: 100,
      result: 100,
      status: 'completed',
      error: null,
      completedAt,
    };
    expect(ResultSchema.parse(result)).toEqual(result);
  });

  it('validates a failed result with error', () => {
    const result = {
      operation: 'divide',
      progress: 100,
      result: null,
      status: 'failed',
      error: 'Division by zero',
      completedAt: new Date(),
    };
    expect(ResultSchema.parse(result)).toMatchObject({
      operation: 'divide',
      error: 'Division by zero',
    });
  });

  it('rejects progress outside 0-100', () => {
    const invalidResult = {
      operation: 'add',
      progress: 150,
      result: null,
      status: 'pending',
      error: null,
      completedAt: null,
    };
    expect(() => ResultSchema.parse(invalidResult)).toThrow();
  });

  it('rejects negative progress', () => {
    const invalidResult = {
      operation: 'add',
      progress: -10,
      result: null,
      status: 'pending',
      error: null,
      completedAt: null,
    };
    expect(() => ResultSchema.parse(invalidResult)).toThrow();
  });
});

describe('ComputationSchema', () => {
  const validComputation = {
    _id: '507f1f77bcf86cd799439011',
    userId: 'user123',
    a: 10,
    b: 5,
    mode: 'classic',
    status: 'pending',
    results: [
      { operation: 'add', progress: 0, result: null, status: 'pending', error: null, completedAt: null },
      { operation: 'subtract', progress: 0, result: null, status: 'pending', error: null, completedAt: null },
      { operation: 'multiply', progress: 0, result: null, status: 'pending', error: null, completedAt: null },
      { operation: 'divide', progress: 0, result: null, status: 'pending', error: null, completedAt: null },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('validates a complete computation', () => {
    expect(ComputationSchema.parse(validComputation)).toMatchObject({
      _id: '507f1f77bcf86cd799439011',
      a: 10,
      b: 5,
    });
  });

  it('rejects computation without required fields', () => {
    const { _id, ...withoutId } = validComputation;
    expect(() => ComputationSchema.parse(withoutId)).toThrow();
  });

  it('validates computation with AI mode', () => {
    const aiComputation = { ...validComputation, mode: 'ai' };
    expect(ComputationSchema.parse(aiComputation).mode).toBe('ai');
  });
});

describe('CreateComputationInput', () => {
  it('validates valid input', () => {
    const input = { a: 10, b: 5, mode: 'classic' };
    expect(CreateComputationInput.parse(input)).toEqual(input);
  });

  it('accepts decimal numbers', () => {
    const input = { a: 3.14, b: 2.71, mode: 'ai' };
    expect(CreateComputationInput.parse(input)).toEqual(input);
  });

  it('accepts negative numbers', () => {
    const input = { a: -10, b: -5, mode: 'classic' };
    expect(CreateComputationInput.parse(input)).toEqual(input);
  });

  it('rejects non-numeric a', () => {
    expect(() => CreateComputationInput.parse({ a: 'ten', b: 5, mode: 'classic' })).toThrow();
  });

  it('rejects missing mode', () => {
    expect(() => CreateComputationInput.parse({ a: 10, b: 5 })).toThrow();
  });
});

describe('JobPayload', () => {
  it('validates valid job payload', () => {
    const payload = {
      computationId: '507f1f77bcf86cd799439011',
      operation: 'add',
      a: 10,
      b: 5,
      mode: 'classic',
    };
    expect(JobPayload.parse(payload)).toMatchObject(payload);
  });

  it('validates job payload with useCache', () => {
    const payload = {
      computationId: '507f1f77bcf86cd799439011',
      operation: 'multiply',
      a: 3,
      b: 7,
      mode: 'ai',
      useCache: true,
    };
    expect(JobPayload.parse(payload).useCache).toBe(true);
  });

  it('accepts missing useCache (optional)', () => {
    const payload = {
      computationId: '507f1f77bcf86cd799439011',
      operation: 'divide',
      a: 100,
      b: 10,
      mode: 'classic',
    };
    expect(JobPayload.parse(payload).useCache).toBeUndefined();
  });

  it('rejects invalid operation in payload', () => {
    const payload = {
      computationId: '507f1f77bcf86cd799439011',
      operation: 'power',
      a: 2,
      b: 8,
      mode: 'classic',
    };
    expect(() => JobPayload.parse(payload)).toThrow();
  });
});
