
import { create } from 'zustand';
import { GameState, HuntRecord, WeatherType, ScentPoint } from '../types';

interface BloodPoint {
  position: [number, number, number];
  timestamp: number;
}

interface GameStore {
  gameState: GameState;
  score: number;
  ammo: number;
  stamina: number;
  weather: WeatherType;
  totalHunted: number;
  huntLog: HuntRecord[];
  activeAnimalsCount: number;
  isTrackerVision: boolean;
  isAimAssistEnabled: boolean;
  scentTrails: ScentPoint[];
  bloodTrails: BloodPoint[]; // New tracking for wounded animals
  
  // Character Movement & Action States
  isCrouching: boolean;
  isProne: boolean;
  isAiming: boolean;
  joystickMove: { x: number; y: number };
  
  // Triggers for syncing UI -> Physical logic
  jumpTriggered: number;
  shootTriggered: number;

  // AI & Game State
  generatedImage: string | null;
  isAiLoading: boolean;
  aiStatus: string;
  strategyResponse: string | null;
  
  setGameState: (state: GameState) => void;
  addScore: (points: number) => void;
  recordHunt: (record: HuntRecord) => void;
  useAmmo: () => void;
  reloadAmmo: () => void;
  setAnimalsCount: (count: number) => void;
  setStamina: (stamina: number) => void;
  setWeather: (weather: WeatherType) => void;
  setTrackerVision: (active: boolean) => void;
  setAimAssist: (enabled: boolean) => void;
  addScentPoint: (point: ScentPoint) => void;
  addBloodPoint: (point: BloodPoint) => void; // New action
  cleanOldTrails: () => void;
  
  // Control Setters
  setPosture: (posture: 'standing' | 'crouching' | 'prone') => void;
  setAiming: (aiming: boolean) => void;
  setJoystickMove: (vec: { x: number; y: number }) => void;
  triggerJump: () => void;
  triggerShoot: () => void;

  setAiLoading: (loading: boolean, status?: string) => void;
  setGeneratedImage: (img: string | null) => void;
  setStrategyResponse: (resp: string | null) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  gameState: GameState.MENU,
  score: 0,
  ammo: 10,
  stamina: 100,
  weather: 'clear',
  totalHunted: 0,
  huntLog: [],
  activeAnimalsCount: 0,
  isTrackerVision: false,
  isAimAssistEnabled: true,
  scentTrails: [],
  bloodTrails: [],
  
  isCrouching: false,
  isProne: false,
  isAiming: false,
  joystickMove: { x: 0, y: 0 },
  jumpTriggered: 0,
  shootTriggered: 0,

  generatedImage: null,
  isAiLoading: false,
  aiStatus: '',
  strategyResponse: null,

  setGameState: (gameState) => set({ gameState }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  recordHunt: (record) => set((state) => ({ 
    huntLog: [record, ...state.huntLog],
    totalHunted: state.totalHunted + 1
  })),
  useAmmo: () => set((state) => ({ ammo: Math.max(0, state.ammo - 1) })),
  reloadAmmo: () => set({ ammo: 10 }),
  setAnimalsCount: (count) => set({ activeAnimalsCount: count }),
  setStamina: (stamina) => set({ stamina: Math.max(0, Math.min(100, stamina)) }),
  setWeather: (weather) => set({ weather }),
  setTrackerVision: (isTrackerVision) => set({ isTrackerVision }),
  setAimAssist: (isAimAssistEnabled) => set({ isAimAssistEnabled }),
  addScentPoint: (point) => set((state) => ({ 
    scentTrails: [...state.scentTrails.slice(-1000), point] 
  })),
  addBloodPoint: (point) => set((state) => ({ 
    bloodTrails: [...state.bloodTrails.slice(-500), point] 
  })),
  cleanOldTrails: () => set((state) => {
    const now = Date.now();
    return { 
      scentTrails: state.scentTrails.filter(p => now - p.timestamp < 30000),
      bloodTrails: state.bloodTrails.filter(p => now - p.timestamp < 60000) 
    };
  }),

  setPosture: (posture) => set({ 
    isCrouching: posture === 'crouching', 
    isProne: posture === 'prone' 
  }),
  setAiming: (isAiming) => set({ isAiming }),
  setJoystickMove: (joystickMove) => set({ joystickMove }),
  triggerJump: () => set((state) => ({ jumpTriggered: state.jumpTriggered + 1 })),
  triggerShoot: () => set((state) => ({ shootTriggered: state.shootTriggered + 1 })),

  setAiLoading: (isAiLoading, aiStatus = '') => set({ isAiLoading, aiStatus }),
  setGeneratedImage: (generatedImage) => set({ generatedImage }),
  setStrategyResponse: (strategyResponse) => set({ strategyResponse }),
}));
