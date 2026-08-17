# ARCHITEKTURA PROJEKTU: LIFE SIMULATION ENGINE
*Technický architektonický návrh pro modulární simulaci života s rolí BOHA*

---

## 1. ZÁKLADNÍ ARCHITEKTONICKÝ RÁMEC

Projekt **Life Simulation** je postaven na principech **Data-Driven Architecture**, **Modular Micro-Kernel (Core + Plugins)** a **Event-Driven Reactive Simulation**.

### 1.1 Třívrstvá separace (Separation of Concerns)

```
┌─────────────────────────────────────────────────────────────────┐
│                    3. PREZENTAČNÍ VRSTVA (UI / Web)             │
│  - God Dashboard & Inspector (L1–L7)                            │
│  - Observer Viewers (World Map, City View, NPC Dossier)         │
│  - Time Controls & Event Feeds                                  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Subscriptions & God API Commands
┌───────────────────────────────▼─────────────────────────────────┐
│              2. SIMULAČNÍ JÁDRO & MODULÁRNÍ SYSTÉMY             │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐          │
│  │ ModuleRegistry│ │  Event Bus    │ │  Time Engine  │          │
│  └───────┬───────┘ └───────┬───────┘ └───────┬───────┘          │
│          └─────────────────┼─────────────────┘                  │
│  ┌─────────────────────────▼─────────────────────────────────┐  │
│  │ Pluggable Domain Modules:                                 │  │
│  │  - WorldHierarchyModule  - NpcAgentModule                 │  │
│  │  - RelationshipModule    - EventSystemModule              │  │
│  │  - EconomyModule         - SocietyModule                  │  │
│  │  - DivineIntervention    - ObserverModule                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Pure State Mutations
┌───────────────────────────────▼─────────────────────────────────┐
│                      1. DATOVÁ A STAVOVÁ VRSTVA                 │
│  - World State Store (Hierarchický strom entit)                 │
│  - Agent Data Models (Potřeby, Paměť, Vztahy, Cíle)             │
│  - Persistence Layer (Snapshots, Delta-logs, Serializátory)     │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Klíčové principy návrhu
1. **Zero Hard-Coupling (Nulové pevné vazby)**: Žádný doménový modul nevolá přímo metody jiného doménového modulu. Komunikace probíhá výhradně přes `EventBus` nebo standardizovaná servisní rozhraní registrovaná v `ModuleRegistry`.
2. **Deterministic & Tick-Driven**: Čas v simulaci plyne v diskrétních krocích (tickách). Každý tick má jasně definované fáze (Input/God -> Perception -> Decision -> Execution -> Environment/State Resolution -> Cleanup/Audit).
3. **Multi-Scale Level of Detail (LoD)**: Výpočetní kapacita je alokována dynamicky. Aktivní/sledovaná NPC se počítají v plné hloubce (Tier 1), zatímco vzdálená města a regiony se počítají agregovanými statistickými rovnicemi (Tier 3).
4. **Rozšiřitelnost jako plugin**: Každý subsystém (počasí, ekonomika, náboženství, nová božská schopnost) je implementován jako třída implementující rozhraní `ISimulationModule`.

---

## 2. ADRESÁŘOVÁ STRUKTURA

Struktura je navržena pro čistou separaci, minimální velikost souborů a snadné rozšiřování bez rizika zásahu do jádra.

```
/
├── ARCHITECTURE_PLAN.md          # Tento architektonický dokument
├── metadata.json                 # Metadata aplikace
├── package.json                  # Konfigurace a závislosti
├── docs/                         # Projektová dokumentace
│   ├── adr/                      # Architecture Decision Records
│   │   ├── 0001-modular-microkernel-eventbus.md
│   │   ├── 0002-tiered-lod-tick-system.md
│   │   └── 0003-hierarchical-world-tree.md
│   └── guides/                   # Vývojářské příručky
│
└── src/
    ├── core/                     # Mikro-jádro simulace
    │   ├── SimulationEngine.ts   # Hlavní smyčka, řízení běhu
    │   ├── ModuleRegistry.ts     # Registr a lifecycle modulů
    │   ├── EventBus.ts           # Typovaný pub/sub event bus
    │   ├── types.ts              # Globální rozhraní a základní typy
    │   └── utils/                # Matematika, ID generátory, pomocné funkce
    │
    ├── models/                   # Datové modely (Entity & Value Objects)
    │   ├── world/                # World, Continent, Region, Country, City, Group
    │   ├── npc/                  # NpcAgent, Identity, Personality, Needs, Memory
    │   ├── relationships/        # RelationshipGraph, Bonds, Conflicts
    │   ├── events/               # GameEvent, EventPayload, Triggers
    │   ├── divine/               # DivineAction, InterventionRule, GodPower
    │   └── common/               # Vector2D, Timestamp, HierarchyNode
    │
    ├── modules/                  # Zásuvné moduly (Plug-and-play)
    │   ├── time/                 # TimeModule: řízení času, kalendář, rychlost
    │   ├── world/                # WorldHierarchyModule: správa stromu světa
    │   ├── npc/                  # NpcAgentModule: životní cyklus agentů
    │   ├── decision/             # NpcDecisionModule: potřeby, utility AI, akce
    │   ├── relationships/        # RelationshipModule: správa vazeb a rodin
    │   ├── events/               # EventSystemModule: generátor a propagace událostí
    │   ├── divine/               # DivineInterventionModule: schopnosti hráče (L1–L7)
    │   ├── observer/             # ObserverModule: sběr telemetrie a filtr pro UI
    │   ├── economy/              # EconomyModule: (připravený skeleton pro budoucí fáze)
    │   └── society/              # SocietyModule: (připravený skeleton pro budoucí fáze)
    │
    ├── persistence/              # Ukládání a načítání stavu
    │   ├── PersistenceManager.ts # Koordinátor snapshotů
    │   ├── Serializers.ts        # Binární/JSON serializátory
    │   └── drivers/              # IndexedDbDriver, LocalStorageDriver, MemoryDriver
    │
    └── ui/                       # Uživatelské rozhraní (React + Tailwind)
        ├── components/           # UI komponenty (Inspector, Map, TimeBar, GodToolbar)
        ├── hooks/                # React hooks napojené na EventBus
        └── state/                # UI stav (výběr NPC, zoom úroveň, filtry)
