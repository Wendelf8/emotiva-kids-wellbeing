import React, { createContext, useContext, useState } from 'react';

interface AppContextType {
  selectedChild: any;
  setSelectedChild: (child: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
};

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedChild, setSelectedChild] = useState<any>(null);

  return (
    <AppContext.Provider value={{ selectedChild, setSelectedChild }}>
      {children}
    </AppContext.Provider>
  );
};