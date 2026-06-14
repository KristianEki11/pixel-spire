/* ============================================================
   CARDS — all card definitions.
   effect keys (all optional):
     damage, hits, aoe(bool), armor, heal, draw, energy,
     poison, vulnerable, weak, strength, selfDamage, purge(bool)
   Upgrades (per level): +2 damage, +2 armor, +2 heal, +1 poison/strength
   ============================================================ */
const CARDS = [
  /* ---------- COMMON ATTACKS ---------- */
  { id:"strike",      name:"Strike",        manaCost:1, type:"Attack",  rarity:"Common", art:"assets/cards/strike.png", effect:{damage:6,hits:1}, description:"Deal {d} damage." },
  { id:"quick_slash", name:"Quick Slash",   manaCost:0, type:"Attack",  rarity:"Common", art:"assets/cards/quick_slash.png", effect:{damage:3,hits:1}, description:"Deal {d} damage." },
  { id:"heavy_blow",  name:"Heavy Blow",    manaCost:2, type:"Attack",  rarity:"Common", art:"assets/cards/heavy_blow.png", effect:{damage:12,hits:1}, description:"Deal {d} damage." },
  { id:"twin_fangs",  name:"Twin Fangs",    manaCost:1, type:"Attack",  rarity:"Common", art:"assets/cards/twin_fangs.png", effect:{damage:3,hits:2}, description:"Deal {d} damage twice." },
  { id:"cleave",      name:"Cleave",        manaCost:1, type:"Attack",  rarity:"Common", art:"assets/cards/cleave.png", effect:{damage:5,hits:1,aoe:true}, description:"Deal {d} damage to ALL enemies." },
  { id:"shield_bash", name:"Shield Bash",   manaCost:1, type:"Attack",  rarity:"Common", art:"assets/cards/shield_bash.png", effect:{damage:4,hits:1,armor:3}, description:"Deal {d} damage. Gain {a} armor." },
  { id:"jab",         name:"Jab",           manaCost:1, type:"Attack",  rarity:"Common", art:"assets/cards/jab.png", effect:{damage:4,hits:1,draw:1}, description:"Deal {d} damage. Draw 1 card." },
  { id:"reckless",    name:"Reckless Swing",manaCost:1, type:"Attack",  rarity:"Common", art:"assets/cards/reckless.png", effect:{damage:10,hits:1,selfDamage:3}, description:"Deal {d} damage. Take 3 damage." },

  /* ---------- COMMON DEFENSE ---------- */
  { id:"defend",      name:"Defend",        manaCost:1, type:"Defense", rarity:"Common", art:"assets/cards/defend.png", effect:{armor:5}, description:"Gain {a} Block." },
  { id:"dodge",       name:"Dodge Roll",    manaCost:0, type:"Defense", rarity:"Common", art:"assets/cards/dodge.png", effect:{armor:3}, description:"Gain {a} Block." },
  { id:"brace",       name:"Brace",         manaCost:2, type:"Defense", rarity:"Common", art:"assets/cards/brace.png", effect:{armor:11}, description:"Gain {a} Block." },
  { id:"deflect",     name:"Deflect",       manaCost:1, type:"Defense", rarity:"Common", art:"assets/cards/deflect.png", effect:{armor:4,draw:1}, description:"Gain {a} Block. Draw 1 card." },

  /* ---------- COMMON SKILLS / BUFFS / DEBUFFS ---------- */
  { id:"first_aid",   name:"First Aid",     manaCost:1, type:"Skill",   rarity:"Common", art:"assets/cards/first_aid.png", effect:{heal:4}, description:"Heal {h} HP." },
  { id:"focus",       name:"Focus",         manaCost:1, type:"Skill",   rarity:"Common", art:"assets/cards/focus.png", effect:{draw:2}, description:"Draw 2 cards." },
  { id:"adrenaline",  name:"Adrenaline",    manaCost:0, type:"Skill",   rarity:"Common", art:"assets/cards/adrenaline.png", effect:{energy:1,draw:1}, description:"Gain 1 mana. Draw 1 card." },
  { id:"flex",        name:"Flex",          manaCost:1, type:"Buff",    rarity:"Common", art:"assets/cards/flex.png", effect:{strength:1}, description:"Gain {s} Strength." },
  { id:"venom_dart",  name:"Venom Dart",    manaCost:1, type:"Debuff",  rarity:"Common", art:"assets/cards/venom_dart.png", effect:{poison:3}, description:"Apply {p} Poison." },
  { id:"taunt",       name:"Taunt",         manaCost:0, type:"Debuff",  rarity:"Common", art:"assets/cards/taunt.png", effect:{weak:1}, description:"Apply 1 Weak." },
  { id:"expose",      name:"Expose",        manaCost:1, type:"Debuff",  rarity:"Common", art:"assets/cards/expose.png", effect:{vulnerable:2}, description:"Apply 2 Vulnerable." },
  { id:"prepare",     name:"Prepare",       manaCost:0, type:"Skill",   rarity:"Common", art:"assets/cards/prepare.png", effect:{draw:2}, description:"Draw 2 cards. Exhaust." },

  /* ---------- RARE ---------- */
  { id:"pummel",      name:"Pummel",        manaCost:2, type:"Attack",  rarity:"Rare", art:"assets/cards/pummel.png", effect:{damage:3,hits:4}, description:"Deal {d} damage 4 times." },
  { id:"whirlwind",   name:"Whirlwind",     manaCost:2, type:"Attack",  rarity:"Rare", art:"assets/cards/whirlwind.png", effect:{damage:7,hits:1,aoe:true}, description:"Deal {d} damage to ALL enemies." },
  { id:"piercer",     name:"Piercer",       manaCost:2, type:"Attack",  rarity:"Rare", art:"assets/cards/piercer.png", effect:{damage:9,hits:1,vulnerable:2}, description:"Deal {d} damage. Apply 2 Vulnerable." },
  { id:"venom_blade", name:"Venom Blade",   manaCost:1, type:"Attack",  rarity:"Rare", art:"assets/cards/venom_blade.png", effect:{damage:5,hits:1,poison:3}, description:"Deal {d} damage. Apply {p} Poison." },
  { id:"crushing",    name:"Crushing Blow", manaCost:3, type:"Attack",  rarity:"Rare", art:"assets/cards/crushing.png", effect:{damage:20,hits:1}, description:"Deal {d} damage." },
  { id:"riposte",     name:"Riposte",       manaCost:2, type:"Attack",  rarity:"Rare", art:"assets/cards/riposte.png", effect:{damage:8,hits:1,armor:6}, description:"Deal {d} damage. Gain {a} armor." },
  { id:"iron_wall",   name:"Iron Wall",     manaCost:2, type:"Defense", rarity:"Rare", art:"assets/cards/iron_wall.png", effect:{armor:14}, description:"Gain {a} Block." },
  { id:"second_wind", name:"Second Wind",   manaCost:1, type:"Skill",   rarity:"Rare", art:"assets/cards/second_wind.png", effect:{heal:6,armor:4}, description:"Heal {h} HP. Gain {a} armor." },
  { id:"deep_breath", name:"Deep Breath",   manaCost:0, type:"Skill",   rarity:"Rare", art:"assets/cards/deep_breath.png", effect:{draw:3}, description:"Draw 3 cards." },
  { id:"battle_cry",  name:"Battle Cry",    manaCost:2, type:"Buff",    rarity:"Rare", art:"assets/cards/battle_cry.png", effect:{strength:2}, description:"Gain {s} Strength." },
  { id:"toxic_cloud", name:"Toxic Cloud",   manaCost:2, type:"Debuff",  rarity:"Rare", art:"assets/cards/toxic_cloud.png", effect:{poison:4,aoe:true}, description:"Apply {p} Poison to ALL enemies." },
  { id:"cripple",     name:"Cripple",       manaCost:1, type:"Debuff",  rarity:"Rare", art:"assets/cards/cripple.png", effect:{weak:2,vulnerable:1}, description:"Apply 2 Weak and 1 Vulnerable." },
  { id:"potion_toss", name:"Potion Toss",   manaCost:1, type:"Skill",   rarity:"Rare", art:"assets/cards/potion_toss.png", effect:{heal:3,energy:1}, description:"Heal {h} HP. Gain 1 mana." },
  { id:"shield_wall", name:"Shield Wall",   manaCost:3, type:"Defense", rarity:"Rare", art:"assets/cards/shield_wall.png", effect:{armor:10,heal:4}, description:"Gain {a} armor. Heal {h} HP." },
  { id:"void_strike", name:"Void Strike",   manaCost:1, type:"Attack",  rarity:"Rare", art:"assets/cards/void_strike.png", effect:{damage:12,hits:1}, description:"Deal {d} dmg. If target has Weak, gain 1 Energy." },
  { id:"poison_nova", name:"Poison Nova",   manaCost:2, type:"Debuff",  rarity:"Rare", art:"assets/cards/poison_nova.png", effect:{poison:4,aoe:true}, description:"Apply {p} Poison to ALL enemies." },

  /* ---------- EPIC ---------- */
  { id:"blade_storm", name:"Blade Storm",   manaCost:3, type:"Attack",  rarity:"Epic", art:"assets/cards/blade_storm.png", effect:{damage:5,hits:3,aoe:true}, description:"Deal {d} damage 3 times to ALL enemies." },
  { id:"executioner", name:"Executioner",   manaCost:3, type:"Attack",  rarity:"Epic", art:"assets/cards/executioner.png", effect:{damage:26,hits:1}, description:"Deal {d} damage." },
  { id:"vampiric",    name:"Vampiric Bite", manaCost:2, type:"Attack",  rarity:"Epic", art:"assets/cards/vampiric.png", effect:{damage:9,hits:1,heal:6}, description:"Deal {d} damage. Heal {h} HP." },
  { id:"thunder",     name:"Thunderclap",   manaCost:2, type:"Attack",  rarity:"Epic", art:"assets/cards/thunder.png", effect:{damage:8,hits:1,aoe:true,vulnerable:1}, description:"Deal {d} to ALL. Apply 1 Vulnerable to ALL." },
  { id:"fortress",    name:"Fortress",      manaCost:3, type:"Defense", rarity:"Epic", art:"assets/cards/fortress.png", effect:{armor:20}, description:"Gain {a} Block." },
  { id:"war_dance",   name:"War Dance",     manaCost:2, type:"Buff",    rarity:"Epic", art:"🔥", effect:{strength:2,draw:2}, description:"Gain {s} Strength. Draw 2 cards." },
  { id:"plague",      name:"Plague",        manaCost:2, type:"Debuff",  rarity:"Epic", art:"🦠", effect:{poison:7}, description:"Apply {p} Poison." },
  { id:"time_warp",   name:"Time Warp",     manaCost:1, type:"Skill",   rarity:"Epic", art:"⏳", effect:{energy:2,draw:1}, description:"Gain 2 mana. Draw 1 card." },
  { id:"sanctuary",   name:"Sanctuary",     manaCost:2, type:"Skill",   rarity:"Epic", art:"⛪", effect:{heal:12}, description:"Heal {h} HP." },
  { id:"mind_spike",  name:"Mind Spike",    manaCost:2, type:"Debuff",  rarity:"Epic", art:"🧠", effect:{weak:2,vulnerable:2,damage:6,hits:1}, description:"Deal {d} damage. Apply 2 Weak, 2 Vulnerable." },
  { id:"void_shield", name:"Void Shield",   manaCost:2, type:"Defense", rarity:"Epic", art:"🌌", effect:{armor:15}, description:"Gain {a} Block. Exhaust." },

  /* ---------- LEGENDARY ---------- */
  { id:"meteor",      name:"Meteor",        manaCost:4, type:"Attack",  rarity:"Legendary", art:"☄️", effect:{damage:18,hits:1,aoe:true}, description:"Deal {d} damage to ALL enemies." },
  { id:"dragonfang",  name:"Dragonfang",    manaCost:3, type:"Attack",  rarity:"Legendary", art:"🐉", effect:{damage:10,hits:3}, description:"Deal {d} damage 3 times." },
  { id:"phoenix",     name:"Phoenix Heart", manaCost:3, type:"Skill",   rarity:"Legendary", art:"🐦‍🔥", effect:{heal:20,purge:true}, description:"Heal {h} HP. Remove your Poison." },
  { id:"titan_skin",  name:"Titan Skin",    manaCost:3, type:"Defense", rarity:"Legendary", art:"🗿", effect:{armor:18,strength:1}, description:"Gain {a} Block and {s} Strength." },
  { id:"omnislash",   name:"Omnislash",     manaCost:5, type:"Attack",  rarity:"Legendary", art:"✨", effect:{damage:7,hits:5}, description:"Deal {d} damage 5 times." },
  { id:"gods_hand",   name:"God's Hand",    manaCost:2, type:"Buff",    rarity:"Legendary", art:"🙌", effect:{strength:3,armor:8}, description:"Gain {s} Strength and {a} armor." },
  { id:"black_pact",  name:"Black Pact",    manaCost:0, type:"Skill",   rarity:"Legendary", art:"📕", effect:{energy:2,selfDamage:4}, description:"Gain 2 mana. Take 4 damage." },
  { id:"doom",        name:"Doom",          manaCost:3, type:"Debuff",  rarity:"Legendary", art:"☠️", effect:{poison:6,aoe:true,weak:1}, description:"Apply {p} Poison and 1 Weak to ALL enemies." },
  { id:"demon_form",  name:"Demon Form",    manaCost:3, type:"Buff",    rarity:"Legendary", art:"😈", effect:{}, description:"At the start of your turn, gain 2 Strength." },
];

/* Starting unlocked cards + starting deck */
const STARTING_UNLOCKS = ["strike","quick_slash","heavy_blow","twin_fangs","defend","dodge","first_aid","focus","flex","venom_dart","prepare"];
const STARTING_DECK = ["strike","strike","strike","strike","strike","defend","defend","defend","defend","defend","quick_slash","quick_slash","first_aid","first_aid","focus","prepare"];

/* Shop unlock prices by rarity */
const RARITY_PRICE = { Common: 50, Rare: 100, Epic: 200, Legendary: 400 };

function getCardById(id) { return CARDS.find(c => c.id === id); }

/* Resolve any deck entry to a renderable card object, including curses.
   Curses live in data/curses.js (loaded before this is called at runtime). */
function resolveCard(id) {
  const c = getCardById(id);
  if (c) return c;
  if (typeof getCurseById === "function") {
    const curse = getCurseById(id);
    if (curse) return curse;
  }
  return { id, name: id, manaCost: 0, type: "Skill", rarity: "Common", art: "❓", effect: {}, description: "" };
}