```

---

## 3. SIMULAČNÍ HIERARCHIE SVĚTA

Všechny entity ve světě jsou organizovány do deterministického stromu:

```
WORLD (Globální klima, globální éra, celková populace)
 └── CONTINENT (Geografie, podnebné pásmo, biom)
      └── REGION (Lokální klima, dostupnost přírodních zdrojů)
           └── COUNTRY (Zákony, kultura, státní zřízení, ekonomický rámec)
                └── CITY / SETTLEMENT (Městská infrastruktura, tržnice, bezpečnost)
                     └── COMMUNITY (Čtvrť, sousedství, sdílené hodnoty)
                          └── GROUP (Rodina, pracovní cech, frakce, gang)
                               └── NPC (Autonomní agent s plnou identitou)
```

### Princip propagace vlivů:
- **Top-Down (Shora dolů)**: Válka na úrovni COUNTRY zhorší bezpečnost v CITIES, což sníží pocit bezpečí v COMMUNITIES a vyvolá stres/strach u konkrétních NPC.
- **Bottom-Up (Zdola nahoru)**: Nespokojenost 70 % NPC v CITY vyvolá nepokoje na úrovni COMMUNITY, které mohou přerůst v revoluci na úrovni COUNTRY.

---

## 4. MODEL AUTONOMNÍHO AGENTA (NPC)

Agent není statický záznam v databázi, nýbrž autonomní entita s následující strukturou:

```typescript
export interface INpcAgent {
  id: string;
  hierarchyAddress: {
    continentId: string;
    regionId: string;
    countryId: string;
    cityId: string;
    communityId: string;
    groupId?: string;
  };
  
  // 1. Identita a biologie
  identity: {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female' | 'other';
    birthTick: number;
    ageYears: number;
    lifeStage: 'infant' | 'child' | 'adolescent' | 'adult' | 'elder';
    isAlive: boolean;
    causeOfDeath?: string;
  };

  // 2. Osobnost (Big Five + Morální profil)
  personality: {
    openness: number;          // 0.0 - 1.0 (otevřenost vůči zkušenostem)
    conscientiousness: number; // 0.0 - 1.0 (svědomitost)
    extraversion: number;      // 0.0 - 1.0 (extraverze)
    agreeableness: number;     // 0.0 - 1.0 (přívětivost)
    neuroticism: number;       // 0.0 - 1.0 (emocionální stabilita / neuroticismus)
    moralityAlign: number;     // -1.0 (sobecký/krutý) až +1.0 (altruistický)
    religiosity: number;       // 0.0 (skeptik) až 1.0 (fanaticky věřící v Boha)
  };

