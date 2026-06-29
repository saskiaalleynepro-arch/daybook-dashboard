'use client';

import { useState } from 'react';
import { X, Plus, Trash2, ChevronLeft } from 'lucide-react';
import type { RecipeDTO } from '@/lib/types';

export default function RecipePickerModal({
  recipes,
  onClose,
  onSelect,
  onCreateRecipe,
}: {
  recipes: RecipeDTO[];
  onClose: () => void;
  onSelect: (recipeId: number) => void;
  onCreateRecipe: (draft: {
    name: string;
    calories: number | null;
    ingredients: { name: string; quantity: string }[];
  }) => Promise<RecipeDTO>;
}) {
  const [mode, setMode] = useState<'pick' | 'create'>(
    recipes.length === 0 ? 'create' : 'pick'
  );
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [ingredients, setIngredients] = useState<
    { name: string; quantity: string }[]
  >([{ name: '', quantity: '' }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateIngredient(idx: number, field: 'name' | 'quantity', value: string) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === idx ? { ...ing, [field]: value } : ing))
    );
  }

  function addIngredientRow() {
    setIngredients((prev) => [...prev, { name: '', quantity: '' }]);
  }

  function removeIngredientRow(idx: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const created = await onCreateRecipe({
        name: name.trim(),
        calories: calories ? Number(calories) : null,
        ingredients: ingredients.filter((i) => i.name.trim()),
      });
      onSelect(created.id);
    } catch {
      setError('Could not save that recipe.');
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-paper border border-line rounded-sm max-w-md w-full max-h-[85vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-ink flex items-center gap-2">
            {mode === 'create' && recipes.length > 0 && (
              <button
                onClick={() => setMode('pick')}
                aria-label="Back to recipe list"
                className="text-ink/40 hover:text-ink"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            {mode === 'pick' ? 'Choose a meal' : 'New recipe'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-ink/40 hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="text-xs text-warn mb-3" role="alert">
            {error}
          </p>
        )}

        {mode === 'pick' ? (
          <div>
            <ul className="space-y-1 mb-4 max-h-72 overflow-y-auto">
              {recipes.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => onSelect(r.id)}
                    className="w-full text-left px-2.5 py-2 rounded-sm hover:bg-accentSoft/50 transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm text-ink/85">{r.name}</span>
                    {r.calories != null && (
                      <span className="text-xs text-ink/40">{r.calories} cal</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setMode('create')}
              className="text-sm text-accent hover:underline flex items-center gap-1"
            >
              <Plus size={14} /> New recipe
            </button>
          </div>
        ) : (
          <div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Recipe name"
              className="w-full border border-line rounded-sm px-2.5 py-2 text-sm mb-2 placeholder:text-ink/35 focus:border-accent focus:outline-none bg-transparent"
            />
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="Calories (optional)"
              className="w-full border border-line rounded-sm px-2.5 py-2 text-sm mb-3 placeholder:text-ink/35 focus:border-accent focus:outline-none bg-transparent"
            />

            <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">
              Ingredients
            </p>
            <div className="space-y-1.5 mb-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <input
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                    placeholder="Ingredient"
                    className="flex-1 border-b border-line pb-1 text-sm bg-transparent placeholder:text-ink/35 focus:border-accent focus:outline-none"
                  />
                  <input
                    value={ing.quantity}
                    onChange={(e) =>
                      updateIngredient(idx, 'quantity', e.target.value)
                    }
                    placeholder="Qty"
                    className="w-20 border-b border-line pb-1 text-sm bg-transparent placeholder:text-ink/35 focus:border-accent focus:outline-none"
                  />
                  <button
                    onClick={() => removeIngredientRow(idx)}
                    aria-label="Remove ingredient"
                    className="text-ink/30 hover:text-warn flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addIngredientRow}
              className="text-xs text-accent hover:underline flex items-center gap-1 mb-4"
            >
              <Plus size={12} /> Add ingredient
            </button>

            <button
              onClick={handleCreate}
              disabled={!name.trim() || saving}
              className="w-full bg-accent text-white rounded-sm py-2 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save and use this recipe'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
