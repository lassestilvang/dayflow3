import { Event, Task } from '@/types';

export interface LayoutItem {
  id: string;
  startMinutes: number;
  endMinutes: number;
  data: Event | Task;
}

export interface PositionedLayoutItem extends LayoutItem {
  left: number;
  width: number;
  columnIndex: number;
  totalColumns: number;
}

/**
 * Calculate the minutes from midnight for a given time
 */
function getTimeInMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Convert an event to a layout item
 */
function eventToLayoutItem(event: Event): LayoutItem {
  return {
    id: event.id,
    startMinutes: getTimeInMinutes(new Date(event.startTime)),
    endMinutes: getTimeInMinutes(new Date(event.endTime)),
    data: event
  };
}

/**
 * Convert a task to a layout item
 */
function taskToLayoutItem(task: Task): LayoutItem {
  if (!task.scheduledTime) {
    throw new Error('Task must have scheduledTime to be positioned');
  }
  
  const [hours, minutes] = task.scheduledTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const duration = task.duration || 30; // default 30 minutes
  
  return {
    id: task.id,
    startMinutes,
    endMinutes: startMinutes + duration,
    data: task
  };
}

/**
 * Check if two time ranges overlap
 */
function doRangesOverlap(a: LayoutItem, b: LayoutItem): boolean {
  return a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

/**
 * Group items into overlapping clusters
 */
function findOverlappingClusters(items: LayoutItem[]): LayoutItem[][] {
  if (items.length === 0) return [];
  
  // Sort items by start time
  const sortedItems = [...items].sort((a, b) => a.startMinutes - b.startMinutes);
  const clusters: LayoutItem[][] = [];
  
  for (const item of sortedItems) {
    let placed = false;
    
    // Try to place the item in an existing cluster
    for (const cluster of clusters) {
      // Check if item overlaps with any item in this cluster
      const overlapsWithCluster = cluster.some(clusterItem => 
        doRangesOverlap(item, clusterItem)
      );
      
      if (overlapsWithCluster) {
        cluster.push(item);
        placed = true;
        break;
      }
    }
    
    // If not placed in any cluster, create a new one
    if (!placed) {
      clusters.push([item]);
    }
  }
  
  return clusters;
}

/**
 * Calculate layout positions for overlapping items
 * This implements a column-based layout similar to Google Calendar
 */
function calculateLayoutForCluster(cluster: LayoutItem[]): PositionedLayoutItem[] {
  if (cluster.length === 0) return [];
  if (cluster.length === 1) {
    return [{
      ...cluster[0],
      left: 0,
      width: 100,
      columnIndex: 0,
      totalColumns: 1
    }];
  }
  
  // Sort by start time to ensure consistent layout
  const sortedCluster = [...cluster].sort((a, b) => a.startMinutes - b.startMinutes);
  
  // Find the maximum number of concurrent items at any point
  let maxConcurrent = 1;
  const timePoints: { time: number; type: 'start' | 'end'; item: LayoutItem }[] = [];
  
  sortedCluster.forEach(item => {
    timePoints.push({ time: item.startMinutes, type: 'start', item });
    timePoints.push({ time: item.endMinutes, type: 'end', item });
  });
  
  // Sort time points (end times before start times at the same minute)
  timePoints.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return a.type === 'end' ? -1 : 1;
  });
  
  let currentConcurrent = 0;
  const activeItems = new Set<string>();
  
  for (const point of timePoints) {
    if (point.type === 'start') {
      currentConcurrent++;
      activeItems.add(point.item.id);
      maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
    } else {
      currentConcurrent--;
      activeItems.delete(point.item.id);
    }
  }
  
  // Assign columns to items using a more sophisticated algorithm
  const itemColumns: Map<string, number> = new Map();
  const columns: LayoutItem[][] = Array(maxConcurrent).fill(null).map(() => []);
  
  // Sort items by start time for assignment
  for (const item of sortedCluster) {
    // Find the first available column where this item doesn't overlap
    let assignedColumn = -1;
    
    for (let col = 0; col < maxConcurrent; col++) {
      const canPlaceInColumn = columns[col].every(colItem => 
        !doRangesOverlap(item, colItem)
      );
      
      if (canPlaceInColumn) {
        assignedColumn = col;
        columns[col].push(item);
        itemColumns.set(item.id, col);
        break;
      }
    }
    
    // If no column found (shouldn't happen with correct maxConcurrent), assign to first
    if (assignedColumn === -1) {
      assignedColumn = 0;
      columns[0].push(item);
      itemColumns.set(item.id, 0);
    }
  }
  
  // Calculate positions
  const positionedItems: PositionedLayoutItem[] = [];
  const columnWidth = 100 / maxConcurrent;
  
  for (const item of sortedCluster) {
    const columnIndex = itemColumns.get(item.id) || 0;
    positionedItems.push({
      ...item,
      left: columnIndex * columnWidth,
      width: columnWidth,
      columnIndex,
      totalColumns: maxConcurrent
    });
  }
  
  return positionedItems;
}

/**
 * Main function to calculate layout for all events and tasks
 */
export function calculateOverlapLayout(
  events: Event[],
  tasks: Task[]
): PositionedLayoutItem[] {
  // Convert events and tasks to layout items
  const eventItems = events
    .filter(event => !event.allDay)
    .map(eventToLayoutItem);
  
  const taskItems = tasks
    .filter(task => !task.allDay && task.scheduledTime)
    .map(taskToLayoutItem);
  
  const allItems = [...eventItems, ...taskItems];
  
  if (allItems.length === 0) return [];
  
  // Find overlapping clusters
  const clusters = findOverlappingClusters(allItems);
  
  // Calculate layout for each cluster
  const allPositionedItems: PositionedLayoutItem[] = [];
  
  for (const cluster of clusters) {
    const positionedCluster = calculateLayoutForCluster(cluster);
    allPositionedItems.push(...positionedCluster);
  }
  
  return allPositionedItems;
}

/**
 * Get positioned items for a specific date (for WeekView)
 */
export function calculateDayLayout(
  events: Event[],
  tasks: Task[]
): PositionedLayoutItem[] {
  return calculateOverlapLayout(events, tasks);
}