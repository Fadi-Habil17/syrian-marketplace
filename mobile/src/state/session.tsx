import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import type { ApiSchemas } from '../api/contracts';
import {
  api,
  clearSession,
  getRefreshToken,
  restoreSession,
  saveSession,
  setExpiredHandler,
  unwrap,
} from '../api/client';

type Session = {
  user: ApiSchemas['User'] | null;
  ready: boolean;
  error: string | null;
  locale: 'ar' | 'en';
  setLocale: (locale: 'ar' | 'en') => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
};
const Context = createContext<Session | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiSchemas['User'] | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locale, setLocale] = useState<'ar' | 'en'>('ar');
  async function reload() {
    const current = unwrap(await api.GET('/api/v1/auth/me'));
    setUser(current);
  }
  useEffect(() => {
    setExpiredHandler(() => setUser(null));
    restoreSession()
      .then((pair) => {
        if (pair) {
          setUser(pair.user);
          setLocale(pair.user.locale);
        }
      })
      .catch(() => setError('تعذّر استعادة الجلسة / Could not restore session'))
      .finally(() => setReady(true));
    return () => setExpiredHandler(() => {});
  }, []);
  async function login(email: string, password: string) {
    const pair = unwrap(
      await api.POST('/api/v1/auth/login', {
        body: { email, password, client: Platform.OS === 'ios' ? 'IOS' : 'ANDROID' },
      }),
    );
    await saveSession(pair);
    setUser(pair.user);
    setLocale(pair.user.locale);
    setError(null);
  }
  async function logout() {
    const refreshToken = await getRefreshToken();
    try {
      if (refreshToken) unwrap(await api.POST('/api/v1/auth/logout', { body: { refreshToken } }));
    } finally {
      await clearSession();
      setUser(null);
    }
  }
  return (
    <Context.Provider value={{ user, ready, error, locale, setLocale, login, logout, reload }}>
      {children}
    </Context.Provider>
  );
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error('Missing SessionProvider');
  return value;
}
