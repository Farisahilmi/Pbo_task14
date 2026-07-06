import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [city, setCity] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <AppContext.Provider value={{ city, setCity, searchTerm, setSearchTerm }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
