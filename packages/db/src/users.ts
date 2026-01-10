import { getDb } from './client';

const USERS_COLLECTION = 'users';

export interface UserPreferences {
  enableResultReuse: boolean;
}

export async function getUserPreferences(
  userId: string
): Promise<UserPreferences> {
  const db = getDb();
  const doc = await db.collection(USERS_COLLECTION).findOne({ userId });
  
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
  await db.collection(USERS_COLLECTION).updateOne(
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
