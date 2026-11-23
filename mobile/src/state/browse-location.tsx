import { createContext, useContext, useState, type ReactNode } from 'react';

type NamedPlace = { id: string; nameAr: string; nameEn: string };
type BrowseLocation = { governorate: NamedPlace; city: NamedPlace | null };
const Context = createContext<{
  location: BrowseLocation | null;
  setLocation: (next: BrowseLocation | null) => void;
} | null>(null);

export function BrowseLocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<BrowseLocation | null>(null);
  return <Context.Provider value={{ location, setLocation }}>{children}</Context.Provider>;
}

export function useBrowseLocation() {
  const value = useContext(Context);
  if (!value) throw new Error('Missing BrowseLocationProvider');
  return value;
}
