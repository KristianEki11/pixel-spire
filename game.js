/* ============================================================
   GAME — persistent state, progression, leveling, shop logic.
   ============================================================ */
const SAVE_KEY = "pixel_spire_save_v1";
const DECK_MIN = 10, DECK_MAX = 30, MAX_COPIES = 3;

const Game = {
  state: null,

  /* ---- new game defaults ---- */
  defaultState() {
    return {
      playerLevel: 1, playerXp: 0,
      currency: 75,
      hp: 60, maxHp: 60, maxMana: 3,
      unlockedCards: STARTING_UNLOCKS.slice(),
      deck: STARTING_DECK.slice(),
      cardUpgrades: {},            // { cardId: level }
      relics: [],                  // player acquired relics
      curses: [],                  // curse card ids added to deck context
      stageIndex: 0,               // next stage to play in STAGES
      clearedStages: [],           // stage ids
      shopOffers: null,            // current 3 shop unlock offers
      gameComplete: false,
      run: null,                   // generated node path (see Run.generateRun)
      pendingReward: null,         // e.g. {kind:"relicDraft",tier,count} between battle->draft
    };
  },

  /* ---- persistence ---- */
  save() { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); },
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      this.state = JSON.parse(raw);
      this.migrate();
      return true;
    } catch (e) { return false; }
  },
  hasSave() { return !!localStorage.getItem(SAVE_KEY); },
  newGame() {
    this.state = this.defaultState();
    this.rollShopOffers();
    Run.generateRun(this.currentAct());
    this.save();
  },

  /* ---- save migration (keeps old saves working) ---- */
  migrate() {
    const s = this.state;
    if (!s.relics) s.relics = [];
    if (!s.curses) s.curses = [];
    if (s.pendingReward === undefined) s.pendingReward = null;
    if (!s.run) {
      // Old save: synthesize a run for the act the player is currently in.
      Run.generateRun(this.currentAct());
    }
  },

  /* ---- leveling ---- */
  xpForNext() { return this.state.playerLevel * 100; },
  gainXp(amount) {
    const s = this.state;
    s.playerXp += amount;
    let levels = 0;
    let manaGained = 0;
    while (s.playerXp >= this.xpForNext()) {
      s.playerXp -= this.xpForNext();
      s.playerLevel++;
      s.maxHp += 5;
      s.hp = s.maxHp;               // full heal on level up
      
      let getsMana = false;
      if (s.playerLevel <= 10) {
        getsMana = true;
      } else if (s.playerLevel <= 20) {
        getsMana = (s.playerLevel % 2 !== 0); // odd levels only
      } else if (s.playerLevel <= 30) {
        getsMana = (s.playerLevel % 3 === 0);
      } else {
        getsMana = (s.playerLevel % 4 === 0);
      }
      if (getsMana) { s.maxMana++; manaGained++; }
      
      levels++;
    }
    this.save();
    return { levels, manaGained };
  },

  /* ---- stage / progression ---- */
  currentStage() { return STAGES[this.state.stageIndex] || null; },
  currentAct() {
    // The run is the source of truth once it exists; fall back to STAGES.
    if (this.state && this.state.run && this.state.run.act) return this.state.run.act;
    const st = this.currentStage();
    return st ? st.act : 3;
  },
  completeStage(stage) {
    const s = this.state;
    s.clearedStages.push(stage.id);
    s.currency += stage.rewards.currency;
    const levelInfo = this.gainXp(stage.rewards.xp);
    if (s.stageIndex < STAGES.length - 1) s.stageIndex++;
    else s.gameComplete = true;
    this.rollShopOffers();          // fresh shop each stage
    this.save();
    return levelInfo;
  },
  onDefeat() {
    const s = this.state;
    s.currency = Math.max(0, s.currency - Math.floor(s.currency * 0.2)); // lose 20% gold
    s.hp = s.maxHp;                  // revive at full HP
    this.save();
  },
  replayMap() {
    const s = this.state;
    s.stageIndex = 0; s.clearedStages = []; s.gameComplete = false;
    s.hp = s.maxHp;
    s.relics = [];
    s.curses = [];
    s.activeShopMarkup = 0;
    s.pendingReward = null;
    s.run = null;
    this.rollShopOffers();
    Run.generateRun(1);
    this.save();
  },

  /* ---- unlocks ---- */
  unlockCard(id) {
    if (!this.state.unlockedCards.includes(id)) {
      this.state.unlockedCards.push(id);
      this.save();
      return true;
    }
    return false;
  },

  /* ---- deck rules ---- */
  deckCount(id) { return this.state.deck.filter(c => c === id).length; },
  canAddToDeck(id) {
    return this.state.deck.length < DECK_MAX && this.deckCount(id) < MAX_COPIES
      && this.state.unlockedCards.includes(id);
  },
  addToDeck(id) { if (this.canAddToDeck(id)) { this.state.deck.push(id); this.save(); return true; } return false; },
  removeFromDeck(index) {
    if (this.state.deck.length > 0) { this.state.deck.splice(index, 1); this.save(); return true; }
    return false;
  },
  /* Playable (non-curse) card count for validation. Curses are extra
     dead weight added by events and do not count toward deck limits. */
  playableDeckCount() {
    return this.state.deck.filter(id => !(typeof isCurseId === "function" && isCurseId(id))).length;
  },
  deckValid() {
    const n = this.playableDeckCount();
    return n >= DECK_MIN && n <= DECK_MAX;
  },

  /* ---- shop ---- */
  rollShopOffers() {
    const locked = CARDS.filter(c => !this.state.unlockedCards.includes(c.id)).map(c => c.id);
    const picks = [];
    const pool = locked.slice();
    while (picks.length < 3 && pool.length) {
      picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    this.state.shopOffers = picks;
  },
  /* Card price including any one-shop markup (from Merchant's Debt). */
  cardPrice(id) {
    const card = getCardById(id);
    const base = RARITY_PRICE[card.rarity];
    const markup = this.state.activeShopMarkup || 0;
    return Math.round(base * (1 + markup));
  },
  buyCard(id) {
    const price = this.cardPrice(id);
    if (this.state.currency < price) return false;
    this.state.currency -= price;
    this.unlockCard(id);
    this.state.shopOffers = this.state.shopOffers.filter(o => o !== id);
    this.save();
    return true;
  },
  upgradePrice(id) { return 60 + (this.state.cardUpgrades[id] || 0) * 60; },
  buyUpgrade(id) {
    const price = this.upgradePrice(id);
    if (this.state.currency < price) return false;
    this.state.currency -= price;
    this.state.cardUpgrades[id] = (this.state.cardUpgrades[id] || 0) + 1;
    this.save();
    return true;
  },
  buyRelic(id) {
    const price = id === "hellfire_stone" ? 120 : 150;
    if (this.state.currency < price || (this.state.relics && this.state.relics.includes(id))) return false;
    if (!this.state.relics) this.state.relics = [];
    this.state.currency -= price;
    this.state.relics.push(id);
    this.save();
    return true;
  },
  buyMaxHp() {       // +5 max HP for 80 gold
    if (this.state.currency < 80) return false;
    this.state.currency -= 80; this.state.maxHp += 5; this.state.hp += 5;
    this.save(); return true;
  },
  buyHeal() {        // full heal for 50 gold
    if (this.state.currency < 50 || this.state.hp >= this.state.maxHp) return false;
    this.state.currency -= 50; this.state.hp = this.state.maxHp;
    this.save(); return true;
  },
};

