# State Clash: Production Roadmap

> **Core Loop:** Drag across 1 or more friendly nodes to chain-select -> Point to target node -> Release to launch strike wave -> Mid-air opposing armies clash and annihilate 1:1 -> Defense Towers zap incoming threats -> Capture nodes when garrison hits 0 -> Eliminate enemy factions -> Earn coins -> Meta-upgrade stats in Armory -> Next level.
> **Format:** HTML5 High-DPI 2D Canvas (sleek minimal vector aesthetic, tactical edge highways, glowing faction nodes, particle streams).

---

## Mainline Milestones

### [x] Sprint 1: High-DPI Canvas Viewport, Game Loop, Visibility Guard & i18n Foundation
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - Responsive 2D Canvas supporting device pixel ratio (DPR) with auto-resize.
  - Fixed-timestep game loop in `src/core/loop.ts` with strict `deltaTime` clamping (`Math.min(dt, 0.1)`).
  - **Browser Lifecycle Guard (Page Visibility API):**
    - Listen to `visibilitychange` (`document.hidden`).
    - Freeze simulation clock and suspend `AudioContext` when tab is backgrounded.
    - Zero unit teleportation or delta-time accumulation on tab return.
  - Lightweight event emitter in `src/core/events.ts`.
  - Strict i18n engine in `src/i18n/index.ts` with English dictionary `src/i18n/en.ts` and `t(key)` helper. Zero raw text.
  - Title overlay in `#ui-root` with "START BATTLE" button unlocking audio and launching canvas.
- **Verification:** Canvas auto-scales without distortion; switching browser tabs freezes loop cleanly with zero delta jumps; `npx tsc --noEmit` passes.

---

### [x] Sprint 2: Node Archetypes, In-Match Upgrades & Garrison Growth
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - Define node structures in `src/core/types.ts`: id, position (x, y), radius, faction, troop count, max capacity, node type, tier level (1 to 3).
  - **Three Specialized Node Archetypes:**
    1. *City (Base):* Standard troop production (+1/s), balanced capacity (cap: 40/60/80).
    2. *Forge / Barracks:* Rapid troop production (+2.5/s), lower defensive cap (cap: 25/35/50). Prime early-game contest target.
    3. *Defense Tower:* Does NOT produce troops. Automatically fires energy bolts at hostile troops entering range, destroying them before they reach the gate.
  - **In-Match Tier Upgrade:** Double-tapping / clicking an already-selected friendly node spends 15 troops to upgrade it to the next tier (+capacity, +production rate, or +tower range).
  - Canvas 2D rendering: distinctive geometric glyphs per archetype (Circle for City, Hexagon for Forge, Shield/Turret ring for Tower).
  - Center troop count indicator and tier level pips.
- **Verification:** Cities, Forges, and Towers render with distinct visuals; Forges generate troops faster; upgrading tiers consumes troops and boosts stats cleanly.

---

### [x] Sprint 3: Multi-Node Drag Selection, Mid-Air Collisions & Marching Streams
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - **Multi-Node Drag-Through Selection:**
    - Pointer down on a friendly node initiates selection.
    - Dragging the pointer across additional friendly nodes adds them to the active selection chain (A → B → C).
    - Glowing connection line shows all nodes currently mobilized.
    - Optional "Select All" button in HUD for rapid mobilization on large maps.
  - **Trajectory Aiming & Burst Dispatch:**
    - Dragging out from the chain points a targeting vector at a destination node.
    - Releasing pointer over destination dispatches 50% of garrison from ALL selected nodes simultaneously.
  - **Mid-Air Troop Collisions (Counter-Course Annihilation):**
    - Troops travel as discrete orbs with faction color, radius, and coordinate velocity.
    - Spatial check: when an attacking troop encounters an opposing enemy troop travelling on counter paths within collision threshold, **both units mutually annihilate 1:1** with a spark particle burst.
    - Eliminates unrealistic base-trading; armies clash in the field.
  - **Tower Zone Interception:**
    - Defense Towers scan for passing hostile troops and shoot homing projectiles, destroying them mid-march.
- **Verification:** Swiping through 3 bases and releasing on an enemy node launches troops from all 3 bases; opposing armies meeting in open field destroy each other 1:1; Towers shoot down incoming hostiles.

---

