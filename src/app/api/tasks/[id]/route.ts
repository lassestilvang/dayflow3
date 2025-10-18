import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskData = await request.json();
    const { id } = await params;

    // Convert date strings to Date objects
    const processedData = {
      ...taskData,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      scheduledDate: taskData.scheduledDate ? new Date(taskData.scheduledDate) : null,
      updatedAt: new Date(),
    };

    const updatedTask = await db
      .update(tasks)
      .set(processedData)
      .where(and(eq(tasks.id, id), eq(tasks.userId, session.user.id)))
      .returning();

    if (updatedTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const task = updatedTask[0];
    const serializedTask = {
      ...task,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      scheduledDate: task.scheduledDate ? task.scheduledDate.toISOString() : null,
      createdAt: task.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: task.updatedAt?.toISOString() || new Date().toISOString(),
    };

    return NextResponse.json(serializedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const deletedTask = await db
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, session.user.id)))
      .returning();

    if (deletedTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}