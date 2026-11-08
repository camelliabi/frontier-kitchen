import type { GameState } from '@frontier/game-core';
/** Future adapters provide storage; no browser or native API is required by game rules. */
export interface SaveData { readonly version: 1; readonly state: GameState }
export interface SaveStorage {
  load(slot: string): Promise<SaveData | null>;
  save(slot: string, data: SaveData): Promise<void>;
}
