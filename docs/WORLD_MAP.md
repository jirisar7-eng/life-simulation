# WORLD MAP SPECIFICATION & DATA FOUNDATION

## 1. Přehled & Filozofie

World Map představuje geografický a prostorový datový model simulace. Definuje diskrétní souřadnicový systém složený z mapových dlaždic (`MapTile`), kde každý bod nese informace o terénu, biomu, nadmořské výšce a přítomnosti vody.

---

## 2. Oddělení Dat od Rendereru (Strict Decoupling)

- **Datová nezávislost**: Třída `WorldMap` a související typy (`TerrainType`, `BiomeType`, `WaterState`) jsou uloženy v doménové vrstvě (`src/models/map/`).
- **Žádná závislost na grafickém enginu**: `WorldMap` neobsahuje žádné importy z `pixi.js`, DOM ani Canvas API.
- **Jednosměrný datový tok**: `WorldRenderer` přebírá mapová data ke čtení (`renderer.setWorldMap(map)`) a promítá je do grafických primitiv. Renderer nikdy nevlastní ani přímo nemutuje simulační data mapy.

---

## 3. Datový Model (`MapTile`)

Každá mapová dlaždice nese následující atributy:
- `id`: Unikátní identifikátor dlaždice (např. `tile_12_8`).
- `x`: Celé číslo představující X souřadnici na mapové mřížce.
- `y`: Celé číslo představující Y souřadnici na mapové mřížce.
- `elevation`: Nadmořská výška (normalizovaná hodnota vyjadřující hloubku moře až po horské vrcholy).
- `terrain`: Výčtový typ terénu (`TerrainType`).
- `water`: Stav a typ vodní plochy (`WaterState`).
- `biome`: Klimatický biom (`BiomeType`).

---

## 4. Terény a Biomy

### TerrainType
- `OCEAN`: Hluboké mořské vody.
- `COAST`: Pobřežní mělčiny a pláže.
- `PLAINS`: Travnaté pláně a louky.
- `FOREST`: Lesní a zalesněné porosty.
- `HILLS`: Kopcovitá a pahorkatá krajina.
- `MOUNTAINS`: Vysokohorské masivy a skalní štíty.
- `DESERT`: Písečné a kamenité pouště.

### BiomeType
- `TEMPERATE`: Mírné pásmo s vyváženou vegetací.
- `TROPICAL`: Tropické vlhké a teplé oblasti.
- `ARID`: Suché, aridní oblasti s nízkými srážkami.
- `COLD`: Chladné podhorské a severské pásmo.
- `TUNDRA`: Věčně zmrzlá a arktická tundra.

### WaterState
- `NONE`: Suchozemská dlaždice bez otevřené vodní plochy.
- `RIVER`: Říční koryto nebo potok.
- `LAKE`: Vnitrozemské jezero nebo vodní nádrž.
- `OCEAN`: Souvislá mořská / oceánská plocha.

---

## 5. Veřejné API (`WorldMap`)

- `createWorldMap(options)`: Tovární metoda pro inicializaci mapy se zadanými rozměry.
- `getTile(x, y)`: Vrátí bezpečnou kopii dlaždice na zadaných souřadnicích (nebo `undefined` při souřadnicích mimo meze).
- `setTile(x, y, patch)`: Aktualizuje vybrané atributy existující dlaždice.
- `isWithinBounds(x, y)`: Ověřuje validitu souřadnic v rámci rozměrů mapy.
- `getMapBounds()`: Poskytuje mezní body `minX`, `maxX`, `minY`, `maxY`, `width`, `height`.
- `getAllTiles()`: Poskytuje pole všech dlaždic pro dávkové zpracování nebo vykreslení.

---

## 6. Deterministická Generace (Zero Math.random)

- Veškeré procedurální i náhodné procesy pro mapová data využívají výhradně rozhraní `RandomSource` a implementaci `SeededRandom` (`src/core/random.ts`).
- Použití stejného seedu generuje 100% identickou mapu na jakémkoliv prostředí.

---

## 7. Plán Budoucích Fází

1. **Procedurální Výškové Mapy (Noise Functions)**: Integrace deterministického Simplex / Perlin šumu pro organické generování kontinentů a pohoří.
2. **Klimatický a Hydrologický Model**: Výpočet teploty podle zeměpisné šířky/výšky a eroze vodních toků od pramenů do oceánů.
3. **Prostorové Indexování a Chunking**: Dělení rozsáhlých map (např. 1024x1024) do chunků pro streaming a paměťovou optimalizaci.
