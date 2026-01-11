'use client';

import { LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { signOut, useSession } from '@/lib/auth-client';

export function LogoutButton() {
  const { data: session } = useSession();
  const isSignedIn = !!session?.user;

  if (!isSignedIn) return null;

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <Button
      variant="neu"
      size="icon-sm"
      onClick={handleSignOut}
      className="rounded-full"
      aria-label="Sign out"
    >
      <LogOut className="h-3.5 w-3.5" />
    </Button>
  );
}
