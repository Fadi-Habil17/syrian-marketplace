'use client';
import { createContext, Fragment, useContext, type ReactNode } from 'react';
const Actor = createContext<string | null>(null);
export const useActor = () => useContext(Actor);
export function ActorScope({ id, children }: { id: string | null; children: ReactNode }) {
  return (
    <Actor.Provider value={id}>
      <Fragment key={id ?? 'signed-out'}>{children}</Fragment>
    </Actor.Provider>
  );
}
