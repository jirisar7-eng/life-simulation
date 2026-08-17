import React, { useState } from 'react';
import { HIERARCHY_LEVELS } from '../data/architectureData';
import { Layers, ArrowDown, ArrowUp, Shield, Users, Globe, MapPin, Building2, Home } from 'lucide-react';

export const HierarchyVisualizer: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('world');

  const selectedLevel = HIERARCHY_LEVELS.find((l) => l.id === selectedId) || HIERARCHY_LEVELS[0];

  const getIcon = (id: string) => {
    switch (id) {
      case 'world': return <Globe className="w-5 h-5 text-indigo-400" />;
      case 'continent': return <Layers className="w-5 h-5 text-sky-400" />;
      case 'region': return <MapPin className="w-5 h-5 text-emerald-400" />;
      case 'country': return <Shield className="w-5 h-5 text-amber-400" />;
      case 'city': return <Building2 className="w-5 h-5 text-rose-400" />;
      case 'community': return <Home className="w-5 h-5 text-purple-400" />;
      case 'group': return <Users className="w-5 h-5 text-teal-400" />;
      case 'npc': return <Users className="w-5 h-5 text-amber-300" />;
      default: return <Layers className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div id="hierarchy-visualizer-container" className="space-y-6">
      {/* Header */}
      <div id="hierarchy-header" className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100">Simulační Hierarchie Světa</h2>
            <p className="text-sm text-slate-400">
              Od makrokosmu celého světa až po atomárního autonomního agenta (NPC)
            </p>
          </div>
        </div>

        {/* Influence propagation summary banner */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-start gap-3">
            <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded mt-0.5">
              <ArrowDown className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Top-Down Propagace</span>
              <p className="text-xs text-slate-300 mt-1">
                Změny nahoře (např. válka na úrovni COUNTRY nebo sucho v REGION) kaskádovitě ovlivňují bezpečnost měst, ceny jídla a vyvolávají stres u jednotlivých NPC.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-start gap-3">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded mt-0.5">
              <ArrowUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Bottom-Up Propagace</span>
              <p className="text-xs text-slate-300 mt-1">
                Kolektivní stav dole (např. 80 % hladových NPC v CITY) vyvolá nepokoje v COMMUNITY a může svrhnout vládu na úrovni COUNTRY.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main interactive split view */}
      <div id="hierarchy-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tree Column */}
        <div id="hierarchy-tree-column" className="lg:col-span-5 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
            Hierarchické Uzly Stromu (Kliknutím prozkoumejte)
          </h3>
          <div className="space-y-1.5">
            {HIERARCHY_LEVELS.map((item, index) => {
              const isSelected = item.id === selectedId;
              return (
                <button
                  key={item.id}
                  id={`hierarchy-btn-${item.id}`}
                  onClick={() => setSelectedId(item.id)}
                  style={{ marginLeft: `${index * 12}px` }}
                  className={`w-[calc(100%-${index * 12}px)] text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-950/50 border-indigo-500/50 text-white shadow-lg shadow-indigo-950/30'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-950 rounded border border-slate-800">
                      {getIcon(item.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                          {item.level}
                        </span>
                        <span className="font-semibold text-sm">{item.title}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5 truncate max-w-[220px]">
                        {item.scaleDescription}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Level Details Card */}
        <div id="hierarchy-detail-card" className="lg:col-span-7">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-5 h-full">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800 rounded-lg">
                  {getIcon(selectedLevel.id)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono">
                      {selectedLevel.level}
                    </span>
                    <span className="text-xs text-slate-400">
                      Božský vliv: Level {selectedLevel.godInfluenceLevel}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">{selectedLevel.title}</h3>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Popis a rozsah
              </h4>
              <p className="text-sm text-slate-200 leading-relaxed">{selectedLevel.description}</p>
              <div className="mt-2 text-xs text-indigo-300 font-mono bg-indigo-950/40 p-2 rounded border border-indigo-900/50">
                Měřítko simulace: {selectedLevel.scaleDescription}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Klíčové Odpovědnosti
                </h4>
                <ul className="space-y-1.5">
                  {selectedLevel.responsibilities.map((resp, i) => (
                    <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-lg">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  Simulované Atributy
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedLevel.simulatedAttributes.map((attr, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-1 bg-slate-800/80 text-sky-300 rounded border border-slate-700 font-mono"
                    >
                      {attr}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800/80 rounded-lg text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Adresace v kódu: </span>
              <code className="text-indigo-400 font-mono">
                {`world.continent[cId].region[rId].country[ctId].city[cityId]...`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
