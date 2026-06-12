# 🗡️ PIXEL SPIRE

**A Browser-Based Deck-Building Roguelite Card Game**

[![GitHub Pages](https://img.shields.io/badge/Play%20Now-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://KristianEki11.github.io/pixel-spire)
[![JavaScript](https://img.shields.io/badge/JavaScript-Vanilla-yellow?style=for-the-badge&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS](https://img.shields.io/badge/CSS-Pixel%20Art-blue?style=for-the-badge&logo=css3)](https://developer.mozilla.org/en-US/docs/Web/CSS)

---

## 🎮 Play Now

👉 **[https://KristianEki11.github.io/pixel-spire](https://KristianEki11.github.io/pixel-spire)**

No installation required. Runs entirely in your browser. Progress is auto-saved.

---

## 📖 About

**Pixel Spire** is a turn-based card strategy game where you build a deck and battle your way through a 3-act campaign. Face 18 unique enemies across enchanted forests, crystal caverns, and shadow citadels — all rendered in a retro pixel-art aesthetic.

Inspired by *Slay the Spire* and built with zero dependencies using pure Vanilla HTML/CSS/JS.

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🃏 **56 Unique Cards** | Common, Rare, Epic, and Legendary — each with upgrade scaling |
| 👹 **18 Enemies** | Predictable intent cycles: attack, defend, buff, debuff, heal |
| 🗺️ **3-Act Campaign** | 24 hand-crafted stages across Whispering Forest, Crystal Caverns, Shadow Citadel |
| 📈 **Leveling System** | Gain XP, level up, unlock more Mana and Max HP |
| 🏪 **In-Game Shop** | Unlock cards, upgrade stats, buy HP recovery |
| 🗃️ **Deck Editor** | Build a 15–30 card deck (max 3 copies per card) |
| 📚 **Card Collection** | Browse all 56 cards with locked/unlocked state |
| 💾 **Auto-Save** | Progress saved to `localStorage` after every action |
| ⚔️ **Roguelite Loop** | Defeat = lose 20% gold, keep all cards & progress, revive at full HP |

---

## 🕹️ How to Play

### Combat
1. Each turn, draw **5 cards** and spend **Mana** to play them
2. Cards deal damage, build armor, apply status effects, or heal you
3. **End your turn** — enemies then act according to their **telegraphed intent** (shown as icons above them)
4. Repeat until all enemies fall or you die

### Status Effects
| Effect | Description |
|--------|-------------|
| 🛡️ **Armor** | Absorbs damage before HP; resets at start of your turn |
| 💪 **Strength** | Adds flat bonus to all attack damage |
| ☠️ **Poison** | Deals N damage per turn; decays by 1 each round |
| 🎯 **Vulnerable** | Takes 50% more damage from attacks |
| ⛓️ **Weak** | Deals 25% less damage with attacks |

### Campaign Map
- Click the **glowing current node** on the map to enter a stage
- **Normal** → 1–2 enemies + card reward pick
- **MiniBoss** 👑 → tough elite enemy + premium card pool
- **Boss** 🐉 → Act finale with Legendary card rewards
- **Bonus** 🎁 → Free gold + automatic card unlock, no combat

### Progression
- After each battle, **pick one card** from a pool of 3 (or skip for +⛃ 25 gold)
- Visit the **Shop** anytime from the map to unlock, upgrade cards, or restore HP
- Level up to increase Max HP (+5) and eventually Max Mana (+1 every 4 levels)

### Deck Rules
- Deck must have **15–30 cards**
- Maximum **3 copies** of the same card
- Click a card in **DECK** view to remove it; click an owned card to add it

---

## 📂 Project Structure

```
game-card/
├── index.html          — App shell: all 10 screens, script load order
├── style.css           — Retro pixel-art styling (Space Mono & Courier Prime fonts)
├── engine.js           — Combat logic, damage formula, status effects, AI
├── game.js             — Persistent state, leveling, shop, deck rules, save/load
├── ui.js               — Screen rendering, event wiring, battle animations
└── data/
    ├── cards.js        — 56 card definitions + rarity pricing
    ├── enemies.js      — 18 enemies with intent cycle patterns
    └── stages.js       — 24 stages across 3 acts with reward tables
```

---

## 🔧 Running Locally

No build step required — just serve the files with any static HTTP server:

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .

# Then open: http://localhost:8080
```

---

## 🃏 Card Rarities

| Rarity | Shop Price | Count | Notes |
|--------|-----------|-------|-------|
| Common | ⛃ 50 | 20 | Available from start |
| Rare | ⛃ 100 | 16 | Unlocked via stage rewards |
| Epic | ⛃ 200 | 11 | Available Act 2+ |
| Legendary | ⛃ 400 | 9 | Available Act 3 & Boss rewards |

---

## 🗺️ Campaign Overview

### 🌲 Act 1 — Whispering Forest
`Forest Edge → Wolf Den → 🎁 Hidden Grove → Spore Hollow → 👑 Goblin King → Bandit Camp → 🎁 Ancient Shrine → 🐲 Forest Dragon`

### 💎 Act 2 — Crystal Caverns
`Cavern Mouth → Acid Pools → 🎁 Gem Cache → Bone Gallery → 👑 Crystal Golem → Golem Forge → 🎁 Crystal Spring → 🐍 Cave Hydra`

### 🏰 Act 3 — Shadow Citadel
`Citadel Gates → Haunted Wing → 🎁 Royal Vault → Knight's Watch → 👑 Dark Champion → Gargoyle Roost → 🎁 Forbidden Library → ☠️ Lich Lord`

---

## 🛠️ Tech Stack

- **HTML5** — DOM structure, semantic screen sections
- **CSS3** — Pixel-art retro styling, `Space Mono` & `Courier Prime` (Google Fonts), CSS animations
- **JavaScript (ES5/ES6)** — No modules, no bundler — pure script-tag globals for GitHub Pages compatibility
- **localStorage** — Client-side persistent save state

---

## 📜 License

MIT License — free to use, modify, and distribute.

---

*Built with ❤️ and pixel art vibes.*
