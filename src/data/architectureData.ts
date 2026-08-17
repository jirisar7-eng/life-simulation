import { ModuleDefinition, HierarchyLevel, GodLevelDefinition, AgentModelSection } from '../types/architecture';

export const MODULES_DATA: ModuleDefinition[] = [
  {
    id: 'core-engine',
    name: 'SimulationEngine',
    category: 'Core',
    status: 'Phase 1 Core',
    description: 'Centrální řídící smyčka (Game Loop), správce ticků, delta time a koordinátor fází zpracování.',
    dependencies: [],
    providedServices: ['ISimulationEngine', 'ITickScheduler'],
    listensToEvents: ['CORE_PAUSE_REQUESTED', 'CORE_SPEED_CHANGED'],
    emitsEvents: ['TICK_STARTED', 'TICK_PHASE_ADVANCED', 'TICK_COMPLETED'],
  },
  {
    id: 'event-bus',
    name: 'EventBus',
    category: 'Core',
    status: 'Phase 1 Core',
    description: 'Vysoce propustný typovaný Pub/Sub komunikační kanál s prioritním řazením, historií a filtrováním.',
    dependencies: [],
    providedServices: ['IEventBus', 'IEventHistory'],
    listensToEvents: ['*'],
    emitsEvents: ['EVENT_PUBLISHED', 'EVENT_FILTERED'],
  },
  {
    id: 'module-registry',
    name: 'ModuleRegistry',
    category: 'Core',
    status: 'Phase 1 Core',
    description: 'Správce životního cyklu modulů (Init, Start, Tick, Pause, Save, Destroy) a řešitel závislostí.',
    dependencies: ['event-bus'],
    providedServices: ['IModuleRegistry', 'IServiceLocator'],
    listensToEvents: ['MODULE_HOT_RELOAD_REQUESTED'],
    emitsEvents: ['MODULE_INITIALIZED', 'MODULE_REGISTERED', 'MODULE_TEARDOWN'],
  },
  {
    id: 'time-module',
    name: 'TimeModule',
    category: 'Core',
    status: 'Phase 1 Core',
    description: 'Kalendářní systém (sekundy, minuty, hodiny, dny, měsíce, roky), řízení rychlosti (1x až 3600x) a krokování.',
    dependencies: ['event-bus'],
    providedServices: ['ITimeService', 'ICalendar'],
    listensToEvents: ['TIME_SET_SPEED', 'TIME_STEP_FORWARD'],
    emitsEvents: ['TIME_SECOND_TICK', 'TIME_HOUR_PASSED', 'TIME_DAY_PASSED', 'TIME_YEAR_PASSED'],
  },
  {
    id: 'world-hierarchy',
    name: 'WorldHierarchyModule',
    category: 'World & Hierarchy',
    status: 'Phase 1 Core',
    description: 'Správa prostorové a organizační stromové struktury (World -> Continents -> Regions -> Countries -> Cities -> Groups).',
    dependencies: ['event-bus'],
    providedServices: ['IWorldStore', 'IHierarchyNavigator'],
    listensToEvents: ['HIERARCHY_NODE_CREATED', 'HIERARCHY_NODE_UPDATED'],
    emitsEvents: ['WORLD_STATE_MUTATED', 'SPATIAL_INDEX_UPDATED'],
  },
  {
    id: 'npc-agent',
    name: 'NpcAgentModule',
    category: 'Agent & Behavior',
    status: 'Phase 1 Core',
    description: 'Správa životního cyklu agentů, biologický věk, Maslowovy dynamické potřeby, emoce a Big-5 osobnost.',
    dependencies: ['event-bus', 'world-hierarchy', 'time-module'],
    providedServices: ['INpcRegistry', 'IAgentStateProvider'],
    listensToEvents: ['TIME_DAY_PASSED', 'DIVINE_NPC_BLESSING'],
    emitsEvents: ['NPC_BORN', 'NPC_DIED', 'NPC_NEED_CRITICAL', 'NPC_EMOTION_SHIFT'],
  },
  {
    id: 'decision-system',
    name: 'NpcDecisionModule',
    category: 'Agent & Behavior',
    status: 'Phase 2',
    description: 'Utility-AI a GOAP (Goal Oriented Action Planning) rozhodovací jádro pro autonomní chování NPC.',
    dependencies: ['npc-agent', 'time-module'],
    providedServices: ['IDecisionEngine', 'IActionPlanner'],
    listensToEvents: ['NPC_NEED_CRITICAL', 'WORLD_EVENT_TRIGGERED'],
    emitsEvents: ['NPC_ACTION_STARTED', 'NPC_ACTION_FINISHED', 'NPC_GOAL_CHANGED'],
  },
  {
    id: 'relationships-module',
    name: 'RelationshipModule',
    category: 'Agent & Behavior',
    status: 'Phase 3',
    description: 'Sociální a rodinný graf, sympatie, láska, žárlivost, pracovní vazby a reputace mezi NPC a skupinami.',
    dependencies: ['npc-agent'],
    providedServices: ['ISocialGraphService', 'IFamilyTreeService'],
    listensToEvents: ['NPC_INTERACTION_OCCURRED', 'NPC_BORN', 'NPC_DIED'],
    emitsEvents: ['RELATIONSHIP_ALTERED', 'CONFLICT_DECLARED', 'ALLIANCE_FORMED'],
  },
  {
    id: 'events-module',
    name: 'EventSystemModule',
    category: 'Systems',
    status: 'Phase 4',
    description: 'Generátor autonomních dynamických událostí (katastrofy, slavnosti, mor, revoluce, zázraky) s kaskádovým vlivem.',
    dependencies: ['world-hierarchy', 'event-bus'],
    providedServices: ['IEventGenerator', 'IEventCascadeEngine'],
    listensToEvents: ['WORLD_CONDITION_MET', 'DIVINE_SPARK_TRIGGER'],
    emitsEvents: ['GAME_EVENT_SPAWNED', 'GAME_EVENT_RESOLVED', 'HISTORY_ENTRY_LOGGED'],
  },
  {
    id: 'divine-intervention',
    name: 'DivineInterventionModule',
    category: 'Player & Divine',
    status: 'Phase 1 Core',
    description: 'Božské rozhraní hráče pro zásahy na 7 úrovních (od inspirace jednotlivce po kosmické potopy a změny klimatu).',
    dependencies: ['world-hierarchy', 'npc-agent', 'event-bus'],
    providedServices: ['IGodService', 'IInterventionRegistry'],
    listensToEvents: ['GOD_COMMAND_ISSUED'],
    emitsEvents: ['DIVINE_INTERVENTION_APPLIED', 'MIRACLE_MANIFESTED', 'DIVINE_FAVOR_CHANGED'],
  },
  {
    id: 'persistence-module',
    name: 'PersistenceModule',
    category: 'Systems',
    status: 'Phase 1 Core',
    description: 'Správce serializace, snapshotů, delta-logů a ukládání do IndexedDB / JSON souborů.',
    dependencies: ['module-registry'],
    providedServices: ['IPersistenceManager', 'ISnapshotStore'],
    listensToEvents: ['SIMULATION_SAVE_REQUESTED', 'SIMULATION_LOAD_REQUESTED'],
    emitsEvents: ['SAVE_COMPLETED', 'LOAD_COMPLETED'],
  },
  {
    id: 'economy-module',
    name: 'EconomyModule',
    category: 'Systems',
    status: 'Phase 5+',
    description: 'Výroba, spotřeba, lokální a regionální trhy, zaměstnání, obchody a ekonomické krize.',
    dependencies: ['world-hierarchy', 'npc-agent'],
    providedServices: ['IEconomyService', 'IMarketEngine'],
    listensToEvents: ['RESOURCE_HARVESTED', 'TRADE_TRANSACTION'],
    emitsEvents: ['MARKET_PRICE_SHIFTED', 'ECONOMIC_CRISIS_TRIGGERED'],
  }
];

