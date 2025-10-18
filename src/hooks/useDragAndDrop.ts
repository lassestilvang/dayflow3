'use client';

import { useState } from 'react';
import { useDndMonitor, useDraggable, useDroppable } from '@dnd-kit/core';
import { Task, Event } from '@/types';

interface DragItem {
  id: string;
  type: 'task' | 'event';
  data: Task | Event;
}

export function useDragAndDrop() {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

  useDndMonitor({
    onDragStart({ active }) => {
      setDraggedItem(active.data.current as DragItem);
    },
    onDragEnd() {
      setDraggedItem(null);
    },
  });

  return { draggedItem };
}

export function useDraggableItem(item: Task | Event) {
  const isTask = 'category' in item;
  
  return useDraggable({
    id: item.id,
    data: {
      type: isTask ? 'task' : 'event',
      data: item,
    } as DragItem,
  });
}

export function useDroppableZone(id: string) {
  return useDroppable({
    id,
  });
}