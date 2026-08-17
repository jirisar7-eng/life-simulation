import React, { useState } from 'react';
import { GOD_LEVELS_DATA } from '../data/architectureData';
import { Eye, Zap, Sparkles, AlertTriangle } from 'lucide-react';

export const GodApiMatrix: React.FC = () => {
  const [selectedLevelNum, setSelectedLevelNum] = useState<number>(1);

  const currentLevel = GOD_LEVELS_DATA.find((l) => l.level === selectedLevelNum) || GOD_LEVELS_DATA[0];

  return (
    <div id="god-api-matrix" className="space-y-6">
      {/* Header */}
      <div id="god-header" className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Player / God API (7 Úrovní Božské Moci)</h2>
            <p className="text-sm text-slate-400">
              Postupná gradace vlivu hráče od pozorování duše jednotlivce až po přetváření kosmických ér
            </p>
          </div>
        </div>
      </div>

      {/* Level Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {GOD_LEVELS_DATA.map((lvl) => {
          const isSelected = lvl.level === selectedLevelNum;
          return (
            <button
              key={lvl.level}
              id={`btn-god-lvl-${lvl.level}`}
              onClick={() => setSelectedLevelNum(lvl.level)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-lg shadow-amber-950/20 ring-1 ring-amber-400/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Level {lvl.level}
              </div>
              <div className="font-semibold text-xs text-slate-100 truncate mt-0.5">
                {lvl.scope.split(' ')[0]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Level Deep Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Level Overview & Observation */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs px-2.5 py-1 bg-amber-500/20 text-amber-300 font-mono font-bold rounded">
                Úroveň {currentLevel.level} ze 7
              </span>
              <h3 className="text-lg font-bold text-white mt-2">{currentLevel.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{currentLevel.subtitle}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Eye className="w-4 h-4" />
                Pozorovací Schopnosti (Observer Mode)
              </div>
              <ul className="space-y-2">
                {currentLevel.observationCapabilities.map((cap, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-950/50 p-2.5 rounded border border-slate-800/80">
                    <span className="text-sky-400 font-bold">•</span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right: Divine Interventions / Miracles */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2 px-1">
            <Zap className="w-4 h-4" />
            Dostupné Božské Zásahy (Divine Actions)
          </h3>

          <div className="space-y-3">
            {currentLevel.interventions.map((action, i) => (
              <div
                key={i}
                className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3 transition-all hover:border-slate-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-white text-sm">{action.name}</h4>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-amber-950 text-amber-300 font-mono rounded border border-amber-900/50 self-start">
                    {action.energyCost}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">{action.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block uppercase">Cíl zásahu</span>
                    <span className="font-semibold text-slate-200">{action.target}</span>
                  </div>
                  <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block uppercase">Dopad na simulaci</span>
                    <span className="font-semibold text-emerald-300">{action.impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-400">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Všechny božské zásahy jsou odesílány jako události do <code className="text-indigo-400 font-mono">EventBus</code> v rámci fáze <code className="text-indigo-400 font-mono">DIVINE_QUEUE</code> simulačního ticku a trvale logovány do historické kroniky světa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
