import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { getMongoClient } from '@mathstream/db';

// Lazy initialization to prevent build-time errors when env vars are not available
let _auth: ReturnType<typeof betterAuth> | null = null;

function createAuth() {
  if (!_auth) {
    // Use shared MongoDB client from @mathstream/db to avoid multiple connection pools
    const db = getMongoClient().db();
    _auth = betterAuth({
      database: mongodbAdapter(db),
      emailAndPassword: {
        enabled: false,
      },
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      },
      redirects: {
        afterSignIn: '/',
        afterSignUp: '/',
        afterSignOut: '/',
      },
    });
  }
  return _auth;
}

// Export a proxy that lazily initializes auth on first access
export const auth = new Proxy({} as ReturnType<typeof betterAuth>, {
  get(_, prop) {
    return createAuth()[prop as keyof ReturnType<typeof betterAuth>];
  },
});