/* ============================================================
   RUN — roguelite node layer built on top of the designed
   STAGES list. Generates a per-act path of encounters, resolves
   node types, and applies event/relic/curse effects.
   Combat/miniboss/boss nodes reuse the existing STAGES + Engine.
   ============================================================ */
const Run = {

  /* ---- shorthand ---- */
  get s() { return Game.state; },
  cur() { return this.s.run; },

  /* random helpers */
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  /* ============================================================
     generateRun(act) — build the node path for an act.
     Strategy: take the designed stages for the act. Keep the
     MiniBoss and Boss in their slots as combat nodes. Fill the
     remaining slots from NODE_COMPOSITION weights, then enforce
     pacing (no two events back-to-back when avoidable).
     ============================================================ */
  generateRun(act) {
    const stages = STAGES.filter(st => st.act === act);
    const normals  = stages.filter(st => st.type === "Normal");
    const miniboss = stages.find(st => st.type === "MiniBoss");
    const boss     = stages.find(st => st.type === "Boss");
    const eliteTier = ACT_RELIC_TIER[act] || "common";

    // Build a weighted bag of non-combat node types for this act.
    const comp = NODE_COMPOSITION[act] || NODE_COMPOSITION[1];
    const bag = [];
    Object.keys(comp).forEach(type => {
      if (type === "combat") return; // combats come from real stages
      for (let i = 0; i < comp[type]; i++) bag.push(type);
    });
    const shuffledExtras = this.shuffle(bag);

    // Interleave normal-combat stages with the extra (non-combat) nodes.
    const path = [];
    const normalQueue = normals.slice();
    let extraIdx = 0;

    // Alternate: combat, extra, combat, extra ... until both drained.
    while (normalQueue.length || extraIdx < shuffledExtras.length) {
      if (normalQueue.length) {
        const st = normalQueue.shift();
        path.push({ type: "combat", stageId: st.id });
      }
      if (extraIdx < shuffledExtras.length) {
        path.push(this.makeNode(shuffledExtras[extraIdx++], eliteTier));
      }
    }

    // MiniBoss (if any) goes before the final stretch; Boss is always last.
    if (miniboss) {
      const insertAt = Math.max(1, Math.floor(path.length * 0.6));
      path.splice(insertAt, 0, { type: "combat", stageId: miniboss.id, role: "miniboss" });
    }
    if (boss) path.push({ type: "combat", stageId: boss.id, role: "boss" });

    // Pacing pass: avoid two 'event' nodes in a row by swapping with a
    // nearby non-event, non-boss node.
    this.spaceOutEvents(path);

    this.s.run = {
      act,
      stageIndex: 0,
      path,
      usedEvents: (this.s.run && this.s.run.usedEvents) ? this.s.run.usedEvents : [],
      flags: { guaranteeElite: false, shopMarkup: 0 },
    };
    Game.save();
    return this.s.run;
  },

  /* Build a single non-combat node, resolving an event/treasure tier. */
  makeNode(type, eliteTier) {
    if (type === "event")    return { type: "event", dataId: this.rollEventId() };
    if (type === "elite")    return { type: "elite", tier: eliteTier };
    if (type === "treasure") return { type: "treasure", tier: eliteTier };
    if (type === "camp")     return { type: "camp" };
    if (type === "shop")     return { type: "shop" };
    return { type: "combat" };
  },

  /* Weighted event selection respecting actRange and oncePerRun. */
  rollEventId() {
    const act = this.s.run ? this.s.run.act : Game.currentAct();
    const used = (this.s.run && this.s.run.usedEvents) || [];
    const pool = EVENTS.filter(e =>
      e.actRange[0] <= act && act <= e.actRange[1] &&
      !(e.oncePerRun && used.includes(e.id))
    );
    if (!pool.length) return this.pick(EVENTS).id;
    const total = pool.reduce((sum, e) => sum + (e.weight || 1), 0);
    let roll = Math.random() * total;
    for (const e of pool) { roll -= (e.weight || 1); if (roll <= 0) return e.id; }
    return pool[0].id;
  },

  /* Prevent back-to-back events where a safe swap exists. */
  spaceOutEvents(path) {
    for (let i = 1; i < path.length; i++) {
      if (path[i].type === "event" && path[i - 1].type === "event") {
        // find the nearest later node that is not event/boss/miniboss to swap
        for (let j = i + 1; j < path.length; j++) {
          const t = path[j].type, role = path[j].role;
          if (t !== "event" && role !== "boss" && role !== "miniboss") {
            [path[i], path[j]] = [path[j], path[i]];
            break;
          }
        }
      }
    }
  },

  /* ---- current node + advancement ---- */
  currentNode() {
    const r = this.cur();
    if (!r) return null;
    return r.path[r.stageIndex] || null;
  },
  isRunComplete() {
    const r = this.cur();
    return r ? r.stageIndex >= r.path.length : false;
  },

  /* Resolve the stage object backing a combat/elite node. */
  stageForNode(node) {
    if (node.stageId) return STAGES.find(st => st.id === node.stageId);
    // Elite nodes have no designed stage: synthesize one from a normal stage.
    const normals = STAGES.filter(st => st.act === this.cur().act && st.type === "Normal");
    const base = this.pick(normals) || STAGES.find(st => st.act === this.cur().act);
    return base;
  },

  /* Build a harder stage clone for an elite encounter. */
  makeEliteStage(node) {
    const base = this.stageForNode(node);
    const clone = JSON.parse(JSON.stringify(base));
    clone.id = `elite_${this.cur().act}_${this.cur().stageIndex}`;
    clone.type = "Elite";
    clone.name = `Elite: ${base.name}`;
    clone.icon = "🔱";
    clone.isElite = true;
    clone.eliteTier = node.tier || "common";
    // Bigger gold; relic draft handled separately as the reward.
    clone.rewards = Object.assign({}, base.rewards, {
      currency: Math.round((base.rewards.currency || 40) * 1.8),
      cardPool: [], // elite reward is a relic draft, not a card
    });
    return clone;
  },

  /* Advance to the next node; regenerate next act when this one ends. */
  advanceNode() {
    const r = this.cur();
    if (!r) return;
    r.stageIndex++;
    if (r.stageIndex >= r.path.length) {
      // Act complete -> move stageIndex pointer in STAGES + start next act.
      const nextAct = Math.min(3, r.act + 1);
      if (r.act >= 3) {
        this.s.gameComplete = true;
      } else {
        this.generateRun(nextAct);
      }
    }
    Game.save();
  },

  /* ============================================================
     COMBAT COMPLETION — grant rewards for a node win.
     For elite/boss/combat: gold + xp. Card-pick reward handled
     by UI (rewards screen). Elite additionally sets a pending
     relic draft. Does NOT advance the node (UI advances after
     the reward screen is dismissed).
     ============================================================ */
  completeCombatNode(stage, node) {
    const s = this.s;
    s.currency += stage.rewards.currency || 0;
    // copper_coil relic: extra gold on combat clears
    if (s.relics.includes("copper_coil")) {
      const coil = getRelicById("copper_coil");
      s.currency += coil.value;
    }
    const levelInfo = Game.gainXp(stage.rewards.xp || 0);
    s.clearedStages.push(stage.id);
    if (node && node.type === "elite") {
      s.pendingReward = { kind: "relicDraft", tier: node.tier || "common", count: 3 };
    }
    Game.save();
    return levelInfo;
  },

  rollShopOffers() { Game.rollShopOffers(); },

  /* ============================================================
     RELICS — acquisition + immediate onAcquire effects.
     ============================================================ */
  addRelic(id) {
    const s = this.s;
    if (!id || s.relics.includes(id)) return false;
    s.relics.push(id);
    const r = getRelicById(id);
    if (r && r.onAcquire) {
      if (r.onAcquire.maxHp) { s.maxHp += r.onAcquire.maxHp; s.hp += r.onAcquire.maxHp; }
      if (r.onAcquire.gold)  { s.currency += r.onAcquire.gold; }
      if (r.onAcquire.heal)  { s.hp = Math.min(s.maxHp, s.hp + r.onAcquire.heal); }
    }
    Game.save();
    return true;
  },
  addRandomRelic(tier) {
    const choices = generateRelicChoices(tier, 1, true);
    if (!choices.length) return null;
    this.addRelic(choices[0].id);
    return choices[0];
  },

  /* ============================================================
     CURSES + deck mutations used by events/campfire.
     ============================================================ */
  addCurse(curseId) {
    const s = this.s;
    let id = curseId;
    if (!id || id === "random") id = this.pick(CURSES).id;
    s.curses.push(id);
    s.deck.push(id);            // curses live in the deck so they clog draws
    Game.save();
    return id;
  },
  removeDeckCardAt(index) {
    const s = this.s;
    if (index < 0 || index >= s.deck.length) return false;
    const id = s.deck[index];
    s.deck.splice(index, 1);
    if (isCurseId(id)) {
      const ci = s.curses.indexOf(id);
      if (ci !== -1) s.curses.splice(ci, 1);
    }
    Game.save();
    return true;
  },
  upgradeDeckCard(id) {
    if (isCurseId(id)) return false;
    this.s.cardUpgrades[id] = (this.s.cardUpgrades[id] || 0) + 1;
    Game.save();
    return true;
  },
  duplicateDeckCard(id) {
    if (this.s.deck.length >= DECK_MAX) return false;
    this.s.deck.push(id);
    Game.save();
    return true;
  },
  randomCardByRarity(rarity) {
    const pool = CARDS.filter(c => c.rarity === rarity);
    return pool.length ? this.pick(pool).id : null;
  },
  restHeal() {
    const s = this.s;
    const amount = Math.round(s.maxHp * 0.25);
    s.hp = Math.min(s.maxHp, s.hp + amount);
    Game.save();
    return amount;
  },

  /* ============================================================
     applyEffect(effect, ctx) — resolve a single event effect.
     Returns an optional descriptor for effects the UI must
     handle interactively (pickers / drafts):
       { interactive:"upgradeCard" | "removeCard" | "transformCard"
                     | "duplicateCard" | "relicDraft" | "cardDraft", ... }
     Non-interactive effects mutate state and return null.
     ============================================================ */
  applyEffect(effect) {
    const s = this.s;
    switch (effect.type) {
      case "gold":        s.currency = Math.max(0, s.currency + effect.value); Game.save(); return null;
      case "heal": {
        if (effect.value < 0) s.hp = Math.max(1, s.hp + effect.value);
        else s.hp = Math.min(s.maxHp, s.hp + effect.value);
        Game.save(); return null;
      }
      case "healPercent": {
        const amt = Math.round(s.maxHp * effect.value);
        s.hp = Math.min(s.maxHp, s.hp + amt); Game.save(); return null;
      }
      case "maxHp": {
        s.maxHp = Math.max(1, s.maxHp + effect.value);
        if (s.hp > s.maxHp) s.hp = s.maxHp;
        if (effect.value > 0) s.hp += effect.value;
        Game.save(); return null;
      }
      case "addCard": {
        let id = effect.cardId;
        if (!id && effect.rarity) id = this.randomCardByRarity(effect.rarity);
        if (id) { Game.unlockCard(id); if (s.deck.length < DECK_MAX) s.deck.push(id); Game.save(); }
        return null;
      }
      case "addRelic":       this.addRelic(effect.relicId); return null;
      case "addRelicRandom": this.addRandomRelic(effect.tier || "common"); return null;
      case "addCurse":       this.addCurse(effect.curseId); return null;
      case "setFlag": {
        if (this.cur()) this.cur().flags[effect.flag] = effect.value;
        Game.save(); return null;
      }
      /* interactive effects: signal the UI to open a picker/draft */
      case "upgradeCard":   return { interactive: "upgradeCard" };
      case "removeCard":    return { interactive: "removeCard" };
      case "transformCard": return { interactive: "transformCard" };
      case "duplicateCard": return { interactive: "duplicateCard" };
      case "relicDraft":    return { interactive: "relicDraft", tier: effect.tier || "common", count: effect.count || 3 };
      case "cardDraft":     return { interactive: "cardDraft", rarity: effect.rarity || "Rare", count: effect.count || 3 };
      default: return null;
    }
  },

  /* Mark an event as used (for oncePerRun). */
  markEventUsed(id) {
    const r = this.cur();
    if (r && !r.usedEvents.includes(id)) { r.usedEvents.push(id); Game.save(); }
  },

  /* Consume the one-shot shop markup flag, returning a price multiplier. */
  consumeShopMarkup() {
    const r = this.cur();
    if (!r) return 1;
    const m = 1 + (r.flags.shopMarkup || 0);
    r.flags.shopMarkup = 0;
    Game.save();
    return m;
  },
};
