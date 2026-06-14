# Product Requirements Document (PRD)
# Pixel Spire — Deck-Building Roguelite

**Version:** 1.2.0  
**Author:** Ki Dev
**Date:** 2026-06-15  
**Status:** ✅ v1.2.0 Complete — Live on GitHub Pages

---

## 1. Product Overview

**Pixel Spire** is a browser-based, single-player deck-building roguelite card game inspired by Slay the Spire. Players build and upgrade a card deck, traverse a 3-act linear campaign map, and engage in turn-based battles against progressively challenging enemies. The game is implemented entirely in Vanilla HTML, CSS, and JavaScript with no external dependencies, making it fully deployable via GitHub Pages.

---

## 2. Goals & Objectives

| Goal | Description |
|------|-------------|
| **Entertainment** | Deliver an engaging, replayable card-strategy experience in the browser |
| **Accessibility** | Zero install, zero dependencies — runs on any modern browser from a URL |
| **Depth** | 56 unique cards, 18 enemies across 3 acts, upgrade systems, a persistent shop, and relics |
| **Polish** | Retro pixel-art aesthetic with clear combat feedback and smooth UI transitions |
| **Persistence** | Auto-save to `localStorage` so players never lose progress |

---

## 3. Target Audience

- Casual to mid-core gamers familiar with card/roguelite games (Slay the Spire, Monster Train)
- Players who enjoy strategic deck construction and turn-based tactical combat
- Browser game players looking for a complete, self-contained experience

---

## 4. Scope

### 4.1 In-Scope (v1.0)

- ✅ Complete 3-Act campaign with 24 hand-crafted stages
- ✅ 56 playable cards across 4 rarity tiers (Common, Rare, Epic, Legendary)
- ✅ 18 unique enemies with predictable intent cycles across 3 acts
- ✅ Turn-based combat engine with status effects (Armor, Poison, Strength, Weak, Vulnerable)
- ✅ Deck Editor (10–30 cards, max 3 copies per card)
- ✅ Card Collection viewer (all 56 cards, locked/unlocked state)
- ✅ In-game Shop (unlock cards, upgrade existing cards, buy Relics, buy Max HP, Full Heal)
- ✅ Player progression system (Level, XP, Max HP scaling, Mana scaling)
- ✅ Persistent save state via `localStorage`
- ✅ Post-defeat roguelite loop (lose 20% gold, keep all progress, revive at full HP)
- ✅ Full-screen Retro pixel-art UI with dedicated image assets, Space Mono & Courier Prime typography
- ✅ Responsive layout for desktop browsers

### 4.2 Out-of-Scope (Future Versions)

- ❌ Multiplayer / PVP
- ❌ Mobile touch-optimized layout
- ❌ Procedural/randomized map generation
- ❌ Animated sprite sheets
- ❌ Audio / Sound effects
- ❌ Multiple character classes
- ❌ Achievements / leaderboards

---

## 5. Functional Requirements

### 5.1 Game Screens & Navigation

| Screen ID | Description | Entry Points |
|-----------|-------------|--------------|
| `screen-title` | Main menu with New Game / Continue | App launch |
| `screen-map` | Campaign map showing 3 acts and all 24 stages | After new/continue game; after any stage completion |
| `screen-battle` | Turn-based combat arena | Clicking an available stage node |
| `screen-rewards` | Post-combat card pick + gold/XP display | After winning a battle |
| `screen-deck` | Deck editor — add/remove cards | `DECK` button on map topbar |
| `screen-collection` | Full card gallery (locked/unlocked) | `CARDS` button on map topbar |
| `screen-shop` | Card unlock shop + upgrades + services | `SHOP` button on map topbar |
| `screen-bonus` | Treasure room reward screen | Entering a Bonus stage |
| `screen-defeat` | Defeat screen with roguelite penalty | When player HP reaches 0 |
| `screen-victory` | Game complete screen | After clearing final stage |

### 5.2 Combat System

#### 5.2.1 Turn Structure
1. **Player Turn Start:** Player armor resets to 0. Poison ticks. Draw cards until reaching Target Hand Size (Default 5). Mana refills to max.
2. **Player Action Phase:** Player plays cards from hand spending Mana. Cards are discarded after use. Auto-end turn triggers if no playable cards remain.
3. **Player End Turn:** Remaining cards in hand are retained for the next turn. Debuffs (Weak/Vulnerable) decay by 1 per turn.
4. **Enemy Phase:** Enemies act sequentially (with 650ms delay between actions) using their intent pattern cycle.
5. **End of Round:** Debuffs on enemies decay. Turn counter increments. Repeat.

#### 5.2.2 Damage Calculation
```
effectiveDamage = (baseDamage + attacker.strength) × weakMod × vulnerableMod
weakMod      = attacker.weak > 0 ? 0.75 : 1.0
vulnerableMod = target.vulnerable > 0 ? 1.5 : 1.0
actualDamage  = max(0, effectiveDamage - target.armor)
```

