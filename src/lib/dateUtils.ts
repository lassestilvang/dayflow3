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

// FullCalendar formatter functions
export function createFullCalendarFormatters(settings: UserSettings) {
  return {
    // Format for column headers in time grid views (shows day and date)
    formatDayHeader: (arg: any) => {
      return format(arg.date, 'EEE MMM d');
    },
    
    // Format for week day headings in month view
    formatWeekdayName: (arg: any) => {
      return format(arg.date, 'EEE');
    },
    
    // Format for slot labels in time grid (shows time)
    formatTime: (arg: any) => {
      return formatTime(arg.date, settings);
    },
    
    // Format for the main calendar title
    formatTitle: (arg: any) => {
      const date = arg.date;
      const view = arg.view.type;
      switch (view) {
        case 'dayGridMonth':
          return format(date, 'MMMM yyyy');
        case 'timeGridWeek':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
        case 'timeGridDay':
          return format(date, 'EEEE, MMMM d, yyyy');
        default:
          return format(date, 'MMMM yyyy');
      }
    },
    
    // Format for event time display
    formatEventTime: (start: Date, end: Date, allDay: boolean) => {
      if (allDay) {
        return '';
      }
      const startTime = formatTime(start, settings);
      const endTime = formatTime(end, settings);
      return `${startTime} - ${endTime}`;
    }
  };
}