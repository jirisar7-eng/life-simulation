import React, { useState } from 'react';
import { User, Heart, Brain, Clock, ShieldCheck, Zap, Award } from 'lucide-react';
import { AGENT_MODEL_SECTIONS } from '../data/architectureData';

export const AgentModelInspector: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schema' | 'live-demo'>('live-demo');

  // Interactive demo state of a sample agent
  const [hunger, setHunger] = useState(25);
  const [energy, setEnergy] = useState(70);
  const [safety, setSafety] = useState(85);
  const [faith, setFaith] = useState(0.85);

  const getNeedColor = (val: number, inverse = false) => {
    const effective = inverse ? 100 - val : val;
    if (effective >= 70) return 'bg-emerald-500';
    if (effective >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div id="agent-model-inspector" className="space-y-6">
      {/* Header with mode toggles */}
      <div id="agent-header" className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Model Autonomního Agenta (NPC)</h2>
              <p className="text-sm text-slate-400">
                Živá bytost s psychologií, emocemi, Maslowovými potřebami a vlastní historií
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1 bg-slate-950 border border-slate-800 rounded-lg self-start">
            <button
              id="btn-agent-demo"
              onClick={() => setActiveTab('live-demo')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'live-demo'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Živý Inspektor Agenta
            </button>
            <button
              id="btn-agent-schema"
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'schema'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Technické Schéma Modulů
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'live-demo' ? (
        <div id="live-agent-dossier" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Identity & Personality */}
          <div className="lg:col-span-4 space-y-6">
            {/* Identity Card */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-indigo-950 border-2 border-indigo-500/50 flex items-center justify-center text-indigo-400 font-bold text-lg">
                  EV
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Eldrin Valerius</h3>
                  <p className="text-xs text-slate-400">Mistr Kovář • Město Novograd</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
                <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px] uppercase">Věk</span>
                  <span className="font-semibold text-slate-200">34 let (Dospělý)</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px] uppercase">Stav</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Žije (Zdravý)
                  </span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px] uppercase">Bohatství</span>
                  <span className="font-semibold text-amber-400">142 Zlatých</span>
                </div>
                <div className="p-2 bg-slate-950/60 rounded border border-slate-800/80">
                  <span className="text-slate-400 block text-[10px] uppercase">Cech / Rodina</span>
                  <span className="font-semibold text-slate-200">Cech Kovářů</span>
                </div>
              </div>
            </div>

            {/* Big-5 Personality Card */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Osobnostní Profil (Big Five)
                </h3>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Otevřenost (Openness)</span>
                    <span className="font-mono text-purple-300">82 %</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '82%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Svědomitost (Conscientiousness)</span>
                    <span className="font-mono text-purple-300">74 %</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '74%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Extraverze (Extraversion)</span>
                    <span className="font-mono text-purple-300">45 %</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Přívětivost (Agreeableness)</span>
                    <span className="font-mono text-purple-300">88 %</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Stabilita vs Neuroticismus</span>
                    <span className="font-mono text-purple-300">75 % vyrovnaný</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Víra v Boha (Hráče)
                    </span>
                    <span className="font-mono text-amber-300">{Math.round(faith * 100)} %</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${faith * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column: Dynamic Maslow Needs & Decision Loop */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Dynamické Potřeby (Reálný Čas)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Interaktivní simulace</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Hlad (0 = sytý, 100 = hladoví)</span>
                    <span className="font-mono text-slate-200">{hunger} / 100</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${getNeedColor(hunger, true)}`} style={{ width: `${hunger}%` }}></div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={hunger}
                    onChange={(e) => setHunger(Number(e.target.value))}
                    className="w-full mt-1 accent-indigo-500 h-1 bg-slate-800 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Energie & Odpočinek</span>
                    <span className="font-mono text-slate-200">{energy} / 100</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${getNeedColor(energy)}`} style={{ width: `${energy}%` }}></div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={energy}
                    onChange={(e) => setEnergy(Number(e.target.value))}
                    className="w-full mt-1 accent-indigo-500 h-1 bg-slate-800 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Pocit Bezpečí</span>
                    <span className="font-mono text-slate-200">{safety} / 100</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${getNeedColor(safety)}`} style={{ width: `${safety}%` }}></div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={safety}
                    onChange={(e) => setSafety(Number(e.target.value))}
                    className="w-full mt-1 accent-indigo-500 h-1 bg-slate-800 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Evaluated Action from Decision Engine */}
              <div className="mt-4 p-3.5 bg-slate-950/80 border border-indigo-900/40 rounded-lg space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Výstup Utility-AI Rozhodovacího Systému
                </span>
                <p className="text-xs text-slate-200">
                  {hunger > 70 ? (
                    <span className="text-rose-300 font-semibold">
                      Kritická priorita: Jít do městské tržnice a koupit chléb (Hlad &gt; 70).
                    </span>
                  ) : energy < 30 ? (
                    <span className="text-amber-300 font-semibold">
                      Vysoká priorita: Jít do rodinného domu a spát (Energie &lt; 30).
                    </span>
                  ) : (
                    <span className="text-emerald-300 font-semibold">
                      Běžná činnost: Kování mečů v cechovní dílně pro export do hlavního města.
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Current Goal & Intent */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Dlouhodobé Cíle & Schopnosti
              </h3>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-300">Kovářství (Blacksmithing)</span>
                  <span className="font-mono text-amber-400 font-bold">Úroveň 85 / 100</span>
                </div>
                <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-300">Obchodní vyjednávání</span>
                  <span className="font-mono text-sky-400 font-bold">Úroveň 60 / 100</span>
                </div>
                <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-300">Vedení lidí</span>
                  <span className="font-mono text-purple-400 font-bold">Úroveň 42 / 100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Memory Stream & Life Chronicle */}
          <div className="lg:col-span-3 space-y-6">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Životní Kronika Agenta
                </h3>
              </div>

              <div className="space-y-3 border-l-2 border-slate-800 pl-3 text-xs">
                <div className="relative">
                  <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-900"></span>
                  <span className="text-[10px] text-slate-400 block font-mono">Dnes (Věk 34)</span>
                  <p className="text-slate-200 mt-0.5">Přijal velkou zakázku od králova posla na 50 kovaných štítů.</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-slate-900"></span>
                  <span className="text-[10px] text-slate-400 block font-mono">Před 2 lety (Věk 32)</span>
                  <p className="text-slate-200 mt-0.5">Svatba s Lilianou. Založení nové domácnosti v severní čtvrti.</p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-slate-900"></span>
                  <span className="text-[10px] text-slate-400 block font-mono">Před 8 lety (Věk 26)</span>
                  <p className="text-slate-200 mt-0.5">
                    Zažil božské zjevení během noční bouře (Víra v Boha vzrostla o +40 %).
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-slate-600 ring-4 ring-slate-900"></span>
                  <span className="text-[10px] text-slate-400 block font-mono">Věk 0</span>
                  <p className="text-slate-400 mt-0.5">Narozen v osadě Starý Les v rodině uhlíře.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Technical Schema Tab */
        <div id="agent-schema-view" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {AGENT_MODEL_SECTIONS.map((sec) => (
            <div key={sec.key} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
              <h3 className="font-bold text-white text-base">{sec.title}</h3>
              <p className="text-xs text-slate-400">{sec.description}</p>
              <div className="space-y-2 pt-2 border-t border-slate-800">
                {sec.fields.map((f, i) => (
                  <div key={i} className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80 text-xs">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-mono text-indigo-300 font-semibold">{f.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{f.type}</span>
                    </div>
                    <p className="text-slate-300 text-[11px] mb-1">{f.description}</p>
                    <div className="text-[10px] text-emerald-400 font-mono bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-900/30">
                      Příklad: {f.sampleValue}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
