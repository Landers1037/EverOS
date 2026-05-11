# Dock Enhancement Design

## Overview
Add two new dock features configurable from the Appearance settings:
1. **Dock Style** — toggle between Standard (current) and MacOS Mini
2. **Auto-Hide** — toggle to auto-hide dock with hover-to-reveal

## 1. Settings State (useSettingsStore)

### New types
```typescript
export type DockStyle = "standard" | "mini";
interface DockConfig {
  style: DockStyle;
  autoHide: boolean;
}
```

### New state fields
- `dock: DockConfig` — persisted to `everos-settings-dock` in localStorage
- `setDockStyle(style: DockStyle)` — action
- `setDockAutoHide(autoHide: boolean)` — action

### Default values
- style: `"standard"`
- autoHide: `false`

## 2. Appearance Settings UI

Add two new controls in the Appearance tab, below Desktop Background and above Default Zoom:

### Dock Style picker
Two-button toggle group (same pattern as Theme picker):
- **Standard** — current full-width dock
- **MacOS Mini** — centered floating dock with glass highlight

### Auto-Hide toggle
Switch/toggle control:
- **Off** (default) — dock always visible
- **On** — dock hidden until bottom hover

### Translation keys
```typescript
// en.ts
settings.dockStyle: "Dock Style"
settings.dockStandard: "Standard"
settings.dockMini: "MacOS Mini"
settings.autoHide: "Auto-Hide Dock"

// zh.ts
settings.dockStyle: "程序坞样式"
settings.dockStandard: "标准"
settings.dockMini: "MacOS Mini"
settings.autoHide: "自动隐藏程序坞"
```

## 3. Dock Component Changes

### MacOS Mini style
When `dock.style === "mini"`:
- Container: centered horizontally, width fits content, not full-width
- Background: `rgba(17, 19, 23, 0.85)` with `backdrop-filter: blur(24px)`
- Border: `1px solid rgba(255, 255, 255, 0.12)`
- Border radius: `18px` (`var(--radius-lg)`)
- Box shadow: `0 8px 32px rgba(0,0,0,0.4)`
- Inner highlight: subtle gradient overlay at top 40% (`linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 100%)`)
- Icon buttons: 44px (vs current 40px in Standard)
- Bottom offset: 12px gap from bottom edge (floating appearance)

When `dock.style === "standard"`:
- Current behavior unchanged (full-width, flat at bottom, 64px height)

### Auto-Hide behavior
When `dock.autoHide === true`:

**Hidden state:**
- Dock translated below viewport (`transform: translateY(100%)`)
- A thin 2px trigger line visible at the very bottom center of the screen
- Trigger line: `var(--border-strong)` color, 40px wide, centered, rounded
- The trigger line is the only visible element when dock is hidden
- Bottom area padding reduced to accommodate the trigger

**Reveal:**
- Mouse entering a 6px tall trigger zone at the very bottom of the screen starts the reveal
- Dock slides up from bottom with `transform: translateY(0)`
- Animation: 240ms, `cubic-bezier(0.22, 1, 0.36, 1)`
- After dock is fully revealed, it behaves normally (clickable icons)

**Hide:**
- Mouse leaving the dock area starts a 500ms delay timer
- If mouse re-enters the dock during the delay, timer cancels
- After delay expires, dock slides back down with same animation (reversed)
- Animation: 200ms, `ease-out`

**Edge cases:**
- If both auto-hide and Mini style are on, the dock floats up/down as a unit
- If auto-hide is disabled while dock is hidden, dock instantly appears
- On mobile, auto-hide is disabled (touch doesn't have hover)
- Settings modal is always above the dock (z-index), not affected by auto-hide

### CSS animation
```css
@keyframes dockSlideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes dockSlideDown {
  from { transform: translateY(0); }
  to { transform: translateY(100%); }
}
```

## 4. Files to Modify

| File | Change |
|---|---|
| `src/types/desktop.ts` | Add `DockStyle` type |
| `src/stores/useSettingsStore.ts` | Add `dock` state + actions + localStorage persistence |
| `src/components/desktop/Dock.tsx` | Implement two visual styles + auto-hide logic |
| `src/components/settings/SettingsModal.tsx` | Add dock style picker + auto-hide toggle |
| `src/i18n/en.ts` | Add 5 translation keys |
| `src/i18n/zh.ts` | Add 5 translation keys |
| `src/app/globals.css` | Add `dockSlideUp` / `dockSlideDown` keyframes |

## 5. Testing Notes

- Style switch: verify both styles render correctly
- Auto-hide toggle on/off: verify dock visibility toggles immediately
- Hover trigger zone: verify ~6px zone at bottom works reliably
- Mouse leave delay: verify 500ms delay before hiding
- Style + auto-hide combinations: verify all 4 combos work
- Mobile: verify auto-hide is disabled