export const HIERARCHY_LEVELS: HierarchyLevel[] = [
  {
    id: 'world',
    level: 'L7 (Apex)',
    title: 'WORLD (Svět)',
    description: 'Celý planetární systém, globální klima, historická éra, celková populace a souhrnná víra.',
    scaleDescription: '1 Globální entita • 100 000+ NPC agregovaně',
    responsibilities: ['Globální čas a sluneční cykly', 'Globální zázrak a Boží hněv', 'Celková demografická bilance'],
    simulatedAttributes: ['Global Era', 'Total Population', 'Average Faith Level', 'Global Temperature Offset'],
    godInfluenceLevel: 7
  },
  {
    id: 'continent',
    level: 'L6',
    title: 'CONTINENTS (Kontinenty)',
    description: 'Velké geografické celky, makroklimatické pásy (tropy, mírné pásmo, tundra) a tektonické desky.',
    scaleDescription: '3–7 Kontinentů na svět',
    responsibilities: ['Přirozené geografické bariéry', 'Kontinentální migrační toky', 'Velká podnebí'],
    simulatedAttributes: ['Biome Composition', 'Tectonic Stability', 'Migratory Pressure Index'],
    godInfluenceLevel: 6
  },
  {
    id: 'region',
    level: 'L5',
    title: 'REGIONS (Regiony)',
    description: 'Lokální krajina, údolí, pohoří, dostupnost vody, úrodnost půdy, lesy a nerostné zásoby.',
    scaleDescription: '10–30 Regionů na kontinent',
    responsibilities: ['Dostupnost primárních surovin', 'Lokální počasí (deště, sucha)', 'Kapacita ekosystému'],
    simulatedAttributes: ['Soil Fertility', 'Water Reserves', 'Fauna Density', 'Local Weather State'],
    godInfluenceLevel: 5
  },
  {
    id: 'country',
    level: 'L4',
    title: 'COUNTRIES (Státy & Království)',
    description: 'Politicko-právní entity se zákony, státním zřízením, daněmi, kulturou a armádou.',
    scaleDescription: '2–10 Států na region/kontinent',
    responsibilities: ['Státní zákony a náboženství', 'Diplomatické vztahy a války', 'Daně a fiskální politika'],
    simulatedAttributes: ['Government Type', 'Official Religion', 'Treasury', 'Law & Order Index', 'Stability'],
    godInfluenceLevel: 4
  },
  {
    id: 'city',
    level: 'L3',
    title: 'CITIES & SETTLEMENTS (Města & Osady)',
    description: 'Centra osídlení, infrastruktura, hradby, sýpky, tržnice, chrámy a bezpečnost obyvatel.',
    scaleDescription: '5–50 Měst na stát • 100–10 000 NPC na město',
    responsibilities: ['Veřejné zásoby jídla a vody', 'Hygiena a nákazy', 'Obrana a kriminalita'],
    simulatedAttributes: ['Grain Granary Storage', 'Sanitation Level', 'Defensive Rating', 'Local Morale'],
    godInfluenceLevel: 3
  },
  {
    id: 'community',
    level: 'L2',
    title: 'COMMUNITIES (Komunity & Čtvrti)',
    description: 'Sousedství, městské čtvrti a vesnické pospolitosti se sdílenou kulturou a náladou.',
    scaleDescription: '3–10 Komunit na město • 20–100 NPC na komunitu',
    responsibilities: ['Místní nálada a solidarita', 'Sdílení místních zdrojů', 'Sousedszké konflikty'],
    simulatedAttributes: ['Social Cohesion', 'Panic Index', 'Mutual Trust Rating'],
    godInfluenceLevel: 2
  },
  {
    id: 'group',
    level: 'L1.5',
    title: 'GROUPS (Skupiny, Rodiny, Cechy)',
    description: 'Funkční a pokrevní jednotky: rodiny v domácnosti, kovářské cechy, party přátel či náboženské sekty.',
    scaleDescription: '2–10 NPC na skupinu',
    responsibilities: ['Společné jmění domácnosti', 'Výchova dětí a dědictví', 'Kolektivní rozhodování'],
    simulatedAttributes: ['Shared Wealth', 'Family Lineage ID', 'Guild Hierarchy Rank', 'Group Purpose'],
    godInfluenceLevel: 2
  },
  {
    id: 'npc',
    level: 'L1 (Atomic Agent)',
    title: 'NPC (Autonomní Jednotlivec)',
    description: 'Základní atomární bytost s plnou identitou, psychologií Big-5, potřebami, vzpomínkami a svobodnou vůlí.',
    scaleDescription: 'Základní agent simulace',
    responsibilities: ['Vyhodnocování potřeb v reálném čase', 'Interakce s ostatními NPC', 'Tvorba životní kroniky'],
    simulatedAttributes: ['Big-5 Personality', 'Maslow Needs Matrix', 'Emotional State', 'Memory Chronicle', 'Skills'],
    godInfluenceLevel: 1
  }
];