### [x] Sprint 4: Smart Bot AI & Multi-Faction Warfare
- **Recommended Model:** `Claude 3.5 / 3.7 Opus`
- **Scope:**
  - Autonomous bot decision loop in `src/game/ai-controller.ts` evaluated every 0.8–1.5 seconds per bot.
  - Strategic threat & opportunity assessment:
    - Prioritizes neutral Forges for early economy.
    - Avoids attacking into active Defense Tower fire zones unless mounting a coordinated overwhelming strike.
    - Multi-Node Bot Strikes: if a single base cannot take a target, the bot mobilizes 2–3 nearby friendly bases simultaneously.
    - In-Match Upgrades: bots invest surplus troops into upgrading high-value bases to Tier 2/3.
  - Bot Factions & Personalities:
    - *Crimson Red:* Aggressive rusher (targets weakest neighbors and Forges immediately).
    - *Amber Orange:* Defensive architect (upgrades Towers and consolidates before striking).
- **Verification:** 3-way matches (Player vs Red vs Amber) feel tactical and challenging; bots use multi-node attacks and respect tower threat zones.

---

### [x] Sprint 5: Graph Topology, Obstacles & Procedural Level Generator
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - **Procedural Graph Generator (`src/game/map-generator.ts`):**
    - Generates 6 to 14 nodes per level with Poisson-disc spacing.
    - Node type distribution: 60% Cities, 25% Forges, 15% Defense Towers.
  - **Topological Highways & Obstacles:**
    - Visible graph edges/roads connect neighboring nodes.
    - Natural obstacles (mountains/chasms) block direct line of sight between certain nodes, requiring armies to march along established network edges.
  - **Guaranteed Fair Graph Connectivity:**
    - Breadth-First Search (BFS) / Flood-Fill validation: guarantees 100% of nodes are reachable from every base.
    - Symmetric distance balance: player and bot starting bases have comparable transit distances to high-value neutral Forges/Towers.
  - **Win / Loss Evaluation:**
    - Victory: 100% of enemy factions eliminated.
    - Defeat: Player loses all bases and troops.
    - Level progression index advancing to next challenge.
- **Verification:** Maps generate without deadlocks, isolated islands, or unfair spawns; troops march along valid highway paths around obstacles.

---

### [x] Sprint 6: Meta-Progression Armory & LocalStorage Economy
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - Economy loop: earn coins upon victory based on completion speed and captured territory percentage.
  - Persistent storage manager saving: `coins`, `currentLevel`, `purchasedUpgrades`.
  - Permanent Armory Shop accessible from menu and post-battle modal:
    - *Base Production Rate:* +8% universal garrison growth per tier.
    - *Starting Troops:* +5 initial troops in starting base per tier.
    - *March Velocity:* +10% troop movement speed per tier.
    - *Tower Fortification:* +15% Tower firing rate and projectile range per tier.
  - Costs scale exponentially per upgrade tier.
- **Verification:** Upgrades persist across page refreshes and apply correctly to match parameters.

---

### [x] Sprint 7: Web Audio Synthesis & Visual Juiciness
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - Zero-asset Web Audio synthesizer in `src/audio/audio-manager.ts`:
    - Chain selection whoosh as nodes are selected.
    - Pop / sizzle sound on mid-air troop annihilation.
    - Tower laser/bolt discharge sound.
    - Heavy resonance bass boom on base capture.
    - Victory fanfare and defeat chord.
  - Visual juice:
    - Shockwave ripple on base capture and tier upgrade.
    - Particle sparks when opposing troops collide mid-air.
    - Glowing neon trajectory lines with marching energy pulses.
    - Subtle screen shake impulse when a key stronghold falls.
- **Verification:** High-impact audio/visual feedback without performance drops on low-end mobile devices.

---

### [x] Sprint 8: Portal Release & One-Click Packager (CrazyGames & Itch)
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - Multi-language dictionary: English (`en`), Russian (`ru`), Polish (`pl`), Spanish (`es`).
  - Rewarded ad hooks: "Double Victory Coins" and "Emergency Reinforcements (+20 troops)".
  - Audit `vite.config.ts` (`base: './'`) for iframe CDN compatibility.
  - Run `npm run pack` to generate clean `state-clash-web.zip` with `index.html` at root.
  - Full mobile touch responsiveness audit.
- **Verification:** Output zip runs standalone, passes all build checks, zero iframe 404s.

---

## Quality of Life (QOL) Milestones

