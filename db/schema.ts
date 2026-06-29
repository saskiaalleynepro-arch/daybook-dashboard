import {
  pgTable,
  serial,
  text,
  timestamp,
  boolean,
  integer,
  date,
  pgEnum,
} from 'drizzle-orm/pg-core';

export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high']);

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  done: boolean('done').notNull().default(false),
  priority: priorityEnum('priority').notNull().default('medium'),
  dueDate: date('due_date'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const notes = pgTable('notes', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull().default(''),
  pinned: boolean('pinned').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const habitSectionEnum = pgEnum('habit_section', ['daily', 'devotional']);

export const habits = pgTable('habits', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  emoji: text('emoji').notNull().default('✅'),
  color: text('color').notNull().default('#3a5a40'),
  section: habitSectionEnum('section').notNull().default('daily'),
  targetPerWeek: integer('target_per_week').notNull().default(7),
  position: integer('position').notNull().default(0),
  archived: boolean('archived').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// One row per habit per day it was completed.
// Streaks are computed on the fly from these rows rather than stored,
// so there's no derived state to keep in sync.
export const habitLogs = pgTable('habit_logs', {
  id: serial('id').primaryKey(),
  habitId: integer('habit_id')
    .notNull()
    .references(() => habits.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
});

// ---------------------------------------------------------------------------
// Week View tables
// All "week-scoped" tables key off weekStart: the Monday (YYYY-MM-DD) that
// identifies which week a row belongs to. This keeps querying simple —
// "give me everything for week X" is one equality filter per table — and
// avoids needing a separate "weeks" parent table to manage.
// ---------------------------------------------------------------------------

export const weekTasks = pgTable('week_tasks', {
  id: serial('id').primaryKey(),
  weekStart: date('week_start').notNull(),
  title: text('title').notNull(),
  done: boolean('done').notNull().default(false),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const gymSessions = pgTable('gym_sessions', {
  id: serial('id').primaryKey(),
  weekStart: date('week_start').notNull(),
  date: date('date').notNull(),
  went: boolean('went').notNull().default(false),
  workoutType: text('workout_type'),
});

export const gymExercises = pgTable('gym_exercises', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id')
    .notNull()
    .references(() => gymSessions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sets: integer('sets'),
  reps: integer('reps'),
  weight: integer('weight'),
  restSeconds: integer('rest_seconds'),
  setsCompleted: integer('sets_completed').notNull().default(0),
  position: integer('position').notNull().default(0),
});

export const focusAreas = pgTable('focus_areas', {
  id: serial('id').primaryKey(),
  weekStart: date('week_start').notNull(),
  title: text('title').notNull(),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const focusGoals = pgTable('focus_goals', {
  id: serial('id').primaryKey(),
  focusAreaId: integer('focus_area_id')
    .notNull()
    .references(() => focusAreas.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  done: boolean('done').notNull().default(false),
  position: integer('position').notNull().default(0),
});

export const reflections = pgTable('reflections', {
  id: serial('id').primaryKey(),
  weekStart: date('week_start').notNull().unique(),
  content: text('content').notNull().default(''),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const readingStatusEnum = pgEnum('reading_status', [
  'currently_reading',
  'read',
  'want_to_read',
]);

export const books = pgTable('books', {
  id: serial('id').primaryKey(),
  openLibraryKey: text('open_library_key').notNull(),
  title: text('title').notNull(),
  author: text('author'),
  coverUrl: text('cover_url'),
  status: readingStatusEnum('status').notNull().default('want_to_read'),
  startedAt: timestamp('started_at'),
  finishedAt: timestamp('finished_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Single-row-per-key settings table. Used for small app-wide preferences
// like the weather location, where a whole table-per-setting would be
// overkill but a hardcoded env var wouldn't let the user change it in the UI.
export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// Standalone calendar events (appointments etc.), separate from tasks.
// "date" is the day the event falls on; "time" is an optional HH:MM string
// for events with a specific time, left null for all-day events.
export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  date: date('date').notNull(),
  // endDate is null for a normal single-day event/appointment. When set,
  // the event is a "block" spanning date..endDate inclusive (e.g. a
  // holiday) and is shaded across every day in that range on the calendar.
  endDate: date('end_date'),
  time: text('time'),
  color: text('color'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Meal plan / recipe library / shopping list
// Recipes are a reusable library, independent of any week. mealSlots links
// a recipe to a specific day+mealType within a specific week, so the same
// recipe can be planned on multiple days/weeks without duplicating it.
// ---------------------------------------------------------------------------

export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  calories: integer('calories'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const recipeIngredients = pgTable('recipe_ingredients', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  quantity: text('quantity'),
  position: integer('position').notNull().default(0),
});

export const mealTypeEnum = pgEnum('meal_type', [
  'breakfast',
  'lunch',
  'dinner',
]);

export const mealSlots = pgTable('meal_slots', {
  id: serial('id').primaryKey(),
  weekStart: date('week_start').notNull(),
  date: date('date').notNull(),
  mealType: mealTypeEnum('meal_type').notNull(),
  recipeId: integer('recipe_id')
    .notNull()
    .references(() => recipes.id, { onDelete: 'cascade' }),
});

// Food log: what was actually eaten, separate from the forward-looking meal
// plan. Calories are shown per entry; there is intentionally no daily total
// vs. target comparison built into the schema or API.
export const foodLogEntries = pgTable('food_log_entries', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  description: text('description').notNull(),
  calories: integer('calories'),
  recipeId: integer('recipe_id').references(() => recipes.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const shoppingListItems = pgTable('shopping_list_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  quantity: text('quantity'),
  checked: boolean('checked').notNull().default(false),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Daily to-do list: items are scoped to a single date with no carryover.
// Each new day naturally starts empty since the query is always filtered
// to today's date — there's no cleanup job needed, old days' rows just
// sit unused in the table (kept in case you ever want a history view later).
export const dailyTodos = pgTable('daily_todos', {
  id: serial('id').primaryKey(),
  date: date('date').notNull(),
  title: text('title').notNull(),
  done: boolean('done').notNull().default(false),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;
export type HabitLog = typeof habitLogs.$inferSelect;
export type WeekTask = typeof weekTasks.$inferSelect;
export type GymSession = typeof gymSessions.$inferSelect;
export type GymExercise = typeof gymExercises.$inferSelect;
export type FocusArea = typeof focusAreas.$inferSelect;
export type FocusGoal = typeof focusGoals.$inferSelect;
export type Reflection = typeof reflections.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type MealSlot = typeof mealSlots.$inferSelect;
export type FoodLogEntry = typeof foodLogEntries.$inferSelect;
export type ShoppingListItem = typeof shoppingListItems.$inferSelect;
export type DailyTodo = typeof dailyTodos.$inferSelect;
