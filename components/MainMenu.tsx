
import React from 'react';
import { Play, Settings, Trophy, ShieldCheck } from 'lucide-react';

interface MainMenuProps {
  onStart: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[#050505]">
      {/* Background Visual Element */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center max-w-4xl w-full px-6 text-center">
        <div className="mb-2 text-emerald-500 font-bebas text-2xl tracking-[0.5em] animate-pulse">
          OPEN WORLD HUNTING SIMULATOR
        </div>
        <h1 className="text-8xl md:text-[10rem] font-bebas text-white leading-none tracking-tighter mb-12 drop-shadow-2xl">
          WILD<span className="text-emerald-500">HUNTER</span>
        </h1>

        <div className="grid md:grid-cols-2 gap-8 w-full mb-16">
          <div className="flex flex-col items-center bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:border-emerald-500/50 transition-colors group">
            <h2 className="text-3xl font-bebas text-white mb-4 tracking-wider">SINGLE PLAYER</h2>
            <p className="text-white/60 text-sm mb-8 leading-relaxed">
              Venture into the deep evergreen forest. Track diverse wildlife, manage your ammunition, and become a master tracker in our vast open-world environment.
            </p>
            <button 
              onClick={onStart}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bebas text-2xl rounded-xl transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
            >
              <Play className="fill-current" /> BEGIN HUNT
            </button>
          </div>

          <div className="flex flex-col items-center justify-center gap-4">
             <div className="flex w-full gap-4">
               <button className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bebas text-xl text-white transition-all flex items-center justify-center gap-2">
                 <Trophy className="w-5 h-5" /> TROPHIES
               </button>
               <button className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bebas text-xl text-white transition-all flex items-center justify-center gap-2">
                 <Settings className="w-5 h-5" /> SETTINGS
               </button>
             </div>
             
             <div className="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-left">
               <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4" /> Hunter's Code
               </h3>
               <ul className="text-white/60 text-xs space-y-2 font-medium">
                 <li>• Track animals carefully by watching their behavior.</li>
                 <li>• Aim for the body for a clean take-down.</li>
                 <li>• Conserve ammo; reload with 'R' when safe.</li>
                 <li>• Large bears require multiple shots to neutralize.</li>
               </ul>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-white/30 text-[10px] tracking-[0.2em] uppercase font-bold">
          <span>v1.0.4 PROTOTYPE</span>
          <span className="w-1 h-1 bg-white/20 rounded-full" />
          <span>THREE.JS ENGINE</span>
          <span className="w-1 h-1 bg-white/20 rounded-full" />
          <span>GEMINI AI ENHANCED</span>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
