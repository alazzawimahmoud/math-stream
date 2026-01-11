'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoutButton } from '@/components/logout-button';
import { GoogleIcon } from '@/components/icons/google';

interface UserControlsProps {
  user: {
    name?: string | null;
    image?: string | null;
  } | null;
  onSignIn: () => void;
  onOpenSettings: () => void;
}

export function UserControls({ user, onSignIn, onOpenSettings }: UserControlsProps) {
  if (user) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="relative group flex items-center">
          <span className="hidden lg:block absolute right-full mr-2 px-2 py-1 bg-card rounded-lg text-foreground font-medium text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none neu-raised-sm">
            {user.name?.split(' ')[0] ?? 'User'}
          </span>
          <button
            type="button"
            onClick={onOpenSettings}
            className="cursor-pointer"
            aria-label="Open settings"
          >
            <Avatar className="h-7 w-7 ring-2 ring-border neu-raised-sm">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? ''} />
              <AvatarFallback className="gradient-blue text-secondary-foreground text-xs font-semibold">
                {user.name?.charAt(0).toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="lg:hidden">
        <ThemeToggle />
      </div>
      <Button onClick={onSignIn} variant="pill" size="pill-sm" className="font-semibold text-[10px]">
        <GoogleIcon className="h-3 w-3 mr-1" />
        Sign In
      </Button>
    </div>
  );
}