### [x] QOL 1: Visual Overhaul & Tactical Aesthetics
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - **Procedural Landscape & Territory Influence:**
    - Replace basic grid with dark tactical biome: subtle topographic elevation isolines and radial vignette.
    - Dynamic territorial control auras (Voronoi/gradient blend from bases in faction colors) showing expanding territorial dominance like in State.io.
  - **Vector Structural Node Icons:**
    - *City:* Fortified citadel/castle bastion with crenellated walls and faction emblem.
    - *Forge:* Industrial factory with dual smokestacks, cogwheel rim, and pulsing energy core.
    - *Defense Tower:* Dual-barrel rotating turret mounted on an octagonal armored platform with dynamic aim toward nearest enemy.
    - High-contrast central troop badge and glowing military chevron/star tier pips.
  - **Micro-Troop Vanguards:**
    - Replace generic dots with directed delta-chevron vanguard assault fighters oriented along velocity vector (`atan2(vy, vx)`).
    - Glowing engine thruster trails for marching columns.
  - **Tactical Double-Rail Highways:**
    - Sleek double-line highway corridors with animated directional flow chevrons.
- **Verification:** High-DPI 60 FPS performance maintained; distinct iconography readable at a glance on mobile; build passes without external image assets.

---

### [x] QOL 2: Continental Landmass, State Borders & Direct Marching
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - **Eliminate Railroads & Ricochet Pathing (Direct Open March):**
    - Remove intermediate graph waypoint ricocheting in `troop-system.ts`. Troops march directly from source to target along straight vectors with natural stream spread (±6px).
    - Remove artificial highway rails (`renderEdges`) to give a clean open tactical field.
    - Update Bot AI (`ai-evaluator.ts`) to evaluate direct Euclidean trajectories and direct tower intercept lines.
  - **Organic Continent & Ocean (State.io Style):**
    - Render the playable map as an organic continent/landmass with smooth coastlines surrounded by deep tactical ocean.
    - Subtle coastal shelf line / ocean contour to create clear visual separation of land vs water.
  - **Territory / Province Partitioning (Conquering States):**
    - Partition the continental landmass into distinct country/state provinces around each node (Voronoi cell polygons).
    - Fill each province polygon with its faction's color (tinted fill) and thick stylish borders separating neighboring states.
    - When a base is captured, its entire province dynamically updates to the conqueror's faction color!
- **Verification:** Armies march directly without bouncing; capturing a base visibly paints the whole country/province; 60 FPS with zero external assets.

---

### [x] QOL 3: 4-Lane Phalanx Waves, Full Shop, ESC Menu, Dynamic Maps & Custom Art
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - **4-Lane Army Phalanx Dispatch:**
    - Troop waves march 4 abreast in parallel lanes (lateral offsets: -12, -4, +4, +12 px) spawning up to 4 units simultaneously per tick.
    - Troops swarm out 4x faster in impressive military invasion phalanxes.
  - **Clean Minimal HUD & ESC Pause Menu:**
    - Strip all clutter from the top HUD during battle: display ONLY `Level X` on the left and a sleek pause button `[ II ]` on the right (using `art/pause.png`).
    - ESC key or pause button opens Pause Menu modal: Resume, Restart, Shop, Settings (Sound toggle with `art/sound-on.png`/`art/sound-off.png`, Language), Main Menu.
  - **Title / Main Menu:**
    - Start Battle, Shop, Settings.
  - **Massive Map Scaling (Levels 10, 20, 30+):**
    - Dynamic node scaling up to 28-32 bases on level 25-30+ with responsive base radius adjustment so large maps don't overlap.
  - **Expanded Shop (Upgrades, Skins, Biomes):**
    - 3 tabs: Upgrades (existing 4 branches), Troop Skins (Vanguard, Drones, Tanks, Phantoms), Arena Biomes (Cyber Ocean, Volcanic Magma, Emerald Acid, Arctic Glaciers).
    - Save equipped skin and arena in `PlayerSaveData`.
  - **Zero Windows 11 / Emoji Icons:**
    - Strictly use custom PNG art from `art/` (`coin.png`, `sound-on.png`, `sound-off.png`, `pause.png`, `shop.png`, `double.png`, `airdrop.png`) across all UI elements, modals, and buttons. Zero unicode emojis.
- **Verification:** 4-lane waves swarm smoothly; clean HUD with only Level; ESC menu functions; Shop equips skins and arena biomes; build passes with custom art.

