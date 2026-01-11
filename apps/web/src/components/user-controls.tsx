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
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="relative group flex items-center">
          {/* Desktop hover tooltip */}
          <span className="hidden lg:block absolute right-full mr-2 px-2 py-1 bg-card border border-border rounded text-foreground font-medium text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg">
            {user.name?.split(' ')[0] ?? 'User'}
          </span>
          <button
            type="button"
            onClick={onOpenSettings}
            className="cursor-pointer"
            aria-label="Open settings"
          >
            <Avatar className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 border border-border">
              <AvatarImage src={user.image ?? undefined} alt={user.name ?? ''} />
              <AvatarFallback className="bg-primary text-primary-foreground text-[10px] sm:text-xs lg:text-sm font-bold">
                {user.name?.charAt(0).toUpperCase() ?? 'U'}
              </AvatarFallback>
            </Avatar>
          </button>
        </div>
        {/* ThemeToggle and LogoutButton only on mobile/medium - on lg they're in fixed corner */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>
    );
  }

  // Not signed in
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* ThemeToggle only on mobile/medium */}
      <div className="lg:hidden">
        <ThemeToggle />
      </div>
      <Button
        onClick={onSignIn}
        size="sm"
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase text-[9px] sm:text-[10px] px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2 h-6 sm:h-auto"
      >
        <GoogleIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 sm:mr-1.5" />
        Sign In
      </Button>
    </div>
  );
}
