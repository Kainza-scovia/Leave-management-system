'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/lib/types';
import {
  initializeMockData,
  getCurrentUser,
  setCurrentUser,
  getMockUsers,
  getEmployees,
} from '@/lib/mock-data';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  isDarkMode: boolean;
  setIsDarkMode: (mode: boolean) => void;
  mockUsers: User[];
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mockUsers, setMockUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize mock data
    initializeMockData();

    // Get or create current user
    let user = getCurrentUser();
    if (!user) {
      const employees = getEmployees();
      const users = getMockUsers(employees);
      if (users.length > 0) {
        user = users[0];
        setCurrentUser(user);
      }
    }

    if (user) {
      setCurrentUserState(user);
    }

    // Get mock users for role switcher
    const employees = getEmployees();
    const users = getMockUsers(employees);
    setMockUsers(users);

    // Load theme preference
    const darkMode = localStorage.getItem('theme') === 'dark';
    setIsDarkMode(darkMode);
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.classList.toggle('light', !darkMode);

    setIsLoading(false);
  }, []);

  const handleSetCurrentUser = (user: User) => {
    setCurrentUserState(user);
    setCurrentUser(user);
  };

  const handleSetIsDarkMode = (mode: boolean) => {
    setIsDarkMode(mode);
    localStorage.setItem('theme', mode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', mode);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        isDarkMode,
        setIsDarkMode: handleSetIsDarkMode,
        mockUsers,
        isLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
