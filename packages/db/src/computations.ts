import { ObjectId } from 'mongodb';
import { getDb } from './client';
import type { Computation, OperationType, Result, ComputationMode } from '@mathstream/shared';

const COLLECTION = 'computations';

export async function createComputation(
  userId: string,
  a: number,
  b: number,
  mode: ComputationMode
): Promise<string> {
  const db = getDb();
  const now = new Date();
  
  const operations: OperationType[] = ['add', 'subtract', 'multiply', 'divide'];
  const results: Result[] = operations.map(op => ({
    operation: op,
    progress: 0,
    result: null,
    status: 'pending',
    error: null,
    completedAt: null,
  }));
  
  const doc = {
    userId,
    a,
    b,
    mode,
    status: 'pending',
    results,
    createdAt: now,
    updatedAt: now,
  };
  
  const result = await db.collection(COLLECTION).insertOne(doc);
  return result.insertedId.toString();
}

export async function getComputation(id: string): Promise<Computation | null> {
  const db = getDb();
  const doc = await db.collection(COLLECTION).findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  return { ...doc, _id: doc._id.toString() } as Computation;
}

export async function getComputationsByUser(
  userId: string,
  limit: number = 20,
  skip: number = 0
): Promise<{ computations: Computation[]; hasMore: boolean; total: number }> {
  const db = getDb();
  const [docs, total] = await Promise.all([
    db.collection(COLLECTION)
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit + 1) // Fetch one extra to check if there are more
      .toArray(),
    db.collection(COLLECTION).countDocuments({ userId })
  ]);
  
  const hasMore = docs.length > limit;
  const computations = docs.slice(0, limit).map(doc => ({ ...doc, _id: doc._id.toString() })) as Computation[];
  
  return { computations, hasMore, total };
}

export async function updateResultProgress(
  computationId: string,
  operation: OperationType,
  progress: number
): Promise<void> {
  const db = getDb();
  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(computationId) },
    {
      $set: {
        'results.$[elem].progress': progress,
        'results.$[elem].status': 'processing',
        status: 'processing',
        updatedAt: new Date(),
      },
    },
    { arrayFilters: [{ 'elem.operation': operation }] }
  );
}

export async function updateResultComplete(
  computationId: string,
  operation: OperationType,
  result: number | null,
  error: string | null
): Promise<void> {
  const db = getDb();
  
  await db.collection(COLLECTION).updateOne(
    { _id: new ObjectId(computationId) },
    {
      $set: {
        'results.$[elem].progress': 100,
        'results.$[elem].result': result,
        'results.$[elem].error': error,
        'results.$[elem].status': error ? 'failed' : 'completed',
        'results.$[elem].completedAt': new Date(),
        updatedAt: new Date(),
      },
    },
    { arrayFilters: [{ 'elem.operation': operation }] }
  );
  
  // Check if all results are complete
  const computation = await getComputation(computationId);
  if (computation) {
    const allComplete = computation.results.every(
      r => r.status === 'completed' || r.status === 'failed'
    );
    if (allComplete) {
      await db.collection(COLLECTION).updateOne(
        { _id: new ObjectId(computationId) },
        { $set: { status: 'completed', updatedAt: new Date() } }
      );
    }
  }
}

export async function findCompletedResult(
  a: number,
  b: number,
  mode: ComputationMode,
  operation: OperationType
): Promise<{ result: number | null; error: string | null } | null> {
  const db = getDb();
  
  // Find a computation with matching a, b, mode that has a completed result for the operation
  // Using $elemMatch ensures both operation and status match on the same array element
  const computation = await db.collection(COLLECTION).findOne({
    a,
    b,
    mode,
    results: {
      $elemMatch: {
        operation: operation,
        status: { $in: ['completed', 'failed'] },
      },
    },
  });
  
  if (!computation) return null;
  
  // Extract the specific result for the operation (guaranteed to exist due to $elemMatch)
  const result = (computation.results as Result[]).find(
    r => r.operation === operation && (r.status === 'completed' || r.status === 'failed')
  )!; // Non-null assertion: $elemMatch guarantees a match exists
  
  return {
    result: result.result,
    error: result.error,
  };
}
