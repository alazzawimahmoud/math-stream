import { getDb } from './client';
import { COLLECTIONS } from './collections';

export interface UserPreferences {
  enableResultReuse: boolean;
}

export async function getUserPreferences(
  userId: string
): Promise<UserPreferences> {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.USERS).findOne({ userId });
  
  if (!doc || !doc.preferences) {
    // Return default preferences if user document doesn't exist or has no preferences
    return { enableResultReuse: false };
  }
  
  return {
    enableResultReuse: doc.preferences.enableResultReuse ?? false,
  };
}

export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  const db = getDb();
  
  // Get current preferences to merge
  const current = await getUserPreferences(userId);
  const updated = { ...current, ...preferences };
  
  // Upsert user document with preferences
  await db.collection(COLLECTIONS.USERS).updateOne(
    { userId },
    {
      $set: {
        preferences: updated,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        userId,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );
  
  return updated;
}
