import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { lists } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userLists = await db
      .select()
      .from(lists)
      .where(eq(lists.userId, session.user.id))
      .orderBy(lists.createdAt);

    return NextResponse.json(userLists);
  } catch (error) {
    console.error('Error fetching lists:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, color, icon } = await request.json();

    if (!name || !color || !icon) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [newList] = await db
      .insert(lists)
      .values({
        userId: session.user.id,
        name,
        color,
        icon,
        isDefault: false,
      })
      .returning();

    return NextResponse.json(newList, { status: 201 });
  } catch (error) {
    console.error('Error creating list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}