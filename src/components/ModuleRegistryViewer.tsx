import React, { useState } from 'react';
import { MODULES_DATA } from '../data/architectureData';
import { Box, CheckCircle2, Radio, Zap, ArrowRight, Code } from 'lucide-react';

export const ModuleRegistryViewer: React.FC = () => {
  const [selectedModuleId, setSelectedModuleId] = useState<string>('core-engine');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const categories = ['All', 'Core', 'World & Hierarchy', 'Agent & Behavior', 'Systems', 'Player & Divine'];

  const filteredModules = filterCategory === 'All'
    ? MODULES_DATA
    : MODULES_DATA.filter((m) => m.category === filterCategory);

  const activeModule = MODULES_DATA.find((m) => m.id === selectedModuleId) || MODULES_DATA[0];

  return (
    <div id="module-registry-viewer" className="space-y-6">
      {/* Header */}
      <div id="registry-header" className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <Box className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Module Registry & Micro-Kernel</h2>
            <p className="text-sm text-slate-400">
              Modulární architektura se zásuvnými doménovými moduly a čistým Event Bus rozhraním
            </p>
          </div>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterCategory === cat
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Modules split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Module Cards Grid */}
        <div className="lg:col-span-6 space-y-2">
          {filteredModules.map((mod) => {
            const isSelected = mod.id === selectedModuleId;
            return (
              <button
                key={mod.id}
                onClick={() => setSelectedModuleId(mod.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-lg ring-1 ring-emerald-400/20'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100">{mod.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {mod.category}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                      mod.status.includes('Phase 1')
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {mod.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{mod.description}</p>
              </button>
            );
          })}
        </div>

        {/* Selected Module Specification Card */}
        <div className="lg:col-span-6 space-y-5">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-5">
            <div className="border-b border-slate-800 pb-4 flex justify-between items-start">
              <div>
                <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-mono font-bold rounded">
                  {activeModule.category}
                </span>
                <h3 className="text-xl font-bold text-white mt-2">{activeModule.name}</h3>
                <span className="text-xs text-slate-400 font-mono block mt-0.5">
                  ID: {activeModule.id}
                </span>
              </div>
              <span className="text-xs px-2.5 py-1 bg-slate-800 text-slate-300 font-mono rounded">
                {activeModule.status}
              </span>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed">{activeModule.description}</p>

            {/* Services & Dependencies */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Poskytované Služby
                </span>
                <div className="space-y-1">
                  {activeModule.providedServices.map((srv, i) => (
                    <code key={i} className="block text-slate-200 font-mono text-[11px] bg-slate-900 px-2 py-1 rounded">
                      {srv}
                    </code>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-lg space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <ArrowRight className="w-3.5 h-3.5" /> Požadované Závislosti
                </span>
                <div className="space-y-1">
                  {activeModule.dependencies.length > 0 ? (
                    activeModule.dependencies.map((dep, i) => (
                      <code key={i} className="block text-slate-200 font-mono text-[11px] bg-slate-900 px-2 py-1 rounded">
                        {dep}
                      </code>
                    ))
                  ) : (
                    <span className="text-slate-500 italic text-[11px]">Nezávislý základní modul</span>
                  )}
                </div>
              </div>
            </div>

            {/* Event Bus Subscriptions & Broadcasts */}
            <div className="space-y-3 pt-2">
              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5" /> Odebírané Události (Listens to)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeModule.listensToEvents.map((evt, i) => (
                    <span key={i} className="text-[11px] font-mono px-2 py-0.5 bg-sky-950/50 text-sky-300 rounded border border-sky-900/40">
                      {evt}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> Publikované Události (Emits)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activeModule.emitsEvents.map((evt, i) => (
                    <span key={i} className="text-[11px] font-mono px-2 py-0.5 bg-purple-950/50 text-purple-300 rounded border border-purple-900/40">
                      {evt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
