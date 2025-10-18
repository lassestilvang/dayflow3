import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEvents = await db
      .select()
      .from(events)
      .where(eq(events.userId, session.user.id))
      .orderBy(events.startTime);

    // Convert Date objects to ISO strings for JSON serialization
    const serializedEvents = userEvents.map(event => ({
      ...event,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      createdAt: event.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: event.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json(serializedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
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

    const eventData = await request.json();
    
    // Convert date strings to Date objects
    const processedData = {
      ...eventData,
      userId: session.user.id,
      startTime: new Date(eventData.startTime),
      endTime: new Date(eventData.endTime),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const newEvent = await db
      .insert(events)
      .values(processedData)
      .returning();

    const event = newEvent[0];
    const serializedEvent = {
      ...event,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      createdAt: event.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: event.updatedAt?.toISOString() || new Date().toISOString(),
    };

    return NextResponse.json(serializedEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}