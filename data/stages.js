/* ============================================================
   STAGES — designed map. 3 acts × 8 stages = 24 stages.
   Stage types: Normal, MiniBoss, Boss, Bonus
   Bonus = treasure (no battle): currency + free card unlock.
   rewards.cardPool: card ids offered as the pick-1-of-3 reward.
   ============================================================ */
const ACTS = [
  { act:1, name:"ACT 1 — WHISPERING FOREST", theme:"🌲" },
  { act:2, name:"ACT 2 — CRYSTAL CAVERNS",  theme:"💎" },
  { act:3, name:"ACT 3 — SHADOW CITADEL",   theme:"🏰" },
];

const STAGES = [
  /* ---------- ACT 1 ---------- */
  { id:"s1_1", act:1, type:"Normal",   name:"Forest Edge",     icon:"🌿", enemies:["goblin"],
    rewards:{ currency:35, xp:60,  cardPool:["jab","shield_bash","deflect"] } },
  { id:"s1_2", act:1, type:"Normal",   name:"Wolf Den",        icon:"🐾", enemies:["wolf","goblin"],
    rewards:{ currency:40, xp:70,  cardPool:["cleave","taunt","dodge"] } },
  { id:"s1_3", act:1, type:"Bonus",    name:"Hidden Grove",    icon:"🎁",
    rewards:{ currency:80, xp:40,  freeCard:"adrenaline" } },
  { id:"s1_4", act:1, type:"Normal",   name:"Spore Hollow",    icon:"🍄", enemies:["mushroom","wolf"],
    rewards:{ currency:45, xp:80,  cardPool:["expose","venom_blade","brace"] } },
  { id:"s1_5", act:1, type:"MiniBoss", name:"Throne of Sticks",icon:"👑", enemies:["goblin_king"],
    rewards:{ currency:90, xp:150, cardPool:["pummel","iron_wall","second_wind"] } },
  { id:"s1_6", act:1, type:"Normal",   name:"Bandit Camp",     icon:"⛺", enemies:["bandit","goblin"],
    rewards:{ currency:50, xp:90,  cardPool:["riposte","deep_breath","reckless"] } },
  { id:"s1_7", act:1, type:"Bonus",    name:"Ancient Shrine",  icon:"🎁",
    rewards:{ currency:100, xp:50, freeCard:"battle_cry" } },
  { id:"s1_8", act:1, type:"Boss",     name:"Dragon's Glade",  icon:"🐲", enemies:["forest_dragon"],
    rewards:{ currency:150, xp:250, cardPool:["whirlwind","toxic_cloud","shield_wall"] } },

  /* ---------- ACT 2 ---------- */
  { id:"s2_1", act:2, type:"Normal",   name:"Cavern Mouth",    icon:"🕳️", enemies:["bat","bat"],
    rewards:{ currency:55, xp:100, cardPool:["piercer","cripple","potion_toss"] } },
  { id:"s2_2", act:2, type:"Normal",   name:"Acid Pools",      icon:"🧪", enemies:["slime","bat"],
    rewards:{ currency:60, xp:110, cardPool:["crushing","second_wind","expose"] } },
  { id:"s2_3", act:2, type:"Bonus",    name:"Gem Cache",       icon:"🎁",
    rewards:{ currency:130, xp:60, freeCard:"time_warp" } },
  { id:"s2_4", act:2, type:"Normal",   name:"Bone Gallery",    icon:"🦴", enemies:["skeleton","slime"],
    rewards:{ currency:65, xp:120, cardPool:["vampiric","war_dance","fortress"] } },
  { id:"s2_5", act:2, type:"MiniBoss", name:"Shimmering Hall", icon:"💎", enemies:["crystal_golem"],
    rewards:{ currency:120, xp:200, cardPool:["blade_storm","sanctuary","plague"] } },
  { id:"s2_6", act:2, type:"Normal",   name:"Golem Forge",     icon:"⚒️", enemies:["golem","skeleton"],
    rewards:{ currency:70, xp:130, cardPool:["thunder","mind_spike","iron_wall"] } },
  { id:"s2_7", act:2, type:"Bonus",    name:"Crystal Spring",  icon:"🎁",
    rewards:{ currency:150, xp:70, freeCard:"executioner" } },
  { id:"s2_8", act:2, type:"Boss",     name:"Hydra's Lake",    icon:"🐍", enemies:["cave_hydra"],
    rewards:{ currency:220, xp:350, cardPool:["dragonfang","titan_skin","phoenix"] } },

  /* ---------- ACT 3 ---------- */
  { id:"s3_1", act:3, type:"Normal",   name:"Citadel Gates",   icon:"🚪", enemies:["cultist","cultist"],
    rewards:{ currency:80, xp:150, cardPool:["mind_spike","fortress","war_dance"] } },
  { id:"s3_2", act:3, type:"Normal",   name:"Haunted Wing",    icon:"👻", enemies:["wraith","cultist"],
    rewards:{ currency:85, xp:160, cardPool:["plague","sanctuary","blade_storm"] } },
  { id:"s3_3", act:3, type:"Bonus",    name:"Royal Vault",     icon:"🎁",
    rewards:{ currency:200, xp:90, freeCard:"gods_hand" } },
  { id:"s3_4", act:3, type:"Normal",   name:"Knight's Watch",  icon:"⚔️", enemies:["knight","wraith"],
    rewards:{ currency:90, xp:170, cardPool:["omnislash","meteor","titan_skin"] } },
  { id:"s3_5", act:3, type:"MiniBoss", name:"Champion's Arena",icon:"🏟️", enemies:["dark_champion"],
    rewards:{ currency:160, xp:280, cardPool:["black_pact","doom","dragonfang"] } },
  { id:"s3_6", act:3, type:"Normal",   name:"Gargoyle Roost",  icon:"🦅", enemies:["gargoyle","knight"],
    rewards:{ currency:100, xp:180, cardPool:["meteor","phoenix","executioner"] } },
  { id:"s3_7", act:3, type:"Bonus",    name:"Forbidden Library",icon:"🎁",
    rewards:{ currency:250, xp:100, freeCard:"omnislash" } },
  { id:"s3_8", act:3, type:"Boss",     name:"Lich's Sanctum",  icon:"☠️", enemies:["lich_lord"],
    rewards:{ currency:400, xp:600, cardPool:["doom","gods_hand","meteor"] } },
];

function getStageByIndex(i) { return STAGES[i]; }

/* ============================================================
   NODE_COMPOSITION — per-act weights used by Run.generateRun
   to fill the non-boss/non-miniboss encounter slots of an act.
   Act 1 is safer; Act 3 is harder (more elites, more events).
   Boss + MiniBoss positions come from the designed STAGES list.
   ============================================================ */
const NODE_COMPOSITION = {
  1: { combat: 5, event: 3, camp: 2, elite: 1, treasure: 1, shop: 1 },
  2: { combat: 4, event: 3, camp: 2, elite: 2, treasure: 1, shop: 2 },
  3: { combat: 4, event: 3, camp: 1, elite: 3, treasure: 1, shop: 2 },
};

/* Relic tier offered by elite/treasure nodes, per act. */
const ACT_RELIC_TIER = { 1: "common", 2: "rare", 3: "boss" };
