
export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  OVER = 'OVER'
}

export type WeatherType = 'clear' | 'foggy' | 'rainy' | 'stormy';

export type AnimalBehavior = 'wander' | 'alert' | 'flee' | 'idle';

export interface ScentPoint {
  position: [number, number, number];
  animalType: string;
  timestamp: number;
}

export interface Animal {
  id: string;
  type: 'deer' | 'wolf' | 'bear' | 'rabbit';
  position: [number, number, number];
  rotation: number;
  health: number;
  isDead: boolean;
  behavior: AnimalBehavior;
}

export interface HuntRecord {
  animalType: string;
  timestamp: number;
  distance: number;
  score: number;
}
