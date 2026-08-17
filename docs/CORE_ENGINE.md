# Core Engine Documentation — Life Simulation

## 1. Účel Core Engine (Purpose)
Core Engine představuje minimální, deterministické a na uživatelském rozhraní nezávislé jádro simulačního systému Life Simulation. Zajišťuje:
- Řízení diskrétního simulačního času nezávisle na reálném čase (`Date.now()`).
- Vykonávání tick pipeline (`BEGIN_TICK` -> `PROCESS_MODULES` -> `END_TICK`).
- Dynamický Module Registry s topologickým řazením závislostí.
- Typovaný Event Bus pro asynchronní i synchronní reaktivní komunikaci mezi systémy.
- Obecný entitní model (`IEntity`, `EntityManager`) připravený pro budoucí hierarchii (L1–L7).
- 100% determinismus zaručený seeded generátorem pseudonáhodných čísel (`RandomSource`).

---

## 2. Simulation State & Model (`SimulationEngine`)
Instance simulace spravuje celkový stav a koordinuje subsystémy:
- **`currentTick`**: Číslo aktuálního diskrétního ticku (začíná na `0`).
- **`simulationTime`**: Strukturovaný simulační čas (rok, měsíc, den, hodina, minuta, sekunda).
- **`status`**: Jeden ze stavů `'stopped' | 'running' | 'paused'`.
- **`world`**: Metadata a statistiky světa (`IWorldState`).

### Životní cyklus (Lifecycle)
1. `createSimulation(config)`: Inicializuje simulaci ve stavu `stopped`.
2. `startSimulation(sim)`: Spustí inicializaci všech povolených modulů (`initializeAll`) a přepne do stavu `running`. Publikuje `simulation.started`.
3. `pauseSimulation(sim)`: Pozastaví běh (`paused`), publikuje `simulation.paused`.
4. `resumeSimulation(sim)`: Obnoví běh (`running`), publikuje `simulation.resumed`.
5. `stopSimulation(sim)`: Vypne moduly (`shutdownAll`), přepne do `stopped` a publikuje `simulation.stopped`.
6. `advanceTick(sim, deltaTicks)`: Vykoná 1 nebo více diskrétních simulačních kroků.

---

## 3. Deterministic Clock (`SimulationClock`)
Simulační čas je striktně oddělen od reálného času:
- Čas plyne výhradně inkrementem diskrétních ticků.
- Výchozí konfigurace: 1 tick = 60 simulačních sekund (1 minuta).
- Podporuje kalendářní přepočty (hodiny, dny, měsíce, roky) bez plovoucích nepřesností.

---

## 4. Tick Pipeline (`ISimulationTick`)
Každý simulační krok prochází 3 fázemi:
1. **`BEGIN_TICK`**: Zvýšení čítače ticků, publikování události `simulation.tick.started`.
2. **`PROCESS_MODULES`**: Projití všech aktivních modulů v topologicky seřazeném pořadí závislostí a zavolání jejich metody `onTick(tick, context)`.
3. **`END_TICK`**: Uzavření ticku, publikování události `simulation.tick.completed`.

Do budoucna lze mezi fáze zapojit doménové systémy (Needs, Psychology, Economy, Society, Divine Interventions) bez nutnosti měnit jádro.

---

## 5. Module Registry (`ModuleRegistry` & `ISimulationModule`)
Modulární architektura umožňuje přidávat, odebírat, zapínat a vypínat herní systémy bez zásahu do Core Engine:

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

- **Topologické řazení**: Moduly jsou před spuštěním ticku seřazeny tak, aby prerekvizity běžely vždy před závislými moduly. Detekuje cyklické závislosti.
- **Engine Context**: Předává modulům přístup k `eventBus`, `random`, `clock` a vyhledávání ostatních modulů.

---

## 6. Typed Event Bus (`EventBus`)
Poskytuje bezpečný pub-sub kanál pro události simulace:
- **Základní systémové události**:
  - `simulation.started`
  - `simulation.paused`
  - `simulation.resumed`
  - `simulation.stopped`
  - `simulation.tick.started`
  - `simulation.tick.completed`
- **Podpora Wildcard (`*`)**: Umožňuje centrální logování nebo nahrávání replay streamu.
- **Čisté odhlašování**: `subscribe()` vrací funkci pro bezpečný unregister listeneru.

