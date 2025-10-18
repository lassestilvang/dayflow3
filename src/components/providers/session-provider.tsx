'use client';

import { SessionProvider } from 'next-auth/react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { ThemeProvider } from './theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <DndContext sensors={sensors}>
          {children}
        </DndContext>
      </ThemeProvider>
    </SessionProvider>
  );
}