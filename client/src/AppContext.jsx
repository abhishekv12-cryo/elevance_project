import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { TRANSLATIONS } from './i18n';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [toast, setToast] = useState(null);
  const refresh = useCallback(() => api.get('/auth/me').then((d) => setUser(d.user)).catch(() => setUser(null)), []);
  useEffect(() => { refresh(); }, [refresh]);
  const notify = useCallback((text, type = 'ok') => setToast({ text, type }), []);
  const lang = user?.lang || 'en';
  const t = (k) => TRANSLATIONS[lang]?.[k] || TRANSLATIONS.en[k] || k;
  return <Ctx.Provider value={{ user, setUser, refresh, notify, toast, setToast, t, lang }}>{children}</Ctx.Provider>;
};
