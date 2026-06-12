/* ============================================================
   UI — screen rendering and event wiring.
   ============================================================ */
const $ = (sel) => document.querySelector(sel);

const UI = {
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

  /* Build a card DOM element. opts: {locked, price, upgLevel, copies, onClick} */
  cardEl(card, opts = {}) {
    const upg = opts.upgLevel || 0;
    const e = Engine.upgradedEffect(card, upg);
    let desc = card.description
      .replace("{d}", e.damage ?? "").replace("{a}", e.armor ?? "")
      .replace("{h}", e.heal ?? "").replace("{p}", e.poison ?? "")
      .replace("{s}", e.strength ?? "");
    const el = document.createElement("div");
    el.className = `card rarity-${card.rarity}${opts.locked ? " locked" : ""}`;
    el.innerHTML = `
      <div class="card-cost">${card.manaCost}</div>
      ${upg ? `<div class="upg-badge">+${upg}</div>` : ""}
      ${opts.copies ? `<div class="copy-badge">×${opts.copies}</div>` : ""}
      <div class="card-name">${opts.locked ? "???" : card.name}</div>
      <div class="card-art">${opts.locked ? "🔒" : card.art}</div>
      <div class="card-type">${card.type}</div>
      <div class="card-desc">${opts.locked ? "Locked" : desc}</div>
      <div class="card-rarity">${card.rarity}</div>
      ${opts.price != null ? `<div class="price-tag">⛃ ${opts.price}</div>` : ""}`;
    if (opts.onClick && !opts.locked) el.addEventListener("click", opts.onClick);
    return el;
  },

  /* ================= TITLE ================= */
  renderTitle() {
    $("#btn-continue").classList.toggle("hidden", !Game.hasSave());
    this.show("#screen-title");
  },

  /* ================= MAP ================= */
  renderMap() {
    const s = Game.state;
    $("#map-act-name").textContent = ACTS[Game.currentAct() - 1].name;
    $("#map-player-level").textContent = `LV ${s.playerLevel} (${s.playerXp}/${Game.xpForNext()} XP)`;
    $("#map-player-hp").textContent = `HP ${s.hp}/${s.maxHp}`;
    $("#map-currency").textContent = `⛃ ${s.currency}`;

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

  /* ================= BATTLE ================= */
  startBattle(stage) {
    Engine.onUpdate = () => this.renderBattle();
    Engine.onLog = (m) => this.appendLog(m);
    Engine.onHit = (who, uid) => this.flashHit(who, uid);
    Engine.onEnd = (won) => setTimeout(() => won ? this.battleWon(stage) : this.battleLost(), 800);
    $("#battle-log").innerHTML = "";
    $("#battle-stage-name").textContent = `${stage.icon} ${stage.name} [${stage.type}]`;
    Engine.startBattle(stage, Game.state, Game.state.deck, Game.state.cardUpgrades);
    this.show("#screen-battle");
  },

  appendLog(msg) {
    const log = $("#battle-log");
    const p = document.createElement("p");
    p.textContent = msg;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
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

    $("#battle-turn-label").textContent = b.phase === "player" ? `TURN ${b.turn} — YOUR MOVE` : "ENEMY TURN...";
    $("#btn-end-turn").disabled = b.phase !== "player" || b.over;

    // player
    const pct = Math.max(0, (p.hp / p.maxHp) * 100);
    const fill = $("#player-hp-fill");
    fill.style.width = pct + "%";
    fill.classList.toggle("low", pct < 30);
    $("#player-hp-text").textContent = `${p.hp}/${p.maxHp}`;
    $("#player-statuses").innerHTML = this.statusChips(p);
    $("#mana-text").textContent = `${p.mana}/${p.maxMana}`;
    $("#draw-count").textContent = `DRAW ${b.drawPile.length}`;
    $("#discard-count").textContent = `DISC ${b.discardPile.length}`;

    // enemies
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
      div.addEventListener("click", () => Engine.setTarget(en.uid));
      row.appendChild(div);
    });

    // hand — fan layout
    const hand = $("#hand");
    hand.innerHTML = "";
    const total = b.hand.length;
    const maxAngle = Math.min(28, total * 4);
    b.hand.forEach((cardId, i) => {
      const card = getCardById(cardId);
      const playable = Engine.canPlay(cardId);
      const el = this.cardEl(card, {
        upgLevel: b.cardUpgrades[cardId] || 0,
        onClick: () => { if (Engine.canPlay(cardId)) Engine.playCard(i); },
      });
      if (!playable) el.classList.add("unplayable");
      // fan angle: spread from -maxAngle/2 to +maxAngle/2
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
      $("#victory-text").innerHTML =
        `You defeated the Lich Lord at level ${Game.state.playerLevel}!<br>` +
        `Cards unlocked: ${Game.state.unlockedCards.length}/${CARDS.length}<br>` +
        `Gold: ⛃ ${Game.state.currency}`;
      this.show("#screen-victory");
    } else this.renderMap();
  },

  battleLost() {
    Game.onDefeat();
    $("#defeat-text").innerHTML =
      `You were slain at <b>${Engine.battle.stage.name}</b>.<br>` +
      `You lost 20% of your gold but keep all cards, levels and progress.<br>` +
      `You revive at full HP — adjust your deck and try again!`;
    this.show("#screen-defeat");
  },

  /* ================= DECK EDITOR ================= */
  renderDeck() {
    const s = Game.state;
    $("#deck-count").textContent = `${s.deck.length}/${DECK_MAX} (min ${DECK_MIN})`;

    const deckList = $("#deck-list");
    deckList.innerHTML = "";
    s.deck.forEach((id, i) => {
      const card = getCardById(id);
      deckList.appendChild(this.cardEl(card, {
        upgLevel: s.cardUpgrades[id] || 0,
        onClick: () => {
          if (Game.removeFromDeck(i)) this.renderDeck();
          else this.toast(`Deck cannot go below ${DECK_MIN} cards!`);
        },
      }));
    });

    const ownedList = $("#owned-list");
    ownedList.innerHTML = "";
    s.unlockedCards.forEach(id => {
      const card = getCardById(id);
      const copies = Game.deckCount(id);
      ownedList.appendChild(this.cardEl(card, {
        upgLevel: s.cardUpgrades[id] || 0,
        copies: copies || null,
        onClick: () => {
          if (Game.addToDeck(id)) this.renderDeck();
          else this.toast(copies >= MAX_COPIES ? "Max 3 copies per card!" : "Deck is full!");
        },
      }));
    });
    this.show("#screen-deck");
  },

  /* ================= COLLECTION ================= */
  renderCollection() {
    const s = Game.state;
    $("#collection-count").textContent = `${s.unlockedCards.length}/${CARDS.length}`;
    const grid = $("#collection-grid");
    grid.innerHTML = "";
    const order = { Common: 0, Rare: 1, Epic: 2, Legendary: 3 };
    CARDS.slice().sort((a, b) => order[a.rarity] - order[b.rarity]).forEach(card => {
      grid.appendChild(this.cardEl(card, {
        locked: !s.unlockedCards.includes(card.id),
        upgLevel: s.cardUpgrades[card.id] || 0,
      }));
    });
    this.show("#screen-collection");
  },

  /* ================= SHOP ================= */
  renderShop() {
    const s = Game.state;
    $("#shop-currency").textContent = `⛃ ${s.currency}`;

    // unlock offers
    const shopCards = $("#shop-cards");
    shopCards.innerHTML = "";
    if (!s.shopOffers || !s.shopOffers.length) {
      shopCards.innerHTML = `<p class="screen-hint">Sold out! New stock after your next stage.</p>`;
    } else {
      s.shopOffers.forEach(id => {
        const card = getCardById(id);
        shopCards.appendChild(this.cardEl(card, {
          price: RARITY_PRICE[card.rarity],
          onClick: () => {
            if (Game.buyCard(id)) { this.toast(`Bought ${card.name}!`); this.renderShop(); }
            else this.toast("Not enough gold!");
          },
        }));
      });
    }

    // upgrades — every unlocked card can be upgraded
    const shopUpg = $("#shop-upgrades");
    shopUpg.innerHTML = "";
    s.unlockedCards.forEach(id => {
      const card = getCardById(id);
      shopUpg.appendChild(this.cardEl(card, {
        upgLevel: s.cardUpgrades[id] || 0,
        price: Game.upgradePrice(id),
        onClick: () => {
          if (Game.buyUpgrade(id)) { this.toast(`${card.name} upgraded!`); this.renderShop(); }
          else this.toast("Not enough gold!");
        },
      }));
    });

    // services
    const svc = $("#shop-services");
    svc.innerHTML = "";
    const mkSvc = (title, desc, price, fn) => {
      const d = document.createElement("div");
      d.className = "shop-service";
      d.innerHTML = `<b>${title}</b><span>${desc}</span>`;
      const btn = document.createElement("button");
      btn.className = "px-btn";
      btn.textContent = `⛃ ${price}`;
      btn.addEventListener("click", () => {
        if (fn()) { this.toast(`${title} purchased!`); this.renderShop(); }
        else this.toast("Cannot purchase!");
      });
      d.appendChild(btn);
      svc.appendChild(d);
    };
    mkSvc("MAX HP +5", "Permanently increase Max HP by 5.", 80, () => Game.buyMaxHp());
    mkSvc("FULL HEAL", `Restore HP to full (${s.hp}/${s.maxHp}).`, 50, () => Game.buyHeal());

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

    // Back buttons
    $("#btn-deck-back").addEventListener("click", () => this.renderMap());
    $("#btn-collection-back").addEventListener("click", () => this.renderMap());
    $("#btn-shop-back").addEventListener("click", () => this.renderMap());

    // Battle
    $("#btn-end-turn").addEventListener("click", () => Engine.endPlayerTurn());

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
    $("#btn-defeat-continue").addEventListener("click", () => this.renderMap());

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
