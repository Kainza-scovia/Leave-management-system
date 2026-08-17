'use client';

import React, { useState } from 'react';
import { useAppContext } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Moon, Sun, LogOut, Settings, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function Topbar() {
  const {
    currentUser,
    setCurrentUser,
    isDarkMode,
    setIsDarkMode,
    mockUsers,
  } = useAppContext();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 gap-4">
        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search here..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-6 ml-auto">
          {/* Role Selector */}
          {currentUser && mockUsers.length > 1 && (
            <Select
              value={currentUser.id}
              onValueChange={(userId) => {
                const user = mockUsers.find((u) => u.id === userId);
                if (user) {
                  setCurrentUser(user);
                }
              }}
            >
              <SelectTrigger className="w-32 text-xs border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mockUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    <span className="font-medium">{user.role.replace('_', ' ')}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="h-9 w-9 hover:bg-muted rounded-lg transition-colors"
          >
            {isDarkMode ? (
              <Sun className="h-4 w-4 text-accent" />
            ) : (
              <Moon className="h-4 w-4 text-primary" />
            )}
          </Button>

          {/* User Info */}
          {currentUser && (
            <div className="hidden items-center gap-3 sm:flex">
              <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                {currentUser.name.charAt(0)}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
