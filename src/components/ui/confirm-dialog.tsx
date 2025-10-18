'use client';


import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, Tag } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: (choice: 'task' | 'event') => void;
}

export function ConfirmDialog({ 
  open, 
  onOpenChange, 
  title, 
  description, 
  onConfirm 
}: ConfirmDialogProps) {
  const handleChoice = (choice: 'task' | 'event') => {
    onConfirm(choice);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        {description && (
          <p className="text-sm text-muted-foreground mb-6">{description}</p>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => handleChoice('task')}
            variant="outline"
            className="flex flex-col items-center gap-2 h-24"
          >
            <Tag className="h-6 w-6" />
            <span>Task</span>
          </Button>
          
          <Button
            onClick={() => handleChoice('event')}
            variant="outline"
            className="flex flex-col items-center gap-2 h-24"
          >
            <Calendar className="h-6 w-6" />
            <span>Event</span>
          </Button>
        </div>
        
        <div className="flex justify-center mt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}