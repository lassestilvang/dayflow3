'use client';

import { useState } from 'react';
import { 
  Menu, 
  X, 
  Calendar, 
  CheckSquare, 
  Clock, 
  Users, 
  Settings,
  Plus,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTaskStore } from '@/store';
import { cn } from '@/lib/utils';

interface TaskCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  count: number;
}

export function Sidebar() {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['inbox', 'work']);
  const { getTasksByCategory, getOverdueTasks } = useTaskStore();
  
  const overdueCount = getOverdueTasks().length;
  
  const categories: TaskCategory[] = [
    {
      id: 'inbox',
      name: 'Inbox',
      icon: <CheckSquare className="h-4 w-4" />,
      color: 'text-gray-600',
      count: getTasksByCategory('inbox').length,
    },
    {
      id: 'overdue',
      name: 'Overdue',
      icon: <Clock className="h-4 w-4" />,
      color: 'text-red-600',
      count: overdueCount,
    },
    {
      id: 'work',
      name: 'Work',
      icon: <CheckSquare className="h-4 w-4" />,
      color: 'text-blue-600',
      count: getTasksByCategory('work').length,
    },
    {
      id: 'family',
      name: 'Family',
      icon: <Users className="h-4 w-4" />,
      color: 'text-green-600',
      count: getTasksByCategory('family').length,
    },
    {
      id: 'personal',
      name: 'Personal',
      icon: <CheckSquare className="h-4 w-4" />,
      color: 'text-orange-600',
      count: getTasksByCategory('personal').length,
    },
    {
      id: 'travel',
      name: 'Travel',
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-purple-600',
      count: getTasksByCategory('travel').length,
    },
  ];

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="w-64 bg-background border-r border-border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Dayflow</h1>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-2">
        <Button className="w-full justify-start" variant="default">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <Calendar className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      {/* Task Categories */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Tasks</h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <div key={category.id}>
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {expandedCategories.includes(category.id) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <span className={category.color}>{category.icon}</span>
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  {category.count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {category.count}
                    </Badge>
                  )}
                </button>
                
                {expandedCategories.includes(category.id) && (
                  <div className="ml-8 mt-1 space-y-1">
                    {/* Task items would go here */}
                    <div className="text-xs text-muted-foreground p-2">
                      {category.count === 0 ? 'No tasks' : `${category.count} task(s)`}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">User</p>
            <p className="text-xs text-muted-foreground truncate">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}