  // 3. Dynamické potřeby (Maslowova hierarchie v reálném čase)
  needs: {
    hunger: number;            // 0 (sytý) - 100 (hladoví k smrti)
    energy: number;            // 0 (vyčerpaný) - 100 (plný energie)
    safety: number;            // 0 (v ohrožení) - 100 (naprosté bezpečí)
    social: number;            // 0 (osamělý) - 100 (sociálně naplněný)
    esteem: number;            // 0 (ponížený) - 100 (sebevědomý/uznávaný)
    purpose: number;           // 0 (ztracený) - 100 (naplněný smyslem)
  };

  // 4. Emoční stav
  emotionalState: {
    dominantEmotion: 'joy' | 'sorrow' | 'anger' | 'fear' | 'hope' | 'neutral';
    stressLevel: number;       // 0.0 - 1.0
    happinessLevel: number;    // 0.0 - 1.0
    faithInGod: number;        // 0.0 (nevěří) - 1.0 (zbožňuje)
  };

  // 5. Paměť a životní kronika
  memory: {
    shortTermMemories: Array<{ tick: number; eventDescription: string; emotionalImpact: number }>;
    longTermMemories: Array<{ tick: number; keyEvent: string; importance: number }>;
    lifeEventsLog: Array<{ age: number; title: string; summary: string }>;
  };

  // 6. Dovednosti, majetek a zaměstnání
  capabilities: {
    occupation: string;
    skills: Record<string, number>; // např. { farming: 65, crafting: 40, leadership: 20 }
    wealth: number;
    inventory: Array<{ itemId: string; name: string; quantity: number }>;
  };

  // 7. Rozhodovací subsystém (Aktuální záměr a cíl)
  decisionState: {
    currentGoal: string;
    currentAction: {
      type: string;
      startedTick: number;
      estimatedDurationTicks: number;
      targetEntityId?: string;
    };
    priorityQueue: string[];
  };
}
```

---

## 5. KOMUNIKACE MEZI MODULY A EVENT BUS

Komunikace je 100% asynchronně/synchronně řízená přes `EventBus`. Moduly jsou navzájem izolované.

### 5.1 Typovaný Event Bus
Každá událost má jasně definovanou strukturu:

```typescript
export interface ISimulationEvent<T = any> {
  id: string;
  type: string;
  sourceModule: string;
  targetScope: 'NPC' | 'GROUP' | 'COMMUNITY' | 'CITY' | 'REGION' | 'COUNTRY' | 'WORLD';
  targetId?: string;
  timestamp: {
    tick: number;
    year: number;
    month: number;
    day: number;
    hour: number;
  };
  payload: T;
  priority: number; // 0 = běžná telemetrie, 100 = kritická systémová změna / Božský zásah
}
```

### 5.2 Kategorie událostí v systému:
- `TIME_TICK` / `TIME_NEW_DAY` / `TIME_NEW_YEAR`
- `NPC_BORN` / `NPC_DIED` / `NPC_NEED_CRITICAL` / `NPC_ACTION_START`
- `RELATIONSHIP_CREATED` / `RELATIONSHIP_ALTERED` / `CONFLICT_ERUPTED`
- `COMMUNITY_PANIC` / `CITY_MIGRATION` / `RESOURCE_DEPLETED`
- `DIVINE_INTERVENTION` / `DIVINE_BLESSING` / `DIVINE_DISASTER`

---

## 6. MODULE REGISTRY & LIFECYCLE SYSTÉM

Všechny rozšiřující balíčky a subsystémy implementují jednotné rozhraní:

```typescript
export interface ISimulationModule {
  id: string;
  name: string;
  version: string;
  dependencies: string[]; // Např. ['TimeModule', 'WorldHierarchyModule']

  initialize(context: IEngineContext): Promise<void> | void;
  onSimulationStart?(): void;
  onSimulationPause?(): void;
  
  // Voláno každý simulační tick v definované fázi
  onTick(tickContext: ITickContext): void;
  
  // Perzistence
  exportState(): any;
  importState(state: any): void;
  
