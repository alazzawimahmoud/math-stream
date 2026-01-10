import { z } from 'zod';

export const OperationType = z.enum(['add', 'subtract', 'multiply', 'divide']);
export const StatusType = z.enum(['pending', 'processing', 'completed', 'failed']);
export const ComputationMode = z.enum(['classic', 'ai']);

export const ResultSchema = z.object({
  operation: OperationType,
  progress: z.number().min(0).max(100),
  result: z.number().nullable(),
  status: StatusType,
  error: z.string().nullable(),
  completedAt: z.date().nullable(),
});

export const ComputationSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  a: z.number(),
  b: z.number(),
  mode: ComputationMode,
  status: StatusType,
  results: z.array(ResultSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CreateComputationInput = z.object({
  a: z.number(),
  b: z.number(),
  mode: ComputationMode,
});

export const JobPayload = z.object({
  computationId: z.string(),
  operation: OperationType,
  a: z.number(),
  b: z.number(),
  mode: ComputationMode,
  useCache: z.boolean().optional(),
});

export type OperationType = z.infer<typeof OperationType>;
export type StatusType = z.infer<typeof StatusType>;
export type ComputationMode = z.infer<typeof ComputationMode>;
export type Result = z.infer<typeof ResultSchema>;
export type Computation = z.infer<typeof ComputationSchema>;
export type CreateComputationInput = z.infer<typeof CreateComputationInput>;
export type JobPayload = z.infer<typeof JobPayload>;
