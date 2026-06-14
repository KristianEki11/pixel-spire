/* ============================================================
   ENGINE — turn-based combat logic. No DOM access here;
   it fires callbacks that ui.js subscribes to.
   ============================================================ */
const Engine = {
  battle: null, // active battle state
  onUpdate: null, onLog: null, onEnd: null, onHit: null,

  /* ---- helpers ---- */
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  log(msg) { if (this.onLog) this.onLog(msg); },
  update() { if (this.onUpdate) this.onUpdate(); },

  /* Apply card upgrade bonuses to a card's effect values */
  upgradedEffect(card, upgLevel) {
    const e = Object.assign({}, card.effect);
    if (!upgLevel) return e;
    if (e.damage)   e.damage   += 2 * upgLevel;
    if (e.armor)    e.armor    += 2 * upgLevel;
    if (e.heal)     e.heal     += 2 * upgLevel;
    if (e.poison)   e.poison   += 1 * upgLevel;
    if (e.strength) e.strength += 1 * upgLevel;
    return e;
  },

  /* Effective mana cost after upgrades: every 2nd upgrade level
     reduces cost by 1 (min 0). Lets campfire/shop upgrades grant
     the '-mana cost' benefit described in the design. */
  effectiveCost(card, upgLevel) {
    if (!upgLevel) return card.manaCost;
    const reduction = Math.floor(upgLevel / 2);
    return Math.max(0, card.manaCost - reduction);
  },

  /* Whether an upgraded card gains the Exhaust keyword (level >= 2). */
  gainsExhaust(card, upgLevel) {
    return upgLevel >= 2 && (card.type === "Attack" || card.type === "Skill");
  },

  /* Sum a relic hook's value across owned relics. */
  relicValue(hook) {
    if (!this.battle || !this.battle.relics) return 0;
    let total = 0;
    this.battle.relics.forEach(id => {
      const r = (typeof getRelicById === "function") ? getRelicById(id) : null;
      if (r && r.hook === hook) total += (r.value || 0);
    });
    return total;
  },
  hasRelicHook(hook) {
    if (!this.battle || !this.battle.relics) return false;
    return this.battle.relics.some(id => {
      const r = (typeof getRelicById === "function") ? getRelicById(id) : null;
      return r && r.hook === hook;
    });
  },

  /* ---- battle setup ---- */
  startBattle(stage, playerState, deckCardIds, cardUpgrades) {
    const enemies = stage.enemies.map((id, i) => {
      const t = getEnemyById(id);
      return {
        uid: i, id: t.id, name: t.name, art: t.art,
        hp: t.maxHp, maxHp: t.maxHp, armor: 0,
        strength: 0, poison: 0, vulnerable: 0, weak: 0,
        intents: t.intents, intentIndex: 0, dead: false,
      };
    });
    this.battle = {
      stage,
      player: {
        hp: playerState.hp, maxHp: playerState.maxHp,
        mana: playerState.maxMana, maxMana: playerState.maxMana,
        armor: 0, strength: 0, poison: 0, vulnerable: 0, weak: 0,
      },
      enemies,
      drawPile: this.shuffle(deckCardIds.slice()),
      hand: [], discardPile: [],
      cardUpgrades: cardUpgrades || {},
      relics: playerState.relics || [],
      turn: 1, phase: "player", target: 0, over: false,
    };
    this.log(`⚔️ Battle start: ${stage.name}`);

    // Elite scaling: tougher enemies, applied to the cloned elite stage.
    if (stage.isElite) {
      enemies.forEach(e => {
        e.maxHp = Math.round(e.maxHp * 1.4);
        e.hp = e.maxHp;
        e.strength += 1;
      });
      this.log(`🔱 Elite encounter: enemies are stronger.`);
    }

    // Reactor Heart: +1 Max Mana for this combat.
    const manaRelic = this.relicValue("maxMana");
    if (manaRelic) { this.battle.player.maxMana += manaRelic; this.battle.player.mana = this.battle.player.maxMana; }

    // Void Crown: start with Strength.
    const startStr = this.relicValue("combatStartStrength");
    if (startStr) { this.battle.player.strength += startStr; this.log(`👑 Void Crown grants +${startStr} Strength.`); }

    // Combat-start AoE damage (Hellfire Stone, hook-based).
    const aoe = this.relicValue("combatStartAoe");
    if (aoe) {
      enemies.forEach(e => { e.hp = Math.max(0, e.hp - aoe); this.log(`🔥 Combat-start relic deals ${aoe} to ${e.name}.`); });
      this.checkDeaths();
    }

    this.startPlayerTurn();
  },

  /* ---- draw / discard ---- */
  drawCards(n) {
    const b = this.battle;
    for (let i = 0; i < n; i++) {
      if (b.drawPile.length === 0) {
        if (b.discardPile.length === 0) break; // nothing left anywhere
        b.drawPile = this.shuffle(b.discardPile);
        b.discardPile = [];
        this.log("♻️ Discard reshuffled into draw pile.");
      }
      if (b.hand.length >= 10) break; // hand limit
      b.hand.push(b.drawPile.pop());
    }
  },

  /* ---- status ticks ---- */
  tickPoison(unit, name) {
    if (unit.poison > 0) {
      unit.hp = Math.max(0, unit.hp - unit.poison);
      this.log(`☠️ ${name} takes ${unit.poison} poison damage.`);
      unit.poison--;
    }
  },
  decayDebuffs(unit) {
    if (unit.vulnerable > 0) unit.vulnerable--;
    if (unit.weak > 0) unit.weak--;
  },

  /* ---- damage calculation ---- */
  dealDamage(source, target, base) {
    let dmg = base + (source.strength || 0);
    if (source.weak > 0) dmg = Math.floor(dmg * 0.75);
    if (target.vulnerable > 0) dmg = Math.floor(dmg * 1.5);
    dmg = Math.max(0, dmg);
    const absorbed = Math.min(target.armor, dmg);
    target.armor -= absorbed;
    const real = dmg - absorbed;
    target.hp = Math.max(0, target.hp - real);
    return { total: dmg, real, absorbed };
  },

  livingEnemies() { return this.battle.enemies.filter(e => !e.dead); },

  checkDeaths() {
    const b = this.battle;
    b.enemies.forEach(e => {
      if (!e.dead && e.hp <= 0) { e.dead = true; this.log(`💀 ${e.name} is defeated!`); }
    });
    // retarget if current target died
    if (b.enemies[b.target] && b.enemies[b.target].dead) {
      const alive = this.livingEnemies();
      if (alive.length) b.target = alive[0].uid;
    }
    if (this.livingEnemies().length === 0 && !b.over) {
      b.over = true;
      this.log("🏆 Victory!");
      if (this.onEnd) this.onEnd(true);
      return true;
    }
    if (b.player.hp <= 0 && !b.over) {
      // Phoenix Chip: survive once per combat at 1 HP.
      if (this.hasRelicHook("deathSave") && !b.deathSaveUsed) {
        b.deathSaveUsed = true;
        b.player.hp = 1;
        this.log("🔥 Phoenix Chip saves you at 1 HP!");
        return false;
      }
      b.over = true;
      this.log("💔 You have fallen...");
      if (this.onEnd) this.onEnd(false);
      return true;
    }
    return false;
  },

  /* ---- player turn ---- */
  startPlayerTurn() {
    const b = this.battle;
    b.phase = "player";
    b.player.armor = 0;                  // armor resets each turn
    if (b.player.demonForm) {
      const strGain = b.player.demonForm * 2;
      b.player.strength = (b.player.strength || 0) + strGain;
      this.log(`😈 Demon Form grants +${strGain} Strength.`);
    }
    this.tickPoison(b.player, "Hero");
    if (this.checkDeaths()) return;
    b.player.mana = b.player.maxMana;

    // Aegis Core: combat-start armor (turn 1 only).
    if (b.turn === 1) {
      const startArmor = this.relicValue("combatStartArmor");
      if (startArmor) { b.player.armor += startArmor; this.log(`🛡️ Relic grants ${startArmor} Block.`); }
      const ftMana = this.relicValue("firstTurnMana");
      if (ftMana) { b.player.mana += ftMana; this.log(`🔋 Relic grants ${ftMana} extra mana.`); }
    }

    // Regen Matrix: heal at the start of each turn.
    const turnHeal = this.relicValue("turnHeal");
    if (turnHeal && b.player.hp > 0) {
      const h = Math.min(turnHeal, b.player.maxHp - b.player.hp);
      if (h > 0) { b.player.hp += h; this.log(`💚 Regen relic heals ${h} HP.`); }
    }

    const targetHandSize = 5 + this.relicValue("extraDraw");
    const drawAmt = Math.max(0, targetHandSize - b.hand.length);
    if (drawAmt > 0) {
      this.drawCards(drawAmt);
    }
    this.log(`— Turn ${b.turn}: your move —`);
    this.update();
    if (this.onPlayerTurnStart) this.onPlayerTurnStart();
  },

  canPlay(cardId) {
    const b = this.battle;
    if (b.phase !== "player" || b.over) return false;
    if (typeof isCurseId === "function" && isCurseId(cardId)) return false; // curses unplayable
    const card = getCardById(cardId);
    if (!card) return false;
    const cost = this.effectiveCost(card, b.cardUpgrades[cardId] || 0);
    return b.player.mana >= cost;
  },

  /* Play card at hand index, against current target */
  playCard(handIndex) {
    const b = this.battle;
    const cardId = b.hand[handIndex];
    if (!cardId || !this.canPlay(cardId)) return false;
    const card = getCardById(cardId);
    const upg = b.cardUpgrades[cardId] || 0;
    const e = this.upgradedEffect(card, upg);
    const p = b.player;

    p.mana -= this.effectiveCost(card, upg);
    b.hand.splice(handIndex, 1);
    
    // Check for Exhaust effect (base description, or gained via upgrade)
    if ((card.description && (card.description.includes("Exhaust") || card.id === "prepare" || card.id === "void_shield")) || this.gainsExhaust(card, upg)) {
      this.log(`✨ ${card.name} is exhausted and removed from this battle.`);
    } else {
      b.discardPile.push(cardId);
    }
    
    this.log(`▶️ You play ${card.name}.`);

    // Vampire Fang relic healing (hook-based)
    if (card.type === "Attack" && p.hp > 0) {
      const fang = this.relicValue("onAttackHeal");
      if (fang) {
        const healAmt = Math.min(fang, p.maxHp - p.hp);
        if (healAmt > 0) { p.hp += healAmt; this.log(`🩸 Vampire Fang heals you for ${healAmt} HP.`); }
      }
    }

    // Plasma Edge: bonus attack damage (added to this card's damage).
    if (card.type === "Attack" && e.damage) {
      e.damage += this.relicValue("bonusDamage");
    }

    // Void Strike extra energy logic
    if (cardId === "void_strike") {
      const t = b.enemies.find(x => x.uid === b.target);
      if (t && t.weak > 0) {
        p.mana = Math.min(p.maxMana, p.mana + 1);
        this.log(`⚡ Void Strike triggers: target has Weak, gained 1 Energy!`);
      }
    }

    // Demon Form setup
    if (cardId === "demon_form") {
      p.demonForm = (p.demonForm || 0) + 1;
    }

    // Determine targets for hostile effects
    const targets = e.aoe ? this.livingEnemies()
      : [b.enemies[b.target]].filter(t => t && !t.dead);

    // Hostile effects
    targets.forEach(t => {
      if (e.damage) {
        const hits = e.hits || 1;
        for (let h = 0; h < hits; h++) {
          if (t.dead) break;
          const r = this.dealDamage(p, t, e.damage);
          this.log(`💥 ${card.name} hits ${t.name} for ${r.real}${r.absorbed ? ` (${r.absorbed} blocked)` : ""}.`);
          if (this.onHit) this.onHit("enemy", t.uid);
          if (t.hp <= 0) { t.dead = true; this.log(`💀 ${t.name} is defeated!`); }
        }
      }
      if (e.poison)     { t.poison += e.poison;         this.log(`☠️ ${t.name} gains ${e.poison} Poison.`); }
      if (e.vulnerable) { t.vulnerable += e.vulnerable; this.log(`🎯 ${t.name} gains ${e.vulnerable} Vulnerable.`); }
      if (e.weak)       { t.weak += e.weak;             this.log(`⛓️ ${t.name} gains ${e.weak} Weak.`); }
    });

    // Self effects
    if (e.armor)     { p.armor += e.armor;       this.log(`🛡️ You gain ${e.armor} armor.`); }
    if (e.heal)      { const h = Math.min(e.heal, p.maxHp - p.hp); p.hp += h; this.log(`💚 You heal ${h} HP.`); }
    if (e.strength)  { p.strength += e.strength; this.log(`💪 You gain ${e.strength} Strength.`); }
    if (e.energy)    { p.mana += e.energy;       this.log(`⚡ You gain ${e.energy} mana.`); }
    if (e.purge)     { p.poison = 0;             this.log(`🍃 Your Poison is removed.`); }
    if (e.selfDamage){ p.hp = Math.max(0, p.hp - e.selfDamage); this.log(`🩸 You take ${e.selfDamage} damage.`); if (this.onHit) this.onHit("player"); }
    if (e.draw)      this.drawCards(e.draw);

    // retarget fix + win/lose check
    this.checkDeaths();
    this.update();
    return true;
  },

  setTarget(uid) {
    const b = this.battle;
    const e = b.enemies.find(x => x.uid === uid);
    if (e && !e.dead) { b.target = uid; this.update(); }
  },

  endPlayerTurn() {
    const b = this.battle;
    if (b.phase !== "player" || b.over) return;
    this.decayDebuffs(b.player);
    b.phase = "enemy";
    this.update();
    // enemies act sequentially with small delays for readability
    const actors = this.livingEnemies().slice();
    const step = (i) => {
      if (b.over) return;
      if (i >= actors.length) {
        actors.forEach(en => this.decayDebuffs(en));
        b.turn++;
        this.startPlayerTurn();
        return;
      }
      this.enemyAct(actors[i]);
      this.update();
      if (this.checkDeaths()) return;
      setTimeout(() => step(i + 1), 650);
    };
    setTimeout(() => step(0), 500);
  },

  /* ---- enemy turn ---- */
  enemyAct(enemy) {
    const b = this.battle;
    if (enemy.dead || b.over) return;
    enemy.armor = 0; // enemy armor also resets on its own turn
    this.tickPoison(enemy, enemy.name);
    if (enemy.hp <= 0) { enemy.dead = true; this.log(`💀 ${enemy.name} succumbs to poison!`); return; }

    const intent = enemy.intents[enemy.intentIndex % enemy.intents.length];
    const p = b.player;
    switch (intent.type) {
      case "attack": {
        const r = this.dealDamage(enemy, p, intent.value);
        this.log(`⚔️ ${enemy.name} attacks for ${r.real}${r.absorbed ? ` (${r.absorbed} blocked)` : ""}.`);
        if (this.onHit) this.onHit("player");
        break;
      }
      case "multiattack": {
        for (let h = 0; h < intent.hits; h++) {
          if (p.hp <= 0) break;
          const r = this.dealDamage(enemy, p, intent.value);
          this.log(`⚔️ ${enemy.name} strikes for ${r.real}${r.absorbed ? ` (${r.absorbed} blocked)` : ""}.`);
        }
        if (this.onHit) this.onHit("player");
        break;
      }
      case "defend":     enemy.armor += intent.value; this.log(`🛡️ ${enemy.name} gains ${intent.value} armor.`); break;
      case "buff":       enemy.strength += intent.value; this.log(`💪 ${enemy.name} gains ${intent.value} Strength!`); break;
      case "poison":     p.poison += intent.value; this.log(`☠️ ${enemy.name} poisons you (${intent.value}).`); break;
      case "weak":       p.weak += intent.value; this.log(`⛓️ ${enemy.name} weakens you (${intent.value}).`); break;
      case "vulnerable": p.vulnerable += intent.value; this.log(`🎯 ${enemy.name} exposes you (${intent.value}).`); break;
      case "heal": {
        const h = Math.min(intent.value, enemy.maxHp - enemy.hp);
        enemy.hp += h; this.log(`💚 ${enemy.name} heals ${h} HP.`); break;
      }
    }
    enemy.intentIndex++;
  },

  /* Human-readable description of an enemy's next intent */
  intentText(enemy) {
    const it = enemy.intents[enemy.intentIndex % enemy.intents.length];
    const dmg = (v) => Math.max(0, v + enemy.strength - (enemy.weak > 0 ? Math.ceil(v * 0.25) : 0));
    switch (it.type) {
      case "attack":      return { cls:"",       text:`⚔️ ATK ${dmg(it.value)}` };
      case "multiattack": return { cls:"",       text:`⚔️ ATK ${dmg(it.value)}×${it.hits}` };
      case "defend":      return { cls:"defend", text:`🛡️ DEF ${it.value}` };
      case "buff":        return { cls:"buff",   text:`💪 STR +${it.value}` };
      case "poison":      return { cls:"debuff", text:`☠️ PSN ${it.value}` };
      case "weak":        return { cls:"debuff", text:`⛓️ WEAK ${it.value}` };
      case "vulnerable":  return { cls:"debuff", text:`🎯 VULN ${it.value}` };
      case "heal":        return { cls:"buff",   text:`💚 HEAL ${it.value}` };
      default:            return { cls:"",       text:"❓" };
    }
  },
};
