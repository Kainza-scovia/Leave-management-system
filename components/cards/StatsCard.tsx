// components/cards/StatsCard.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number | string;
  description?: string;
  icon?: LucideIcon;
  isLoading?: boolean;
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon,
  isLoading = false 
}: StatsCardProps) {
  // This tells React "Wait until the page loads before showing numbers"
  const [mounted, setMounted] = useState(false);

  // This runs ONCE when the page loads in the browser
  useEffect(() => {
    setMounted(true);
  }, []);

  // If the page hasn't loaded yet, show "..." instead of the number
  if (!mounted) {
    return (
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ...  {/* Show dots while loading */}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">Loading...</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // After the page loads, show the real number
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          {isLoading ? "..." : value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {isLoading ? "Loading..." : description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}