import React from 'react';
import { GitBranch, FileCode, CheckCircle2, ShieldAlert, Cpu, Sparkles, Terminal } from 'lucide-react';

export const RoadmapView: React.FC = () => {
  const phases = [
    {
      phase: 'Fáze 1 (Právě navrženo & Připraveno k zahájení)',
      title: 'Core Engine & Minimal Skeleton',
      scope: 'Základní jádro, ModuleRegistry, EventBus, TimeModule, Hierarchický strom světa (World -> Continent -> City -> NPC), základní entity model a God API Level 1.',
      status: 'Ready for Implementation',
      isCurrent: true,
      deliverables: [
        'SimulationEngine + EventBus (pub/sub s prioritami)',
        'ModuleRegistry s lifecycle metodami (initialize, onTick, exportState)',
        'TimeModule s ovládáním rychlosti (1x, 10x, 3600x, step)',
        'WorldHierarchy strom s testovacími daty 1 města a 20 NPC',
        'God API Level 1 (Inspirace myšlenky, uzdravení, blesk)',
        'Interaktivní vizuální dashboard'
      ]
    },
    {
      phase: 'Fáze 2',
      title: 'Agent Decision Engine & Dynamic Needs',
      scope: 'Maslowova dynamická hierarchie, autonomní rozhodovací cyklus (Utility AI / GOAP), vyhledávání jídla, spánek, kovářství, řemesla.',
      status: 'Planned',
      isCurrent: false,
      deliverables: [
        'NpcDecisionModule s akčními stavy a spotřebou energie',
        'Dynamický hlad a únava v reálném čase',
        'Biologický životní cyklus (stárnutí, přirozené úmrtí, narození)'
      ]
    },
    {
      phase: 'Fáze 3',
      title: 'Vztahy, Rodiny, Cechy & Skupiny',
      scope: 'Sociální graf sympatií, nepřátelství, partnerství, vznik rodin, zakládání řemeslných cechů a God API Level 2–3.',
      status: 'Planned',
      isCurrent: false,
      deliverables: [
        'RelationshipModule se sociálním grafem',
        'Skupinová dynamika a kolektivní rozhodování',
        'God API Level 2 (Vztahy) a Level 3 (Skupiny/Cechy)'
      ]
    },
    {
      phase: 'Fáze 4',
      title: 'Event System & Světové Události',
      scope: 'Generátor autonomních dynamických krizí, slavností, epidemií, kaskádové šíření paniky v komunitách.',
      status: 'Planned',
      isCurrent: false,
      deliverables: [
        'EventSystemModule s kaskádovou propagací',
        'Historická kronika světa (World Chronicle Log)',
        'God API Level 4 (Města) & Level 5 (Regionální klima)'
      ]
    },
    {
      phase: 'Fáze 5+',
      title: 'Ekonomika, Společnost & Globální Božské Éry',
      scope: 'Výroba a trh se surovinami, měna, politické systémy států, náboženství a God API Level 6–7.',
      status: 'Planned',
      isCurrent: false,
      deliverables: [
        'EconomyModule (trh, poptávka, nabídka)',
        'SocietyModule (zákony, ideologie, stabilita vlád)',
        'God API Level 6–7 (Dynastie, Zlatý věk, Potopa světa)'
      ]
    }
  ];

  return (
    <div id="roadmap-view" className="space-y-6">
      {/* Header */}
      <div id="roadmap-header" className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <GitBranch className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Implementační Plán & Git Workflow</h2>
            <p className="text-sm text-slate-400">
              Postupný vývoj po malých, izolovaných fázích optimalizovaný pro AI Studio Free Limit
            </p>
          </div>
        </div>
      </div>

      {/* AI Free Limit Rules Banner */}
      <div className="p-5 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-start gap-4 text-xs">
        <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-1 text-slate-300">
          <h3 className="font-bold text-amber-300 text-sm">
            Strategie pro vývoj v AI Studio s Free Limitem
          </h3>
          <p className="leading-relaxed">
            Každá fáze je striktně modulární. Nikdy se nepřepisují hotové soubory, nové funkce se přidávají jako samostatné moduly v <code className="text-amber-300 font-mono">/src/modules/</code>. Před každou implementací se analyzuje existující kód, čímž se minimalizuje spotřeba tokenů a riziko regrese.
          </p>
        </div>
      </div>

      {/* Phases Timeline */}
      <div className="space-y-4">
        {phases.map((item, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-xl border transition-all ${
              item.isCurrent
                ? 'bg-slate-900 border-indigo-500/50 shadow-xl shadow-indigo-950/20 ring-1 ring-indigo-500/30'
                : 'bg-slate-900/60 border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-wider block">
                  {item.phase}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{item.title}</h3>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded font-mono font-semibold self-start ${
                  item.isCurrent
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {item.status}
              </span>
            </div>

            <p className="text-xs text-slate-300 my-3 leading-relaxed">{item.scope}</p>

            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Klíčové Výstupy Fáze:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {item.deliverables.map((del, dIdx) => (
                  <div
                    key={dIdx}
                    className="p-2.5 bg-slate-950/60 rounded border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2"
                  >
                    <CheckCircle2
                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                        item.isCurrent ? 'text-indigo-400' : 'text-slate-500'
                      }`}
                    />
                    <span>{del}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Git Workflow & Audit Standards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <Terminal className="w-4 h-4" />
            Pravidla Git Commitů (Conventional Commits)
          </div>
          <div className="space-y-1.5 text-xs text-slate-300 font-mono">
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <span className="text-emerald-400">feat(core):</span> implement typed event bus
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <span className="text-emerald-400">feat(npc):</span> add big-five personality model
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <span className="text-emerald-400">feat(divine):</span> add god level 1 intervention
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-800">
              <span className="text-amber-400">docs(adr):</span> add ADR 0001 for modular microkernel
            </div>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <FileCode className="w-4 h-4" />
            Architektura Rozhodování (ADR Standard)
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Každá klíčová architektonická změna je ukládána do <code className="text-purple-300 font-mono">/docs/adr/</code> s povinnou strukturou:
          </p>
          <ul className="space-y-1 text-xs text-slate-300">
            <li className="flex items-center gap-2">
              <span className="text-purple-400 font-bold">•</span>
              <span><strong>Status:</strong> Proposed / Accepted / Superseded</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-400 font-bold">•</span>
              <span><strong>Context:</strong> Motivace a popis problému</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-400 font-bold">•</span>
              <span><strong>Decision:</strong> Zvolené technické řešení</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-purple-400 font-bold">•</span>
              <span><strong>Consequences:</strong> Pozitivní i negativní dopady</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
