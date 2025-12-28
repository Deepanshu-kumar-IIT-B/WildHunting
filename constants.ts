
export const WORLD_SIZE = 250;
export const TREE_COUNT = 800; // Increased for density
export const FOLIAGE_COUNT = 2500;
export const ANIMAL_SPAWN_LIMIT = 20; // Slightly more for a "living" world
export const PLAYER_SPEED = 0.12;
export const RUN_MULTIPLIER = 1.8;
export const SENSITIVITY = 0.005;

export const STAMINA_REGEN = 15;
export const STAMINA_DRAIN = 30;

export const DETECTION = {
  SIGHT_RANGE: 45,
  SCENT_RANGE: 18,
  HEARING_RANGE: {
    IDLE: 6,
    WALK: 18,
    RUN: 38
  },
  FOV: 0.65 // Slightly wider detection
};

// Use 'as const' to ensure animal types are treated as literal unions ('deer' | 'wolf' etc.) rather than generic strings
export const ANIMAL_TYPES = [
  { type: 'deer', health: 100, score: 50, color: '#8B4513', callFreq: 120 },
  { type: 'wolf', health: 80, score: 75, color: '#708090', callFreq: 400 },
  { type: 'bear', health: 300, score: 200, color: '#3D2B1F', callFreq: 80 },
  { type: 'rabbit', health: 20, score: 20, color: '#D2B48C', callFreq: 800 }
] as const;
