import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { lists } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

const { name, color, icon } = await request.json();
  const listId = id;

    // Check if list exists and belongs to user
    const [existingList] = await db
      .select()
      .from(lists)
      .where(eq(lists.id, listId));

    if (!existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    if (existingList.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prevent editing default list name
    if (existingList.isDefault && name !== existingList.name) {
      return NextResponse.json({ error: 'Cannot rename default list' }, { status: 400 });
    }

    const [updatedList] = await db
      .update(lists)
      .set({
        ...(name && { name }),
        ...(color && { color }),
        ...(icon && { icon }),
        updatedAt: new Date(),
      })
      .where(eq(lists.id, listId))
      .returning();

    return NextResponse.json(updatedList);
  } catch (error) {
    console.error('Error updating list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const listId = id;

    // Check if list exists and belongs to user
    const [existingList] = await db
      .select()
      .from(lists)
      .where(eq(lists.id, listId));

    if (!existingList) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 });
    }

    if (existingList.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prevent deleting default list
    if (existingList.isDefault) {
      return NextResponse.json({ error: 'Cannot delete default list' }, { status: 400 });
    }

    await db.delete(lists).where(eq(lists.id, listId));

    return NextResponse.json({ message: 'List deleted successfully' });
  } catch (error) {
    console.error('Error deleting list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}