'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface UserSettings {
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStart: 'sunday' | 'monday';
}

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
}

const DATE_FORMATS = [
  { value: 'MM/dd/yyyy', label: 'MM/DD/YYYY (12/31/2023)' },
  { value: 'dd/MM/yyyy', label: 'DD/MM/YYYY (31/12/2023)' },
  { value: 'yyyy-MM-dd', label: 'YYYY-MM-DD (2023-12-31)' },
  { value: 'MMM d, yyyy', label: 'MMM D, YYYY (Dec 31, 2023)' },
  { value: 'MMMM d, yyyy', label: 'MMMM D, YYYY (December 31, 2023)' },
  { value: 'd MMM yyyy', label: 'D MMM YYYY (31 Dec 2023)' },
  { value: 'd MMMM yyyy', label: 'D MMMM YYYY (31 December 2023)' },
];

export function SettingsModal({ isOpen, onOpenChange, settings, onSave }: SettingsModalProps) {
  const [localSettings, setLocalSettings] = React.useState<UserSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
      
      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="date-format">Date Format</Label>
          <Select
            value={localSettings.dateFormat}
            onValueChange={(value) => 
              setLocalSettings(prev => ({ ...prev, dateFormat: value }))
            }
          >
            <SelectTrigger id="date-format">
              <SelectValue placeholder="Select date format" />
            </SelectTrigger>
            <SelectContent>
              {DATE_FORMATS.map((format) => (
                <SelectItem key={format.value} value={format.value}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time-format">Time Format</Label>
          <Select
            value={localSettings.timeFormat}
            onValueChange={(value: '12h' | '24h') => 
              setLocalSettings(prev => ({ ...prev, timeFormat: value }))
            }
          >
            <SelectTrigger id="time-format">
              <SelectValue placeholder="Select time format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12h">12-hour (3:00 PM)</SelectItem>
              <SelectItem value="24h">24-hour (15:00)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="week-start">Week Start</Label>
          <Select
            value={localSettings.weekStart}
            onValueChange={(value: 'sunday' | 'monday') => 
              setLocalSettings(prev => ({ ...prev, weekStart: value }))
            }
          >
            <SelectTrigger id="week-start">
              <SelectValue placeholder="Select week start" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sunday">Sunday</SelectItem>
              <SelectItem value="monday">Monday</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>
      </DialogContent>
    </Dialog>
  );
}