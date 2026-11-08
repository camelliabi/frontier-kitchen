import type { GameState, Ingredient } from '@frontier/game-core';
import { importedIngredients, legacyMaterial } from './cookingData';
export * from './cookingData';
export const ingredients: readonly Ingredient[] = [
  legacyMaterial('mushroom', 'Mushroom', 5, 'Item_Mushroom_E'),
  legacyMaterial('potato', 'Potato', 3),
  legacyMaterial('carrot', 'Carrot', 3, 'Item_PlantGet_M'),
  legacyMaterial('fish', 'Fish', 12, 'Item_FishGet_A'),
  legacyMaterial('milk', 'Milk', 6, 'Item_Material_05'),
  legacyMaterial('radish', 'Radish', 2, 'Item_PlantGet_B'),
  legacyMaterial('tomato', 'Tomato', 4),
  legacyMaterial('cabbage', 'Cabbage', 5),
  legacyMaterial('pumpkin', 'Pumpkin', 8, 'Item_Fruit_J'),
  ...importedIngredients,
];
export const village = { id: 'village', name: 'Valley Village', restaurantName: 'Frontier Kitchen', width: 1600, height: 1100, spawn: { x: 780, y: 630 } } as const;
export const kitchen = { id: 'kitchen', name: 'Kitchen', width: 1000, height: 720, spawn: { x: 500, y: 460 } } as const;
export function createInitialState(): GameState {
  return { worldTime: 480, money: 100, inventory: ingredients.map(item => ({ ingredientId: item.id, quantity: 5 })), player: { sceneId: kitchen.id, ...kitchen.spawn }, restaurant: { isOpen: false }, dishes: [], cookedInventory: [], recipes: [], menu: [], cookingSeed: 137 };
}


