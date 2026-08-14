'use client';

import React from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuditLogPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            <h1 className="text-3xl font-bold mb-6">Audit Log</h1>
            <Card>
              <CardHeader>
                <CardTitle>System Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Audit log coming soon</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
