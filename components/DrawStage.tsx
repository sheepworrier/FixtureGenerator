import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, Fixture } from '../types';
import LotteryMachine from './LotteryMachine';
import { Trophy, ArrowRight, CheckCircle2 } from 'lucide-react';
import { DRAW_INTERVAL_MS } from '../constants';

interface DrawStageProps {
  initialPlayers: Player[];
  onReset: () => void;
}

const DrawStage: React.FC<DrawStageProps> = ({ initialPlayers, onReset }) => {
  const [remainingPlayers, setRemainingPlayers] = useState<Player[]>(initialPlayers);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [currentHome, setCurrentHome] = useState<Player | null>(null);
  const [lastDrawnNumber, setLastDrawnNumber] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawHistory, setDrawHistory] = useState<string[]>([]); // For logs or announcements

  // Calculate bracket structure
  const totalPlayers = initialPlayers.length;
  const { matchesNeeded } = useMemo(() => {
    if (totalPlayers < 2) return { matchesNeeded: 0 };
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(totalPlayers)));
    const byesNeeded = nextPowerOf2 - totalPlayers;
    const matchesNeeded = (totalPlayers - byesNeeded) / 2;
    return { matchesNeeded };
  }, [totalPlayers]);

  const drawPlayer = useCallback(() => {
    if (remainingPlayers.length === 0) {
      setIsDrawing(false);
      return;
    }

    // Pick random player from remaining
    const randomIndex = Math.floor(Math.random() * remainingPlayers.length);
    const drawn = remainingPlayers[randomIndex];
    
    // Update remaining players
    const newRemaining = [...remainingPlayers];
    newRemaining.splice(randomIndex, 1);
    setRemainingPlayers(newRemaining);

    // Trigger Visuals
    setLastDrawnNumber(drawn.number);
    
    // Determine Fixture Type
    // Count how many 'real' matches (not byes) are already created
    const matchesSoFar = fixtures.filter(f => f.away !== null).length;

    if (matchesSoFar < matchesNeeded) {
      // We are in the "Create Matches" phase
      if (currentHome) {
        // We have a Home player waiting, so this drawn player is Away
        setFixtures((prev) => [
          { id: crypto.randomUUID(), home: currentHome, away: drawn },
          ...prev
        ]);
        setDrawHistory(h => [`${drawn.name} drawn vs ${currentHome.name}`, ...h]);
        setCurrentHome(null); // Reset waiting player
      } else {
        // No one waiting, this player becomes Home
        setCurrentHome(drawn);
        setDrawHistory(h => [`${drawn.name} drawn as Home`, ...h]);
      }
    } else {
      // We have enough matches, the rest are Byes
      setFixtures((prev) => [
        { id: crypto.randomUUID(), home: drawn, away: null },
        ...prev
      ]);
      setDrawHistory(h => [`${drawn.name} receives a BYE!`, ...h]);
    }

  }, [remainingPlayers, fixtures, currentHome, matchesNeeded]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isDrawing && remainingPlayers.length > 0) {
      interval = setInterval(drawPlayer, DRAW_INTERVAL_MS);
    } else if (remainingPlayers.length === 0) {
      setIsDrawing(false);
    }
    return () => clearInterval(interval);
  }, [isDrawing, remainingPlayers.length, drawPlayer]);

  const toggleDraw = () => {
    // If starting for the first time or resuming
    if (remainingPlayers.length > 0) {
      setIsDrawing(!isDrawing);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="h-16 flex-none bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-20 shadow-md">
        <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                Live Draw
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">Fixture Generator</h1>
        </div>
        
        <div className="flex items-center gap-4">
             {/* Status Indicator */}
             <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
                <div className={`w-2.5 h-2.5 rounded-full ${isDrawing ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
                <span className="text-xs font-medium text-slate-400">
                    {isDrawing ? 'DRAWING IN PROGRESS' : remainingPlayers.length === 0 ? 'DRAW COMPLETED' : 'READY'}
                </span>
             </div>

            <button
                onClick={toggleDraw}
                disabled={remainingPlayers.length === 0}
                className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
                    isDrawing 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : remainingPlayers.length === 0 
                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                }`}
            >
                {isDrawing ? 'Pause' : remainingPlayers.length === 0 ? 'Finished' : 'Start Draw'}
            </button>
             <button onClick={onReset} className="text-slate-500 hover:text-white text-sm font-medium">Exit</button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        
        {/* Left Panel: Remaining Players */}
        <aside className="col-span-3 bg-slate-900 border-r border-slate-800 flex flex-col min-h-0">
            <div className="p-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10 backdrop-blur">
                <h2 className="text-sm uppercase tracking-wider font-bold text-slate-400 mb-1">Upcoming</h2>
                <div className="text-2xl font-light text-white">{remainingPlayers.length} <span className="text-base text-slate-500">players left</span></div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {remainingPlayers.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                        <span className="font-medium truncate">{p.name}</span>
                        <span className="flex-shrink-0 w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-xs font-mono text-slate-300">
                            {p.number}
                        </span>
                    </div>
                ))}
                {remainingPlayers.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-slate-600 pb-20">
                        <CheckCircle2 size={48} className="mb-2 opacity-50" />
                        <p>All players drawn</p>
                     </div>
                )}
            </div>
        </aside>

        {/* Center Panel: Animation */}
        <section className="col-span-6 flex flex-col bg-slate-950 relative">
             {/* Physics Container */}
             <div className="flex-1 flex items-center justify-center p-8 relative">
                 <div className="w-full max-w-[600px] h-[500px]">
                    <LotteryMachine 
                        players={initialPlayers} 
                        drawnNumber={lastDrawnNumber} 
                        isDrawing={isDrawing}
                        width={600} 
                        height={500} 
                    />
                 </div>
                 
                 {/* Overlay Current Action */}
                 <div className="absolute top-10 left-0 right-0 flex justify-center pointer-events-none">
                    {currentHome && (
                         <div className="bg-slate-900/90 backdrop-blur-md border border-indigo-500/50 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce-short">
                            <span className="text-slate-400 text-sm font-bold uppercase">Waiting for Opponent</span>
                            <div className="h-6 w-px bg-slate-600"></div>
                            <span className="text-indigo-400 font-bold text-lg">{currentHome.name}</span>
                         </div>
                    )}
                 </div>

                 {/* Last Event Toast */}
                 {drawHistory.length > 0 && (
                     <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
                         <div className="bg-slate-800/80 backdrop-blur border border-slate-600 px-4 py-2 rounded-full text-slate-300 text-sm shadow-lg">
                             {drawHistory[0]}
                         </div>
                     </div>
                 )}
             </div>
        </section>

        {/* Right Panel: Drawn Fixtures */}
        <aside className="col-span-3 bg-slate-900 border-l border-slate-800 flex flex-col min-h-0">
             <div className="p-4 border-b border-slate-800 bg-slate-900/95 sticky top-0 z-10 backdrop-blur">
                <h2 className="text-sm uppercase tracking-wider font-bold text-emerald-500 mb-1">Fixtures</h2>
                <div className="text-2xl font-light text-white">{fixtures.length} <span className="text-base text-slate-500">matches set</span></div>
            </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {fixtures.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-48 text-slate-600 mt-10">
                        <Trophy size={48} className="mb-2 opacity-50" />
                        <p>Ready to start...</p>
                     </div>
                 )}
                 {fixtures.map((f, i) => (
                     <div key={f.id} className="animate-[fadeIn_0.5s_ease-out] p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700 shadow-sm group hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center justify-between gap-2">
                             {/* Home */}
                             <div className="flex-1 min-w-0 text-center">
                                 <div className="text-xs text-slate-500 mb-1 font-mono">{f.home.number}</div>
                                 <div className="font-bold text-slate-200 truncate">{f.home.name}</div>
                             </div>

                             {/* VS */}
                             <div className="flex-none flex flex-col items-center justify-center px-2">
                                <span className="text-xs font-bold text-slate-600 bg-slate-950 px-2 py-1 rounded-full border border-slate-800">VS</span>
                             </div>

                             {/* Away */}
                             <div className="flex-1 min-w-0 text-center">
                                 {f.away ? (
                                    <>
                                        <div className="text-xs text-slate-500 mb-1 font-mono">{f.away.number}</div>
                                        <div className="font-bold text-slate-200 truncate">{f.away.name}</div>
                                    </>
                                 ) : (
                                    <div className="text-xs uppercase font-bold text-amber-500 bg-amber-500/10 py-1 px-2 rounded inline-block">BYE</div>
                                 )}
                             </div>
                        </div>
                     </div>
                 ))}
             </div>
        </aside>

      </main>
    </div>
  );
};

export default DrawStage;