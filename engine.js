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

  /* Jester hooks */
  jesterValue(hook, context = {}) {
    if (!this.battle || !this.battle.jesters) return 0;
    let total = 0;
    this.battle.jesters.forEach(id => {
      const j = (typeof getJesterById === "function") ? getJesterById(id) : null;
      if (j && j.effects) {
        j.effects.forEach(e => {
          if (typeof e === "string") {
            const [k, v] = e.split(":");
            if (k === hook && v && v.startsWith("+")) total += parseInt(v.slice(1), 10);
          }
        });
      }
    });
    return total;
  },
  jesterMult(hook, context = {}) {
    if (!this.battle || !this.battle.jesters) return 1;
    let mult = 1;
    this.battle.jesters.forEach(id => {
      const j = (typeof getJesterById === "function") ? getJesterById(id) : null;
      if (j && j.effects) {
        j.effects.forEach(e => {
          if (typeof e === "string") {
            const [k, v] = e.split(":");
            if (k === hook && v && v.startsWith("x")) mult *= parseFloat(v.slice(1));
          } else if (typeof e === "object") {
            if (hook === "conditionalMult" && e.conditionalMult) {
              if (context.cardsPlayed >= e.conditionalMult.when) {
                mult *= e.conditionalMult.xN;
              }
            }
          }
        });
      }
    });
    return mult;
  },

  /* ---- battle setup ---- */
  startBattle(stage, playerState, deckCardIds, cardUpgrades) {
    const enemies = stage.enemies.map((id, i) => {
      const t = getEnemyById(id);
      return {
        uid: i, id: t.id, name: t.name, art: t.art,
        hp: t.hp || t.maxHp, maxHp: t.hp || t.maxHp, armor: 0,
        strength: 0, poison: 0, vulnerable: 0, weak: 0,
        thorns: 0, healPerTurn: 0, damageTakenMultiplier: 1.0,
        intents: t.intents, intentIndex: 0, dead: false,
        abilities: t.abilities || [],
        shock: 0, stagger: 0, blind: 0, ink: 0, curse_spore: 0,
        hex: 0, rust: 0, lag: 0, curse_note: 0, curse_vow: 0, doom: 0,
      };
    });
    // Set static/passive abilities on enemies
    enemies.forEach(e => {
      const t = getEnemyById(e.id);
      if (t.abilities) {
        t.abilities.forEach(ab => {
          const parts = ab.split(":");
          const k = parts[0];
          const v = parts[1];
          if (k === "thorns") e.thorns = parseInt(v, 10);
          if (k === "healPerTurn") e.healPerTurn = parseInt(v, 10);
          if (k === "damageTakenMultiplier") e.damageTakenMultiplier = parseFloat(v);
        });
      }
    });

    this.battle = {
      stage,
      player: {
        hp: playerState.hp, maxHp: playerState.maxHp,
        mana: playerState.maxMana, maxMana: playerState.maxMana,
        maxManaBase: playerState.maxMana,
        armor: 0, strength: 0, poison: 0, vulnerable: 0, weak: 0,
        shock: 0, stagger: 0, blind: 0, ink: 0, curse_spore: 0,
        hex: 0, rust: 0, lag: 0, curse_note: 0, curse_vow: 0, doom: 0,
      },
      enemies,
      drawPile: this.shuffle(deckCardIds.slice()),
      hand: [], discardPile: [], selectedCards: [],
      cardUpgrades: cardUpgrades || {},
      relics: playerState.relics || [],
      jesters: playerState.jesters || [],
      turn: 1, phase: "player", target: 0, over: false,
      handsLeft: 3, discardsLeft: 3,
      playerModifiers: [],
      enemyModifiers: [],
      laggedCardIndices: [],
    };

    // Apply run-level jester bonuses
    this.battle.player.maxMana += this.jesterValue("addMaxMana");
    this.battle.player.maxManaBase = this.battle.player.maxMana;
    this.battle.handsLeft += this.jesterValue("addPlayHands");
    this.battle.discardsLeft += this.jesterValue("addDiscards");

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
    if (manaRelic) {
      this.battle.player.maxManaBase += manaRelic;
      this.battle.player.maxMana = this.battle.player.maxManaBase;
      this.battle.player.mana = this.battle.player.maxMana;
    }

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

  /* Modifier & Status Helpers */
  applyModifier(targetType, id, value, duration, stageScoped, targetUid = null) {
    const b = this.battle;
    const mod = { id, value, duration, stageScoped };
    if (targetType === "player") {
      b.playerModifiers.push(mod);
      this.log(`⚠️ Player gains modifier ${id}: ${value > 0 ? "+" : ""}${value} (${stageScoped ? "stage" : `${duration} turns`}).`);
      if (id === "reduceDiscards") {
        b.discardsLeft = Math.max(0, b.discardsLeft + value);
      }
    } else {
      mod.uid = targetUid;
      b.enemyModifiers.push(mod);
      const enemyName = b.enemies.find(e => e.uid === targetUid).name;
      this.log(`⚠️ ${enemyName} gains modifier ${id}: ${value > 0 ? "+" : ""}${value} (${stageScoped ? "stage" : `${duration} turns`}).`);
    }
    this.update();
  },

  getModifierValue(targetType, id, targetUid = null) {
    const b = this.battle;
    if (!b) return 0;
    let sum = 0;
    if (targetType === "player") {
      if (b.playerModifiers) {
        b.playerModifiers.forEach(m => {
          if (m.id === id) sum += m.value;
        });
      }
    } else {
      if (b.enemyModifiers) {
        b.enemyModifiers.forEach(m => {
          if (m.uid === targetUid && m.id === id) sum += m.value;
        });
      }
    }
    return sum;
  },

  getEnemyDamageTakenMultiplier(enemy) {
    const base = enemy.damageTakenMultiplier !== undefined ? enemy.damageTakenMultiplier : 1.0;
    let mult = base;
    const b = this.battle;
    if (b && b.enemyModifiers) {
      b.enemyModifiers.forEach(m => {
        if (m.uid === enemy.uid && m.id === "damageTakenMultiplier") {
          mult *= m.value;
        }
      });
    }
    return mult;
  },

  getEnemyThorns(enemy) {
    const base = enemy.thorns || 0;
    const mod = this.getModifierValue("enemy", "thorns", enemy.uid);
    return base + mod;
  },

  decayPlayerModifiers() {
    const b = this.battle;
    if (!b.playerModifiers) return;
    b.playerModifiers = b.playerModifiers.filter(m => {
      if (m.stageScoped) return true;
      m.duration--;
      return m.duration > 0;
    });
  },

  decayEnemyModifiers(enemy) {
    const b = this.battle;
    if (!b.enemyModifiers) return;
    b.enemyModifiers = b.enemyModifiers.filter(m => {
      if (m.uid !== enemy.uid) return true;
      if (m.stageScoped) return true;
      m.duration--;
      return m.duration > 0;
    });
  },

  decayPlayerStatuses() {
    const p = this.battle.player;
    if (p.stagger > 0) p.stagger--;
    if (p.blind > 0) p.blind--;
    if (p.ink > 0) p.ink--;
    if (p.hex > 0) p.hex--;
    if (p.rust > 0) p.rust--;
    if (p.lag > 0) p.lag--;
  },

  /* ---- damage calculation ---- */
  dealDamage(source, target, base) {
    let dmg = base + (source.strength || 0);
    if (source.weak > 0) dmg = Math.floor(dmg * 0.75);
    if (target.vulnerable > 0) dmg = Math.floor(dmg * 1.5);
    dmg = Math.max(0, dmg);
    
    // Apply damageTakenMultiplier for enemies
    if (target.uid !== undefined) {
      const mult = this.getEnemyDamageTakenMultiplier(target);
      dmg = Math.floor(dmg * mult);
    }
    
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
    
    // Recalculate max mana with temporary modifiers
    const manaPenalty = this.getModifierValue("player", "reduceMaxMana");
    b.player.maxMana = Math.max(1, (b.player.maxManaBase || 3) + manaPenalty);
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

    if (b.handsLeft <= 0 && this.livingEnemies().length > 0) {
      b.player.hp = 0; // Out of budget
      b.over = true;
      this.log("💔 Exhausted all Hands! You fall...");
      if (this.onEnd) this.onEnd(false);
      this.update();
      return;
    }

    const targetHandSize = Math.max(0, 5 + this.relicValue("extraDraw") + this.jesterValue("addHandSize") - (b.player.stagger || 0));
    const drawAmt = Math.max(0, targetHandSize - b.hand.length);
    if (drawAmt > 0) {
      this.drawCards(drawAmt);
    }

    // Lag status locking
    b.laggedCardIndices = [];
    if (b.player.lag > 0 && b.hand.length > 0) {
      const numToLock = Math.min(b.hand.length, b.player.lag);
      const indices = Array.from({ length: b.hand.length }, (_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      b.laggedCardIndices = indices.slice(0, numToLock);
      b.laggedCardIndices.forEach(idx => {
        const cardId = b.hand[idx];
        const card = resolveCard(cardId);
        this.log(`🌐 Lagged! ${card.name} is locked for this turn.`);
      });
    }

    // Decay player status and modifiers after draw calculation
    this.decayPlayerStatuses();
    this.decayPlayerModifiers();

    this.log(`— Turn ${b.turn}: your move —`);
    this.update();
    if (this.onPlayerTurnStart) this.onPlayerTurnStart();
  },

  toggleSelection(handIndex) {
    const b = this.battle;
    if (b.phase !== "player" || b.over) return;
    if (b.laggedCardIndices && b.laggedCardIndices.includes(handIndex)) {
      this.log("❌ That card is locked by Lag!");
      return;
    }
    const pos = b.selectedCards.indexOf(handIndex);
    if (pos >= 0) {
      b.selectedCards.splice(pos, 1);
    } else {
      b.selectedCards.push(handIndex);
    }
    this.update();
  },

  selectionCost() {
    const b = this.battle;
    let cost = 0;
    let shockActive = b.player.shock || 0;
    const sortedSelections = b.selectedCards.slice().sort((a, b) => a - b);
    sortedSelections.forEach(idx => {
      const cardId = b.hand[idx];
      const card = resolveCard(cardId);
      if (card) {
        let baseCost = this.effectiveCost(card, b.cardUpgrades[cardId] || 0);
        if (shockActive > 0 && card.manaCost !== -1) {
          baseCost += 1;
          shockActive--;
        }
        cost += baseCost;
      }
    });
    return cost;
  },

  discardHand() {
    const b = this.battle;
    if (b.phase !== "player" || b.over || b.discardsLeft <= 0 || b.selectedCards.length === 0) return false;
    
    b.discardsLeft--;
    
    // Move selected cards from hand to discard pile
    const indices = b.selectedCards.slice().sort((a, b) => b - a);
    indices.forEach(idx => {
      b.discardPile.push(b.hand[idx]);
      b.hand.splice(idx, 1);
    });
    
    const count = indices.length;
    b.selectedCards = [];
    
    this.log(`♻️ Discarded ${count} card(s).`);
    
    // Draw replacements up to hand limit
    const targetHandSize = 5 + this.relicValue("extraDraw") + this.jesterValue("addHandSize");
    const drawAmt = Math.max(0, targetHandSize - b.hand.length);
    if (drawAmt > 0) {
      this.drawCards(drawAmt);
    }

    this.update();
    return true;
  },

  playHand() {
    const b = this.battle;
    if (b.phase !== "player" || b.over || b.handsLeft <= 0 || b.selectedCards.length === 0) return false;
    
    const cost = this.selectionCost();
    if (cost > b.player.mana) {
      this.log(`❌ Not enough Mana (${cost}/${b.player.mana}) to play these cards.`);
      return false;
    }
    
    // Play Hands penalty check
    const playHandsPenalty = this.getModifierValue("player", "reducePlayHands");
    const playCost = 1 + playHandsPenalty;
    if (b.handsLeft < playCost) {
      this.log(`❌ Not enough Play Hands (${b.handsLeft}/${playCost}) to play this hand.`);
      return false;
    }

    b.handsLeft -= playCost;
    b.player.mana -= cost;
    
    const p = b.player;
    const cardsPlayed = b.selectedCards.length;
    const ctx = { cardsPlayed };
    
    // Gather cards and remove from hand (reverse order)
    const indices = b.selectedCards.slice().sort((a, b) => b - a);
    const playedCards = [];
    indices.forEach(idx => {
      playedCards.unshift(b.hand[idx]);
      b.hand.splice(idx, 1);
    });
    b.selectedCards = [];

    let totalBaseDamage = 0;
    let aoeDamage = 0;
    let hasAoe = false;

    let lastCardType = null;

    // Resolve individual non-damage effects and sum damage
    playedCards.forEach(cardId => {
      const card = resolveCard(cardId);
      if (!card) return;
      const upg = b.cardUpgrades[cardId] || 0;
      const e = this.upgradedEffect(card, upg);

      if ((card.description && (card.description.includes("Exhaust") || card.id === "prepare" || card.id === "void_shield")) || this.gainsExhaust(card, upg)) {
        this.log(`✨ ${card.name} is exhausted.`);
      } else {
        b.discardPile.push(cardId);
      }

      this.log(`▶️ Played ${card.name}.`);

      // Shock stack decrement
      if (p.shock > 0 && card.manaCost !== -1) {
        p.shock--;
        this.log(`⚡ Shocked! A card consumed 1 additional mana. (${p.shock} shock remaining)`);
      }

      // Curse Vow check
      const cardType = card.type;
      if (p.curse_vow > 0 && lastCardType && cardType === lastCardType && (cardType === "Attack" || cardType === "Skill")) {
        const vowDmg = p.curse_vow * 3;
        p.hp = Math.max(0, p.hp - vowDmg);
        this.log(`📜 Vow Broken! Playing consecutive ${cardType}s deals ${vowDmg} damage to you.`);
        if (this.onHit) this.onHit("player");
      }
      lastCardType = cardType;

      // Hex check
      if (p.hex > 0 && (cardType === "Skill" || cardType === "Buff" || cardType === "Debuff")) {
        const hexDmg = p.hex * 2;
        p.hp = Math.max(0, p.hp - hexDmg);
        this.log(`🔮 Hexed! Playing ${cardType} deals ${hexDmg} damage to you.`);
        if (this.onHit) this.onHit("player");
      }

      if (card.type === "Attack" && p.hp > 0) {
        const fang = this.relicValue("onAttackHeal");
        if (fang) {
          const healAmt = Math.min(fang, p.maxHp - p.hp);
          if (healAmt > 0) { p.hp += healAmt; this.log(`🩸 Vampire Fang heals you for ${healAmt} HP.`); }
        }
      }

      // Thorns check
      const hits = e.hits || 1;
      const targets = e.aoe ? this.livingEnemies() : [b.enemies[b.target]].filter(t => t && !t.dead);
      targets.forEach(t => {
        const totalThorns = this.getEnemyThorns(t);
        if (e.damage && totalThorns > 0) {
          const thornsDmg = totalThorns * hits;
          p.hp = Math.max(0, p.hp - thornsDmg);
          this.log(`💥 Thorns! ${t.name} deals ${thornsDmg} damage back to you.`);
          if (this.onHit) this.onHit("player");
        }
      });

      if (e.damage) {
        let cardDmg = e.damage + (p.strength || 0);
        if (card.type === "Attack") {
          cardDmg += this.relicValue("bonusDamage");
        }
        if (e.aoe) {
          aoeDamage += cardDmg;
          hasAoe = true;
        } else {
          totalBaseDamage += cardDmg * (e.hits || 1);
        }
      }

      if (cardId === "void_strike") {
        const t = b.enemies.find(x => x.uid === b.target);
        if (t && t.weak > 0) {
          p.mana = Math.min(p.maxMana, p.mana + 1);
          this.log(`⚡ Void Strike triggers: target has Weak, gained 1 Energy!`);
        }
      }

      if (cardId === "demon_form") {
        p.demonForm = (p.demonForm || 0) + 1;
      }

      // Self effects
      if (e.armor) {
        let armorGain = e.armor;
        if (p.rust > 0) {
          const reduction = Math.min(0.75, p.rust * 0.25);
          armorGain = Math.max(0, Math.floor(armorGain * (1 - reduction)));
          this.log(`⚙️ Rusted! Block gain reduced to ${armorGain} (${reduction * 100}% reduction).`);
        }
        p.armor += armorGain;
        this.log(`🛡️ You gain ${armorGain} armor.`);
      }
      if (e.heal)      { const h = Math.min(e.heal, p.maxHp - p.hp); p.hp += h; this.log(`💚 You heal ${h} HP.`); }
      if (e.strength)  { p.strength += e.strength; this.log(`💪 You gain ${e.strength} Strength.`); }
      if (e.energy)    { p.mana += e.energy;       this.log(`⚡ You gain ${e.energy} mana.`); }
      if (e.purge)     { p.poison = 0;             this.log(`🍃 Your Poison is removed.`); }
      if (e.selfDamage){ p.hp = Math.max(0, p.hp - e.selfDamage); this.log(`🩸 You take ${e.selfDamage} damage.`); if (this.onHit) this.onHit("player"); }
      if (e.draw)      this.drawCards(e.draw);

      // Debuffs (apply to single target or AoE)
      const debuffTargets = e.aoe ? this.livingEnemies() : [b.enemies[b.target]].filter(t => t && !t.dead);
      debuffTargets.forEach(t => {
        if (e.poison)     { t.poison += e.poison;         this.log(`☠️ ${t.name} gains ${e.poison} Poison.`); }
        if (e.vulnerable) { t.vulnerable += e.vulnerable; this.log(`🎯 ${t.name} gains ${e.vulnerable} Vulnerable.`); }
        if (e.weak)       { t.weak += e.weak;             this.log(`⛓️ ${t.name} gains ${e.weak} Weak.`); }
      });
    });

    // Apply Jester total damage modifiers
    totalBaseDamage += this.jesterValue("flatDamageBonus", ctx);
    aoeDamage += this.jesterValue("flatDamageBonus", ctx);
    p.armor += this.jesterValue("flatBlockBonus", ctx);

    const dmgMult = this.jesterMult("damageMultiplier", ctx) * this.jesterMult("conditionalMult", ctx);
    
    totalBaseDamage = Math.floor(totalBaseDamage * dmgMult);
    aoeDamage = Math.floor(aoeDamage * dmgMult);

    const dummySource = { strength: 0, weak: p.weak };

    // Deal damage
    if (totalBaseDamage > 0) {
      const t = b.enemies.find(x => x.uid === b.target);
      if (t && !t.dead) {
        const r = this.dealDamage(dummySource, t, totalBaseDamage);
        this.log(`💥 Hand deals ${r.real} total damage to ${t.name}${r.absorbed ? ` (${r.absorbed} blocked)` : ""}.`);
        if (this.onHit) this.onHit("enemy", t.uid);
      }
    }
    
    if (hasAoe && aoeDamage > 0) {
      this.livingEnemies().forEach(t => {
        const r = this.dealDamage(dummySource, t, aoeDamage);
        this.log(`💥 Hand deals ${r.real} AoE damage to ${t.name}${r.absorbed ? ` (${r.absorbed} blocked)` : ""}.`);
        if (this.onHit) this.onHit("enemy", t.uid);
      });
    }

    this.checkDeaths();
    this.update();
    
    if (b.over) return true;
    
    // Enemy acts after Play Hand
    this.endPlayerTurn();
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
    
    // Decay enemy-side modifiers at the start of their turn
    this.decayEnemyModifiers(enemy);
    
    enemy.armor = 0; // enemy armor also resets on its own turn
    this.tickPoison(enemy, enemy.name);
    if (enemy.hp <= 0) { enemy.dead = true; this.log(`💀 ${enemy.name} succumbs to poison!`); return; }

    // healPerTurn trigger
    const passiveHeal = enemy.healPerTurn || 0;
    const modHeal = this.getModifierValue("enemy", "healPerTurn", enemy.uid);
    const healVal = passiveHeal + modHeal;
    if (healVal > 0 && enemy.hp > 0 && enemy.hp < enemy.maxHp) {
      const h = Math.min(healVal, enemy.maxHp - enemy.hp);
      enemy.hp += h;
      this.log(`💚 ${enemy.name} heals ${h} HP from regen/sustain.`);
    }

    const intent = enemy.intents[enemy.intentIndex % enemy.intents.length];
    const p = b.player;

    // Process modifiers in note
    this.processIntentModifiers(enemy, intent);

    switch (intent.type) {
      case "attack": {
        const r = this.dealDamage(enemy, p, intent.value);
        this.log(`⚔️ ${enemy.name} attacks for ${r.real}${r.absorbed ? ` (${r.absorbed} blocked)` : ""}.`);
        if (this.onHit) this.onHit("player");
        this.triggerEnemyOnHitEffects(enemy, intent);
        break;
      }
      case "multiattack": {
        for (let h = 0; h < intent.hits; h++) {
          if (p.hp <= 0) break;
          const r = this.dealDamage(enemy, p, intent.value);
          this.log(`⚔️ ${enemy.name} strikes for ${r.real}${r.absorbed ? ` (${r.absorbed} blocked)` : ""}.`);
          this.triggerEnemyOnHitEffects(enemy, intent);
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
      case "debuff":
      case "special": {
        this.log(`✨ ${enemy.name} performs: ${intent.note || "Special action"}.`);
        break;
      }
    }
    enemy.intentIndex++;
  },

  /* Human-readable description of an enemy's next intent */
  intentText(enemy) {
    const b = this.battle;
    if (b && b.player && b.player.ink > 0) {
      return { cls: "unknown", text: "❓ UNKNOWN" };
    }
    
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
      case "debuff":      return { cls:"debuff", text: it.note ? it.note.split("(")[0].trim() : "💨 DEBUFF" };
      case "special":     return { cls:"special",text: it.note ? it.note.split("(")[0].trim() : "✨ SPECIAL" };
      default:            return { cls:"",       text:"❓" };
    }
  },

  /* Enemy on-hit status & modifier helpers */
  triggerEnemyOnHitEffects(enemy, intent) {
    const p = this.battle.player;
    const abList = enemy.abilities || [];
    const note = intent.note || "";
    
    const applyStatus = (statusName, count) => {
      p[statusName] = (p[statusName] || 0) + count;
      this.log(`⚠️ Applied ${count} stack(s) of ${statusName} to Player.`);
      
      if (statusName === "curse_spore" && p.curse_spore >= 3) {
        p.curse_spore -= 3;
        this.addCurseToDiscard("curse_static");
        this.log(`🍄 Spore cache burst! Added Static curse to your discard pile.`);
      }
      if (statusName === "curse_note" && p.curse_note >= 3) {
        p.curse_note -= 3;
        p.hp = Math.max(0, p.hp - 15);
        this.addCurseToDiscard("curse_static");
        this.log(`🎵 Crescendo! Taken 15 damage and added Static curse to discard.`);
        if (this.onHit) this.onHit("player");
      }
      if (statusName === "doom" && p.doom >= 3) {
        p.doom -= 3;
        p.hp = Math.max(0, p.hp - 30);
        this.log(`☠️ Doom Prophecy fulfilled! Taken 30 damage.`);
        if (this.onHit) this.onHit("player");
      }
    };
    
    const checkString = (str) => {
      const match = str.match(/applyStatusOnHit:\{([^}]+)\}/);
      if (match) {
        const parts = match[1].split(":");
        const name = parts[0];
        const count = parseInt(parts[1], 10);
        applyStatus(name, count);
      }
    };
    
    abList.forEach(ab => checkString(ab));
    checkString(note);
  },
  
  addCurseToDiscard(curseId) {
    this.battle.discardPile.push(curseId);
  },

  processIntentModifiers(enemy, intent) {
    const note = intent.note || "";
    const modifierRegex = /(reducePlayHands|reduceDiscards|reduceMaxMana|damageTakenMultiplier|healPerTurn|thorns):([+-]?\d*\.?\d+)/g;
    let match;
    while ((match = modifierRegex.exec(note)) !== null) {
      const modId = match[1];
      const modVal = parseFloat(match[2]);
      
      let duration = 1;
      let stageScoped = false;
      if (note.includes("stage")) {
        stageScoped = true;
        duration = Infinity;
      } else if (note.includes("next 2 turns") || note.includes("next 2 enemy turns")) {
        duration = 2;
      } else if (note.includes("1 cycle") || note.includes("next turn only")) {
        duration = 1;
      } else {
        if (modId === "reduceDiscards") {
          stageScoped = true;
          duration = Infinity;
        } else {
          duration = 1;
        }
      }
      
      if (modId === "damageTakenMultiplier" || modId === "healPerTurn" || modId === "thorns") {
        this.applyModifier("enemy", modId, modVal, duration, stageScoped, enemy.uid);
      } else {
        this.applyModifier("player", modId, modVal, duration, stageScoped);
      }
    }
  },
};
