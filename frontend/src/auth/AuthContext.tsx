import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/client';
import i18n, {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  type AppLanguage,
  normalizeAppLanguage,
} from '../i18n/config';

interface AuthState {
  token: string | null;
  role: string | null;
  language: AppLanguage;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  changeLanguagePreference: (language: AppLanguage) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function resolveInitialLanguage(): AppLanguage {
  const storedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (storedLanguage) {
    return normalizeAppLanguage(storedLanguage);
  }

  return normalizeAppLanguage(window.navigator.language) ?? DEFAULT_LANGUAGE;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    token: localStorage.getItem('ecm_token'),
    role: localStorage.getItem('ecm_role'),
    language: resolveInitialLanguage(),
  });

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password });
    const {
      access_token,
      role,
      language_preference,
    }: { access_token: string; role: string; language_preference?: string } = res.data;
    const clientPreferredLanguage = normalizeAppLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
    const serverLanguage = normalizeAppLanguage(language_preference);
    const nextLanguage = clientPreferredLanguage !== serverLanguage ? clientPreferredLanguage : serverLanguage;
    localStorage.setItem('ecm_token', access_token);
    localStorage.setItem('ecm_role', role);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    setAuth({ token: access_token, role, language: nextLanguage });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ecm_token');
    localStorage.removeItem('ecm_role');
    setAuth((current) => ({ token: null, role: null, language: current.language }));
  }, []);

  const changeLanguagePreference = useCallback(async (language: AppLanguage) => {
    const previousLanguage = auth.language;

    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    setAuth((current) => ({ ...current, language }));

    try {
      if (auth.token) {
        await api.patch('/api/me/preferences', { language_preference: language });
      }
    } catch (error) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, previousLanguage);
      setAuth((current) => ({ ...current, language: previousLanguage }));
      throw error;
    }
  }, [auth.language, auth.token]);

  useEffect(() => {
    void i18n.changeLanguage(auth.language);
    document.documentElement.lang = auth.language;
  }, [auth.language]);

  useEffect(() => {
    if (!auth.token) {
      return;
    }

    const syncLanguagePreference = async () => {
      try {
        const response = await api.get('/api/me/preferences');
        const serverLanguage = normalizeAppLanguage(response.data.language_preference);
        const currentLanguage = normalizeAppLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));

        if (currentLanguage !== serverLanguage) {
          await api.patch('/api/me/preferences', { language_preference: currentLanguage });
          setAuth((current) => (current.language === currentLanguage ? current : { ...current, language: currentLanguage }));
          return;
        }

        localStorage.setItem(LANGUAGE_STORAGE_KEY, serverLanguage);
        setAuth((current) => (current.language === serverLanguage ? current : { ...current, language: serverLanguage }));
      } catch (error) {
        console.error('Failed to sync language preference', error);
      }
    };

    void syncLanguagePreference();
  }, [auth.token]);

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, changeLanguagePreference, isAuthenticated: !!auth.token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
