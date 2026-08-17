# WORLD RENDERER SPECIFICATION & ARCHITECTURE

## 1. Přehled & Účel

World Renderer představuje prezentační grafickou vrstvu pro vizualizaci hierarchického světa simulace. Poskytuje interaktivní 2D plátno (canvas) s plynulým ovládáním kamery (pan, zoom), deterministickým převodem souřadnic a oddělením od simulačního jádra.

---

## 2. Volba Technologie (PixiJS 8.x WebGL)

Jako grafický engine byl zvolen **PixiJS 8.x**:
- **Vysoký výkon & WebGL Pipeline**: Hardwarově akcelerované 2D vykreslování zvládající desetitisíce interaktivních objektů při 60 FPS.
- **Moderní architektura PixiJS 8**: Sjednocené a modularizované grafické API s podporou reaktivního layoutu a automatického škálování DPI.
- **Příprava na budoucí WebGPU**: PixiJS 8 má interní abstrakci nad WebGL a WebGPU (`preference: 'webgl' | 'webgpu'`). Renderer je navržen tak, aby umožnil přechod na WebGPU bez nutnosti přepisovat doménovou nebo kamerovou logiku.
- **Striktní oddělení**: Simulation Engine neimportuje PixiJS ani DOM elementy. Renderer slouží pouze jako konzument read-only stavu simulace.

---

## 3. Souřadnicový Systém (WorldPosition vs. ScreenPosition)

Renderer striktně rozlišuje mezi dvěma souřadnicovými prostory:

### WorldPosition
- Virtuální souřadnice v simulačním prostoru `(x, y)`.
- Nezávislé na rozlišení obrazovky, velikosti okna i přiblížení kamery.
- Počátek `(0, 0)` představuje absolutní střed světa.

### ScreenPosition
- Fyzické pixelové souřadnice na plátně prohlížeče `(x, y)`.
- Rozsah od `(0, 0)` v levém horním rohu po `(viewportWidth, viewportHeight)` v pravém dolním rohu.

### Deterministický převod:
```typescript
// World -> Screen
screenX = (worldX - cameraX) * zoom + viewportWidth / 2
screenY = (worldY - cameraY) * zoom + viewportHeight / 2

// Screen -> World
worldX = (screenX - viewportWidth / 2) / zoom + cameraX
worldY = (screenY - viewportHeight / 2) / zoom + cameraY
```

---

## 4. Kamera (`Camera.ts`)

Kamera spravuje výřez pohledu a transformace:
- **Pozice**: Střed kamery ve světových souřadnicích `(x, y)`.
- **Zoom**: Měřítko zobrazení s mezemi `minZoom` (např. 0.1x) a `maxZoom` (např. 10.0x).
- **Interakce**:
  - `pan(dx, dy)`: Posun kamery.
  - `zoomBy(factor, pivot)`: Exponenciální přiblížení/oddálení s volitelným pivot bodem (např. pozicí kurzoru myši).
  - `worldToScreen()` / `screenToWorld()`: Deterministické unprojection / projection funkce.

---

## 5. Architektura WorldRendereru (`WorldRenderer.ts`)

Lifecycle metody:
- `initialize(targetElement)`: Asynchronní inicializace PixiJS aplikace a navázání na DOM kontejner.
- `resize(width, height)`: Adaptace viewportu na změnu velikosti okna (ResizeObserver).
- `render()`: Synchronizace polohy a měřítka kontejneru scény podle stavu kamery.
- `destroy()`: Čisté uvolnění paměti, WebGL kontextu a listenerů.

---

## 6. Budoucí Rozšíření (Plán Fází)

1. **Multi-Scale Level of Detail (LOD)**:
   - *Makro pohled (Zoom < 0.3x)*: Vykreslení celých regionů (L6) a osídlení (L5) formou agregovaných heatmap a ikon.
   - *Mezo pohled (0.3x <= Zoom < 1.5x)*: Zobrazení struktur komunit (L4) a budov (L3).
   - *Mikro pohled (Zoom >= 1.5x)*: Detailní zobrazení agentů/NPC (L1), inventářů a bezprostředního okolí.
2. **Chunk Streaming & Culling**:
   - Dělení světa do prostorových chunků (např. 256x256 jednotek).
   - Frustum culling vyřazující neviditelné objekty mimo zorné pole kamery.
3. **Procedurální Generování Mapy**:
   - Šumové funkce (Simplex / Perlin / Voronoi) pro generování biomů, výškových map a vodních toků.
4. **WebGPU Backend**:
   - Automatická volba WebGPU na podporovaných zařízeních pro ještě vyšší propustnost geometrie a shaderů.
