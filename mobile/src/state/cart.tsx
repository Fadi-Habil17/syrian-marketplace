import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useSession } from './session';
import type { ApiSchemas } from '../api/contracts';
type Line = { product: ApiSchemas['Product']; quantity: number };
const Context = createContext<{
  lines: Line[];
  add: (product: ApiSchemas['Product']) => void;
  remove: (id: string) => void;
  clear: () => void;
} | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<Line[]>([]);
  const { user } = useSession();
  useEffect(() => {
    setLines([]);
  }, [user?.id]);
  function add(product: ApiSchemas['Product']) {
    setLines((current) => {
      if (
        current.some(
          (line) =>
            line.product.storeId !== product.storeId ||
            line.product.price.currency !== product.price.currency,
        )
      )
        throw new Error('ابدأ سلة جديدة لهذا المتجر / Start a new cart for this store');
      const found = current.find((line) => line.product.id === product.id);
      return found
        ? current.map((line) =>
            line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
          )
        : [...current, { product, quantity: 1 }];
    });
  }
  return (
    <Context.Provider
      value={{
        lines,
        add,
        remove: (id) => setLines((current) => current.filter((line) => line.product.id !== id)),
        clear: () => setLines([]),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useCart() {
  const value = useContext(Context);
  if (!value) throw new Error('Missing cart');
  return value;
}
