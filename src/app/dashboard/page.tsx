'use client';

import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Calendar } from '@/components/calendar/Calendar';
import { useTaskStore, useEventStore, useUIStore } from '@/store';

export default function DashboardPage() {
  const { fetchTasks } = useTaskStore();
  const { fetchEvents } = useEventStore();
  const { setLoading } = useUIStore();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTasks(),
          fetchEvents()
        ]);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchTasks, fetchEvents, setLoading]);

  return (
    <MainLayout>
      <Calendar />
    </MainLayout>
  );
}