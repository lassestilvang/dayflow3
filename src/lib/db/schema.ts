import { pgTable, text, timestamp, boolean, integer, uuid, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const taskCategoryEnum = pgEnum('task_category', ['inbox', 'work', 'family', 'personal', 'travel']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high']);
export const eventTypeEnum = pgEnum('event_type', ['meeting', 'appointment', 'reminder', 'deadline']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  category: taskCategoryEnum('category').default('inbox'),
  priority: taskPriorityEnum('priority').default('medium'),
  completed: boolean('completed').default(false),
  dueDate: timestamp('due_date'),
  scheduledDate: timestamp('scheduled_date'),
  scheduledTime: text('scheduled_time'), // HH:MM format
  duration: integer('duration'), // in minutes
  subtasks: jsonb('subtasks'), // array of subtask objects
  externalId: text('external_id'), // for integrations
  externalSource: text('external_source'), // notion, clickup, etc.
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  type: eventTypeEnum('type').default('meeting'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  allDay: boolean('all_day').default(false),
  location: text('location'),
  attendees: jsonb('attendees'), // array of attendee objects
  externalId: text('external_id'), // for calendar integrations
  externalSource: text('external_source'), // google, outlook, etc.
  color: text('color').default('#3b82f6'), // default blue
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const integrations = pgTable('integrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(), // google, outlook, notion, etc.
  type: text('type').notNull(), // calendar, task, etc.
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  metadata: jsonb('metadata'), // additional provider-specific data
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const sharedEvents = pgTable('shared_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  sharedWithUserId: uuid('shared_with_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permission: text('permission').notNull().default('read'), // read, write
  createdAt: timestamp('created_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;
export type SharedEvent = typeof sharedEvents.$inferSelect;
export type NewSharedEvent = typeof sharedEvents.$inferInsert;