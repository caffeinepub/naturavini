import React, { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PageHeader() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [logoError, setLogoError] = useState(false);

  const isAuthenticated = !!identity;
  const isLoggingIn = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        if (err?.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <header className="bg-primary shadow-catalogue">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          {!logoError ? (
            <img
              src="/assets/generated/naturavini-logo-v4.dim_480x240.png"
              alt="Natura Vini — wine glass with grape cluster and NATURA VINI wordmark"
              className="h-14 sm:h-18 w-auto object-contain"
              style={{ maxWidth: '220px' }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="text-primary-foreground font-serif text-2xl font-bold tracking-wide">
              NATURA VINI
            </span>
          )}
        </div>

        {/* Auth button */}
        <Button
          onClick={handleAuth}
          disabled={isLoggingIn}
          variant="outline"
          size="sm"
          className="border-primary-foreground/40 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 hover:text-primary-foreground gap-2"
        >
          {isLoggingIn ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isAuthenticated ? (
            <LogOut className="h-4 w-4" />
          ) : (
            <LogIn className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {isLoggingIn ? 'Logging in…' : isAuthenticated ? 'Log out' : 'Admin Login'}
          </span>
        </Button>
      </div>

      {/* Subtitle bar */}
      <div className="bg-primary/80 border-t border-primary-foreground/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2">
          <p className="text-primary-foreground/70 text-xs tracking-widest uppercase font-sans">
            Natural Wine Price List
          </p>
        </div>
      </div>
    </header>
  );
}
