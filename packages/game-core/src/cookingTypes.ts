export interface MaterialProperties {
  readonly actorId: string;
  readonly tags: readonly string[];
  readonly hp: number;
  readonly effect: string;
  readonly potency: number;
  readonly timeBoost: number;
  readonly hpBoost: number;
  readonly sellPrice: number;
  readonly buyPrice: number;
  readonly lowPrice: boolean;
  readonly boostSuccessRate: number;
  readonly canCook: boolean;
}
export interface RegularRule {
  readonly order: number; readonly result_id: string;
  readonly actors: readonly (readonly string[])[];
  readonly tags: readonly (readonly string[])[];
  readonly HB: number; readonly TB: number;
}
export interface SingleRule {
  readonly order: number; readonly result_id: string;
  readonly actors: readonly string[]; readonly tags: readonly string[];
  readonly HB: number; readonly TB: number; readonly Num: number;
}
export interface EffectParameters {
  readonly effect_id: string; readonly BT: number; readonly MR: number;
  readonly Ma: number; readonly Mi: number; readonly SSA: number;
}
export interface CookingRules {
  readonly Recipes: readonly RegularRule[];
  readonly SingleRecipes: readonly SingleRule[];
  readonly System: {
    readonly CEI: readonly EffectParameters[];
    readonly FA: string; readonly FCA: string; readonly MEA: string;
    readonly FALR: number; readonly SFALR: number; readonly LRMR: number;
    readonly NMMR: readonly number[]; readonly NMSSR: readonly number[]; readonly SSAET: number;
  };
  readonly names: Readonly<Record<string, string>>;
}
export interface CookingOptions {
  readonly seed?: number;
  readonly random?: () => number;
  readonly alwaysBoost?: boolean;
}
export interface CookingStats {
  readonly resultId: string;
  readonly effectId: string | null;
  readonly effectStrength: number;
  readonly rawEffectPoints: number;
  readonly recoveryHp: number;
  readonly durationSeconds: number;
  readonly fullRecovery: boolean;
  readonly bonusHearts: number;
  readonly staminaRecovery: number;
  readonly bonusStamina: number;
  readonly critical: boolean;
  readonly bonus: 'none' | 'recovery' | 'duration' | 'strength';
  readonly monsterExtract: boolean;
  readonly sellPrice: number;
}
export interface MaterialGroup { readonly material: MaterialProperties; readonly count: number }

export function nextCookingSeed(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}
export function seededRandom(seed: number): () => number {
  let current = seed >>> 0;
  return () => { current = nextCookingSeed(current); return current / 4294967296; };
}
