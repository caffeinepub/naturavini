import React from 'react';
import WineTable from '../components/WineTable';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function WineList() {
  const { identity } = useInternetIdentity();
  const isAdmin = !!identity;

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Page intro */}
      <div className="mb-8 border-b border-border pb-6">
        <h1 className="font-serif text-3xl sm:text-4xl text-foreground mb-2">
          Wine Price List
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
          A curated selection of natural wines from Croatia, Italy, and beyond.
          {isAdmin && (
            <span className="ml-2 inline-flex items-center gap-1 text-primary font-medium">
              · Admin mode active
            </span>
          )}
        </p>
      </div>

      <WineTable />
    </main>
  );
}