  destroy(): void;
}
```

### Životní cyklus modulu v `ModuleRegistry`:
1. **Registration**: Validace unikátnosti ID.
2. **Dependency Resolution**: Topologické seřazení modulů podle závislostí.
3. **Initialization (`initialize`)**: Předání referencí na `EventBus`, `WorldStore` a kontext.
4. **Execution Loop (`onTick`)**: Volání v deterministickém pořadí.
5. **State Capture / Restoration (`exportState`/`importState`)**: Bezproblémový save/load.
6. **Teardown (`destroy`)**: Čisté odhlášení listenerů.

---

## 7. SIMULATION TICK SYSTÉM & RYCHLOST ČASU

### 7.1 Časové jednotky a diskrétní kroky
- **1 Tick = 1 simulační sekunda** (při základní 1x rychlosti)
- **60 Ticks = 1 simulační minuta**
- **3600 Ticks = 1 simulační hodina**
- **86 400 Ticks = 1 simulační den**
- **12 Měsíců v roce, 30 Dní v měsíci** (přizpůsobitelný kalendář)

### 7.2 Škálování rychlosti (Simulation Speeds)
- `PAUSE` (0x)
- `NORMAL` (1x - detailní sledování)
- `FAST` (10x - pozorování dne)
- `TURBO` (60x - minuty jako sekundy)
- `GENERATIONAL` (3600x - dny v sekundách pro populační dynamiku)
- `STEP` (Přesně 1 diskrétní tick pro ladění a audit)

### 7.3 Fáze jednoho Ticku (Tick Execution Pipeline)
V každém simulačním ticku se provádějí následující kroky v pevném pořadí:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. TIME STEP: Inkrementace hodin a kalendáře                │
├─────────────────────────────────────────────────────────────┤
│ 2. DIVINE QUEUE: Aplikace příkazů a božských zásahů hráče   │
├─────────────────────────────────────────────────────────────┤
│ 3. ENVIRONMENT & WORLD: Změna počasí, zdrojů, plynutí světa │
├─────────────────────────────────────────────────────────────┤
│ 4. AGENT DECISION & ACTION (LoD Tiered):                    │
│    - Tier 1: Plný výpočet potřeb, emocí, paměti, akcí       │
│    - Tier 2: Odlehčený výpočet dominantních stavů           │
│    - Tier 3: Agregovaná statistická extrapolace             │
├─────────────────────────────────────────────────────────────┤
│ 5. EVENT RESOLUTION & BROADCAST: Vyhodnocení vzniklých stavů│
├─────────────────────────────────────────────────────────────┤
│ 6. TELEMETRY & OBSERVER SYNC: Příprava snapshotu pro UI     │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. PLAYER / GOD API (7 ÚROVNÍ KONTROLY)

Hráč vystupuje jako vševidoucí a všemohoucí entita (BŮH). Každá úroveň nabízí specifické nástroje:

| Úroveň | Název úrovně | Pozorovací schopnost | Božské zásahy (Divine Interventions) |
| :--- | :--- | :--- | :--- |
| **LEVEL 1** | **Jednotlivec (Individual)** | Myšlenky, emoce, paměť, potřeby NPC | Vnuknutí nápadu, okamžité uzdravení, změna nálady, blesk z čistého nebe |
| **LEVEL 2** | **Vztahy a Rodina (Bonds)** | Strom rodiny, sympatie, nepřátelství | Sblížení dvou duší, rozdmýchání žárlivosti, vytvoření pokrevní aliance |
| **LEVEL 3** | **Skupina (Group/Guild)** | Soudržnost frakce, společné zásoby | Jmenování vůdce, rozpad cechu, darování zdrojů, fanatizace |
| **LEVEL 4** | **Město (Settlement)** | Kriminalita, zásoby jídla, morálka | Požehnání úrody, morová rána, otevření nové obchodní cesty |
| **LEVEL 5** | **Region (Region)** | Ekosystém, lesy, sucho, migrace | Změna klimatu (déšť/sucho), vyvolání zemětřesení, příchod zvěře |
| **LEVEL 6** | **Stát (Country)** | Zákony, stabilita vlády, hrozba válek | Změna státní ideologie, vyhlášení míru, ekonomický krach, reformace |
| **LEVEL 7** | **Svět (World/Cosmos)** | Globální éry, celková populace, víra | Vstup do Zlatého věku, Potopa světa, Globální zjevení Boha |

---

## 9. OBSERVER & TELEMETRY SYSTEM

Observer systém zajišťuje, že UI nemusí číst neuspořádaná data z celého světa, ale dostává agregované pohledy v reálném čase:
- **Spatial Subscriptions**: UI si zaregistruje "Focus Target" (např. NPC s ID `#42` nebo město `#Novograd`).
- **Telemetry Feeds**: Modul posílá kompaktní diffy změn (změny potřeb, nově vzniklé vazby, nejnovější události v kronice).
- **Historical Timeline**: Záznam významných historických milníků pro zpětné přehrávání a kroniku světa.

