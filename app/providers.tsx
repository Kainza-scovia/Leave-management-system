// app/providers.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { User } from "@/lib/types";
import {
  initializeMockData,
  getCurrentUser,
  setCurrentUser as setMockCurrentUser,
  getMockUsers,
  getEmployees,
} from "@/lib/mock-data";

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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [mockUsers, setMockUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initialize mock data (for demo purposes)
    initializeMockData();

    // Get mock users for role switcher
    const employees = getEmployees();
    const users = getMockUsers(employees);
    setMockUsers(users);

    // Load theme preference
    const darkMode = localStorage.getItem("theme") === "dark";
    setIsDarkMode(darkMode);
    document.documentElement.classList.toggle("dark", darkMode);
    document.documentElement.classList.toggle("light", !darkMode);

    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in with Firebase
        try {
          // Try to fetch user data from Firestore
          const userDoc = await getDoc(doc(db, "employees", firebaseUser.uid));
          
          let userData: User;
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            userData = {
              id: firebaseUser.uid,
              email: firebaseUser.email ?? "",
              name: data.name ?? firebaseUser.displayName ?? firebaseUser.email ?? "User",
              employeeCode: data.employeeCode ?? "",
              department: data.department ?? "",
              role: data.role ?? "employee",
              avatar: data.avatar ?? "",
              totalLeaveDays: data.totalLeaveDays ?? 20,
              usedLeaveDays: data.usedLeaveDays ?? 0,
              remainingLeaveDays: data.remainingLeaveDays ?? 20,
            };
          } else {
            // If no Firestore doc, create basic user from Firebase auth
            userData = {
              id: firebaseUser.uid,
              email: firebaseUser.email ?? "",
              name: firebaseUser.displayName ?? firebaseUser.email ?? "User",
              employeeCode: "",
              role: "employee",
              avatar: "",
              totalLeaveDays: 20,
              usedLeaveDays: 0,
              remainingLeaveDays: 20,
            };
          }
          
          setCurrentUserState(userData);
          // Also update mock data for consistency
          setMockCurrentUser(userData);
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fallback to Firebase user data
          const fallbackUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email ?? "",
            name: firebaseUser.displayName ?? firebaseUser.email ?? "User",
            role: "employee",
            avatar: "",
            totalLeaveDays: 20,
            usedLeaveDays: 0,
            remainingLeaveDays: 20,
          };
          setCurrentUserState(fallbackUser);
          setMockCurrentUser(fallbackUser);
        }
      } else {
        // No Firebase user, check mock data for session
        const mockUser = getCurrentUser();
        if (mockUser) {
          setCurrentUserState(mockUser);
        } else {
          setCurrentUserState(null);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSetCurrentUser = (user: User) => {
    setCurrentUserState(user);
    // Update mock data
    setMockCurrentUser(user);
  };

  const handleSetIsDarkMode = (mode: boolean) => {
    setIsDarkMode(mode);
    localStorage.setItem("theme", mode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", mode);
    document.documentElement.classList.toggle("light", !mode);
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
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}