
import React, { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stars, Environment, KeyboardControls } from '@react-three/drei';
import { GameState } from './types';
import GameScene from './components/GameScene';
import HUD from './components/HUD';
import MainMenu from './components/MainMenu';
import { useGameStore } from './store/useGameStore';
import { Key } from 'lucide-react';

const App: React.FC = () => {
  const { gameState, setGameState, setTrackerVision } = useGameStore();
  const [needsApiKey, setNeedsApiKey] = useState(false);

  const handleStartGame = async () => {
    if (typeof (window as any).aistudio !== 'undefined') {
       const hasKey = await (window as any).aistudio.hasSelectedApiKey();
       if (!hasKey) {
         setNeedsApiKey(true);
         return;
       }
    }
    setGameState(GameState.PLAYING);
  };

  const openKeyDialog = async () => {
    if (typeof (window as any).aistudio !== 'undefined') {
      await (window as any).aistudio.openSelectKey();
      setNeedsApiKey(false);
      setGameState(GameState.PLAYING);
    }
  };

  const handlePause = useCallback(() => {
    if (gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
    } else if (gameState === GameState.PAUSED) {
      setGameState(GameState.PLAYING);
    }
  }, [gameState, setGameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handlePause();
      if (e.key.toLowerCase() === 'v') setTrackerVision(true);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'v') setTrackerVision(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handlePause, setTrackerVision]);

  return (
    <div className="w-full h-full relative bg-[#050505] overflow-hidden">
      {needsApiKey && (
        <div className="absolute inset-0 z-[300] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center">
           <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/40">
              <Key className="w-10 h-10 text-emerald-400" />
           </div>
           <h2 className="text-4xl font-bebas text-white mb-4">API KEY REQUIRED</h2>
           <p className="text-white/60 max-w-md mb-8 leading-relaxed">
             To access the advanced AI Laboratory features, you must select a paid API key from a Google Cloud project.
           </p>
           <button 
             onClick={openKeyDialog}
             className="px-12 py-4 bg-emerald-500 text-black font-bold uppercase tracking-widest hover:bg-white transition-all rounded-full"
           >
             Select API Key
           </button>
        </div>
      )}

      <KeyboardControls
        map={[
          { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
          { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
          { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
          { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
          { name: 'jump', keys: ['Space'] },
          { name: 'run', keys: ['Shift'] },
          { name: 'aim', keys: ['m', 'M'] },
          { name: 'tracker', keys: ['v', 'V'] },
        ]}
      >
        <Canvas shadows camera={{ fov: 60, near: 0.1, far: 1000 }}>
          <Sky distance={450000} sunPosition={[0, 0.4, 1]} inclination={0} azimuth={0.25} />
          <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
          <Environment preset="forest" />
          
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[100, 100, 50]}
            intensity={1.5}
            castShadow
            shadow-camera-left={-150}
            shadow-camera-right={150}
            shadow-camera-top={150}
            shadow-camera-bottom={-150}
            shadow-camera-near={1}
            shadow-camera-far={300}
            shadow-mapSize={[2048, 2048]}
          />

          {gameState !== GameState.MENU && <GameScene />}
        </Canvas>
      </KeyboardControls>

      {gameState === GameState.MENU && <MainMenu onStart={handleStartGame} />}
      {gameState === GameState.PLAYING && <HUD />}
      {gameState === GameState.PAUSED && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
          <h1 className="text-8xl font-bebas text-white mb-8 tracking-[0.2em]">PAUSED</h1>
          <button 
            onClick={() => setGameState(GameState.PLAYING)}
            className="px-12 py-4 bg-emerald-500 text-black font-bold uppercase tracking-widest hover:bg-white transition-all duration-300 rounded-full"
          >
            Resume Hunting
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
