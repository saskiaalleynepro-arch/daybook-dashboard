'use client';

import { useEffect, useState } from 'react';
import { X, Plus, ChefHat, BookOpen } from 'lucide-react';
import type { MealSlotDTO, RecipeDTO, MealType } from '@/lib/types';
import { daysInWeek } from '@/lib/dates';
import RecipePickerModal from './RecipePickerModal';
import RecipeLibraryModal from './RecipeLibraryModal';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

export default function MealPlan({ weekStart }: { weekStart: string }) {
  const [slots, setSlots] = useState<MealSlotDTO[]>([]);
  const [recipes, setRecipes] = useState<RecipeDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState<{ date: string; mealType: MealType } | null>(
    null
  );
  const [managingRecipes, setManagingRecipes] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const days = daysInWeek(weekStart);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/meal-slots?weekStart=${weekStart}`).then((r) => r.json()),
      fetch('/api/recipes').then((r) => r.json()),
    ])
      .then(([slotData, recipeData]) => {
        setSlots(slotData);
        setRecipes(recipeData);
      })
      .catch(() => setError('Could not load the meal plan.'))
      .finally(() => setLoading(false));
  }, [weekStart]);

  function slotFor(date: string, mealType: MealType) {
    return slots.find((s) => s.date === date && s.mealType === mealType);
  }

  async function setMeal(date: string, mealType: MealType, recipeId: number) {
    try {
      const res = await fetch('/api/meal-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart, date, mealType, recipeId }),
      });
      if (!res.ok) throw new Error();
      const created: MealSlotDTO = await res.json();
      setSlots((prev) => [
        ...prev.filter((s) => !(s.date === date && s.mealType === mealType)),
        created,
      ]);
      setPicking(null);
    } catch {
      setError('Could not set that meal.');
    }
  }

  async function clearSlot(slot: MealSlotDTO) {
    setSlots((prev) => prev.filter((s) => s.id !== slot.id));
    try {
      await fetch(`/api/meal-slots/${slot.id}`, { method: 'DELETE' });
    } catch {
      setError('Could not clear that meal.');
    }
  }

  async function createRecipe(draft: {
    name: string;
    calories: number | null;
    ingredients: { name: string; quantity: string }[];
  }) {
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    if (!res.ok) throw new Error();
    const created: RecipeDTO = await res.json();
    setRecipes((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    return created;
  }

  async function updateRecipe(
    id: number,
    fields: { name?: string; calories?: number | null }
  ) {
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...fields } : r))
    );
    setSlots((prev) =>
      prev.map((s) =>
        s.recipeId === id
          ? {
              ...s,
              recipeName: fields.name ?? s.recipeName,
              recipeCalories:
                fields.calories !== undefined ? fields.calories : s.recipeCalories,
            }
          : s
      )
    );
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError('Could not save that change.');
    }
  }

  async function deleteRecipe(id: number) {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setSlots((prev) => prev.filter((s) => s.recipeId !== id));
    try {
      const res = await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      setError('Could not delete that recipe.');
    }
  }

  async function addIngredientToRecipe(
    recipeId: number,
    fields: { name: string; quantity: string }
  ) {
    try {
      const res = await fetch(`/api/recipes/${recipeId}/ingredients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeId
            ? { ...r, ingredients: [...r.ingredients, created] }
            : r
        )
      );
    } catch {
      setError('Could not add that ingredient.');
    }
  }

  async function updateIngredient(
    id: number,
    fields: { name?: string; quantity?: string | null }
  ) {
    setRecipes((prev) =>
      prev.map((r) => ({
        ...r,
        ingredients: r.ingredients.map((i) =>
          i.id === id ? { ...i, ...fields } : i
        ),
      }))
    );
    try {
      const res = await fetch(`/api/recipe-ingredients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error();
    } catch {
      setError('Could not save that ingredient.');
    }
  }

  async function deleteIngredient(id: number) {
    setRecipes((prev) =>
      prev.map((r) => ({
        ...r,
        ingredients: r.ingredients.filter((i) => i.id !== id),
      }))
    );
    try {
      const res = await fetch(`/api/recipe-ingredients/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
    } catch {
      setError('Could not delete that ingredient.');
    }
  }

  return (
    <section className="bg-white/60 border border-line rounded-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-serif text-lg text-ink flex items-center gap-2">
          <ChefHat size={16} className="text-accent" />
          Meal plan
        </h3>
        <button
          onClick={() => setManagingRecipes(true)}
          className="text-xs text-accent hover:underline flex items-center gap-1"
        >
          <BookOpen size={12} /> Manage recipes
        </button>
      </div>

      {error && (
        <p className="text-xs text-warn mb-2" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink/40 italic">Loading…</p>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="min-w-[40rem] w-full text-left">
            <thead>
              <tr>
                <th className="text-[10px] uppercase tracking-wide text-ink/35 pb-2 w-20" />
                {days.map((date, i) => (
                  <th
                    key={date}
                    className="text-[10px] uppercase tracking-wide text-ink/35 pb-2 font-medium px-1"
                  >
                    {DAY_LABELS[i]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map((mealType) => (
                <tr key={mealType} className="border-t border-line">
                  <td className="text-xs text-ink/50 py-2 pr-2 align-top">
                    {MEAL_LABELS[mealType]}
                  </td>
                  {days.map((date) => {
                    const slot = slotFor(date, mealType);
                    return (
                      <td key={date} className="py-2 px-1 align-top">
                        {slot ? (
                          <div className="group bg-accentSoft/50 rounded-sm px-2 py-1.5 relative">
                            <p className="text-xs text-ink/85 leading-snug pr-3">
                              {slot.recipeName}
                            </p>
                            {slot.recipeCalories != null && (
                              <p className="text-[10px] text-ink/45 mt-0.5">
                                {slot.recipeCalories} cal
                              </p>
                            )}
                            <button
                              onClick={() => clearSlot(slot)}
                              aria-label="Clear meal"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-ink/30 hover:text-warn transition-opacity"
                            >
                              <X size={11} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setPicking({ date, mealType })}
                            aria-label={`Add ${mealType} for this day`}
                            className="w-full h-9 rounded-sm border border-dashed border-line hover:border-accent text-ink/25 hover:text-accent flex items-center justify-center transition-colors"
                          >
                            <Plus size={13} />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {picking && (
        <RecipePickerModal
          recipes={recipes}
          onClose={() => setPicking(null)}
          onSelect={(recipeId) => setMeal(picking.date, picking.mealType, recipeId)}
          onCreateRecipe={createRecipe}
        />
      )}

      {managingRecipes && (
        <RecipeLibraryModal
          recipes={recipes}
          onClose={() => setManagingRecipes(false)}
          onUpdateRecipe={updateRecipe}
          onDeleteRecipe={deleteRecipe}
          onAddIngredient={addIngredientToRecipe}
          onUpdateIngredient={updateIngredient}
          onDeleteIngredient={deleteIngredient}
        />
      )}
    </section>
  );
}