#### 5.2.3 Status Effects

| Status | Applied To | Effect | Duration |
|--------|-----------|--------|----------|
| **Armor (Block)** | Player & Enemies | Absorbs damage before HP | Resets to 0 at turn start |
| **Strength** | Player & Enemies | Adds flat bonus to all attack damage | Permanent until end of battle |
| **Poison** | Player & Enemies | Deals N damage at turn start; N decrements by 1 | Until reaches 0 |
| **Vulnerable** | Player & Enemies | Incoming damage ×1.5 | Decrements by 1 per round |
| **Weak** | Player & Enemies | Outgoing damage ×0.75 | Decrements by 1 per round |
| **Exhaust** | Player | Card is removed from battle after use | N/A |

### 5.3 Card System

#### 5.3.1 Card Attributes
| Field | Description |
|-------|-------------|
| `id` | Unique string identifier |
| `name` | Display name |
| `manaCost` | Energy required to play (0–5) |
| `type` | Attack / Defense / Skill / Buff / Debuff |
| `rarity` | Common / Rare / Epic / Legendary |
| `art` | Image path (e.g. `assets/cards/*.png`) |
| `effect` | Object: `{damage, hits, aoe, armor, heal, draw, energy, poison, vulnerable, weak, strength, selfDamage, purge}` |
| `description` | Template string with `{d}`, `{a}`, `{h}`, `{p}`, `{s}` placeholders |

#### 5.3.2 Card Upgrade System
Each card can be upgraded at the Shop (60 gold + 60 per existing upgrade level):
- `+2 damage` per level
- `+2 armor` per level
- `+2 heal` per level
- `+1 poison/strength` per level

#### 5.3.3 Card Pool Summary

| Rarity | Count | Shop Price | Notes |
|--------|-------|-----------|-------|
| Common | 20 | ⛃ 50 | Available from the start |
| Rare | 16 | ⛃ 100 | Unlocked via battle rewards & shop |
| Epic | 11 | ⛃ 200 | Earned in Act 2–3 stages |
| Legendary | 9 | ⛃ 400 | Unlocked in Act 3 & final boss |

**Total: 56 unique cards**

### 5.4 Enemy System

#### 5.4.1 Enemy Intent Cycle
Enemies telegraph their next action visually using intent icons on the map. They follow a looping sequence of intents:

| Intent Type | Visual | Description |
|-------------|--------|-------------|
| `attack` | ⚔️ ATK N | Deal N damage to player |
| `multiattack` | ⚔️ ATK N×H | Deal N damage H times |
| `defend` | 🛡️ DEF N | Gain N armor |
| `buff` | 💪 STR +N | Gain N Strength |
| `poison` | ☠️ PSN N | Apply N Poison to player |
| `weak` | ⛓️ WEAK N | Apply N Weak to player |
| `vulnerable` | 🎯 VULN N | Apply N Vulnerable to player |
| `heal` | 💚 HEAL N | Restore N HP |

#### 5.4.2 Enemy Roster per Act

| Act | Theme | Enemies | MiniBoss | Boss |
|-----|-------|---------|----------|------|
| Act 1 | 🌲 Whispering Forest | Goblin, Dire Wolf, Spore Cap, Forest Bandit | Goblin King (55 HP) | Forest Dragon (90 HP) |
| Act 2 | 💎 Crystal Caverns | Cave Bat, Acid Slime, Skeleton, Stone Golem | Crystal Golem (80 HP) | Cave Hydra (130 HP) |
| Act 3 | 🏰 Shadow Citadel | Cultist, Dread Knight, Wraith, Gargoyle | Dark Champion (110 HP) | Lich Lord (180 HP) |

### 5.5 Progression & Economy

#### 5.5.1 Player Leveling
- XP gained per stage completed (60–600 XP depending on stage type)
- XP to level up: `currentLevel × 100`
- Level up rewards: +5 Max HP (heals to full), +Max Mana depending on level brackets (Levels 1-10: every level, 11-20: odd levels, 21-30: every 3rd level, >30: every 4th level)

#### 5.5.2 Currency (Gold ⛃)
- Earned from completing stages (35–400 gold)
- Spent in Shop for card unlocks, upgrades, Max HP purchases, and Full Heal
- Penalty on defeat: Lose 20% of current gold

#### 5.5.3 Stage Map Structure (24 Stages)

```
Act 1 (8 stages): Forest Edge → Wolf Den → [Bonus: Hidden Grove] → Spore Hollow 
                 → Goblin King → Bandit Camp → [Bonus: Ancient Shrine] → Forest Dragon (Boss)

Act 2 (8 stages): Cavern Mouth → Acid Pools → [Bonus: Gem Cache] → Bone Gallery
                 → Crystal Golem → Golem Forge → [Bonus: Crystal Spring] → Cave Hydra (Boss)

Act 3 (8 stages): Citadel Gates → Haunted Wing → [Bonus: Royal Vault] → Knight's Watch
                 → Dark Champion → Gargoyle Roost → [Bonus: Forbidden Library] → Lich Lord (Boss)
```

