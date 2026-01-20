import React, { useState } from 'react';
import InputStage from './components/InputStage';
import DrawStage from './components/DrawStage';
import { Player, AppStage } from './types';

const App: React.FC = () => {
  const [stage, setStage] = useState<AppStage>(AppStage.INPUT);
  const [players, setPlayers] = useState<Player[]>([]);

  const handleInputComplete = (data: Player[]) => {
    setPlayers(data);
    setStage(AppStage.DRAW);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to exit? Current progress will be lost.")) {
      setPlayers([]);
      setStage(AppStage.INPUT);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {stage === AppStage.INPUT && (
        <div className="flex items-center justify-center min-h-screen">
          <InputStage onComplete={handleInputComplete} />
        </div>
      )}
      {stage === AppStage.DRAW && (
        <DrawStage initialPlayers={players} onReset={handleReset} />
      )}
    </div>
  );
};

export default App;