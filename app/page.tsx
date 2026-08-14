'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from './providers';
import { Topbar } from '@/components/layout/Topbar';

export default function Home() {
  const router = useRouter();
  const { currentUser, isLoading } = useAppContext();

  useEffect(() => {
    if (!isLoading && currentUser) {
      // Redirect to appropriate dashboard based on role
      if (currentUser.role === 'EMPLOYEE') {
        router.push('/employee/dashboard');
      } else if (currentUser.role === 'MANAGER') {
        router.push('/manager/dashboard');
      } else if (currentUser.role === 'HR_ADMIN') {
        router.push('/hr/dashboard');
      }
    }
  }, [currentUser, isLoading, router]);

  return (
    <div className="min-h-screen bg-background">
      <Topbar />
      <div className="flex items-center justify-center p-4 py-32">
        <div className="space-y-4 text-center">
          <div className="animate-spin">
            <div className="h-12 w-12 rounded-full border-4 border-muted border-t-primary mx-auto" />
          </div>
          <h1 className="text-2xl font-bold">Loading Leave Management System</h1>
          <p className="text-muted-foreground">Initializing your workspace...</p>
        </div>
      </div>
    </div>
  );
}
