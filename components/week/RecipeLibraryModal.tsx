'use client';

import { useState } from 'react';
import { X, Plus, Trash2, ChevronLeft, Pencil } from 'lucide-react';
import type { RecipeDTO } from '@/lib/types';

export default function RecipeLibraryModal({
  recipes,
  onClose,
  onUpdateRecipe,
  onDeleteRecipe,
  onAddIngredient,
  onUpdateIngredient,
  onDeleteIngredient,
}: {
  recipes: RecipeDTO[];
  onClose: () => void;
  onUpdateRecipe: (
    id: number,
    fields: { name?: string; calories?: number | null }
  ) => Promise<void>;
  onDeleteRecipe: (id: number) => Promise<void>;
  onAddIngredient: (
    recipeId: number,
    fields: { name: string; quantity: string }
  ) => Promise<void>;
  onUpdateIngredient: (
    id: number,
    fields: { name?: string; quantity?: string | null }
  ) => Promise<void>;
  onDeleteIngredient: (id: number) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newIngredient, setNewIngredient] = useState({ name: '', quantity: '' });
  const editing = recipes.find((r) => r.id === editingId) ?? null;

  async function handleAddIngredient() {
    if (!editing || !newIngredient.name.trim()) return;
    await onAddIngredient(editing.id, newIngredient);
    setNewIngredient({ name: '', quantity: '' });
  }

  return (
    <div
      className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-paper border border-line rounded-sm max-w-lg w-full max-h-[85vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-ink flex items-center gap-2">
            {editing && (
              <button
                onClick={() => setEditingId(null)}
                aria-label="Back to recipe list"
                className="text-ink/40 hover:text-ink"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            {editing ? editing.name || 'Edit recipe' : 'Recipe library'}
          </h2>
          <button onClick={onClose} aria-label="Close" className="text-ink/40 hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {!editing ? (
          recipes.length === 0 ? (
            <p className="text-sm text-ink/40 italic">
              No recipes yet — add one from the Meal plan grid.
            </p>
          ) : (
            <ul className="space-y-1">
              {recipes.map((r) => (
                <li
                  key={r.id}
                  className="group flex items-center gap-2 px-2 py-2 rounded-sm border border-line bg-white/50"
                >
                  <span className="flex-1 text-sm text-ink/85">{r.name}</span>
                  {r.calories != null && (
                    <span className="text-xs text-ink/40">{r.calories} cal</span>
                  )}
                  <button
                    onClick={() => setEditingId(r.id)}
                    aria-label="Edit recipe"
                    className="text-ink/40 hover:text-accent"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => onDeleteRecipe(r.id)}
                    aria-label="Delete recipe"
                    className="text-ink/30 hover:text-warn"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <div>
            <input
              value={editing.name}
              onChange={(e) => onUpdateRecipe(editing.id, { name: e.target.value })}
              placeholder="Recipe name"
              className="w-full border border-line rounded-sm px-2.5 py-2 text-sm mb-2 bg-transparent focus:border-accent focus:outline-none"
            />
            <input
              type="number"
              value={editing.calories ?? ''}
              onChange={(e) =>
                onUpdateRecipe(editing.id, {
                  calories: e.target.value ? Number(e.target.value) : null,
                })
              }
              placeholder="Calories (optional)"
              className="w-full border border-line rounded-sm px-2.5 py-2 text-sm mb-3 bg-transparent focus:border-accent focus:outline-none"
            />

            <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">
              Ingredients
            </p>
            <div className="space-y-1.5 mb-2">
              {editing.ingredients.map((ing) => (
                <div key={ing.id} className="flex items-center gap-1.5">
                  <input
                    value={ing.name}
                    onChange={(e) =>
                      onUpdateIngredient(ing.id, { name: e.target.value })
                    }
                    className="flex-1 border-b border-line pb-1 text-sm bg-transparent focus:border-accent focus:outline-none"
                  />
                  <input
                    value={ing.quantity ?? ''}
                    onChange={(e) =>
                      onUpdateIngredient(ing.id, { quantity: e.target.value })
                    }
                    placeholder="Qty"
                    className="w-20 border-b border-line pb-1 text-sm bg-transparent placeholder:text-ink/35 focus:border-accent focus:outline-none"
                  />
                  <button
                    onClick={() => onDeleteIngredient(ing.id)}
                    aria-label="Remove ingredient"
                    className="text-ink/30 hover:text-warn flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-1.5 mb-4">
              <input
                value={newIngredient.name}
                onChange={(e) =>
                  setNewIngredient((prev) => ({ ...prev, name: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()}
                placeholder="New ingredient"
                className="flex-1 border-b border-line pb-1 text-sm bg-transparent placeholder:text-ink/35 focus:border-accent focus:outline-none"
              />
              <input
                value={newIngredient.quantity}
                onChange={(e) =>
                  setNewIngredient((prev) => ({ ...prev, quantity: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && handleAddIngredient()}
                placeholder="Qty"
                className="w-20 border-b border-line pb-1 text-sm bg-transparent placeholder:text-ink/35 focus:border-accent focus:outline-none"
              />
              <button
                onClick={handleAddIngredient}
                aria-label="Add ingredient"
                className="text-accent hover:text-ink flex-shrink-0"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              onClick={() => setEditingId(null)}
              className="text-sm text-accent hover:underline"
            >
              Done editing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
