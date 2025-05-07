import React, { createContext, useState, useContext } from 'react';

const SearchContext = createContext();

export const SearchProvider = ({ children }) => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const hideSearch = () => {
    setIsSearchVisible(false);
  };

  return (
    <SearchContext.Provider value={{ 
      isSearchVisible, 
      setIsSearchVisible,
      searchResults,
      setSearchResults,
      hideSearch
    }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}; 