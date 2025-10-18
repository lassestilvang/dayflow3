import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, session.user.id))
      .orderBy(tasks.createdAt);

    // Convert Date objects to ISO strings for JSON serialization
    const serializedTasks = userTasks.map(task => ({
      ...task,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      scheduledDate: task.scheduledDate ? task.scheduledDate.toISOString() : null,
      completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      createdAt: task.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: task.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json(serializedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskData = await request.json();
    
    // Convert date strings to Date objects
    const processedData = {
      ...taskData,
      userId: session.user.id,
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      scheduledDate: taskData.scheduledDate ? new Date(taskData.scheduledDate) : null,
      completedAt: taskData.completedAt ? new Date(taskData.completedAt) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const newTask = await db
      .insert(tasks)
      .values(processedData)
      .returning();

    const task = newTask[0];
    const serializedTask = {
      ...task,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      scheduledDate: task.scheduledDate ? task.scheduledDate.toISOString() : null,
      completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      createdAt: task.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: task.updatedAt?.toISOString() || new Date().toISOString(),
    };

    return NextResponse.json(serializedTask, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}