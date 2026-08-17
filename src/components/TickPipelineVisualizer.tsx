import React, { useState } from 'react';
import { Play, Pause, FastForward, Clock, Cpu, RefreshCw, Layers } from 'lucide-react';

export const TickPipelineVisualizer: React.FC = () => {
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  const [selectedSpeed, setSelectedSpeed] = useState<string>('1x');

  const tickPhases = [
    {
      phaseNumber: 1,
      title: '1. TIME & CALENDAR STEP',
      responsibleModule: 'TimeModule',
      description: 'Inkrementace simulačních sekund, minut, dnů a ročních období. Validace časových triggerů.',
      cost: 'Low (~0.1ms)',
      emits: 'TIME_SECOND_TICK, TIME_DAY_PASSED'
    },
    {
      phaseNumber: 2,
      title: '2. DIVINE & PLAYER QUEUE',
      responsibleModule: 'DivineInterventionModule',
      description: 'Zpracování fronty božských zásahů hráče (požehnání, blesky, zázraky, vnuknutí cílů).',
      cost: 'Variable (~0.5ms)',
      emits: 'DIVINE_INTERVENTION_APPLIED'
    },
    {
      phaseNumber: 3,
      title: '3. ENVIRONMENT & RESOURCE SHIFT',
      responsibleModule: 'WorldHierarchyModule',
      description: 'Aktualizace stavu počasí, teploty, obnovy přírodních zdrojů (úroda, voda, lesy).',
      cost: 'Medium (~1.2ms)',
      emits: 'WEATHER_STATE_CHANGED, RESOURCE_DEPLETED'
    },
    {
      phaseNumber: 4,
      title: '4. AGENT DECISION & ACTION (LoD Tiered)',
      responsibleModule: 'NpcAgentModule + NpcDecisionModule',
      description: 'Výpočet potřeb, emocí a cílů. Tier 1 (plný výpočet), Tier 2 (odlehčený), Tier 3 (statistická makro-agregace).',
      cost: 'Heavy (~8-15ms)',
      emits: 'NPC_NEED_CRITICAL, NPC_ACTION_STARTED'
    },
    {
      phaseNumber: 5,
      title: '5. EVENT PROPAGATION & CONFLICTS',
      responsibleModule: 'EventSystemModule',
      description: 'Vyhodnocení interakcí mezi agenty, sociálních konfliktů, narození, sňatků a úmrtí.',
      cost: 'Medium (~2.5ms)',
      emits: 'RELATIONSHIP_ALTERED, NPC_BORN, NPC_DIED'
    },
    {
      phaseNumber: 6,
      title: '6. TELEMETRY & OBSERVER SYNC',
      responsibleModule: 'ObserverModule & PersistenceModule',
      description: 'Příprava diferenciálních snapshotů pro UI, logování do historické kroniky, periodický autosave.',
      cost: 'Low (~0.8ms)',
      emits: 'OBSERVER_STATE_READY, SAVE_COMPLETED'
    }
  ];

  return (
    <div id="tick-pipeline-visualizer" className="space-y-6">
      {/* Header */}
      <div id="pipeline-header" className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 rounded-lg text-sky-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Simulation Tick Systém & Pipeline</h2>
              <p className="text-sm text-slate-400">
                Deterministické zpracování diskrétních simulačních kroků a škálování rychlosti
              </p>
            </div>
          </div>

          {/* Time Controls Simulation Widget */}
          <div className="flex items-center gap-2 bg-slate-950 p-2 border border-slate-800 rounded-xl">
            <button
              onClick={() => setSelectedSpeed('PAUSE')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedSpeed === 'PAUSE' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
            <button
              onClick={() => setSelectedSpeed('1x')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedSpeed === '1x' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5" /> 1x (Real-time)
            </button>
            <button
              onClick={() => setSelectedSpeed('10x')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedSpeed === '10x' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FastForward className="w-3.5 h-3.5" /> 10x
            </button>
            <button
              onClick={() => setSelectedSpeed('3600x')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedSpeed === '3600x' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FastForward className="w-3.5 h-3.5" /> 3600x (Generace)
            </button>
          </div>
        </div>
      </div>

      {/* 6-Phase Pipeline Step View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            Fáze provádění jednoho ticku (Klikněte na fázi pro detail)
          </h3>

          <div className="space-y-2">
            {tickPhases.map((phase, idx) => {
              const isSelected = idx === activePhaseIndex;
              return (
                <button
                  key={phase.phaseNumber}
                  onClick={() => setActivePhaseIndex(idx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-sky-950/40 border-sky-500/50 text-white shadow-lg shadow-sky-950/30 ring-1 ring-sky-400/20'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                        isSelected ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {phase.phaseNumber}
                    </span>
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">{phase.title}</h4>
                      <span className="text-xs text-sky-400/80 font-mono">{phase.responsibleModule}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{phase.cost}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Phase Details & LoD Architecture */}
        <div className="lg:col-span-6 space-y-5">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs px-2.5 py-1 bg-sky-500/20 text-sky-300 font-mono font-bold rounded">
                Detail Fáze {tickPhases[activePhaseIndex].phaseNumber}
              </span>
              <h3 className="text-lg font-bold text-white mt-2">
                {tickPhases[activePhaseIndex].title}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Zodpovědný modul:{' '}
                <code className="text-sky-400 font-mono">
                  {tickPhases[activePhaseIndex].responsibleModule}
                </code>
              </p>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">
              {tickPhases[activePhaseIndex].description}
            </p>

            <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Vyvolávané Události</span>
              <div className="text-xs font-mono text-emerald-400">
                {tickPhases[activePhaseIndex].emits}
              </div>
            </div>
          </div>

          {/* Multi-Scale LoD Tier Box */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Layers className="w-4 h-4" />
              Multi-Scale Level of Detail (LoD) Škálování Výkonu
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
                <span className="text-emerald-400 font-bold block text-[11px]">Tier 1 (Detail)</span>
                <span className="text-slate-400 text-[10px] block">Do 500 sledovaných NPC</span>
                <p className="text-[11px] text-slate-300">Plný výpočet potřeb a emocí každý tick (1 Hz).</p>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
                <span className="text-amber-400 font-bold block text-[11px]">Tier 2 (Místní)</span>
                <span className="text-slate-400 text-[10px] block">Do 5 000 NPC v okolí</span>
                <p className="text-[11px] text-slate-300">Zjednodušený výpočet dominantních stavů každých 10 ticků.</p>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg space-y-1">
                <span className="text-purple-400 font-bold block text-[11px]">Tier 3 (Makro)</span>
                <span className="text-slate-400 text-[10px] block">100 000+ NPC ve světě</span>
                <p className="text-[11px] text-slate-300">Statistické rovnice porodnosti a spotřeby celých měst.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
