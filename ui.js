/* ============================================================
   UI — screen rendering and event wiring.
   ============================================================ */
const $ = (sel) => document.querySelector(sel);

const UI = {
  queuedCards: [],
  isExecuting: false,
  lastTurnId: -1,

  /* ---------- generic helpers ---------- */
  show(screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    $(screenId).classList.add("active");
  },
  toast(msg, ms = 1800) {
    const t = $("#toast");
    t.textContent = msg; t.classList.remove("hidden");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.add("hidden"), ms);
  },

  updateTopbarStats(prefix) {
    const s = Game.state;
    const lvlEl = $(`#${prefix}-player-level-top`);
    const hpEl = $(`#${prefix}-player-hp-top`);
    const goldEl = $(`#${prefix}-currency-top`);
    
    if (lvlEl) lvlEl.textContent = `LV ${s.playerLevel} (${s.playerXp}/${Game.xpForNext()} XP)`;
    if (hpEl) hpEl.textContent = `HP ${s.hp}/${s.maxHp}`;
    if (goldEl) goldEl.textContent = `⛃ ${s.currency}`;
  },

  /* Build a card DOM element. opts: {locked, price, upgLevel, copies, onClick} */
  cardEl(card, opts = {}) {
    const el = document.createElement("div");
    el.className = `card rarity-${card.rarity}${opts.locked ? " locked" : ""}`;
    
    if (opts.locked) {
      el.innerHTML = `
        <div class="card-locked-inner">
          <div class="card-locked-question">?</div>
          <div class="card-locked-label">LOCKED</div>
        </div>
      `;
      return el;
    }

    const upg = opts.upgLevel || 0;
    const e = Engine.upgradedEffect(card, upg);
    let desc = card.description
      .replace("{d}", e.damage ?? "").replace("{a}", e.armor ?? "")
      .replace("{h}", e.heal ?? "").replace("{p}", e.poison ?? "")
      .replace("{s}", e.strength ?? "");

    let displayType = "SKILL";
    if (card.type === "Attack") displayType = "ATTACK";
    else if (card.type === "Buff") displayType = "POWER";

    let artClass = "type-skill";
    if (card.type === "Attack") artClass = "type-attack";
    else if (card.type === "Buff") artClass = "type-power";

    el.innerHTML = `
      <div class="card-cost">${card.manaCost}</div>
      ${upg ? `<div class="upg-badge">+${upg}</div>` : ""}
      ${opts.copies ? `<div class="copy-badge">×${opts.copies}</div>` : ""}
      <div class="card-art ${artClass}">${card.art}</div>
      <div class="card-name">${card.name}</div>
      <div class="card-desc">${desc}</div>
      <div class="card-footer">
        <span class="card-type">${displayType}</span>
      </div>
      ${opts.price != null ? `<div class="price-tag">⛃ ${opts.price}</div>` : ""}`;
      
    if (opts.onClick) el.addEventListener("click", opts.onClick);
    return el;
  },

  /* ================= TITLE ================= */
  renderTitle() {
    $("#btn-continue").classList.toggle("hidden", !Game.hasSave());
    this.show("#screen-title");
  },

  /* ================= MAP (run-node based) ================= */
  renderMap() {
    const s = Game.state;
    if (!s.run) Run.generateRun(Game.currentAct());
    const r = s.run;
    $("#map-act-name").textContent = ACTS[r.act - 1].name;
    this.updateTopbarStats("map");

    const cont = $("#map-container");
    cont.innerHTML = "";

    const labels = {
      combat: "Combat", elite: "Elite", event: "Event",
      camp: "Campfire", treasure: "Treasure", shop: "Merchant"
    };
    const icons = {
      combat: "⚔️", elite: "🔱", event: "❓",
      camp: "🔥", treasure: "💰", shop: "🛍️"
    };

    const actDiv = document.createElement("div");
    actDiv.className = "map-act";
    actDiv.innerHTML = `<div class="map-act-title">${ACTS[r.act - 1].theme} ${ACTS[r.act - 1].name}</div>`;
    const row = document.createElement("div");
    row.className = "map-nodes";

    r.path.forEach((node, i) => {
      const el = document.createElement("div");
      el.className = "map-node";
      let icon = icons[node.type] || "⚔️";
      let label = labels[node.type] || "Node";
      if (node.role === "boss")     { el.classList.add("boss");     icon = "☠️"; label = "BOSS"; }
      if (node.role === "miniboss") { el.classList.add("miniboss"); icon = "👑"; label = "Mini-Boss"; }
      if (node.type === "elite")    el.classList.add("elite");
      if (node.type === "treasure")el.classList.add("bonus");
      if (i < r.stageIndex) el.classList.add("cleared");
      if (i === r.stageIndex && !s.gameComplete) {
        el.classList.add("current");
        el.addEventListener("click", () => this.enterNode(node));
      }
      if (i > r.stageIndex) el.classList.add("locked");
      el.innerHTML = `<div class="node-icon">${icon}</div><div>${label}</div>`;
      row.appendChild(el);
      if (i < r.path.length - 1) {
        const link = document.createElement("span");
        link.className = "map-link"; link.textContent = "▶";
        row.appendChild(link);
      }
    });
    actDiv.appendChild(row);
    cont.appendChild(actDiv);
    this.show("#screen-map");
  },

  /* Legacy designed-map renderer kept for reference / fallback. */
  renderMapLegacy() {
    const s = Game.state;
    $("#map-act-name").textContent = ACTS[Game.currentAct() - 1].name;
    this.updateTopbarStats("map");

    const cont = $("#map-container");
    cont.innerHTML = "";
    ACTS.forEach(act => {
      const actStages = STAGES.filter(st => st.act === act.act);
      const actDiv = document.createElement("div");
      actDiv.className = "map-act";
      const firstIdx = STAGES.indexOf(actStages[0]);
      if (s.stageIndex < firstIdx && !s.gameComplete) actDiv.classList.add("locked");
      actDiv.innerHTML = `<div class="map-act-title">${act.theme} ${act.name}</div>`;
      const row = document.createElement("div");
      row.className = "map-nodes";
      actStages.forEach((st, i) => {
        const idx = STAGES.indexOf(st);
        const node = document.createElement("div");
        node.className = "map-node";
        if (st.type === "Boss") node.classList.add("boss");
        if (st.type === "MiniBoss") node.classList.add("miniboss");
        if (st.type === "Bonus") node.classList.add("bonus");
        if (s.clearedStages.includes(st.id)) node.classList.add("cleared");
        if (idx === s.stageIndex && !s.gameComplete) {
          node.classList.add("current");
          node.addEventListener("click", () => this.enterStage(st));
        }
        node.innerHTML = `<div class="node-icon">${st.icon}</div><div>${st.name}</div><div>${st.type}</div>`;
        row.appendChild(node);
        if (i < actStages.length - 1) {
          const link = document.createElement("span");
          link.className = "map-link"; link.textContent = "▶";
          row.appendChild(link);
        }
      });
      actDiv.appendChild(row);
      cont.appendChild(actDiv);
    });
    this.show("#screen-map");
  },

  enterStage(stage) {
    if (stage.type === "Bonus") { this.runBonus(stage); return; }
    if (!Game.deckValid()) { this.toast(`Deck must have ${DECK_MIN}–${DECK_MAX} cards!`); return; }
    this.startBattle(stage);
  },

  /* ================= NODE DISPATCH ================= */
  /* Called when the player clicks the current node on the run map. */
  enterNode(node) {
    switch (node.type) {
      case "combat": {
        const stage = Run.stageForNode(node);
        if (!Game.deckValid()) { this.toast(`Deck must have ${DECK_MIN}–${DECK_MAX} cards!`); return; }
        this.activeNode = node;
        this.startBattle(stage);
        break;
      }
      case "elite": {
        if (!Game.deckValid()) { this.toast(`Deck must have ${DECK_MIN}–${DECK_MAX} cards!`); return; }
        this.activeNode = node;
        const eliteStage = Run.makeEliteStage(node);
        this.startBattle(eliteStage);
        break;
      }
      case "event":    this.activeNode = node; this.renderEvent(getEventById(node.dataId)); break;
      case "camp":     this.activeNode = node; this.renderCampfire(); break;
      case "treasure":
        this.activeNode = node;
        this.openRelicDraft(node.tier || "common", 3, { context: "treasure" });
        break;
      case "shop":     this.activeNode = node; this.renderShop(); break;
      default: this.advanceAndMap();
    }
  },

  /* Advance the run pointer then return to the map (or victory). */
  advanceAndMap() {
    Run.advanceNode();
    if (Game.state.gameComplete) { this.showVictory(); return; }
    this.activeNode = null;
    this.renderMap();
  }

  /* ================= BONUS ================= */
  runBonus(stage) {
    const levels = Game.completeStage(stage);
    let html = `You found <b>⛃ ${stage.rewards.currency}</b> and gained <b>${stage.rewards.xp} XP</b>!`;
    if (stage.rewards.freeCard) {
      const c = getCardById(stage.rewards.freeCard);
      const isNew = Game.unlockCard(c.id);
      html += `<br>📜 Card found: <b>${c.name}</b> ${isNew ? "(NEW — unlocked!)" : "(already owned)"}`;
    }
    if (levels) html += `<br>🆙 LEVEL UP! Now level ${Game.state.playerLevel} (+${levels * 5} Max HP, fully healed).`;
    $("#bonus-summary").innerHTML = html;
    this.show("#screen-bonus");
  },

  startBattle(stage) {
    this.queuedCards = [];
    this.isExecuting = false;
    this.lastTurnId = -1;
    Engine.onUpdate = () => this.renderBattle();
    Engine.onLog = (m) => console.log(m);
    Engine.onHit = (who, uid) => this.flashHit(who, uid);
    Engine.onEnd = (won) => setTimeout(() => won ? this.battleWon(stage) : this.battleLost(), 800);
    $("#battle-stage-name").textContent = `${stage.icon} ${stage.name} [${stage.type}]`;
    Engine.startBattle(stage, Game.state, Game.state.deck, Game.state.cardUpgrades);
    this.show("#screen-battle");
  },

  async playQueuedHand() {
    if (this.isExecuting || this.queuedCards.length === 0) return;
    this.isExecuting = true;
    
    // Disable interactions
    $("#btn-end-turn").disabled = true;
    document.querySelectorAll(".card").forEach(el => el.style.pointerEvents = "none");

    const b = Engine.battle;
    if (!b) return;

    for (let i = 0; i < this.queuedCards.length; i++) {
      if (b.over) break;
      const q = this.queuedCards[i];
      const queuedRow = $("#queued-cards-row");
      const cardEl = queuedRow.children[i];
      
      if (cardEl) {
        const card = getCardById(q.id);
        const isHostile = card.type === "Attack" || card.type === "Debuff";
        const targetEl = isHostile ? document.querySelector(`[data-uid="${b.target}"]`) : document.querySelector("#player-unit");
        
        if (targetEl) {
          const cardRect = cardEl.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();
          const throwX = (targetRect.left + targetRect.width / 2) - (cardRect.left + cardRect.width / 2);
          const throwY = (targetRect.top + targetRect.height / 2) - (cardRect.top + cardRect.height / 2);
          cardEl.style.setProperty("--throw-x", `${throwX}px`);
          cardEl.style.setProperty("--throw-y", `${throwY}px`);
          cardEl.classList.add(isHostile ? "throw-hostile" : "throw-friendly");
        }
      }
      
      await new Promise(res => setTimeout(res, 450));
      
      const handIndex = b.hand.indexOf(q.id);
      if (handIndex !== -1) {
        Engine.playCard(handIndex);
      }
      
      this.queuedCards.splice(i, 1);
      i--;
      this.renderBattle();
      
      await new Promise(res => setTimeout(res, 200));
    }
    
    this.queuedCards = [];
    this.isExecuting = false;
    $("#btn-end-turn").disabled = false;
    this.renderBattle();
  },

  flashHit(who, uid) {
    const el = who === "player" ? $("#player-unit") : document.querySelector(`[data-uid="${uid}"]`);
    if (!el) return;
    el.classList.remove("hit"); void el.offsetWidth; el.classList.add("hit");
  },

  statusChips(unit) {
    const chips = [];
    if (unit.armor > 0)      chips.push(`<span class="status-chip armor">🛡️${unit.armor}</span>`);
    if (unit.strength > 0)   chips.push(`<span class="status-chip strength">💪${unit.strength}</span>`);
    if (unit.poison > 0)     chips.push(`<span class="status-chip poison">☠️${unit.poison}</span>`);
    if (unit.vulnerable > 0) chips.push(`<span class="status-chip vulnerable">🎯${unit.vulnerable}</span>`);
    if (unit.weak > 0)       chips.push(`<span class="status-chip weak">⛓️${unit.weak}</span>`);
    return chips.join("");
  },

  renderBattle() {
    const b = Engine.battle;
    if (!b) return;
    const p = b.player;

    if (b.phase === "player" && this.lastTurnId !== b.turn) {
      this.lastTurnId = b.turn;
      this.queuedCards = [];
      this.isExecuting = false;
    }

    $("#battle-turn-label").textContent = b.phase === "player" ? `TURN ${b.turn} — YOUR MOVE` : "ENEMY TURN...";
    
    const reservedMana = this.queuedCards.reduce((acc, q) => acc + getCardById(q.id).manaCost, 0);
    const remainingMana = p.mana - reservedMana;

    const btnEnd = $("#btn-end-turn");
    btnEnd.disabled = b.phase !== "player" || b.over || this.isExecuting;
    if (this.queuedCards.length > 0) {
      btnEnd.innerHTML = "PLAY<br>HAND";
      btnEnd.classList.add("playhand");
    } else {
      btnEnd.innerHTML = "END<br>TURN";
      btnEnd.classList.remove("playhand");
    }

    const pct = Math.max(0, (p.hp / p.maxHp) * 100);
    const fill = $("#player-hp-fill");
    fill.style.width = pct + "%";
    fill.classList.toggle("low", pct < 30);
    $("#player-hp-text").textContent = `${p.hp}/${p.maxHp}`;
    $("#player-statuses").innerHTML = this.statusChips(p);
    $("#mana-text").textContent = `${remainingMana}/${p.maxMana}`;
    $("#draw-count").textContent = `DRAW ${b.drawPile.length}`;
    $("#discard-count").textContent = `DISC ${b.discardPile.length}`;

    const row = $("#enemy-row");
    row.innerHTML = "";
    b.enemies.forEach(en => {
      const div = document.createElement("div");
      div.className = `unit enemy-unit${en.dead ? " dead" : ""}${en.uid === b.target ? " targeted" : ""}`;
      div.dataset.uid = en.uid;
      const epct = Math.max(0, (en.hp / en.maxHp) * 100);
      const intent = en.dead ? null : Engine.intentText(en);
      div.innerHTML = `
        <div class="sprite">${en.art}</div>
        <div class="unit-name">${en.name}</div>
        <div class="hp-bar"><div class="hp-fill${epct < 30 ? " low" : ""}" style="width:${epct}%"></div></div>
        <div class="hp-text">${en.hp}/${en.maxHp}</div>
        ${intent ? `<div class="intent ${intent.cls}">${intent.text}</div>` : ""}
        <div class="status-row">${this.statusChips(en)}</div>`;
      div.addEventListener("click", () => {
        if (this.isExecuting) return;
        Engine.setTarget(en.uid);
      });
      row.appendChild(div);
    });

    const queuedRow = $("#queued-cards-row");
    queuedRow.innerHTML = "";
    this.queuedCards.forEach((q, qIndex) => {
      const card = getCardById(q.id);
      const el = this.cardEl(card, {
        upgLevel: b.cardUpgrades[q.id] || 0,
        onClick: () => {
          if (this.isExecuting) return;
          this.queuedCards.splice(qIndex, 1);
          this.renderBattle();
        }
      });
      el.classList.add("queued-card");
      queuedRow.appendChild(el);
    });

    const hand = $("#hand");
    hand.innerHTML = "";
    const queuedIndices = this.queuedCards.map(q => q.originalIndex);
    const visibleCards = b.hand.map((cardId, i) => ({ cardId, originalIndex: i }))
                               .filter(item => !queuedIndices.includes(item.originalIndex));
    const total = visibleCards.length;
    const maxAngle = Math.min(28, total * 4);
    visibleCards.forEach((item, i) => {
      const cardId = item.cardId;
      const originalIndex = item.originalIndex;
      const card = getCardById(cardId);
      const playable = remainingMana >= card.manaCost;
      const el = this.cardEl(card, {
        upgLevel: b.cardUpgrades[cardId] || 0,
        onClick: () => {
          if (this.isExecuting) return;
          if (playable) {
            this.queuedCards.push({ id: cardId, originalIndex });
            this.renderBattle();
          }
        },
      });
      if (!playable) el.classList.add("unplayable");
      const mid = (total - 1) / 2;
      const angle = total > 1 ? ((i - mid) / mid) * (maxAngle / 2) : 0;
      const yOff  = total > 1 ? Math.abs(i - mid) * 6 : 0;
      el.style.setProperty("--fan-angle", `${angle}deg`);
      el.style.transform = `rotate(${angle}deg) translateY(${yOff}px)`;
      el.addEventListener("mouseenter", () => {
        el.style.transform = `translateY(-32px) scale(1.1)`;
        el.style.zIndex = "20";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = `rotate(${angle}deg) translateY(${yOff}px)`;
        el.style.zIndex = "";
      });
      hand.appendChild(el);
    });
  },

  /* ---------- battle results ---------- */
  battleWon(stage) {
    Game.state.hp = Engine.battle.player.hp;            // persist remaining HP
    const levels = Game.completeStage(stage);
    let html = `⛃ +${stage.rewards.currency} gold &nbsp; ✨ +${stage.rewards.xp} XP`;
    if (levels) html += `<br>🆙 LEVEL UP! Now level ${Game.state.playerLevel} (+${levels * 5} Max HP, fully healed).`;
    $("#reward-summary").innerHTML = html;

    // pick-one card reward
    const choices = $("#reward-card-choices");
    choices.innerHTML = "";
    const pool = (stage.rewards.cardPool || []).filter(id => !Game.state.unlockedCards.includes(id));
    if (pool.length === 0) {
      choices.innerHTML = `<p class="screen-hint">No new cards available — bonus ⛃ 30 instead!</p>`;
      Game.state.currency += 30; Game.save();
      $("#btn-skip-reward").classList.add("hidden");
      $("#btn-rewards-continue").classList.remove("hidden");
    } else {
      $("#btn-skip-reward").classList.remove("hidden");
      $("#btn-rewards-continue").classList.add("hidden");
      pool.forEach(id => {
        const card = getCardById(id);
        choices.appendChild(this.cardEl(card, {
          onClick: () => {
            Game.unlockCard(id);
            this.toast(`Unlocked: ${card.name}!`);
            this.finishRewards();
          },
        }));
      });
    }
    this.show("#screen-rewards");
  },

  finishRewards() {
    if (Game.state.gameComplete) {
      const s = Game.state;
      $("#victory-summary").innerHTML = `
        <div class="summary-item"><span>Final Level:</span><span>LV ${s.playerLevel}</span></div>
        <div class="summary-item"><span>Stages Cleared:</span><span>${s.clearedStages.length} / 24</span></div>
        <div class="summary-item"><span>Cards Unlocked:</span><span>${s.unlockedCards.length} / ${CARDS.length}</span></div>
        <div class="summary-item"><span>Hardware Upgrades:</span><span>${(s.relics || []).length} / 2</span></div>
        <div class="summary-item"><span>Gold Remaining:</span><span>⛃ ${s.currency}</span></div>
      `;
      $("#victory-text").innerHTML =
        `You defeated the Lich Lord at level ${s.playerLevel}!<br>` +
        `You have climbed the Spire and secured eternal glory. Replay to keep gathering cards!`;
      this.show("#screen-victory");
    } else this.renderMap();
  },

  battleLost() {
    Game.onDefeat();
    const s = Game.state;

    // Calculate stats
    const actReached = Game.currentAct();
    const cardsCollected = s.unlockedCards.length;
    const enemiesSlain = s.clearedStages.reduce((count, id) => {
      const st = STAGES.find(x => x.id === id);
      return count + (st && st.type !== "Bonus" ? 1 : 0);
    }, 0);
    const goldEarned = 75 + s.clearedStages.reduce((sum, id) => {
      const st = STAGES.find(x => x.id === id);
      return sum + (st ? st.rewards.currency : 0);
    }, 0);
    const xpGained = s.clearedStages.reduce((sum, id) => {
      const st = STAGES.find(x => x.id === id);
      return sum + (st ? st.rewards.xp : 0);
    }, 0);

    // Update DOM elements
    $("#defeat-act-reached").textContent = actReached;
    $("#defeat-cards-collected").textContent = cardsCollected;
    $("#defeat-enemies-slain").textContent = enemiesSlain;
    $("#defeat-gold-earned").textContent = goldEarned;

    $("#defeat-xp-gained").textContent = `XP GAINED: +${xpGained}`;
    $("#defeat-level-progression").textContent = `LV ${s.playerLevel} ➔ LV ${s.playerLevel + 1}`;

    const xpNext = Game.xpForNext();
    const xpPct = Math.min(100, Math.max(0, (s.playerXp / xpNext) * 100));
    $("#defeat-xp-fill").style.width = xpPct + "%";

    this.show("#screen-defeat");
  },

  /* ================= DECK EDITOR ================= */
  renderDeck() {
    const s = Game.state;
    this.updateTopbarStats("deck");
    
    // Update stats bar
    $("#deck-player-level").textContent = s.playerLevel;
    $("#deck-player-xp").textContent = `${s.playerXp}/${Game.xpForNext()} XP`;
    $("#deck-player-gold").textContent = s.currency.toLocaleString();
    $("#deck-player-hp").textContent = `${s.hp}/${s.maxHp}`;
    
    const hpPct = Math.max(0, (s.hp / s.maxHp) * 100);
    const hpFill = $("#deck-player-hp-fill");
    hpFill.style.width = hpPct + "%";
    hpFill.classList.toggle("low", hpPct < 30);

    // Update deck count display
    const countEl = $("#deck-count");
    countEl.textContent = `${s.deck.length}/${DECK_MAX}`;
    countEl.classList.toggle("low", s.deck.length < DECK_MIN);

    // 1. Render CURRENT DECK as a list of rows
    const deckList = $("#deck-list");
    deckList.innerHTML = "";

    // Count copies of each card in deck
    const counts = {};
    s.deck.forEach(id => {
      counts[id] = (counts[id] || 0) + 1;
    });

    // To preserve the order cards were added/unlocked, we can iterate over cards that are in the deck
    const rendered = new Set();
    s.deck.forEach(id => {
      if (rendered.has(id)) return;
      rendered.add(id);

      const card = getCardById(id);
      const qty = counts[id];
      const row = document.createElement("div");
      row.className = `deck-row rarity-${card.rarity}`;
      row.innerHTML = `
        <div class="deck-row-left">
          <div class="deck-row-cost">${card.manaCost}</div>
          <div class="deck-row-name">${card.name}</div>
        </div>
        <div class="deck-row-qty">x${qty}</div>
      `;

      row.addEventListener("click", () => {
        // Find index of the first occurrence of this card in s.deck and remove it
        const idx = s.deck.indexOf(id);
        if (idx !== -1) {
          if (Game.removeFromDeck(idx)) {
            this.renderDeck();
          } else {
            this.toast(`Deck cannot go below ${DECK_MIN} cards!`);
          }
        }
      });

      deckList.appendChild(row);
    });

    // 2. Render OWNED CARDS
    const ownedList = $("#owned-list");
    ownedList.innerHTML = "";
    
    if (!this.deckFilter) this.deckFilter = 'all';
    
    // Update filter buttons active state
    document.querySelectorAll("#screen-deck .filter-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.filter === this.deckFilter);
    });

    s.unlockedCards.forEach(id => {
      const card = getCardById(id);
      
      // Filter logic
      if (this.deckFilter === 'attack' && card.type !== 'Attack') return;
      if (this.deckFilter === 'skill' && card.type === 'Attack') return;

      const copies = Game.deckCount(id);
      ownedList.appendChild(this.cardEl(card, {
        upgLevel: s.cardUpgrades[id] || 0,
        copies: copies || null,
        onClick: () => {
          if (Game.addToDeck(id)) {
            this.renderDeck();
          } else {
            this.toast(copies >= MAX_COPIES ? "Max 3 copies per card!" : "Deck is full!");
          }
        },
      }));
    });

    this.show("#screen-deck");
  },

  /* ================= COLLECTION ================= */
  renderCollection() {
    const s = Game.state;
    this.updateTopbarStats("collection");
    
    // Set default filter states if not initialized
    if (this.collRarityFilter === undefined) this.collRarityFilter = 'all';
    if (this.collTypeFilter === undefined) this.collTypeFilter = 'all';
    
    // Update active class on filter buttons
    document.querySelectorAll("#collection-rarity-filters .coll-filter-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.rarity === this.collRarityFilter);
    });
    document.querySelectorAll("#collection-type-filters .coll-filter-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.type === this.collTypeFilter);
    });

    const grid = $("#collection-grid");
    grid.innerHTML = "";
    
    const order = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };
    
    // Filter cards based on rarity and type
    const filteredCards = CARDS.slice()
      .sort((a, b) => order[a.rarity] - order[b.rarity])
      .filter(card => {
        // Rarity filter
        if (this.collRarityFilter !== 'all' && card.rarity !== this.collRarityFilter) {
          return false;
        }
        
        // Type filter
        if (this.collTypeFilter !== 'all') {
          const mappedType = card.type === "Attack" ? "Attack" : (card.type === "Buff" ? "Power" : "Skill");
          if (mappedType !== this.collTypeFilter) {
            return false;
          }
        }
        
        return true;
      });

    // Populate grid with filtered cards
    filteredCards.forEach(card => {
      grid.appendChild(this.cardEl(card, {
        locked: !s.unlockedCards.includes(card.id),
        upgLevel: s.cardUpgrades[card.id] || 0,
      }));
    });

    const countLabel = $("#collection-count-label");
    if (countLabel) {
      countLabel.textContent = `${s.unlockedCards.length}/${CARDS.length}`;
    }

    this.show("#screen-collection");
  },

  /* ================= SHOP ================= */
  renderShop() {
    const s = Game.state;
    this.updateTopbarStats("shop");
    
    // Update stats bar
    $("#shop-hp-val").textContent = `${s.hp}/${s.maxHp}`;
    const hpPct = Math.max(0, (s.hp / s.maxHp) * 100);
    const hpFill = $("#shop-hp-fill-bar");
    hpFill.style.width = hpPct + "%";
    hpFill.classList.toggle("low", hpPct < 30);
    
    $("#shop-gold-val").textContent = s.currency;

    // 1. LEFT COLUMN: CARDS FOR SALE
    const cardsGrid = $("#shop-cards-grid");
    cardsGrid.innerHTML = "";
    if (!s.shopOffers || !s.shopOffers.length) {
      cardsGrid.innerHTML = `<p class="screen-hint" style="grid-column: 1/-1;">Sold out! New stock after your next stage.</p>`;
    } else {
      s.shopOffers.forEach((id, index) => {
        const card = getCardById(id);
        const itemEl = document.createElement("div");
        itemEl.className = `shop-card-item rarity-${card.rarity}`;
        
        const upg = s.cardUpgrades[id] || 0;
        const e = Engine.upgradedEffect(card, upg);
        let desc = card.description
          .replace("{d}", e.damage ?? "").replace("{a}", e.armor ?? "")
          .replace("{h}", e.heal ?? "").replace("{p}", e.poison ?? "")
          .replace("{s}", e.strength ?? "");
          
        itemEl.innerHTML = `
          <div class="card-index-label">${index + 1}</div>
          <div class="card-title">${card.name}</div>
          <div class="card-desc">${desc}</div>
          <div class="card-footer">
            <span class="card-price">⛃ ${RARITY_PRICE[card.rarity]}</span>
            <button class="px-btn buy-btn">BUY</button>
          </div>
        `;
        
        const buyBtn = itemEl.querySelector(".buy-btn");
        buyBtn.addEventListener("click", () => {
          if (Game.buyCard(id)) {
            this.toast(`Bought ${card.name}!`);
            this.renderShop();
          } else {
            this.toast("Not enough gold!");
          }
        });
        
        cardsGrid.appendChild(itemEl);
      });
    }

    // 2. RIGHT COLUMN: UPGRADES & SERVICES
    const upgradesList = $("#shop-upgrades-list");
    upgradesList.innerHTML = "";

    // A. Relic: Hellfire Stone
    const hasHellfire = s.relics && s.relics.includes("hellfire_stone");
    const hellfireItem = document.createElement("div");
    hellfireItem.className = `shop-upgrade-item${hasHellfire ? " sold-out" : ""}`;
    hellfireItem.innerHTML = `
      <div class="shop-upgrade-header">
        <div class="shop-upgrade-icon-box">🔥</div>
        <div class="shop-upgrade-title-container" style="flex-grow: 1;">
          <span class="shop-upgrade-title">HELLFIRE STONE</span>
          <p class="shop-upgrade-desc">At the start of combat, deal 3 damage to ALL enemies.</p>
        </div>
      </div>
      <div class="shop-upgrade-footer">
        <span class="shop-upgrade-price">${hasHellfire ? "OWNED" : "⛃ 120"}</span>
        <button class="px-btn buy-btn" ${hasHellfire ? "disabled" : ""}>${hasHellfire ? "OWNED" : "BUY"}</button>
      </div>
    `;
    if (!hasHellfire) {
      hellfireItem.querySelector(".buy-btn").addEventListener("click", () => {
        if (Game.buyRelic("hellfire_stone")) {
          this.toast("Obtained Hellfire Stone!");
          this.renderShop();
        } else this.toast("Not enough gold!");
      });
    }
    upgradesList.appendChild(hellfireItem);

    // B. Relic: Vampire Fang
    const hasFang = s.relics && s.relics.includes("vampire_fang");
    const fangItem = document.createElement("div");
    fangItem.className = `shop-upgrade-item${hasFang ? " sold-out" : ""}`;
    fangItem.innerHTML = `
      <div class="shop-upgrade-header">
        <div class="shop-upgrade-icon-box">💜</div>
        <div class="shop-upgrade-title-container" style="flex-grow: 1;">
          <span class="shop-upgrade-title">VAMPIRE FANG</span>
          <p class="shop-upgrade-desc">Heal 1 HP whenever you play an Attack card.</p>
        </div>
      </div>
      <div class="shop-upgrade-footer">
        <span class="shop-upgrade-price">${hasFang ? "OWNED" : "⛃ 150"}</span>
        <button class="px-btn buy-btn" ${hasFang ? "disabled" : ""}>${hasFang ? "OWNED" : "BUY"}</button>
      </div>
    `;
    if (!hasFang) {
      fangItem.querySelector(".buy-btn").addEventListener("click", () => {
        if (Game.buyRelic("vampire_fang")) {
          this.toast("Obtained Vampire Fang!");
          this.renderShop();
        } else this.toast("Not enough gold!");
      });
    }
    upgradesList.appendChild(fangItem);

    // C. Service: Max HP +5
    const maxHpItem = document.createElement("div");
    maxHpItem.className = "shop-upgrade-item";
    maxHpItem.innerHTML = `
      <div class="shop-upgrade-header">
        <div class="shop-upgrade-icon-box">💖</div>
        <div class="shop-upgrade-title-container" style="flex-grow: 1;">
          <span class="shop-upgrade-title">MAX HP +5</span>
          <p class="shop-upgrade-desc">Permanently increase Max HP by 5.</p>
        </div>
      </div>
      <div class="shop-upgrade-footer">
        <span class="shop-upgrade-price">⛃ 80</span>
        <button class="px-btn buy-btn">BUY</button>
      </div>
    `;
    maxHpItem.querySelector(".buy-btn").addEventListener("click", () => {
      if (Game.buyMaxHp()) {
        this.toast("Max HP increased by 5!");
        this.renderShop();
      } else this.toast("Not enough gold!");
    });
    upgradesList.appendChild(maxHpItem);

    // D. Service: Full Heal
    const healItem = document.createElement("div");
    healItem.className = "shop-upgrade-item";
    healItem.innerHTML = `
      <div class="shop-upgrade-header">
        <div class="shop-upgrade-icon-box">💚</div>
        <div class="shop-upgrade-title-container" style="flex-grow: 1;">
          <span class="shop-upgrade-title">FULL HEAL</span>
          <p class="shop-upgrade-desc">Restore HP to full.</p>
        </div>
      </div>
      <div class="shop-upgrade-footer">
        <span class="shop-upgrade-price">⛃ 50</span>
        <button class="px-btn buy-btn">BUY</button>
      </div>
    `;
    healItem.querySelector(".buy-btn").addEventListener("click", () => {
      if (Game.buyHeal()) {
        this.toast("HP fully restored!");
        this.renderShop();
      } else this.toast("HP is already full or insufficient gold!");
    });
    upgradesList.appendChild(healItem);

    // E. Service: Card Upgrade
    const cardUpgradeItem = document.createElement("div");
    cardUpgradeItem.className = "shop-upgrade-item";
    
    // Create options for dropdown
    let optionsHtml = `<option value="" disabled selected>Choose a card to upgrade...</option>`;
    s.unlockedCards.forEach(id => {
      const card = getCardById(id);
      const level = s.cardUpgrades[id] || 0;
      const price = Game.upgradePrice(id);
      optionsHtml += `<option value="${id}">${card.name} (+${level}) — ⛃ ${price}</option>`;
    });

    cardUpgradeItem.innerHTML = `
      <div class="shop-upgrade-header">
        <div class="shop-upgrade-icon-box">🔺</div>
        <div class="shop-upgrade-title-container" style="flex-grow: 1;">
          <span class="shop-upgrade-title">CARD UPGRADE</span>
          <p class="shop-upgrade-desc">Permanently upgrade an owned card to boost its power.</p>
          <div class="shop-upgrade-select-wrapper">
            <select class="shop-upgrade-select" id="shop-card-upg-dropdown">
              ${optionsHtml}
            </select>
          </div>
        </div>
      </div>
      <div class="shop-upgrade-footer">
        <span class="shop-upgrade-price" id="shop-card-upg-price">⛃ --</span>
        <button class="px-btn buy-btn" id="shop-card-upg-btn" disabled>BUY</button>
      </div>
    `;

    const selectEl = cardUpgradeItem.querySelector("#shop-card-upg-dropdown");
    const priceEl = cardUpgradeItem.querySelector("#shop-card-upg-price");
    const buyBtnEl = cardUpgradeItem.querySelector("#shop-card-upg-btn");

    selectEl.addEventListener("change", () => {
      const id = selectEl.value;
      if (id) {
        const price = Game.upgradePrice(id);
        priceEl.textContent = `⛃ ${price}`;
        buyBtnEl.disabled = false;
      }
    });

    buyBtnEl.addEventListener("click", () => {
      const id = selectEl.value;
      if (id) {
        const card = getCardById(id);
        if (Game.buyUpgrade(id)) {
          this.toast(`${card.name} upgraded!`);
          this.renderShop();
        } else {
          this.toast("Not enough gold!");
        }
      }
    });

    upgradesList.appendChild(cardUpgradeItem);

    this.show("#screen-shop");
  },

  /* ================= INIT / EVENT WIRING ================= */
  init() {
    // Title
    $("#btn-newgame").addEventListener("click", () => {
      if (Game.hasSave() && !confirm("Overwrite existing save?")) return;
      Game.newGame();
      this.renderMap();
    });
    $("#btn-continue").addEventListener("click", () => {
      if (Game.load()) this.renderMap();
      else this.toast("No save found!");
    });

    // Map topbar
    $("#btn-map-deck").addEventListener("click", () => this.renderDeck());
    $("#btn-map-collection").addEventListener("click", () => this.renderCollection());
    $("#btn-map-shop").addEventListener("click", () => this.renderShop());
    $("#btn-map-title").addEventListener("click", () => this.renderTitle());

    // Shop topbar buttons
    $("#btn-shop-deck").addEventListener("click", () => this.renderDeck());
    $("#btn-shop-cards").addEventListener("click", () => this.renderCollection());
    $("#btn-shop-shop").addEventListener("click", () => this.renderShop());
    $("#btn-shop-title").addEventListener("click", () => this.renderTitle());

    // Click on shop name logo to return to map
    const shopLogo = $("#btn-shop-logo");
    if (shopLogo) {
      shopLogo.addEventListener("click", () => this.renderMap());
    }

    // Deck screen wiring
    $("#btn-deck-logo").addEventListener("click", () => this.renderMap());
    $("#btn-deck-cards").addEventListener("click", () => this.renderCollection());
    $("#btn-deck-deck").addEventListener("click", () => this.renderDeck());
    $("#btn-deck-shop").addEventListener("click", () => this.renderShop());
    $("#btn-deck-title").addEventListener("click", () => this.renderTitle());
    
    // Deck filters
    document.querySelectorAll("#screen-deck .filter-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        this.deckFilter = e.target.dataset.filter;
        this.renderDeck();
      });
    });

    // Save button
    $("#btn-deck-save").addEventListener("click", () => {
      if (Game.deckValid()) {
        this.toast("Deck saved successfully!");
        this.renderMap();
      } else {
        this.toast(`Deck must have ${DECK_MIN}–${DECK_MAX} cards!`);
      }
    });
    // Collection screen topbar
    $("#btn-collection-logo").addEventListener("click", () => this.renderMap());
    $("#btn-collection-deck").addEventListener("click", () => this.renderDeck());
    $("#btn-collection-cards").addEventListener("click", () => this.renderCollection());
    $("#btn-collection-shop").addEventListener("click", () => this.renderShop());
    $("#btn-collection-title").addEventListener("click", () => this.renderTitle());
    
    // Collection screen filters
    document.querySelectorAll("#collection-rarity-filters .coll-filter-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        this.collRarityFilter = e.target.dataset.rarity;
        this.renderCollection();
      });
    });
    document.querySelectorAll("#collection-type-filters .coll-filter-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        this.collTypeFilter = e.target.dataset.type;
        this.renderCollection();
      });
    });
    
    const oldShopBack = $("#btn-shop-back");
    if (oldShopBack) {
      oldShopBack.addEventListener("click", () => this.renderMap());
    }

    // Battle
    $("#btn-end-turn").addEventListener("click", () => {
      if (this.isExecuting) return;
      if (this.queuedCards.length > 0) {
        this.playQueuedHand();
      } else {
        Engine.endPlayerTurn();
      }
    });

    // Rewards
    $("#btn-skip-reward").addEventListener("click", () => {
      Game.state.currency += 25; Game.save();   // small gold compensation
      this.toast("Card skipped: +⛃ 25");
      this.finishRewards();
    });
    $("#btn-rewards-continue").addEventListener("click", () => this.finishRewards());

    // Bonus
    $("#btn-bonus-continue").addEventListener("click", () => this.renderMap());

    // Defeat
    $("#btn-defeat-retry").addEventListener("click", () => this.renderMap());
    $("#btn-defeat-title-screen").addEventListener("click", () => this.renderTitle());

    // Victory
    $("#btn-victory-replay").addEventListener("click", () => { Game.replayMap(); this.renderMap(); });
    $("#btn-victory-title").addEventListener("click", () => this.renderTitle());

    // Boot: show title; auto-load save for "Continue" availability
    if (Game.hasSave()) Game.load();
    this.renderTitle();
  },
};

/* Start the game when DOM is ready */
window.addEventListener("DOMContentLoaded", () => UI.init());
