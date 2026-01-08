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
      variant="ghost"
      size="icon"
      onClick={handleSignOut}
      className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-muted/50 hover:bg-muted text-foreground/70 hover:text-foreground transition-colors"
      aria-label="Sign out"
    >
      <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
    </Button>
  );
}
