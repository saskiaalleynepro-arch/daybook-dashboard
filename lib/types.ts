export type Priority = 'low' | 'medium' | 'high';

export type TaskDTO = {
  id: number;
  title: string;
  description: string | null;
  done: boolean;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NoteDTO = {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type HabitSection = 'daily' | 'devotional';

export type HabitDayDTO = { date: string; done: boolean };

export type HabitDTO = {
  id: number;
  name: string;
  emoji: string;
  color: string;
  section: HabitSection;
  targetPerWeek: number;
  position: number;
  archived: boolean;
  createdAt: string;
  days: HabitDayDTO[];
  completedThisWeek: number;
};

export type HabitsResponse = {
  habits: HabitDTO[];
  weekStart: string;
  overallScore: number;
};

// --- Week View ---

export type WeekTaskDTO = {
  id: number;
  weekStart: string;
  title: string;
  done: boolean;
  position: number;
  createdAt: string;
};

export type GymExerciseDTO = {
  id: number;
  sessionId: number;
  name: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  restSeconds: number | null;
  setsCompleted: number;
  position: number;
};

export type GymSessionDTO = {
  id: number;
  weekStart: string;
  date: string;
  went: boolean;
  workoutType: string | null;
  exercises: GymExerciseDTO[];
};

export type FocusGoalDTO = {
  id: number;
  focusAreaId: number;
  title: string;
  done: boolean;
  position: number;
};

export type FocusAreaDTO = {
  id: number;
  weekStart: string;
  title: string;
  position: number;
  createdAt: string;
  goals: FocusGoalDTO[];
};

export type ReflectionDTO = {
  id: number | null;
  weekStart: string;
  content: string;
};

export type BookStatus = 'currently_reading' | 'read' | 'want_to_read';

export type BookDTO = {
  id: number;
  openLibraryKey: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  status: BookStatus;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type BookSearchResult = {
  openLibraryKey: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
};

// --- Weather ---

export type WeatherLocation = {
  name: string;
  latitude: number;
  longitude: number;
};

export type LocationSearchResult = {
  name: string;
  region?: string;
  country?: string;
  latitude: number;
  longitude: number;
};

export type DailyForecast = {
  date: string;
  high: number;
  low: number;
  condition: string;
};

export type ForecastResponse = {
  current: { temperature: number; condition: string };
  daily: DailyForecast[];
  unit: string;
};

// --- Calendar ---

export type EventDTO = {
  id: number;
  title: string;
  date: string;
  endDate: string | null;
  time: string | null;
  color: string | null;
  notes: string | null;
  createdAt: string;
};

// --- Meal plan / recipes / food log / shopping list ---

export type RecipeIngredientDTO = {
  id: number;
  recipeId: number;
  name: string;
  quantity: string | null;
  position: number;
};

export type RecipeDTO = {
  id: number;
  name: string;
  calories: number | null;
  notes: string | null;
  createdAt: string;
  ingredients: RecipeIngredientDTO[];
};

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export type MealSlotDTO = {
  id: number;
  weekStart: string;
  date: string;
  mealType: MealType;
  recipeId: number;
  recipeName: string;
  recipeCalories: number | null;
};

export type FoodLogEntryDTO = {
  id: number;
  date: string;
  description: string;
  calories: number | null;
  recipeId: number | null;
  createdAt: string;
};

export type ShoppingListItemDTO = {
  id: number;
  name: string;
  quantity: string | null;
  checked: boolean;
  position: number;
  createdAt: string;
};

export type DailyTodoDTO = {
  id: number;
  date: string;
  title: string;
  done: boolean;
  position: number;
  createdAt: string;
};
