import { db } from '@/lib/db';
import { lists, tasks } from '@/lib/db/schema';
import { auth } from '@/lib/auth';

// This migration script converts the old category enum system to the new lists system
export async function migrateCategoriesToLists() {
  console.log('Starting migration from categories to lists...');
  
  try {
    // Get all users to create default lists for each
    const users = await db.select().from(require('@/lib/db/schema').users);
    
    // Default list configurations matching the old categories
    const defaultLists = [
      { name: 'Inbox', color: '#6b7280', icon: 'CheckSquare', isDefault: true },
      { name: 'Work', color: '#2563eb', icon: 'CheckSquare', isDefault: false },
      { name: 'Family', color: '#16a34a', icon: 'Users', isDefault: false },
      { name: 'Personal', color: '#ea580c', icon: 'CheckSquare', isDefault: false },
      { name: 'Travel', color: '#9333ea', icon: 'Calendar', isDefault: false },
    ];

    // Category to list mapping
    const categoryToListMap: Record<string, string> = {};

    for (const user of users) {
      console.log(`Creating lists for user: ${user.email}`);
      
      // Create lists for this user
      for (const listConfig of defaultLists) {
        const [newList] = await db
          .insert(lists)
          .values({
            userId: user.id,
            ...listConfig,
          })
          .returning();
        
        // Map the old category name to the new list ID
        const categoryKey = listConfig.name.toLowerCase();
        categoryToListMap[categoryKey] = newList.id;
        
        console.log(`Created list: ${listConfig.name} with ID: ${newList.id}`);
      }
    }

    // Update all tasks to use listId instead of category
    console.log('Updating tasks to use listId...');
    
    // Get all tasks that still have the old category field
    const allTasks = await db.select().from(tasks);
    
    for (const task of allTasks) {
      // This is a workaround - we need to access the old category field
      // In a real migration, you'd need to handle this differently
      // For now, we'll assume the category field exists and update it
      const taskAny = task as any;
      const oldCategory = taskAny.category;
      
      if (oldCategory && categoryToListMap[oldCategory]) {
        await db
          .update(tasks)
          .set({ listId: categoryToListMap[oldCategory] })
          .where(require('drizzle-orm').eq(tasks.id, task.id));
        
        console.log(`Updated task ${task.id} from category ${oldCategory} to listId ${categoryToListMap[oldCategory]}`);
      }
    }

    console.log('Migration completed successfully!');
    return { success: true, message: 'Migration completed successfully' };
    
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Function to seed default lists for new users
export async function seedDefaultLists(userId: string) {
  const defaultLists = [
    { name: 'Inbox', color: '#6b7280', icon: 'CheckSquare', isDefault: true },
    { name: 'Work', color: '#2563eb', icon: 'CheckSquare', isDefault: false },
    { name: 'Family', color: '#16a34a', icon: 'Users', isDefault: false },
    { name: 'Personal', color: '#ea580c', icon: 'CheckSquare', isDefault: false },
    { name: 'Travel', color: '#9333ea', icon: 'Calendar', isDefault: false },
  ];

  try {
    const createdLists = await db
      .insert(lists)
      .values(
        defaultLists.map(list => ({
          userId,
          ...list,
        }))
      )
      .returning();

    console.log(`Created ${createdLists.length} default lists for user ${userId}`);
    return createdLists;
  } catch (error) {
    console.error('Failed to seed default lists:', error);
    throw error;
  }
}