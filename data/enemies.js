/* ============================================================
   ENEMIES — intent pattern cycles in order, looping.
   intent types: attack, multiattack, defend, buff (strength),
                 poison, weak, vulnerable, heal
   ============================================================ */
const ENEMIES = [
  /* ---------- ACT 1: WHISPERING FOREST ---------- */
  { id:"goblin",      name:"Goblin",        art:"👺", maxHp:18,
    intents:[ {type:"attack",value:5}, {type:"attack",value:5}, {type:"defend",value:4} ] },
  { id:"wolf",        name:"Dire Wolf",     art:"🐺", maxHp:16,
    intents:[ {type:"multiattack",value:3,hits:2}, {type:"attack",value:6} ] },
  { id:"mushroom",    name:"Spore Cap",     art:"🍄", maxHp:22,
    intents:[ {type:"poison",value:3}, {type:"attack",value:4}, {type:"defend",value:5} ] },
  { id:"bandit",      name:"Forest Bandit", art:"🥷", maxHp:24,
    intents:[ {type:"attack",value:7}, {type:"weak",value:1}, {type:"attack",value:7} ] },
  { id:"goblin_king", name:"Goblin King",   art:"👹", maxHp:55, miniboss:true,
    intents:[ {type:"attack",value:8}, {type:"buff",value:2}, {type:"multiattack",value:4,hits:2}, {type:"defend",value:8} ] },
  { id:"forest_dragon", name:"Forest Dragon", art:"🐲", maxHp:90, boss:true,
    intents:[ {type:"attack",value:10}, {type:"poison",value:4}, {type:"defend",value:10}, {type:"multiattack",value:5,hits:3} ] },

  /* ---------- ACT 2: CRYSTAL CAVERNS ---------- */
  { id:"bat",         name:"Cave Bat",      art:"🦇", maxHp:20,
    intents:[ {type:"multiattack",value:3,hits:2}, {type:"weak",value:1}, {type:"attack",value:6} ] },
  { id:"slime",       name:"Acid Slime",    art:"🟢", maxHp:30,
    intents:[ {type:"poison",value:4}, {type:"attack",value:7}, {type:"heal",value:5} ] },
  { id:"skeleton",    name:"Skeleton",      art:"💀", maxHp:26,
    intents:[ {type:"attack",value:9}, {type:"defend",value:6}, {type:"attack",value:9} ] },
  { id:"golem",       name:"Stone Golem",   art:"🗿", maxHp:38,
    intents:[ {type:"defend",value:8}, {type:"attack",value:11}, {type:"vulnerable",value:2} ] },
  { id:"crystal_golem", name:"Crystal Golem", art:"💎", maxHp:80, miniboss:true,
    intents:[ {type:"defend",value:12}, {type:"attack",value:13}, {type:"buff",value:2}, {type:"multiattack",value:6,hits:2} ] },
  { id:"cave_hydra",  name:"Cave Hydra",    art:"🐍", maxHp:130, boss:true,
    intents:[ {type:"multiattack",value:6,hits:3}, {type:"poison",value:5}, {type:"heal",value:10}, {type:"attack",value:14} ] },

  /* ---------- ACT 3: SHADOW CITADEL ---------- */
  { id:"cultist",     name:"Cultist",       art:"🧟", maxHp:32,
    intents:[ {type:"buff",value:2}, {type:"attack",value:9}, {type:"attack",value:9} ] },
  { id:"knight",      name:"Dread Knight",  art:"⚔️", maxHp:40,
    intents:[ {type:"attack",value:12}, {type:"defend",value:10}, {type:"multiattack",value:6,hits:2} ] },
  { id:"wraith",      name:"Wraith",        art:"👻", maxHp:28,
    intents:[ {type:"weak",value:2}, {type:"attack",value:10}, {type:"vulnerable",value:2} ] },
  { id:"gargoyle",    name:"Gargoyle",      art:"🦅", maxHp:36,
    intents:[ {type:"defend",value:9}, {type:"multiattack",value:5,hits:2}, {type:"attack",value:12} ] },
  { id:"dark_champion", name:"Dark Champion", art:"🛡️", maxHp:110, miniboss:true,
    intents:[ {type:"attack",value:14}, {type:"buff",value:3}, {type:"defend",value:14}, {type:"multiattack",value:7,hits:2} ] },
  { id:"lich_lord",   name:"Lich Lord",     art:"🧙‍♂️", maxHp:180, boss:true,
    intents:[ {type:"attack",value:16}, {type:"poison",value:6}, {type:"weak",value:2}, {type:"heal",value:12}, {type:"multiattack",value:8,hits:2} ] },
];

function getEnemyById(id) { return ENEMIES.find(e => e.id === id); }
