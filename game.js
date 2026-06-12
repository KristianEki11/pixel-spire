/* ============================================================
   GAME — persistent state, progression, leveling, shop logic.
   ============================================================ */
const SAVE_KEY = "pixel_spire_save_v1";
const DECK_MIN = 15, DECK_MAX = 30, MAX_COPIES = 3;

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
      stageIndex: 0,               // next stage to play in STAGES
      clearedStages: [],           // stage ids
      shopOffers: null,            // current 3 shop unlock offers
      gameComplete: false,
    };
  },

  /* ---- persistence ---- */
  save() { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); },
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      this.state = JSON.parse(raw);
      return true;
    } catch (e) { return false; }
  },
  hasSave() { return !!localStorage.getItem(SAVE_KEY); },
  newGame() { this.state = this.defaultState(); this.rollShopOffers(); this.save(); },

  /* ---- leveling ---- */
  xpForNext() { return this.state.playerLevel * 100; },
  gainXp(amount) {
    const s = this.state;
    s.playerXp += amount;
    let levels = 0;
    while (s.playerXp >= this.xpForNext()) {
      s.playerXp -= this.xpForNext();
      s.playerLevel++;
      s.maxHp += 5;
      s.hp = s.maxHp;               // full heal on level up
      if (s.playerLevel % 4 === 0) s.maxMana++; // every 4 levels: +1 mana
      levels++;
    }
    this.save();
    return levels;
  },

  /* ---- stage / progression ---- */
  currentStage() { return STAGES[this.state.stageIndex] || null; },
  currentAct() {
    const st = this.currentStage();
    return st ? st.act : 3;
  },
  completeStage(stage) {
    const s = this.state;
    s.clearedStages.push(stage.id);
    s.currency += stage.rewards.currency;
    const levels = this.gainXp(stage.rewards.xp);
    if (s.stageIndex < STAGES.length - 1) s.stageIndex++;
    else s.gameComplete = true;
    this.rollShopOffers();          // fresh shop each stage
    this.save();
    return levels;
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
    this.rollShopOffers();
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
    if (this.state.deck.length > DECK_MIN) { this.state.deck.splice(index, 1); this.save(); return true; }
    return false;
  },
  deckValid() { return this.state.deck.length >= DECK_MIN && this.state.deck.length <= DECK_MAX; },

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
  buyCard(id) {
    const card = getCardById(id);
    const price = RARITY_PRICE[card.rarity];
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
