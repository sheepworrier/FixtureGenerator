import React, { useState } from 'react';
import { Player } from '../types';
import { Shuffle, Users, PlayCircle, RotateCcw } from 'lucide-react';

interface InputStageProps {
  onComplete: (players: Player[]) => void;
}

const InputStage: React.FC<InputStageProps> = ({ onComplete }) => {
  const [inputText, setInputText] = useState('');
  const [assignedPlayers, setAssignedPlayers] = useState<Player[]>([]);
  const [step, setStep] = useState<1 | 2>(1); // 1: Input, 2: Review

  const handleProcess = () => {
    const names = inputText
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length < 2) {
      alert("Please enter at least 2 players.");
      return;
    }

    // Generate random permutation of numbers 1 to N
    const n = names.length;
    const numbers = Array.from({ length: n }, (_, i) => i + 1);
    
    // Fisher-Yates Shuffle
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    const players: Player[] = names.map((name, index) => ({
      id: crypto.randomUUID(),
      name,
      number: numbers[index]
    })).sort((a, b) => a.number - b.number); // Sort by assigned number for display

    setAssignedPlayers(players);
    setStep(2);
  };

  const handleReset = () => {
    setAssignedPlayers([]);
    setStep(1);
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-6">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-2">
          Fixture<span className="text-indigo-500">Ball</span>
        </h1>
        <p className="text-slate-400 text-lg">
          Randomize your tournament draw with physics-based excitement.
        </p>
      </div>

      <div className="bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-700">
        {step === 1 ? (
          <div className="p-8">
            <div className="flex items-center gap-2 mb-4 text-indigo-400">
              <Users size={24} />
              <h2 className="text-xl font-bold">Step 1: Enter Players</h2>
            </div>
            <textarea
              className="w-full h-64 p-4 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none text-lg"
              placeholder="Paste list of names here...&#10;John Doe&#10;Jane Smith&#10;Alex Johnson"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleProcess}
                className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/20"
              >
                <Shuffle size={20} />
                Assign Numbers
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[600px]">
            <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
              <div className="flex items-center gap-2 text-emerald-400">
                <Shuffle size={24} />
                <h2 className="text-xl font-bold">Step 2: Review Assignments</h2>
              </div>
              <button 
                onClick={handleReset}
                className="text-slate-400 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors"
              >
                <RotateCcw size={16} /> Reset
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-900/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedPlayers.map((p) => (
                  <div key={p.id} className="flex items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-white shadow-md">
                      {p.number}
                    </div>
                    <span className="ml-4 font-medium text-slate-200 text-lg truncate">
                      {p.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-700 bg-slate-800 flex justify-end">
               <button
                onClick={() => onComplete(assignedPlayers)}
                className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/20 animate-pulse"
              >
                <PlayCircle size={24} />
                Start The Draw
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputStage;