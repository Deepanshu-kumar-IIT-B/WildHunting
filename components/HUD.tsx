
import React, { useState, useRef } from 'react';
import { 
  Target, Shield, BookOpen, Wind, CloudRain, CloudFog, Sun, 
  Eye, Zap, Settings2, Sparkles, Image as ImageIcon, RefreshCw, 
  Wand2, BrainCircuit, MoveUp, User, Square, Maximize2, Crosshair, 
  Backpack, Plus, Radio, Wifi, Map as MapIcon, ChevronRight, Mic, Volume2,
  Clock, RotateCcw, LogOut
} from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { geminiService } from '../services/geminiService';

const HUD: React.FC = () => {
  const { 
    score, ammo, stamina, weather, huntLog, activeAnimalsCount, 
    totalHunted, isTrackerVision, isAimAssistEnabled, setAimAssist,
    generatedImage, setGeneratedImage, isAiLoading, setAiLoading, aiStatus,
    strategyResponse, setStrategyResponse,
    isCrouching, isProne, isAiming, setPosture, setAiming, triggerJump, triggerShoot, setJoystickMove
  } = useGameStore();
  
  const [showAiLab, setShowAiLab] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [activePreset, setActivePreset] = useState(1);
  
  // Joystick Logic
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const [isJoystickActive, setIsJoystickActive] = useState(false);

  const handleJoystick = (e: React.PointerEvent) => {
    if (!joystickRef.current || !joystickKnobRef.current) return;
    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;
    const distance = Math.min(60, Math.sqrt(dx * dx + dy * dy));
    const angle = Math.atan2(dy, dx);
    
    const finalX = Math.cos(angle) * distance;
    const finalY = Math.sin(angle) * distance;
    
    joystickKnobRef.current.style.transform = `translate(${finalX}px, ${finalY}px)`;
    setJoystickMove({ x: finalX / 60, y: -finalY / 60 });
  };

  const stopJoystick = () => {
    setIsJoystickActive(false);
    if (joystickKnobRef.current) joystickKnobRef.current.style.transform = 'translate(0, 0)';
    setJoystickMove({ x: 0, y: 0 });
  };

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between text-white font-sans select-none">
      
      {/* Top Header - Mini Map & Presets */}
      <div className="flex justify-between items-start">
        <div className="flex gap-4 pointer-events-auto">
          {/* Mini Map */}
          <div className="w-28 h-28 bg-black/40 backdrop-blur-md rounded-lg border border-white/20 relative overflow-hidden shadow-xl">
             <div className="absolute top-2 left-2 flex gap-1.5 opacity-60">
                <Mic size={14} />
                <Volume2 size={14} />
             </div>
             <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_emerald]" />
             <div className="absolute bottom-1 left-1 text-[8px] opacity-40 uppercase font-black">Forest Sector A</div>
          </div>
          
          {/* Preset Selector */}
          <div className="flex flex-col gap-2">
            <div className="bg-black/80 backdrop-blur-xl flex rounded overflow-hidden border border-white/10 shadow-lg">
               <button 
                 onClick={() => setActivePreset(1)}
                 className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${activePreset === 1 ? 'bg-orange-500 text-black' : 'hover:bg-white/5'}`}
               >
                 Preset 1
               </button>
               <button 
                 onClick={() => setActivePreset(2)}
                 className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all ${activePreset === 2 ? 'bg-orange-500 text-black' : 'hover:bg-white/5'}`}
               >
                 Preset 2
               </button>
            </div>
            <div className="flex gap-1">
               <button className="flex-1 bg-white/10 p-2 rounded hover:bg-white/20 transition-all"><LogOut size={14}/></button>
               <button className="flex-1 bg-white/10 p-2 rounded hover:bg-white/20 transition-all"><RotateCcw size={14}/></button>
            </div>
          </div>
        </div>

        {/* Center Top: Kill Feed */}
        <div className="bg-black/40 px-6 py-2 rounded-b-xl border border-t-0 border-white/10 flex items-center gap-3 text-xs font-bold pointer-events-auto">
           <span className="text-orange-400">STATUS:</span>
           <span>HUNTING</span>
           <div className="w-px h-4 bg-white/20" />
           <Clock size={14} className="text-white/40" />
           <span>12:30</span>
        </div>

        {/* Top Right: Stats & Settings */}
        <div className="flex flex-col items-end gap-3 pointer-events-auto">
           <div className="bg-black/60 px-4 py-2 rounded-lg border border-white/10 flex gap-6 items-center shadow-xl">
              <div className="flex flex-col items-center">
                 <span className="text-[9px] font-black opacity-40 uppercase">Alive</span>
                 <span className="text-xl font-bebas">{activeAnimalsCount}</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex flex-col items-center">
                 <span className="text-[9px] font-black opacity-40 uppercase">Kill</span>
                 <span className="text-xl font-bebas text-red-500">{totalHunted}</span>
              </div>
              <button className="ml-2 p-1.5 hover:bg-white/10 rounded transition-all"><Settings2 size={18} /></button>
           </div>
           {/* Weapon Card */}
           <div className="bg-gradient-to-br from-black/80 to-transparent p-4 rounded-xl border border-white/10 w-52 shadow-2xl">
              <div className="flex justify-between items-start mb-2">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black uppercase text-white/40">Active Weapon</span>
                   <span className="text-sm font-bold tracking-tight">RIFLE .30-06</span>
                 </div>
                 <div className="p-1.5 bg-emerald-500/20 rounded border border-emerald-500/40">
                    <Zap size={12} className="text-emerald-400" />
                 </div>
              </div>
              <div className="flex justify-end items-baseline gap-1">
                 <span className="text-5xl font-bebas tracking-tight leading-none">{ammo}</span>
                 <span className="text-lg opacity-20">/ 10</span>
              </div>
           </div>
        </div>
      </div>

      {/* Center Reticle is implicit from Player raycaster */}

      {/* Bottom Interface */}
      <div className="flex justify-between items-end pb-4">
        
        {/* Bottom Left: Joystick & Gear */}
        <div className="flex items-end gap-8 pointer-events-auto ml-4">
           <div className="flex flex-col gap-3">
              <button className="w-14 h-14 bg-black/60 rounded-full border-2 border-white/20 flex items-center justify-center hover:bg-white/10 shadow-lg"><Backpack size={24} /></button>
              <button className="w-14 h-14 bg-black/60 rounded-full border-2 border-white/20 flex items-center justify-center hover:bg-white/10 shadow-lg"><Plus size={24} className="text-emerald-400" /></button>
           </div>

           <div 
             ref={joystickRef}
             className="joystick-zone w-44 h-44 bg-white/5 backdrop-blur-sm rounded-full border-2 border-white/10 flex items-center justify-center relative shadow-inner cursor-pointer"
             onPointerDown={() => setIsJoystickActive(true)}
             onPointerMove={(e) => isJoystickActive && handleJoystick(e)}
             onPointerUp={stopJoystick}
             onPointerLeave={stopJoystick}
           >
              <div className="w-28 h-28 border border-white/5 rounded-full flex items-center justify-center">
                 <div ref={joystickKnobRef} className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full border-2 border-white/30 shadow-2xl transition-transform duration-75" />
              </div>
           </div>
        </div>

        {/* Bottom Center: Health & Quick Stats */}
        <div className="flex flex-col items-center gap-4 pointer-events-auto mb-4">
           <div className="w-96">
              <div className="flex justify-between text-[10px] font-black tracking-[0.2em] mb-1">
                 <span className="text-white/40 uppercase">Vitals Integrity</span>
                 <span className="text-emerald-400">HP 100/100</span>
              </div>
              <div className="h-1.5 w-full bg-black/60 rounded-full border border-white/10 overflow-hidden shadow-inner">
                 <div className="h-full bg-white transition-all duration-300" style={{ width: '100%' }} />
              </div>
           </div>
           {/* Stamina Bar */}
           <div className="w-64 h-1 bg-black/40 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${stamina < 30 ? 'bg-red-500' : 'bg-blue-400'}`} 
                style={{ width: `${stamina}%` }} 
              />
           </div>
        </div>

        {/* Bottom Right: FIRE & ACTIONS */}
        <div className="flex flex-col items-end gap-6 pr-4 pb-4">
           {/* Scope/Aim Button */}
           <button 
             onClick={() => setAiming(!isAiming)}
             className={`pointer-events-auto w-20 h-20 rounded-full border-4 flex items-center justify-center shadow-2xl transition-all ${isAiming ? 'bg-blue-600 border-white scale-110 shadow-blue-500/40' : 'bg-black/60 border-white/20'}`}
           >
              <Target size={36} />
           </button>

           <div className="flex items-end gap-6 pointer-events-auto">
              <div className="flex flex-col gap-4">
                 <button onClick={triggerJump} className="w-14 h-14 bg-white/10 rounded-full border-2 border-white/20 flex items-center justify-center active:bg-white active:text-black transition-all shadow-lg"><MoveUp size={24} /></button>
                 <button onClick={() => setPosture(isCrouching ? 'standing' : 'crouching')} className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all shadow-lg ${isCrouching ? 'bg-orange-500 border-white text-black' : 'bg-black/60 border-white/20'}`}><User size={22} className="scale-y-75 translate-y-1"/></button>
                 <button onClick={() => setPosture(isProne ? 'standing' : 'prone')} className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all shadow-lg ${isProne ? 'bg-orange-500 border-white text-black' : 'bg-black/60 border-white/20'}`}><Square size={22} className="scale-y-[0.4]"/></button>
              </div>

              {/* THE FIRE BUTTON - ONLY GUN FIRE SOURCE */}
              <button 
                onPointerDown={(e) => {
                  e.stopPropagation();
                  triggerShoot();
                }}
                className="w-36 h-36 bg-red-600 rounded-full border-[10px] border-white/10 flex items-center justify-center shadow-[0_0_60px_rgba(220,38,38,0.4)] active:scale-90 active:bg-red-500 transition-all cursor-pointer"
              >
                <div className="relative pointer-events-none">
                  <Crosshair size={72} className="text-white/30" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon size={28} className="text-white fill-current opacity-80" />
                  </div>
                </div>
              </button>
           </div>
        </div>
      </div>

      {/* AI Lab Access Button Overlay */}
      <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-auto">
         <button onClick={() => setShowAiLab(!showAiLab)} className="w-12 h-12 bg-emerald-500/20 backdrop-blur-md rounded-full border border-emerald-500/40 flex items-center justify-center hover:bg-emerald-500/40 transition-all shadow-lg">
            <Sparkles className="text-emerald-400" />
         </button>
      </div>

      {/* AI Terminal */}
      {showAiLab && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 bg-black/90 backdrop-blur-2xl rounded-3xl p-8 border-2 border-white/10 pointer-events-auto z-[300] shadow-[0_0_100px_rgba(0,0,0,0.8)]">
           <h3 className="text-3xl font-bebas text-emerald-400 mb-6 flex items-center gap-3">
             <Sparkles /> FOREST MASTER AI
           </h3>
           <div className="space-y-6">
              <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Image Generation Prompt</label>
                 <textarea 
                   rows={3}
                   placeholder="e.g. A pack of wolves hunting in moonlit fog..." 
                   value={imagePrompt} 
                   onChange={e => setImagePrompt(e.target.value)}
                   className="bg-white/5 border border-white/10 p-4 rounded-xl text-xs outline-none focus:border-emerald-500 transition-colors"
                 />
              </div>
              <button 
                onClick={() => { setAiLoading(true, 'Consulting Oracle...'); geminiService.generateHuntArt(imagePrompt).then(res => { setGeneratedImage(res); setAiLoading(false); }); }}
                className="w-full py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all active:scale-95"
              >
                Summon Vision
              </button>
              {generatedImage && <img src={generatedImage} className="w-full rounded-xl border border-white/10 shadow-lg" />}
              <button onClick={() => setShowAiLab(false)} className="w-full text-white/40 text-[10px] font-black uppercase tracking-widest hover:text-white pt-4">Exit Terminal</button>
           </div>
        </div>
      )}

      {/* AI Loading State */}
      {isAiLoading && (
        <div className="absolute inset-0 z-[400] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center">
           <RefreshCw className="w-16 h-16 text-emerald-500 animate-spin mb-6" />
           <span className="text-2xl font-bebas tracking-widest text-emerald-400 animate-pulse">{aiStatus}</span>
        </div>
      )}
    </div>
  );
};

export default HUD;
