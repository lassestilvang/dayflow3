'use client';

import { SessionProvider } from 'next-auth/react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';

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
      <DndContext sensors={sensors}>
        {children}
      </DndContext>
    </SessionProvider>
  );
}