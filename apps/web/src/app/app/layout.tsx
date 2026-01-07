'use client';

import { TRPCProvider } from '@/trpc/provider';
import { useSession, signOut } from '@/lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Calculator, LogOut } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackURL: '/' });
  };

  return (
    <TRPCProvider>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-xl shadow-sm">
                <Calculator className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">
                MathStream
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {session?.user && (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? ''} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                        {session.user.name?.charAt(0).toUpperCase() ?? 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-foreground font-medium text-sm hidden sm:inline">
                      {session.user.name}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleSignOut}
                    className="text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2 font-bold uppercase tracking-widest text-[10px]">Sign out</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </div>
    </TRPCProvider>
  );
}