export const GOD_LEVELS_DATA: GodLevelDefinition[] = [
  {
    level: 1,
    title: 'Level 1: Božský Pozorovatel & Jednotlivec',
    subtitle: 'Schopnost vidět do hloubi duše a ovlivnit osud jedince',
    scope: 'Jednotlivé NPC (Individual Agent)',
    observationCapabilities: [
      'Čtení myšlenek a aktuálního záměru NPC',
      'Přesný graf potřeb (hlad, energie, bezpečí, sociální pouto)',
      'Kompletní životní kronika a paměťová stopa',
      'Hloubková analýza osobnosti (Big-5 profil)'
    ],
    interventions: [
      {
        name: 'Vnuknutí myšlenky (Divine Inspiration)',
        description: 'Vloží do mysli NPC silný záměr (např. jít pomoci sousedovi, změnit řemeslo, modlit se).',
        target: 'Jednotlivé NPC',
        impact: 'Změna okamžitého cíle v rozhodovací frontě + zvýšení víry o +15 %',
        energyCost: '10 Božské many'
      },
      {
        name: 'Zázračné uzdravení (Miraculous Healing)',
        description: 'Okamžitě vyléčí zranění nebo nemoc, obnoví energii na 100 % a odstraní strach.',
        target: 'Jednotlivé NPC',
        impact: 'Zdraví 100 %, Odstranění traumatické vzpomínky, Víra v Boha +40 %',
        energyCost: '25 Božské many'
      },
      {
        name: 'Boží blesk (Divine Smite)',
        description: 'Sešle blesk na hříšníka nebo tyrana. Okamžitá eliminace nebo těžké zranění.',
        target: 'Jednotlivé NPC',
        impact: 'Poškození / Smrt cíle, Vznik paniky v okruhu 50 m, Nárůst bázně před Bohem',
        energyCost: '35 Božské many'
      }
    ]
  },
  {
    level: 2,
    title: 'Level 2: Architekt Vztahů & Rodin',
    subtitle: 'Manipulace s pouty lásky, nenávisti a pokrevního dědictví',
    scope: 'Dvojice NPC, Rodiny a Domácnosti',
    observationCapabilities: [
      'Sociální graf sympatií a averzí v rodině',
      'Míra žárlivosti, důvěry a zamilovanosti',
      'Rodokmeny a genetická/talentová dědičnost'
    ],
    interventions: [
      {
        name: 'Spojení spřízněných duší (Soul Bond)',
        description: 'Zažehne hlubokou lásku a náklonnost mezi dvěma vybranými NPC.',
        target: '2 NPC agenti',
        impact: 'Sympatie nastaveny na +90, vysoká pravděpodobnost sňatku a založení rodiny',
        energyCost: '30 Božské many'
      },
      {
        name: 'Sémě sváru (Seed of Discord)',
        description: 'Vyvolá podezíravost a žárlivost mezi dříve loajálními partnery či přáteli.',
        target: '2 NPC agenti',
        impact: 'Sympatie klesnou o -60, riziko okamžitého konfliktu',
        energyCost: '20 Božské many'
      },
      {
        name: 'Požehnání plodnosti (Fertility Blessing)',
        description: 'Zaručí zdravé početí a talentovaného potomka v rodině.',
        target: 'Rodina / Pár',
        impact: 'Zaručené narození dítěte s vysokým bonusem k inteligenci',
        energyCost: '40 Božské many'
      }
    ]
  },
  {
    level: 3,
    title: 'Level 3: Vládce Skupin & Frakcí',
    subtitle: 'Vedení cechů, politických frakcí a posvátných řádů',
    scope: 'Skupiny, Cechy, Gangy, Řády',
    observationCapabilities: [
      'Hierarchie moci uvnitř cechu / řádu',
      'Kolektivní majetek a zásoby skupiny',
      'Míra fanatismu a loajality vůdci'
    ],
    interventions: [
      {
        name: 'Ustanovení Proroka (Consecrate Leader)',
        description: 'Jmenuje konkrétního člena skupiny charismatickým vůdcem uznávaným všemi ostatními.',
        target: 'Skupina + NPC',
        impact: 'Morálka skupiny +50 %, naprostá poslušnost členů',
        energyCost: '50 Božské many'
      },
      {
        name: 'Kolektivní vize (Collective Epiphany)',
        description: 'Vloží do celé skupiny společný cíl (např. postavit chrám, vytáhnout na výpravu).',
        target: 'Celá skupina',
        impact: 'Všichni členové přepnou své chování na společný projekt',
        energyCost: '60 Božské many'
      }
    ]
  },
  {
    level: 4,
    title: 'Level 4: Ochránce & Soudce Měst',
    subtitle: 'Řízení celých osad, městských sýpek a veřejné morálky',
    scope: 'Města a osady (Settlements)',
    observationCapabilities: [
      'Hladina kriminality, hygiena a sýpky města',
      'Celková spokojenost a riziko vzpoury',
      'Produktivita řemesel a tržní aktivita'
    ],
    interventions: [
      {
        name: 'Hojnost úrody (Bountiful Harvest)',
        description: 'Znásobí zásoby obilí v městských sýpkách a odstraní riziko hladomoru.',
        target: 'Město',
        impact: 'Sýpky naplněny na 100 %, index hladu ve městě spadne na 0',
        energyCost: '75 Božské many'
      },
      {
        name: 'Morová rána (Plague of Judgment)',
        description: 'Sešle na město očistnou epidemii trestající zkaženost a bezbožnost.',
        target: 'Město',
        impact: 'Snížení populace o 15–30 %, masivní nárůst modliteb a pokání',
        energyCost: '90 Božské many'
      }
    ]
  },
  {
    level: 5,
    title: 'Level 5: Pán Přírody & Krajiny',
    subtitle: 'Proměna počasí, tekoucích řek a úrodnosti celých provincií',
    scope: 'Přírodní Regiony a Provincie',
    observationCapabilities: [
      'Hydrologický systém a stav podzemních vod',
      'Pohyb zvěře a biomasa lesů',
      'Teplotní a srážkové anomálie'
    ],
    interventions: [
      {
        name: 'Úrodný blahodárný déšť (Fertile Deluge)',
        description: 'Ukončí sucho v celém regionu, zavlaží pole a obnoví vyschlé studny.',
        target: 'Region',
        impact: 'Úrodnost půdy +80 %, úbytek lesních požárů',
        energyCost: '120 Božské many'
      },
      {
        name: 'Zemětřesení & Zlom zemské kůry (Earthquake)',
        description: 'Otřese geologickým zlomem, poškodí stavby a odhalí bohatá ložiska zlata/rudy.',
        target: 'Region',
        impact: 'Poškození budov v regionu, vznik nového nerostného bohatství',
        energyCost: '140 Božské many'
      }
    ]
  },
  {
    level: 6,
    title: 'Level 6: Suverén Států & Dynastií',
    subtitle: 'Proměna státních zřízení, vyhlášení míru a pád říší',
    scope: 'Státy a Království (Countries)',
    observationCapabilities: [
      'Stabilita panovnického rodu a legitimita vlády',
      'Ekonomická soběstačnost a státní pokladna',
      'Válečné napětí a diplomatické smlouvy'
    ],
    interventions: [
      {
        name: 'Pax Divina (Věčný mír)',
        description: 'Vynutí okamžité podepsání mírové smlouvy mezi dvěma válčícími říšemi.',
        target: 'Stát / Diplomatická dvojice',
        impact: 'Ukončení válečného stavu, otevření hranic, rozvoj obchodu',
        energyCost: '200 Božské many'
      },
      {
        name: 'Dynastický kolaps (Dynastic Ruin)',
        description: 'Uvrhne vládnoucí elitu do chaosu a umožní vzestup nové reformní vlády.',
        target: 'Stát',
        impact: 'Změna státního zřízení, reorganizace zákonů',
        energyCost: '220 Božské many'
      }
    ]
  },
  {
    level: 7,
    title: 'Level 7: Stvořitel Kosmu & Globálních Ér',
    subtitle: 'Vstup do Zlatého věku, Potopa světa a fundamentální zákony vesmíru',
    scope: 'Celý svět (World Cosmos)',
    observationCapabilities: [
      'Globální historická éra a vědecko-magický věk',
      'Celkový počet duší na světě',
      'Souhrnná kosmická bilance dobra a zla'
    ],
    interventions: [
      {
        name: 'Příchod Zlatého Věku (The Golden Age)',
        description: 'Nastolí na celém světě 50 let trvající éru míru, umění, vědění a hojnosti.',
        target: 'Globální svět',
        impact: 'Porodnost +50 %, mortalita -40 %, vědecké objevy zrychleny 3x',
        energyCost: '500 Božské many'
      },
      {
        name: 'Velká očistná potopa (The Great Deluge)',
        description: 'Překryje kontinenty vodou a zanechá pouze vyvolené na archách.',
        target: 'Globální svět',
        impact: 'Reset civilizací, nový cyklus světa s uchovanou kronikou',
        energyCost: '750 Božské many'
      }
    ]
  }
];