- **Normal stages**: 1–2 enemies; standard card pool reward
- **MiniBoss stages**: 1 tough enemy; premium card pool reward
- **Boss stages**: 1 final Act enemy; guaranteed Legendary card pool
- **Bonus stages**: No combat; grant currency + 1 free card unlock

### 5.6 Shop

| Feature | Details |
|---------|---------|
| Card Unlock Offers | Up to 3 random locked cards offered; refreshes after each stage |
| Card Upgrades | Upgrade any unlocked card via dropdown; cost = 60 + 60×currentLevel |
| Relics | Buy persistent buffs (Hellfire Stone: ⛃ 120, Vampire Fang: ⛃ 150) |
| Max HP +5 | Cost: ⛃ 80 |
| Full Heal | Cost: ⛃ 50 (only if not at full HP) |

### 5.7 Relic System
Relics provide permanent passive benefits throughout the run.
- **Hellfire Stone**: Deals 3 damage to all enemies at the start of battle.
- **Vampire Fang**: Heal 1 HP whenever you play an Attack card.

### 5.7 Save System

- **Auto-save** triggers after every stage completion, shop purchase, level up, and defeat
- **Save key:** `pixel_spire_save_v1` in `localStorage`
- **Save data includes:** player stats, deck composition, card upgrades, relics, cleared stages, stage index, shop offers, gold, level/XP

---

## 6. Non-Functional Requirements

| Category | Requirement |
|----------|------------|
| **Performance & Efficiency** | Game must load easily on network speeds as low as 1 Mbps. Playable with 0 loading screens. |
| **Hardware Constraints** | Must run smoothly on low-end devices (e.g., 500 MB RAM and 1.0 GHz CPU). |
| **Compatibility** | Chrome 90+, Firefox 88+, Edge 90+, Safari 14+ |
| **Deployment** | Must run as a static site (GitHub Pages, no server-side logic) |
| **File Size** | Total project under 500KB |
| **Persistence** | Save data must survive browser refresh and tab close |
| **Accessibility** | Clear UI layout and semantic HTML elements. |

---

## 7. Technical Architecture

```
game-card/
├── index.html          — DOM skeleton, all 10 screen sections, script loading order
├── style.css           — Retro pixel-art CSS (Press Start 2P font, CRT aesthetic, layouts)
├── engine.js           — Combat logic, damage math, turn management, status ticks (no DOM)
├── game.js             — Persistent state, leveling, shop, deck rules, save/load
├── ui.js               — Screen rendering, event wiring, card elements, battle animations
└── data/
    ├── cards.js        — 51 card definitions, STARTING_DECK, RARITY_PRICE, getCardById()
    ├── enemies.js      — 18 enemy definitions with intent cycle arrays, getEnemyById()
    └── stages.js       — 24 stages across 3 acts, ACTS[], STAGES[], getStageByIndex()
```

### Script Loading Order
```html
data/cards.js → data/enemies.js → data/stages.js → engine.js → game.js → ui.js
```
All scripts use plain `const`/`function` globals (no ES Modules) for GitHub Pages compatibility without a bundler.

---

## 8. User Stories

| ID | User Story | Priority |
|----|-----------|----------|
| US-01 | As a player, I want to start a new game and see a campaign map so I know where to go | High |
| US-02 | As a player, I want to fight enemies by playing cards from my hand to feel strategic | High |
| US-03 | As a player, I want to see enemy intents before I act so I can plan my defense | High |
| US-04 | As a player, I want to pick a card reward after winning a battle to grow my deck | High |
| US-05 | As a player, I want to edit my deck before battles so I can tailor my strategy | High |
| US-06 | As a player, I want to buy and upgrade cards at the shop to improve across the campaign | High |
| US-07 | As a player, I want my progress to be saved automatically so I don't lose anything on refresh | High |
| US-08 | As a player, I want to see all my collected cards in a gallery to know what I've unlocked | Medium |
| US-09 | As a player, I want a defeat penalty that isn't punishing enough to make me quit | Medium |
| US-10 | As a player, I want to replay the map after winning while keeping my cards/upgrades | Low |

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| Game completion possible (Act 1–3 clearable) | ✅ Yes |
| All 24 stages playable | ✅ Yes |
| Save/load round-trip works without data loss | ✅ Yes |
| Zero external dependencies / CDN failures | ✅ Fonts only (Google Fonts) |
| Page loads in < 2 seconds | ✅ All assets < 100KB |

---

## 10. Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-06-12 | Initial release — full 3-act campaign, 51 cards, 18 enemies, shop, progression |
| 1.1.0 | 2026-06-13 | Added Relics, Exhaust mechanic, queued card plays, expanded to 56 cards, shop UI revamp |
| 1.2.0 | 2026-06-15 | Replaced emoji art with dedicated image assets, added card hand retention, auto-end turn, updated minimum deck size to 10, dynamic mana progression scaling, UI Map navigation improvements |
