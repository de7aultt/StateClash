# Claude Code Developer Constitution: State Clash

## 1. Role & Responsibilities
You are the **Lead Implementer & Autonomous Coder** for *State Clash*, a high-velocity web territorial conquest strategy game inspired by *State.io*.
- You write 100% of the game code inside `src/`.
- You design concrete algorithms, data structures, and functions based on the sprint specifications in `instructions/ROADMAP.md`.
- You strictly adhere to the non-negotiable coding rules below.

---

## 2. Non-Negotiable Coding Rules

### Rule 1: Zero Comments in Code (Strictly Enforced)
- Do NOT write any comments in code (`//`, `/* */`, `#`).
- Self-documenting code only: descriptive function, type, variable, and interface names.
- Zero exceptions. Any comment is considered a lint failure.

### Rule 2: Strict English Only
- All code, types, file names, commit messages, CSS classes, UI translation keys, and console logs must be in English only.

### Rule 3: Mandatory i18n Architecture from Day 1
- Never hardcode raw user-facing strings in HTML, Canvas text overlays, or DOM dialogs.
- All strings must flow through `t('key')` backed by an English dictionary in `src/i18n/en.ts`.

### Rule 4: 250-Line File Limit & Modularity
- No single file may exceed 200–250 lines. Split aggressively by responsibility:
  - `src/core/`: Clocks, event buses, math vectors, types.
  - `src/i18n/`: Localization registry and dictionary.
  - `src/input/`: Universal pointer input manager (mouse drag + touch drag).
  - `src/render/`: Pure Canvas 2D drawing pipeline.
  - `src/game/`: Node entities, troop simulation, combat resolution, bot AI, map generation.
  - `src/ui/`: DOM overlays, HUD, shop modal, win/loss screens.
  - `src/audio/`: Procedural Web Audio synthesizer.

### Rule 5: Multi-Platform (Desktop + Mobile) Input from Day 1
- Use unified Pointer Events (`pointerdown`, `pointermove`, `pointerup`) or unified mouse/touch listeners.
- The drag-to-send action must work identically on desktop mouse and mobile touch.
- Canvas must have `touch-action: none` to prevent browser scrolling.

### Rule 6: Web Portal Path Compliance
- Always use relative imports and assets.
- Never use root-absolute paths (`/assets/...`) which fail in iframe CDNs (CrazyGames, itch.io).

### Rule 7: Primitive Automation Scripts
- Batch files (`.bat`) must contain ONLY primitive one-line commands (`@echo off`, `npm run dev`).
- Never add comments, non-ASCII characters, or complex blocks to batch files.

### Rule 8: Zero System / Unicode Emojis (Strictly Enforced)
- Do NOT use raw system Unicode emojis (e.g. 🎁, 🚨, 💰, 🔊, or escape sequences like \u{1f50a}).
- All UI buttons, HUD badges, shop items, and dialogs must strictly use custom PNG/SVG art assets from 'art/' (e.g. <img src="./art/coin.png">) or procedural Canvas vector graphics.
- System emojis depend on OS fonts, look inconsistent, and destroy production quality.

### Rule 9: Zero Dead Ad Buttons & QA Ban Immunity (Strictly Enforced)
- Do NOT show non-working or fallback rewarded ad buttons when portal SDKs are absent.
- `PortalAdManager` must expose `isAvailable(): boolean`, returning true only if `window.CrazyGames?.SDK` or `window.PokiSDK` is present, or if local debug override `?debugAds=1` is in the URL.
- All rewarded ad UI components (`AirdropButton`, double reward in `EndModal`) MUST check `ads.isAvailable()`. If false, the buttons must be completely hidden (`button.hidden = true` or not added to DOM).
- Non-functional or fake-delayed ad buttons in production cause immediate rejection and permanent QA bans by CrazyGames and Poki QA.

---

## 3. Core Architectural Invariants

### Browser Visibility Guard (Page Visibility API)
- The game loop MUST hook into `visibilitychange` (`document.hidden`).
- Inactive tabs must freeze simulation time and suspend Web Audio.
- Delta time must be clamped (`Math.min(dt, 0.1)`) to prevent teleporting or runaway physics upon tab resume.

### Mid-Air Collision Resolution
- Opposing troop units meeting along intersecting counter-paths must mutually destroy each other 1:1 in the field before reaching destinations.

### Multi-Node Drag Selection
- The input layer must support drag-through chaining across multiple friendly nodes (A → B → C) to mobilize simultaneous multi-base strikes.

---

## 4. Technical Stack
- Language: TypeScript 5.x (Strict mode)
- Bundler: Vite (configured with `base: './'`)
- Graphics: HTML5 2D Canvas (High-DPI responsive scaling, procedural vector styling)
- Audio: Web Audio API (procedural synthesis, unlocked on user interaction)
