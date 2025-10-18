import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
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

    const eventData = await request.json();
    const { id } = await params;

    // Convert date strings to Date objects
    const processedData = {
      ...eventData,
      startTime: eventData.startTime ? new Date(eventData.startTime) : undefined,
      endTime: eventData.endTime ? new Date(eventData.endTime) : undefined,
      updatedAt: new Date(),
    };

    const updatedEvent = await db
      .update(events)
      .set(processedData)
      .where(and(eq(events.id, id), eq(events.userId, session.user.id)))
      .returning();

    if (updatedEvent.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = updatedEvent[0];
    const serializedEvent = {
      ...event,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      createdAt: event.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: event.updatedAt?.toISOString() || new Date().toISOString(),
    };

    return NextResponse.json(serializedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
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

    const deletedEvent = await db
      .delete(events)
      .where(and(eq(events.id, id), eq(events.userId, session.user.id)))
      .returning();

    if (deletedEvent.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}