---

## 7. Entity System (`EntityManager` & `IEntity`)
Minimální obecný entitní kontejner s indexací podle typu:
- Každá entita má stabilní `EntityId`, `type`, `createdAtTick`, `tags` a `metadata`.
- `EntityType`: `'individual' | 'household' | 'group' | 'settlement' | 'region' | 'world' | 'item' | 'landmark' | 'custom'`.
- Připraveno pro budoucí škálování na desetitisíce entit (možnost ECS nebo spatial partitioningu ve fázi 3/4).

---

## 8. Determinismus & Seeded PRNG (`SeededRandom`)
- Žádný kód v simulačním jádře nesmí volat `Math.random()`.
- Veškeré stochastické jevy čerpají z rozhraní `RandomSource` (výchozí implementace Mulberry32).
- Zaručuje 100% replikovatelnost světa při zadání stejného seedu.

---

## 9. Hierarchie Světa (Skelet L1–L7)
V `/src/models/hierarchy.ts` jsou připravena typová rozhraní:
- `L7_WORLD`: Globální planeta a globální klima.
- `L6_REGION`: Geografický biom a regionální zdroje.
- `L5_SETTLEMENT`: Město / osada / tábor.
- `L4_COMMUNITY`: Společenství / řád / čtvrť.
- `L3_GROUP`: Cech / frakce / hlídka.
- `L2_HOUSEHOLD`: Domácnost / rodinná buňka.
- `L1_INDIVIDUAL`: Jednotlivý agent (NPC).

---

## 10. World Container (`WorldContainer`)
Doménová služba pro bezpečnou správu hierarchického stromu entit (`src/models/worldContainer.ts`):
- **Správa stromu**: `addEntity()`, `removeEntity()`, `getEntity()`, `getChildren()`, `getParent()`, `getRoot()`.
- **Validace integrity**:
  - Garance unikátního `EntityId`.
  - Ověření existence nadřazené entity (`parentId`).
  - Kontrola hierarchické nadřazenosti tierů (`L7_WORLD` -> `L6_REGION` -> `L5_SETTLEMENT` -> `L4_COMMUNITY` -> `L3_GROUP` -> `L2_HOUSEHOLD` -> `L1_INDIVIDUAL`).
  - Striktní detekce a zamezení cyklů ve stromu.
- **Čisté oddělení**: Neobsahuje žádnou simulační, tickovací, AI ani UI logiku.

---

## 11. World Query Service (`WorldQueryService`)
Read-only API vrstva pro bezpečné dotazování a inspekci hierarchie světa (`src/models/worldQuery.ts`):
- `getWorld()`: Vrátí kořenový uzel světa (`L7_WORLD`).
- `getEntity(id)`: Vrátí uzel libovolné hierarchické úrovně podle ID.
- `getChildren(id)`: Vrátí přímé potomky dané entity.
- `getParent(id)`: Vrátí přímého rodiče dané entity.
- `getDescendants(id)`: Rekurzivně vyhledá a vrátí všechny potomky pod danou entitou.
- **Striktní Read-Only**: Neprovádí žádné mutace, nezasahuje do simulačního cyklu ani UI.

---

## 12. Entity Repository & Persistence Layer
Abstraktní persistence rozhraní pro ukládání a načítání entit (`src/repositories/entityRepository.ts`):
- **Rozhraní (`IEntityRepository`)**: `getById(id)`, `getAll()`, `save(entity)`, `delete(id)`, `exists(id)`.
- **Implementace**:
  - `InMemoryEntityRepository`: Čistý in-memory adaptér pro runtime a testy bez externích závislostí.
  - `PrismaEntityRepository` (`src/repositories/prismaEntityRepository.ts`): PostgreSQL persistence adaptér využívající Prisma ORM.
- **Domain Separation (`EntityMapper`)**:
  - `EntityMapper.toDomain()`: Převod z Prisma schématu na čistý doménový model `IEntity`.
  - `EntityMapper.toPrisma()`: Převod z doménového modelu na Prisma data strukturu.
- **Oddělení vrstev**: Core Engine neobsahuje žádné přímé importy Prisma ani databázových závislostí.
