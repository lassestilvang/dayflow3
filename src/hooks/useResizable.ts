import { useState, useEffect, useRef, useCallback } from 'react';

interface UseResizableProps {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
}

export const useResizable = ({
  defaultWidth = 256,
  minWidth = 200,
  maxWidth = 400,
  storageKey = 'sidebar-width'
}: UseResizableProps = {}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(defaultWidth);

  // Load saved width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem(storageKey);
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (!isNaN(parsedWidth) && parsedWidth >= minWidth && parsedWidth <= maxWidth) {
        setWidth(parsedWidth);
        startWidthRef.current = parsedWidth;
      }
    }
  }, [storageKey, minWidth, maxWidth]);

  // Save width to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(storageKey, width.toString());
  }, [width, storageKey]);

  // Handle mouse move and up events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - startXRef.current;
      const newWidth = startWidthRef.current + deltaX;
      
      // Constrain width within min/max bounds
      const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
      setWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      
      // Restore default cursor and user select
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
    
    // Prevent text selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
  }, [width]);

  return {
    width,
    isResizing,
    handleMouseDown
  };
};