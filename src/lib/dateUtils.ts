import { format } from 'date-fns';

interface UserSettings {
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

export function formatDate(date: Date, settings: UserSettings): string {
  return format(date, settings.dateFormat);
}

export function formatTime(date: Date, settings: UserSettings): string {
  if (settings.timeFormat === '24h') {
    return format(date, 'HH:mm');
  } else {
    return format(date, 'h:mm a');
  }
}

export function formatDateTime(date: Date, settings: UserSettings): string {
  const dateStr = formatDate(date, settings);
  const timeStr = formatTime(date, settings);
  return `${dateStr} ${timeStr}`;
}

export function formatTimeOnly(time: string, settings: UserSettings): string {
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  return formatTime(date, settings);
}