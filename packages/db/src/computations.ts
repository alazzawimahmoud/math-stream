import { ObjectId } from 'mongodb';
import { getDb } from './client.js';
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

export async function getComputationsByUser(userId: string): Promise<Computation[]> {
  const db = getDb();
  const docs = await db.collection(COLLECTION)
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();
  return docs.map(doc => ({ ...doc, _id: doc._id.toString() })) as Computation[];
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
