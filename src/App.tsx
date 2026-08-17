import React, { useState } from 'react';
import { ActiveTab } from './types/architecture';
import { HierarchyVisualizer } from './components/HierarchyVisualizer';
import { AgentModelInspector } from './components/AgentModelInspector';
import { GodApiMatrix } from './components/GodApiMatrix';
import { TickPipelineVisualizer } from './components/TickPipelineVisualizer';
import { ModuleRegistryViewer } from './components/ModuleRegistryViewer';
import { RoadmapView } from './components/RoadmapView';
import { WorldMapViewport } from './components/WorldMapViewport';
import { GameView } from './components/GameView';
import { 
  Sparkles, 
  Layers, 
  User, 
  Clock, 
  Box, 
  GitBranch, 
  BookOpen, 
  Compass, 
  CheckCircle2, 
  Cpu,
  Eye,
  Shield,
  Gamepad2,
  Map as MapIcon,
  LayoutDashboard
} from 'lucide-react';

export default function App() {
  const [viewMode, setViewMode] = useState<'game' | 'architecture'>('game');
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const navItems = [
    { id: 'overview' as ActiveTab, label: 'Architektura & Přehled', icon: <Compass className="w-4 h-4" /> },
    { id: 'world-map' as ActiveTab, label: 'World Renderer (Mapa)', icon: <MapIcon className="w-4 h-4" /> },
    { id: 'hierarchy' as ActiveTab, label: 'Hierarchie Světa', icon: <Layers className="w-4 h-4" /> },
    { id: 'agent-model' as ActiveTab, label: 'Model Agenta (NPC)', icon: <User className="w-4 h-4" /> },
    { id: 'god-api' as ActiveTab, label: 'Player / God API', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'tick-pipeline' as ActiveTab, label: 'Tick Pipeline & Čas', icon: <Clock className="w-4 h-4" /> },
    { id: 'module-registry' as ActiveTab, label: 'Registr Modulů', icon: <Box className="w-4 h-4" /> },
    { id: 'roadmap' as ActiveTab, label: 'Roadmapa & Fáze 1', icon: <GitBranch className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Global Header Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-950/50">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-base sm:text-lg text-white tracking-tight">
                    LIFE SIMULATION
                  </h1>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/80 font-bold">
                    {viewMode === 'game' ? 'Game View' : 'Architecture Hub'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Modulární simulace života s absolutní rolí BOHA
                </p>
              </div>
            </div>

            {/* Mode Switcher Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
                <button
                  id="mode-toggle-game"
                  onClick={() => setViewMode('game')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'game'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Herní Pohled</span>
                </button>
                <button
                  id="mode-toggle-arch"
                  onClick={() => setViewMode('architecture')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'architecture'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Architecture Hub</span>
                </button>
              </div>
            </div>
          </div>

          {/* Architecture Navigation Tabs (Shown only when in architecture mode) */}
          {viewMode === 'architecture' && (
            <div className="flex space-x-1 overflow-x-auto scrollbar-none border-t border-slate-900 py-2">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-tab-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'game' ? (
          <GameView onOpenArchitectureHub={() => setViewMode('architecture')} />
        ) : (
          <>
            {activeTab === 'overview' && (
              <div id="overview-content" className="space-y-8">
                {/* Mission Statement Hero */}
                <div className="p-8 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
                    <BookOpen className="w-4 h-4" />
                    Technická Architektura Projektu
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Modulární simulace života s absolutní rolí BOHA
                  </h2>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-4xl">
                    Projekt je navržen pro neomezenou dlouhodobou rozšiřitelnost. Každý významný systém (svět, NPC, vztahy, ekonomika, události, božské zásahy) je nezávislým zásuvným modulem, který lze kdykoliv přidat, odebrat, vypnout nebo upravit bez zásahu do simulačního jádra.
                  </p>

                  <div className="pt-4 flex flex-wrap gap-3">
                    <button
                      onClick={() => setViewMode('game')}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-emerald-950/50"
                    >
                      <Gamepad2 className="w-4 h-4" /> Spustit Herní Pohled (World Map)
                    </button>
                    <button
                      onClick={() => setActiveTab('hierarchy')}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-indigo-950/50"
                    >
                      <Layers className="w-4 h-4" /> Prozkoumat Hierarchii Světa
                    </button>
                    <button
                      onClick={() => setActiveTab('god-api')}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-amber-950/50"
                    >
                      <Sparkles className="w-4 h-4" /> 7 Úrovní Božské Moci
                    </button>
                    <button
                      onClick={() => setActiveTab('roadmap')}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all"
                    >
                      <GitBranch className="w-4 h-4" /> Plán Fáze 1
                    </button>
                  </div>
                </div>

                {/* 3-Tier Layer Architecture Blueprint */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                    Třívrstvá Architektura Systému
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Layer 3: Presentation */}
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                      <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-lg text-purple-400 w-fit">
                        <Eye className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-white text-base">3. Prezentační Vrstva (UI)</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        React dashboard, telemetrický inspector, mapa světa, časová osa a Božský panel zásahů. Komunikuje výhradně přes odběry a God API.
                      </p>
                      <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-purple-300 space-y-1">
                        <div>• God Action Controller</div>
                        <div>• World Map Visualizer</div>
                        <div>• NPC Dossier Inspector</div>
                      </div>
                    </div>

                    {/* Layer 2: Core Engine & Modules */}
                    <div className="p-6 bg-slate-900 border border-indigo-500/30 rounded-xl space-y-3 shadow-lg shadow-indigo-950/20">
                      <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 w-fit">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-white text-base">2. Simulační Jádro & Moduly</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Micro-kernel složený z SimulationEngine, EventBus, ModuleRegistry a TimeModule. Zásuvné moduly (NPC, vztahy, ekonomika) jsou navzájem izolované.
                      </p>
                      <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-indigo-300 space-y-1">
                        <div>• Typed Pub/Sub Event Bus</div>
                        <div>• Module Registry & Lifecycle</div>
                        <div>• Multi-Scale LoD Tick Pipeline</div>
                      </div>
                    </div>

                    {/* Layer 1: Data & Persistence */}
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 w-fit">
                        <Shield className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-white text-base">1. Datová & Stavová Vrstva</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Hierarchický strom světa, atomární entity agentů, paměťový graf a serializátory pro snapshoty do IndexedDB / JSON.
                      </p>
                      <div className="pt-2 border-t border-slate-800 text-[11px] font-mono text-emerald-300 space-y-1">
                        <div>• Hierarchical World Tree</div>
                        <div>• Agent State Data Models</div>
                        <div>• Snapshot Persistence Drivers</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Core Architectural Pillars Matrix */}
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Klíčové Pilíře Návrhu
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1.5">
                      <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Plná Modularita
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Žádné tvrdé vazby mezi subsystémy. Každý modul lze za běhu odpojit nebo nahradit.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1.5">
                      <div className="text-sky-400 font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Deterministický Čas
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Simulace běží v diskrétních ticích od vteřin po tisíciletí s možností okamžitého krokování.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1.5">
                      <div className="text-purple-400 font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Multi-Scale LoD
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Detailní simulace pro pozorovaná NPC a agregovaná statistická makro-simulace pro zbytek světa.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-1.5">
                      <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        7 Božských Úrovní
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Hráč má k dispozici škálované nástroje od ovlivnění mysli 1 člověka po kosmické potopy.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'world-map' && (
              <div id="world-map-tab" className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-slate-800 rounded-2xl">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                      <MapIcon className="w-5 h-5 text-indigo-400" />
                      Grafický Renderer Světa (PixiJS 8.x WebGL)
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Interaktivní testovací scéna s deterministickým převodem souřadnic (WorldPosition ↔ ScreenPosition) a plynulým ovládáním kamery.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                      Tah myší: <strong className="text-indigo-300">Pan</strong>
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                      Kolečko: <strong className="text-emerald-300">Zoom</strong>
                    </span>
                  </div>
                </div>

                <WorldMapViewport />
              </div>
            )}

            {activeTab === 'hierarchy' && <HierarchyVisualizer />}
            {activeTab === 'agent-model' && <AgentModelInspector />}
            {activeTab === 'god-api' && <GodApiMatrix />}
            {activeTab === 'tick-pipeline' && <TickPipelineVisualizer />}
            {activeTab === 'module-registry' && <ModuleRegistryViewer />}
            {activeTab === 'roadmap' && <RoadmapView />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Life Simulation Engine • Repozitář <code className="text-slate-400 font-mono">jirisar7-eng/life-simulation</code></span>
          <span className="font-mono text-[11px] text-indigo-400">Architektura & Herní Pohled Odděleny</span>
        </div>
      </footer>
    </div>
  );
}
