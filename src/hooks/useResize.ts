'use client';

import { useState, useCallback, useRef } from 'react';
import { Task, Event } from '@/types';

export interface ResizeHandle {
  type: 'top' | 'bottom';
  itemId: string;
  itemType: 'task' | 'event';
  originalItem: Task | Event;
}

export interface ResizeResult {
  newStartTime?: Date;
  newEndTime?: Date;
  newDuration?: number;
  newScheduledTime?: string;
}

export function useResize() {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [startY, setStartY] = useState(0);
  const [originalTop, setOriginalTop] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const containerRef = useRef<HTMLElement>(null);

  const HOUR_HEIGHT = 80; // Should match the HOUR_HEIGHT in calendar components

  const startResize = useCallback((
    e: React.MouseEvent,
    handle: ResizeHandle,
    container: HTMLElement,
    currentTop: number,
    currentHeight: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Stop propagation to prevent drag from triggering
    e.nativeEvent.stopImmediatePropagation();
    
    setIsResizing(true);
    setResizeHandle(handle);
    setStartY(e.clientY);
    setOriginalTop(currentTop);
    setOriginalHeight(currentHeight);
    containerRef.current = container;
    
    // Add global styles to prevent text selection and cursor issues
    document.body.style.userSelect = 'none';
    document.body.style.cursor = handle.type === 'top' ? 'ns-resize' : 'ns-resize';
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeHandle || !containerRef.current) return;

    const deltaY = e.clientY - startY;
    const minutesDelta = Math.round((deltaY / HOUR_HEIGHT) * 60);
    
    // Snap to 15-minute intervals
    const snappedDelta = Math.round(minutesDelta / 15) * 15;
    
    return snappedDelta;
  }, [isResizing, resizeHandle, startY, HOUR_HEIGHT]);

  const stopResize = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
    setStartY(0);
    setOriginalTop(0);
    setOriginalHeight(0);
    containerRef.current = null;
    
    // Remove global styles
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  }, []);

  const calculateResizeResult = useCallback((deltaMinutes: number): ResizeResult => {
    if (!resizeHandle) return {};

    const { type, itemType, originalItem } = resizeHandle;
    const result: ResizeResult = {};

    if (itemType === 'event') {
      const event = originalItem as Event;
      const originalStart = new Date(event.startTime);
      const originalEnd = new Date(event.endTime);

      if (type === 'top') {
        // Resize from top - change start time, keep end time
        const newStart = new Date(originalStart.getTime() + deltaMinutes * 60 * 1000);
        
        // Ensure start time is before end time
        if (newStart < originalEnd) {
          result.newStartTime = newStart;
          result.newEndTime = originalEnd;
        }
      } else {
        // Resize from bottom - change end time, keep start time
        const newEnd = new Date(originalEnd.getTime() + deltaMinutes * 60 * 1000);
        
        // Ensure end time is after start time
        if (newEnd > originalStart) {
          result.newStartTime = originalStart;
          result.newEndTime = newEnd;
        }
      }
    } else {
      // Task
      const task = originalItem as Task;
      
      if (type === 'top') {
        // Resize from top - change scheduled time, adjust duration
        if (task.scheduledTime) {
          const [hours, minutes] = task.scheduledTime.split(':').map(Number);
          const originalStartMinutes = hours * 60 + minutes;
          const newStartMinutes = originalStartMinutes + deltaMinutes;
          
          // Ensure new start time is valid (not negative)
          if (newStartMinutes >= 0) {
            const newHours = Math.floor(newStartMinutes / 60);
            const newMinutes = newStartMinutes % 60;
            result.newScheduledTime = `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
            
            // Calculate new duration
            const originalDuration = task.duration || 30;
            const newDuration = originalDuration - deltaMinutes;
            if (newDuration > 0) {
              result.newDuration = newDuration;
            }
          }
        }
      } else {
        // Resize from bottom - change duration only
        const originalDuration = task.duration || 30;
        const newDuration = originalDuration + deltaMinutes;
        
        if (newDuration > 0) {
          result.newDuration = newDuration;
        }
      }
    }

    return result;
  }, [resizeHandle]);

  return {
    isResizing,
    resizeHandle,
    startY,
    startResize,
    handleMouseMove,
    stopResize,
    calculateResizeResult,
  };
}