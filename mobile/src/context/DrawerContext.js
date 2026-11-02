import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const DrawerContext = createContext({ isOpen: false, openDrawer: () => {}, closeDrawer: () => {} });

export function DrawerProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ isOpen, openDrawer, closeDrawer }), [isOpen, openDrawer, closeDrawer]);
  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

export const useDrawer = () => useContext(DrawerContext);