---

## 10. STRATEGIE VÝKONU (PERFORMANCE & SCALING)

Pro zajištění plynulého běhu i při 10 000+ NPC:
1. **Tiered LoD (Level of Detail)**:
   - **Tier 1 (Aktivní sledování - do 500 NPC)**: Plná simulace každý tick (1 Hz / 60 Hz).
   - **Tier 2 (Místní komunita - do 5 000 NPC)**: Simulace každých 10 ticků, zjednodušená utility AI.
   - **Tier 3 (Vzdálený svět - 100 000+ NPC)**: Agregované makromodely (statistické rovnice porodnosti, spotřeby obilí a úmrtnosti měst) bez běhu individuálních agentních smyček.
2. **Object Pooling**: Recyklace instancí událostí a vektorů, nulový Garbage Collector spike.
3. **Data-Oriented Arrays**: Klíčové číselné hodnoty (potřeby, zdraví) mohou být ukládány v `Float32Array` strukturách pro bleskurychlý batch processing.

---

## 11. STRATEGIE PERSISTENCE (SAVE / LOAD)

1. **Snapshotting**: Uložení kompletního stavu stromu světa a všech aktivních modulů do strukturovaného JSON / IndexedDB.
2. **Delta Logging**: Mezi snapshoty lze ukládat pouze auditní logy událostí a Božských zásahů.
3. **Izolace od UI**: Persistence modul ukládá pouze čistá doménová data, žádné UI stavy.

---

## 12. GIT WORKFLOW, AUDIT A ARCHITECTURE DECISION RECORDS

Pro zachování maximální kvality a dohledatelnosti:
- **Conventional Commits**:
  - `feat(core): implement typed event bus`
  - `feat(npc): add big-five personality model`
  - `feat(divine): add level-1 inspiration intervention`
  - `docs(adr): add ADR 0001 for modular microkernel`
- **ADR (Architecture Decision Records)**: Každá významná změna má záznam v `/docs/adr/` ve formátu:
  - *Status* (Proposed / Accepted / Superseded)
  - *Context* (Problém)
  - *Decision* (Řešení)
  - *Consequences* (Dopady)
- **Verzování**: Sémantické verzování (SemVer `v0.1.0-alpha.1`).

---

## 13. IMPLEMENTAČNÍ PLÁN PO MALÝCH FÁZÍCH

Vzhledem k limitům a modulární čistotě je projekt rozdělen do izolovaných fází:

```
┌─────────────────────────────────────────────────────────────┐
│ FÁZE 1 (AKTUÁLNÍ CÍL): Core Engine & Minimal Skeleton       │
│ - SimulationEngine, EventBus, ModuleRegistry                │
│ - TimeModule (s ovládáním rychlosti a krokováním)           │
│ - WorldHierarchy strom (World -> Continent -> City -> NPC)  │
│ - Základní model NPC (potřeby, identita)                    │
│ - God API Level 1 (Pozorování a základní zásahy)            │
│ - Interaktivní Architecture Hub & Dashboard v UI            │
├─────────────────────────────────────────────────────────────┤
│ FÁZE 2: Decision Engine & Dynamic Needs                     │
│ - Maslowova hierarchie potřeb                               │
│ - Autonomní chování NPC (Hledání jídla, odpočinek, práce)   │
│ - Životní cyklus (Stárnutí, úmrtí, narození)                │
├─────────────────────────────────────────────────────────────┤
│ FÁZE 3: Vztahy, Skupiny a Komunity                          │
│ - Rodinný a sociální graf                                   │
│ - Skupinové chování a dynamika komunit                      │
│ - God API Level 2 a 3                                       │
├─────────────────────────────────────────────────────────────┤
│ FÁZE 4: Event Engine & Světové události                     │
│ - Autonomní katastrofy, epidemie, zázraky, slavnosti        │
│ - Historická kronika světa                                  │
├─────────────────────────────────────────────────────────────┤
│ FÁZE 5: Ekonomika & Společnost                              │
│ - Výroba, spotřeba, směna, bohatství                        │
│ - Kultura, náboženství a zákony                             │
├─────────────────────────────────────────────────────────────┤
│ FÁZE 6: Vyšší Božské úrovně (Level 4–7) & Škálování         │
│ - Globální zásahy, kontinenty, modding API                  │
└─────────────────────────────────────────────────────────────┘
```