---

### [x] QOL 4: Tactical Army Classes (Troop Skin Perks & Strategic Asymmetry)
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - **4 Unique Troop Skin Perks (src/game/cosmetics-config.ts):**
    - *Vanguard (Standard):* Balanced baseline. +0% modifiers. Stable, reliable assault infantry.
    - *Cyber Drones:* Rapid Interceptors. **+25% March Speed**, blitzes across large maps before enemies can react.
    - *Siege Tanks:* Heavy Armor. -10% March Speed, but **+25% Siege Damage** (deals 1.25 damage to hostile garrisons, capturing fortresses with fewer units).
    - *Stealth Phantoms:* Electronic Cloaking. **50% Tower Evasion** (defense towers have 50% chance to miss/fail to target Phantoms mid-march).
  - **Shop UI Perk Descriptions (src/ui/shop-cards.ts & i18n):**
    - Display explicit stat badges for each skin perk in the Shop cards.
  - **Gameplay Integration:**
    - Hook perks into `troop-system.ts` (speed and garrison damage) and `tower-system.ts` (tower targeting check).
- **Verification:** Equipped skin grants its corresponding combat perk; perks display clearly in Shop cards; passes compilation without errors.

---

### [x] QOL 5: Level Select Grid, Dedicated Settings & Clean In-Game Pause
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - **In-Game ESC Pause Menu Overhaul (src/ui/pause-modal.ts):**
    - REMOVE Shop button during active battle.
    - Buttons: RESUME, RESTART LEVEL, SETTINGS (opens dedicated settings modal), MAIN MENU.
  - **Dedicated Settings Screen (src/ui/settings-modal.ts):**
    - Clean modal containing Sound toggle (with `art/sound-on.png` / `art/sound-off.png`) and Language selector (EN / RU / PL / ES).
    - Accessible both from Main Menu and from ESC Pause Menu.
  - **Main Menu Navigation (src/ui/title-screen.ts):**
    - Primary buttons: PLAY, SELECT LEVEL, SHOP, SETTINGS.
  - **Level Select 30-Level Grid (src/ui/level-select-modal.ts):**
    - 30 level tiles (1 to 30) arranged in a responsive grid.
    - Levels <= maxUnlocked: active clickable tile showing level number; clicking loads that level and launches battle.
    - Levels > maxUnlocked: locked tile displaying `<img src="./art/lock.png">`.
    - Allows player to replay any previously beaten level.
  - **Storage Manager Progression:**
    - Separate `maxUnlockedLevel` from `currentLevel` so replaying earlier levels doesn't reset overall progress.
- **Verification:** ESC menu has no Shop; Settings opens cleanly; Level Select grid shows locks and launches chosen level; build passes without errors.

---

### [ ] QOL 6: QA Ad Shield & Safe Rewarded Integration (Zero Dead Buttons)
- **Recommended Model:** `Claude 3.5 Sonnet`
- **Scope:**
  - **PortalAdManager (`src/platform/portal-ad-manager.ts`):**
    - Add `isAvailable(): boolean` returning `true` only if `window.CrazyGames?.SDK` or `window.PokiSDK` is present, or if `new URLSearchParams(window.location.search).has('debugAds')` is true.
    - If `isAvailable()` is false, `showRewardedAd()` immediately resolves to `false` without simulating fake delays.
  - **Airdrop Button (`src/ui/airdrop-button.ts` & `src/main.ts`):**
    - Accept `PortalAdManager` (or availability predicate).
    - In `reset()`: if `!ads.isAvailable()`, remain strictly hidden (`this.button.hidden = true`). Never show unclickable or fallback buttons without SDK.
  - **End Modal (`src/ui/end-modal.ts`):**
    - In `show()`: only append the `createDoubleButton` if `result.coins > 0 && this.ads.isAvailable()`. If SDK is absent, hide the double reward button completely.
  - **Main Menu / Game Flow Audit:**
    - Verify that no dead buttons exist anywhere in the game flow.
- **Verification:**
  - When loaded without portal SDK (default): Airdrop button and Double Coins button do not appear in DOM / stay completely hidden (zero dead buttons, passes CrazyGames & Poki QA review).
  - When loaded with `?debugAds=1`: both buttons appear and can be tested.
  - `npx tsc --noEmit` and `npm run build` pass cleanly.

