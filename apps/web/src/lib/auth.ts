import { betterAuth } from 'better-auth';
import { MongoClient } from 'mongodb';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';

// Lazy initialization to prevent build-time errors when env vars are not available
let _client: MongoClient | null = null;
let _auth: ReturnType<typeof betterAuth> | null = null;

function getClient() {
  if (!_client) {
    _client = new MongoClient(process.env.MONGODB_URL!);
  }
  return _client;
}

function createAuth() {
  if (!_auth) {
    const db = getClient().db();
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

