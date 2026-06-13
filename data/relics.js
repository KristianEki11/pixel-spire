/* ============================================================
   RELICS — data-driven passive items granted via drafts,
   elite/treasure rewards, events, and the shop.

   Relic model:
     { id, name, icon, tier, description, hook? , value? }

   tier: "common" | "rare" | "boss"   (draft pools)
   hook: optional engine trigger key. Engine reads relic ids/hooks
         directly where needed (see engine.js). Stat relics with
         onAcquire are applied immediately by Run.addRelic in game.js.

   onAcquire (optional): one-time effect when the relic is gained:
     { maxHp:+N } | { gold:+N } | { heal:+N }

   To add your own relic: copy a block, set a unique id and tier,
   write the description, and (if it needs combat behavior) add a
   hook handled in engine.js. Pure stat relics just use onAcquire.
   ============================================================ */
const RELICS = [

  /* ---------------- COMMON ---------------- */
  { id:"hellfire_stone", name:"HELLFIRE STONE", icon:"🔥", tier:"common",
    description:"At the start of combat, deal 3 damage to ALL enemies.",
    hook:"combatStartAoe", value:3 },

  { id:"vampire_fang", name:"VAMPIRE FANG", icon:"💜", tier:"common",
    description:"Heal 1 HP whenever you play an Attack card.",
    hook:"onAttackHeal", value:1 },

  { id:"copper_coil", name:"COPPER COIL", icon:"🪙", tier:"common",
    description:"Gain +20 gold each time you clear a combat node.",
    hook:"combatGold", value:20 },

  { id:"iron_charm", name:"IRON CHARM", icon:"🪖", tier:"common",
    description:"Gain +6 Max HP immediately.",
    onAcquire:{ maxHp:6 } },

  { id:"battery_pack", name:"BATTERY PACK", icon:"🔋", tier:"common",
    description:"On the first turn of each combat, gain 1 extra mana.",
    hook:"firstTurnMana", value:1 },

  { id:"medkit", name:"FIELD MEDKIT", icon:"🩹", tier:"common",
    description:"Heal 8 HP immediately.",
    onAcquire:{ heal:8 } },

  /* ---------------- RARE ---------------- */
  { id:"plasma_edge", name:"PLASMA EDGE", icon:"⚔️", tier:"rare",
    description:"Your attacks deal +2 damage.",
    hook:"bonusDamage", value:2 },

  { id:"aegis_core", name:"AEGIS CORE", icon:"🛡️", tier:"rare",
    description:"At the start of each combat, gain 6 Block.",
    hook:"combatStartArmor", value:6 },

  { id:"overclock", name:"OVERCLOCK CHIP", icon:"⚡", tier:"rare",
    description:"Draw 1 additional card at the start of your turn.",
    hook:"extraDraw", value:1 },

  { id:"regen_matrix", name:"REGEN MATRIX", icon:"💚", tier:"rare",
    description:"Heal 2 HP at the start of each of your turns.",
    hook:"turnHeal", value:2 },

  { id:"vault_key", name:"VAULT KEY", icon:"🗝️", tier:"rare",
    description:"Gain +12 Max HP immediately.",
    onAcquire:{ maxHp:12 } },

  /* ---------------- BOSS ---------------- */
  { id:"void_crown", name:"VOID CROWN", icon:"👑", tier:"boss",
    description:"Start each combat with 1 Strength.",
    hook:"combatStartStrength", value:1 },

  { id:"reactor_heart", name:"REACTOR HEART", icon:"🫀", tier:"boss",
    description:"Gain +1 Max Mana. Heal to full immediately.",
    hook:"maxMana", value:1, onAcquire:{ heal:9999 } },

  { id:"phoenix_chip", name:"PHOENIX CHIP", icon:"🔥", tier:"boss",
    description:"The first time you would die in combat, survive at 1 HP (once per combat).",
    hook:"deathSave" },

];

function getRelicById(id) { return RELICS.find(r => r.id === id); }

/* Adjacent-tier fallback order so small pools still fill a draft. */
const RELIC_TIER_ORDER = ["common", "rare", "boss"];

/* ============================================================
   generateRelicChoices(tier, count=3, avoidOwned=true)
   Returns up to `count` relic objects of the requested tier.
   - Excludes relics the player already owns (when avoidOwned).
   - If the tier pool is too small, fills from adjacent tiers.
   ============================================================ */
function generateRelicChoices(tier, count = 3, avoidOwned = true) {
  const owned = (Game.state && Game.state.relics) ? Game.state.relics : [];
  const eligible = (r) => !(avoidOwned && owned.includes(r.id));

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Primary pool: requested tier.
  let pool = shuffle(RELICS.filter(r => r.tier === tier && eligible(r)));
  const picks = pool.slice(0, count);

  // Fill from adjacent tiers if needed.
  if (picks.length < count) {
    const startIdx = RELIC_TIER_ORDER.indexOf(tier);
    const order = RELIC_TIER_ORDER
      .map((t, i) => ({ t, dist: Math.abs(i - startIdx) }))
      .filter(o => o.t !== tier)
      .sort((a, b) => a.dist - b.dist)
      .map(o => o.t);
    for (const t of order) {
      if (picks.length >= count) break;
      const extra = shuffle(
        RELICS.filter(r => r.tier === t && eligible(r) && !picks.includes(r))
      );
      for (const r of extra) {
        if (picks.length >= count) break;
        picks.push(r);
      }
    }
  }
  return picks;
}
