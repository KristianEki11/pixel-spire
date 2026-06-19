/* ============================================================
   JESTERS — run-level persistent modifiers (Balatro-style Jokers)
   ============================================================ */

const JESTERS = [
  {
    id: "j_apprentice",
    name: "Apprentice Jester",
    rarity: "Common",
    description: "+1 Max Mana for each Play Hand.",
    effects: ["addMaxMana:+1"]
  },
  {
    id: "j_acrobat",
    name: "Acrobat",
    rarity: "Common",
    description: "+2 Discards per stage.",
    effects: ["addDiscards:+2"]
  },
  {
    id: "j_juggler",
    name: "Juggler",
    rarity: "Uncommon",
    description: "+1 Hand Size.",
    effects: ["addHandSize:+1"]
  },
  {
    id: "j_timekeeper",
    name: "Timekeeper",
    rarity: "Rare",
    description: "+1 Play Hand per stage.",
    effects: ["addPlayHands:+1"]
  },
  {
    id: "j_brute",
    name: "Brute Jester",
    rarity: "Uncommon",
    description: "Flat +5 damage to every Play Hand.",
    effects: ["flatDamageBonus:+5"]
  },
  {
    id: "j_shieldbearer",
    name: "Shieldbearer",
    rarity: "Uncommon",
    description: "Gain 3 Block every time you Play Hand.",
    effects: ["flatBlockBonus:+3"]
  },
  {
    id: "j_assassin",
    name: "Assassin",
    rarity: "Rare",
    description: "x1.5 Damage Multiplier.",
    effects: ["damageMultiplier:x1.5"]
  },
  {
    id: "j_swarm_tactician",
    name: "Swarm Tactician",
    rarity: "Rare",
    description: "x2 Damage when playing 3 or more cards at once.",
    effects: [ { conditionalMult: { when: 3, xN: 2 } } ]
  }
];

function getJesterById(id) {
  return JESTERS.find(j => j.id === id);
}

// Generate random jesters for draft / shop
function generateJesterChoices(count = 3) {
  // Simple random sampling without replacement for now
  const pool = JESTERS.slice();
  const choices = [];
  while (choices.length < count && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    choices.push(pool.splice(idx, 1)[0]);
  }
  return choices;
}
