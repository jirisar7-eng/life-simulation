# Life Simulation — Simulation Runtime Architecture (Phase 1B)

## 1. Přehled a Účel Runtimu

Simulační runtime (`SimulationEngine`) představuje centrální mikrojádro, které koordinuje deterministický běh simulace života. Runtime je striktně oddělen od prezentační vrstvy (UI), externích databází a síťových protokolů. 

Všechny subsystémy (NPC agenti, vztahy, ekonomika, svět, hráčská božská moc) komunikují s runtime výhradně přes:
- **ModuleRegistry**: Registr a lifecycle zásuvných modulů.
- **EventBus**: Asynchronní typovaný Pub/Sub systém událostí.
- **SimulationClock**: Jediný deterministický zdroj simulačního času (bez závislosti na `Date.now()`).
- **Runtime Snapshot**: Neměnný (deep-frozen) read-only export stavu simulace.

---

## 2. Stavový Automat (Simulation Lifecycle)

Simulace se nachází vždy v jednom ze tří striktně definovaných stavů:

```
                  ┌─────────┐
                  │ STOPPED │
                  └────┬────┘
                       │ start()
                       ▼
                  ┌─────────┐
    ┌────────────►│ RUNNING │◄────────────┐
    │             └────┬────┘             │
    │ resume()         │ pause()          │
    │                  ▼                  │
    │             ┌─────────┐             │
    └─────────────┤ PAUSED  │             │
                  └────┬────┘             │
                       │                  │
                       │ stop()           │ stop()
                       ▼                  ▼
                  ┌───────────────────────┐
                  │        STOPPED        │
                  └───────────────────────┘
```

### Přechody stavového automatu:

1. `stopped` → `start()` → `running`:
   - Spustí `ModuleRegistry.initializeAll(context)` v pořadí topologických závislostí.
   - Nastaví status na `running`.
   - Publikuje událost `simulation.started`.
   - Vrací `true`.

2. `running` → `pause()` → `paused`:
   - Nastaví status na `paused`.
   - Publikuje událost `simulation.paused`.
   - Vrací `true`.

3. `paused` → `resume()` → `running`:
   - Nastaví status na `running`.
   - Publikuje událost `simulation.resumed`.
   - Vrací `true`.

4. `running` / `paused` → `stop()` → `stopped`:
   - Spustí `ModuleRegistry.shutdownAll()` v obráceném pořadí závislostí.
   - Nastaví status na `stopped`.
   - Publikuje událost `simulation.stopped`.
   - Vrací `true`.

### Bezpečné odmítnutí neplatných přechodů:
- `start()` při stavu `running` nebo `paused` je bezpečně odmítnut (vrací `false`).
- `pause()` při stavu `stopped` nebo `paused` je bezpečně odmítnut (vrací `false`).
- `resume()` při stavu `stopped` nebo `running` je bezpečně odmítnut (vrací `false`).
- `stop()` při stavu `stopped` je bezpečně odmítnut (vrací `false`).

---

## 3. Tick Execution Pipeline

Každé zavolání `advanceTick(deltaTicks = 1)` projde přesně třemi sekvenčními fázemi:

```
[ advanceTick() ]
       │
       ▼
1. BEGIN_TICK
   ├── SimulationClock.advance(deltaTicks)
   ├── Publikace 'simulation.tick.started'
   │
       ▼
2. PROCESS_MODULES
   ├── Získání seřazených modulů z ModuleRegistry (topologický sort)
   ├── Pro každý aktivní modul (enabled !== false):
   │     └── module.onTick(tickInfo, engineContext)
   │
       ▼
3. END_TICK
   ├── Nastavení fáze ticku na END_TICK
   ├── Publikace 'simulation.tick.completed'
   └── Návrat ISimulationTick
```

---

## 4. Běhové Režimy (Manual vs. Budoucí Automatic Mode)

Simulace definuje enum/typ `SimulationMode = 'manual' | 'automatic'`:

### A. MANUAL Mode (Výchozí v Phase 1B)
- Simulace čeká na explicitní zavolání `advanceTick(n)`.
- Každé volání provede přesně `n` diskrétních simulačních kroků.
- Žádný interval ani časovač na pozadí neblokuje hlavní vlákno.
- Zaručuje 100% determinismus, ideální pro unit testy, krokování a ladění.

### B. AUTOMATIC Mode (Architektonická příprava)
- V budoucích fázích umožní připojení adaptivního herního smyčkovače (např. `requestAnimationFrame` v prohlížeči nebo `setInterval` na headless serveru).
- Rozhraní `setMode('automatic')`, `isManual()` a `isAutomatic()` je již v mikrojádru plně připraveno.

---

## 5. Module Lifecycle & Závislosti

Každý zásuvný modul implementuje rozhraní `ISimulationModule`:

```typescript
export interface ISimulationModule {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly dependencies?: string[];
  enabled?: boolean;

  initialize?(context: IEngineContext): Promise<void> | void;
  onTick?(tick: ISimulationTick, context: IEngineContext): void;
  shutdown?(): Promise<void> | void;
}
```

- **Topologické řazení:** Moduly s definovanými `dependencies` jsou automaticky řazeny tak, aby závislosti proběhly před závislými moduly.
- **Aktivace / Deaktivace:** `moduleRegistry.enable(id)` / `moduleRegistry.disable(id)`. Deaktivovaný modul je v `onTick` vynechán, aniž by došlo k porušení registru.
- **Izolace chyb:** Pokud modul vyhodí výjimku v `onTick`, jádro ji bezpečně zachytí a zaloguje, aniž by došlo ke kolapsu celé simulace.

---

## 6. Event Flow (Pub/Sub)

Jádro generuje následující standardizované události přes `EventBus`:

| Typ Události | Kdy vzniká | Klíčový Payload |
|---|---|---|
| `simulation.started` | Při úspěšném `start()` | `{ id, name, tick }` |
| `simulation.paused` | Při úspěšném `pause()` | `{ id, tick }` |
| `simulation.resumed` | Při úspěšném `resume()` | `{ id, tick }` |
| `simulation.stopped` | Při úspěšném `stop()` | `{ id, finalTick }` |
| `simulation.tick.started` | Na začátku `advanceTick()` (BEGIN_TICK) | `{ tick, simulationTime, deltaSeconds, phase }` |
| `simulation.tick.completed` | Na konci `advanceTick()` (END_TICK) | `{ tick, simulationTime, deltaSeconds, phase }` |

---

## 7. Runtime Snapshot

Metoda `sim.getSnapshot()` vrací hluboce zmrazený (`Object.freeze`), read-only objekt `ISimulationSnapshot`:

```typescript
export interface ISimulationSnapshot {
  readonly id: string;
  readonly name: string;
  readonly status: SimulationStatus;
  readonly mode: SimulationMode;
  readonly currentTick: number;
  readonly simulationTime: Readonly<SimulationTime>;
  readonly activeModules: ReadonlyArray<IModuleSnapshot>;
  readonly world: Readonly<IWorldState>;
  readonly timestampTick: number;
}
```

Snapshot zabraňuje neoprávněné mutaci vnitřního stavu jádra z UI nebo externích systémů.