export const AGENT_MODEL_SECTIONS: AgentModelSection[] = [
  {
    title: '1. Identita a Biologie',
    key: 'identity',
    description: 'Základní biologické parametry, jméno, věk v ticích a životní fáze.',
    fields: [
      { name: 'id', type: 'string (UUID)', description: 'Unikátní identifikátor agenta', sampleValue: '"npc_8f1a-9c42"' },
      { name: 'firstName / lastName', type: 'string', description: 'Jméno v rodové linii', sampleValue: '"Eldrin Valerius"' },
      { name: 'ageYears / lifeStage', type: 'number / enum', description: 'Biologický věk a fáze (infant, child, adult, elder)', sampleValue: '34 let (adult)' },
      { name: 'isAlive', type: 'boolean', description: 'Stav bytosti (při úmrtí se archivuje do paměti světa)', sampleValue: 'true' }
    ]
  },
  {
    title: '2. Psychologie & Osobnost (Big Five + Morálka)',
    key: 'personality',
    description: 'Trvalé charakterové vlastnosti určující rozhodování a vnímání světa.',
    fields: [
      { name: 'openness (Otevřenost)', type: 'float (0.0 - 1.0)', description: 'Ochota objevovat nové myšlenky a cesty', sampleValue: '0.82 (velmi zvídavý)' },
      { name: 'conscientiousness (Svědomitost)', type: 'float (0.0 - 1.0)', description: 'Pracovitost, disciplína a spolehlivost', sampleValue: '0.74 (odpovědný)' },
      { name: 'extraversion (Extraverze)', type: 'float (0.0 - 1.0)', description: 'Vyhledávání společnosti a vedení lidí', sampleValue: '0.45 (spíše introvert)' },
      { name: 'agreeableness (Přívětivost)', type: 'float (0.0 - 1.0)', description: 'Soucit a ochota pomoci druhým', sampleValue: '0.88 (velmi laskavý)' },
      { name: 'neuroticism (Neuroticismus)', type: 'float (0.0 - 1.0)', description: 'Citlivost na stres a paniku', sampleValue: '0.25 (klidný, vyrovnaný)' },
      { name: 'religiosity (Víra v Boha)', type: 'float (0.0 - 1.0)', description: 'Oddanost hráči jako Boží entitě', sampleValue: '0.91 (hluboce věřící)' }
    ]
  },
  {
    title: '3. Dynamické potřeby (Maslowova hierarchie)',
    key: 'needs',
    description: 'Okamžitý stav organismu vyhodnocovaný v reálném čase každou sekundu.',
    fields: [
      { name: 'hunger (Hlad)', type: 'number (0 - 100)', description: '0 = sytý, 100 = hladovění k smrti', sampleValue: '18 / 100 (v normě)' },
      { name: 'energy (Energie)', type: 'number (0 - 100)', description: '100 = plný sil, 0 = zhroucení únavou', sampleValue: '85 / 100' },
      { name: 'safety (Bezpečí)', type: 'number (0 - 100)', description: 'Pocit bezpečí před dravci, válkou a loupežníky', sampleValue: '92 / 100 (vysoké)' },
      { name: 'social (Sociální kontakt)', type: 'number (0 - 100)', description: 'Míra naplnění vztahy a rozhovory', sampleValue: '65 / 100' },
      { name: 'purpose (Smysl života)', type: 'number (0 - 100)', description: 'Naplnění práce, víry a cílů', sampleValue: '78 / 100' }
    ]
  },
  {
    title: '4. Paměť a Životní kronika',
    key: 'memory',
    description: 'Krátkodobá a dlouhodobá paměť, která formuje předsudky a budoucí reakce.',
    fields: [
      { name: 'shortTermMemories', type: 'Array<MemoryEvent>', description: 'Zážitky z posledních hodin/dní', sampleValue: '["Viděl zázračné uzdravení bratra"]' },
      { name: 'longTermMemories', type: 'Array<KeyMemory>', description: 'Zásadní emoční milníky (svatba, hladomor)', sampleValue: '["Přežil velký požár města v dětství"]' },
      { name: 'lifeEventsLog', type: 'Array<ChronicleEntry>', description: 'Trvalá kronika pro pozorovací režim hráče', sampleValue: '["Věk 20: Jmenován mistrem kovářem"]' }
    ]
  }
];
