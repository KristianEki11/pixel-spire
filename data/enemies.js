/* ============================================================
   ENEMIES — intent pattern cycles in order, looping.
   ============================================================ */
const ENEMIES = [
  /* ---------- ACT 1: NEON RUINS ---------- */
  {
    id: "a1_n01_lumen_rat",
    name: "Lumen Rat",
    class: "normal",
    act: 1,
    hp: 28,
    maxHp: 28,
    art: "🐀",
    baseAttack: 6,
    intents: [
      { type: "attack", value: 6, note: "Quick bite." },
      { type: "buff", value: 1, note: "Gains +1 baseAttack (teaches scaling threat)." },
      { type: "attack", value: 8, note: "Charged bite if not killed quickly." }
    ],
    abilities: [],
    visual: "Small angular rat, neon-cyan eyes/teeth, indigo body.",
    loreHook: "Scavengers that learned to drink the Spire’s leftover light."
  },
  {
    id: "a1_n02_rebar_sentinel",
    name: "Rebar Sentinel",
    class: "normal",
    act: 1,
    hp: 34,
    maxHp: 34,
    art: "🤖",
    baseAttack: 7,
    intents: [
      { type: "defend", value: 8, note: "Raises a rebar shield." },
      { type: "attack", value: 7, note: "Straight jab." },
      { type: "attack", value: 10, note: "Telegraphed heavy swing after defending." }
    ],
    abilities: [],
    visual: "Tall stick-figure guard made of rebar, magenta shoulder glow.",
    loreHook: "Old security frames still guarding doors that no longer exist."
  },
  {
    id: "a1_n03_arc_kite",
    name: "Arc Kite",
    class: "normal",
    act: 1,
    hp: 24,
    maxHp: 24,
    art: "🪁",
    baseAttack: 5,
    intents: [
      { type: "debuff", value: 1, note: "applyStatusOnHit:{shock:1} next attack (soft tax)." },
      { type: "attack", value: 5, note: "Zap." },
      { type: "attack", value: 9, note: "Double zap burst (still uses baseAttack scaling carefully)." }
    ],
    abilities: ["applyStatusOnHit:{shock:1}"],
    visual: "Diamond-shaped drone, neon-yellow arc tail, black core.",
    loreHook: "A maintenance drone that mistakes pulse rhythms for prey."
  },
  {
    id: "a1_n04_brutalist_toad",
    name: "Brutalist Toad",
    class: "normal",
    act: 1,
    hp: 40,
    maxHp: 40,
    art: "🐸",
    baseAttack: 6,
    intents: [
      { type: "defend", value: 10, note: "Hunkers down; teaches 'hit through' vs wait." },
      { type: "attack", value: 6, note: "Tongue lash." },
      { type: "attack", value: 12, note: "Telegraphed slam if player keeps discarding." }
    ],
    abilities: [],
    visual: "Chunky square toad statue with cyan throat glow.",
    loreHook: "Concrete wildlife animated by neon runoff."
  },
  {
    id: "a1_n05_signpost_mimic",
    name: "Signpost Mimic",
    class: "normal",
    act: 1,
    hp: 30,
    maxHp: 30,
    art: "🪧",
    baseAttack: 6,
    intents: [
      { type: "special", value: 1, note: "Fakeout: next intent repeats (teaches pattern watching)." },
      { type: "attack", value: 11, note: "Ambush strike after fakeout." },
      { type: "debuff", value: 1, note: "applyStatusOnHit:{stagger:1} (small hand-efficiency tax)." }
    ],
    abilities: ["applyStatusOnHit:{stagger:1}"],
    visual: "Road-sign silhouette with jagged mouth; neon-pink edge highlights.",
    loreHook: "Wayfinding signs that learned to reroute travelers into their jaws."
  },
  {
    id: "a1_n06_graffiti_wisp",
    name: "Graffiti Wisp",
    class: "normal",
    act: 1,
    hp: 22,
    maxHp: 22,
    art: "💨",
    baseAttack: 4,
    intents: [
      { type: "debuff", value: 1, note: "applyStatusOnHit:{ink:1} (minor accuracy/clarity tax placeholder)." },
      { type: "attack", value: 4, note: "Singe." },
      { type: "buff", value: 1, note: "Heals self slightly via healPerTurn for 2 turns (light sustain check)." }
    ],
    abilities: ["healPerTurn:+1"],
    visual: "Floating paint-smoke blob, neon-green speckles, purple haze.",
    loreHook: "Street art that escaped the wall and kept painting in midair."
  },
  {
    id: "a1_f01_turnstile_brute",
    name: "Turnstile Brute",
    class: "field_boss",
    act: 1,
    hp: 72,
    maxHp: 72,
    art: "🎡",
    baseAttack: 10,
    intents: [
      { type: "attack", value: 10, note: "Gate swing." },
      { type: "defend", value: 12, note: "Locks down (turtle turn)." },
      { type: "attack", value: 16, note: "Telegraphed cleave (punishes wasteful hands)." }
    ],
    abilities: ["thorns:+1"],
    visual: "Massive rotating turnstile wheel with cyan bolts; blocky torso.",
    loreHook: "The Spire’s entry hardware decided nobody gets in for free."
  },
  {
    id: "a1_f02_neon_mastiff",
    name: "Neon Mastiff",
    class: "field_boss",
    act: 1,
    hp: 64,
    maxHp: 64,
    art: "🐕",
    baseAttack: 11,
    intents: [
      { type: "attack", value: 11, note: "Bite." },
      { type: "buff", value: 1, note: "damageTakenMultiplier:0.85 for 1 cycle (brief armor window)." },
      { type: "attack", value: 18, note: "Telegraphed pounce." }
    ],
    abilities: ["damageTakenMultiplier:0.85"],
    visual: "Lean hound silhouette, neon-magenta spine line, black legs.",
    loreHook: "A patrol beast that still obeys a long-dead signal."
  },
  {
    id: "a1_m01_meter_maiden",
    name: "Meter Maiden",
    class: "mini_boss",
    act: 1,
    hp: 90,
    maxHp: 90,
    miniboss: true,
    art: "🪙",
    baseAttack: 9,
    intents: [
      { type: "special", value: 1, note: "Charges a 'toll' turn (telegraph)." },
      { type: "debuff", value: 1, note: "reduceDiscards:-1 for this stage (soft lock; counter-play: end fast)." },
      { type: "attack", value: 14, note: "Receipt slam." }
    ],
    abilities: ["reduceDiscards:-1"],
    visual: "Parking meter body with crown of receipts; neon-yellow screen.",
    loreHook: "The city’s last accountant, still collecting debts from the living."
  },
  {
    id: "a1_m02_billboard_priest",
    name: "Billboard Priest",
    class: "mini_boss",
    act: 1,
    hp: 96,
    maxHp: 96,
    miniboss: true,
    art: "⛪",
    baseAttack: 8,
    intents: [
      { type: "buff", value: 1, note: "healPerTurn:+2 (sermon sustain)." },
      { type: "debuff", value: 1, note: "applyStatusOnHit:{blind:1} (readability tax but fair)." },
      { type: "attack", value: 15, note: "Neon hymn blast (telegraphed)." }
    ],
    abilities: ["healPerTurn:+2", "applyStatusOnHit:{blind:1}"],
    visual: "Tall billboard panel as torso; magenta halo; dangling cables.",
    loreHook: "A worshipper of ads that preaches salvation through consumption."
  },
  {
    id: "a1_b01_archway_warden",
    name: "Archway Warden",
    class: "main_boss",
    act: 1,
    hp: 150,
    maxHp: 150,
    boss: true,
    art: "⛩️",
    baseAttack: 12,
    intents: [
      { type: "defend", value: 18, note: "Raises arch shield (clear 'defend' tell)." },
      { type: "special", value: 1, note: "reducePlayHands:-1 for next 2 enemy turns (telegraphed)." },
      { type: "attack", value: 22, note: "Gate crash (big hit after limiting)." }
    ],
    abilities: ["reducePlayHands:-1"],
    visual: "Huge brutalist arch with cyan seam light; black stone body.",
    loreHook: "The first threshold that tests if you deserve a climb."
  },

  /* ---------- ACT 2: CIRCUIT CATACOMBS ---------- */
  {
    id: "a2_n01_spore_cache",
    name: "Spore Cache",
    class: "normal",
    act: 2,
    hp: 44,
    maxHp: 44,
    art: "🍄",
    baseAttack: 7,
    intents: [
      { type: "debuff", value: 1, note: "applyStatusOnHit:{curse_spore:1} (slow buildup)." },
      { type: "defend", value: 10, note: "Hard shell." },
      { type: "attack", value: 13, note: "Burst pop if left alive." }
    ],
    abilities: ["applyStatusOnHit:{curse_spore:1}"],
    visual: "Low bunker mushroom made of circuit tiles; neon-green pores.",
    loreHook: "Fungus that learned to live in copper and speak in static."
  },
  {
    id: "a2_n02_cable_leecher",
    name: "Cable Leecher",
    class: "normal",
    act: 2,
    hp: 38,
    maxHp: 38,
    art: "🔌",
    baseAttack: 8,
    intents: [
      { type: "special", value: 1, note: "reduceMaxMana:-1 for 1 cycle (brief drain; telegraphed)." },
      { type: "attack", value: 8, note: "Siphon bite." },
      { type: "attack", value: 16, note: "Overload lash if mana was reduced." }
    ],
    abilities: ["reduceMaxMana:-1"],
    visual: "Leech silhouette made of braided cables; cyan inner glow.",
    loreHook: "A parasite that feeds on spell-current, not blood."
  },
  {
    id: "a2_n03_hex_scribe",
    name: "Hex Scribe",
    class: "normal",
    act: 2,
    hp: 36,
    maxHp: 36,
    art: "🧙",
    baseAttack: 6,
    intents: [
      { type: "debuff", value: 1, note: "applyStatusOnHit:{hex:1} (curse theme)." },
      { type: "buff", value: 1, note: "healPerTurn:+1 (maintains pressure)." },
      { type: "attack", value: 14, note: "Rune spike." }
    ],
    abilities: ["applyStatusOnHit:{hex:1}", "healPerTurn:+1"],
    visual: "Robed pixel figure with floating glyph slabs; magenta ink trails.",
    loreHook: "It writes bugs into reality like prayers into stone."
  },
  {
    id: "a2_n04_ossuary_drone",
    name: "Ossuary Drone",
    class: "normal",
    act: 2,
    hp: 46,
    maxHp: 46,
    art: "💀",
    baseAttack: 9,
    intents: [
      { type: "defend", value: 12, note: "Bone-plated guard." },
      { type: "attack", value: 9, note: "Saw swipe." },
      { type: "debuff", value: 1, note: "applyStatusOnHit:{rust:1} (attrition signal)." }
    ],
    abilities: ["applyStatusOnHit:{rust:1}"],
    visual: "Skull-like drone with saw arms; neon-yellow hazard stripe.",
    loreHook: "A janitor of the dead circuits, polishing bones into conductors."
  },
  {
    id: "a2_n05_tomb_router",
    name: "Tomb Router",
    class: "normal",
    act: 2,
    hp: 32,
    maxHp: 32,
    art: "📟",
    baseAttack: 5,
    intents: [
      { type: "special", value: 1, note: "damageTakenMultiplier:0.9 (brief mitigation bubble)." },
      { type: "debuff", value: 1, note: "applyStatusOnHit:{lag:1} (forces awkward hands)." },
      { type: "attack", value: 12, note: "Packet burst." }
    ],
    abilities: ["damageTakenMultiplier:0.9", "applyStatusOnHit:{lag:1}"],
    visual: "Boxy router sarcophagus with blinking cyan ports.",
    loreHook: "Burial hardware that still routes curses between graves."
  },
  {
    id: "a2_n06_static_monk",
    name: "Static Monk",
    class: "normal",
    act: 2,
    hp: 40,
    maxHp: 40,
    art: "🧘",
    baseAttack: 8,
    intents: [
      { type: "buff", value: 1, note: "thorns:+2 (punishes small hits; encourages burst planning)." },
      { type: "attack", value: 8, note: "Palm strike." },
      { type: "attack", value: 15, note: "Resonant clap (telegraphed)." }
    ],
    abilities: ["thorns:+2"],
    visual: "Hooded monk outline with crackling indigo aura; magenta sparks.",
    loreHook: "They meditate until the air itself begins to hurt."
  },
  {
    id: "a2_f01_crypt_conductor",
    name: "Crypt Conductor",
    class: "field_boss",
    act: 2,
    hp: 110,
    maxHp: 110,
    art: "🎼",
    baseAttack: 12,
    intents: [
      { type: "debuff", value: 1, note: "applyStatusOnHit:{curse_note:1} (stacking song)." },
      { type: "attack", value: 12, note: "Baton strike." },
      { type: "attack", value: 20, note: "Crescendo burst after 2 debuffs applied." }
    ],
    abilities: ["applyStatusOnHit:{curse_note:1}"],
    visual: "Orchestra-conductor silhouette with cable-baton; neon-cyan waveform.",
    loreHook: "It conducts funeral music for machines that won’t stay dead."
  },
  {
    id: "a2_f02_gravefire_urn",
    name: "Gravefire Urn",
    class: "field_boss",
    act: 2,
    hp: 104,
    maxHp: 104,
    art: "⚱️",
    baseAttack: 11,
    intents: [
      { type: "buff", value: 1, note: "healPerTurn:+3 (must be answered quickly)." },
      { type: "defend", value: 14, note: "Ash shield." },
      { type: "attack", value: 21, note: "Graveflare blast (telegraphed)." }
    ],
    abilities: ["healPerTurn:+3"],
    visual: "Large urn with neon-green fire and purple soot clouds.",
    loreHook: "A container for sins, burning brighter the more you hesitate."
  },
  {
    id: "a2_m01_curse_librarian",
    name: "Curse Librarian",
    class: "mini_boss",
    act: 2,
    hp: 150,
    maxHp: 150,
    miniboss: true,
    art: "📚",
    baseAttack: 10,
    intents: [
      { type: "special", value: 1, note: "reduceDiscards:-1 (for this stage) after a clear 'shush' tell." },
      { type: "debuff", value: 1, note: "applyStatusOnHit:{hex:2} (big curse spike)." },
      { type: "attack", value: 22, note: "Book-slam verdict." }
    ],
    abilities: ["reduceDiscards:-1", "applyStatusOnHit:{hex:2}"],
    visual: "Tall book-stack body, single cyan eye slit, magenta bookmarks.",
    loreHook: "It catalogs every mistake you make, then charges interest."
  },
  {
    id: "a2_m02_rail_spider_matron",
    name: "Rail-Spider Matron",
    class: "mini_boss",
    act: 2,
    hp: 140,
    maxHp: 140,
    miniboss: true,
    art: "🕷️",
    baseAttack: 11,
    intents: [
      { type: "attack", value: 11, note: "Piercing leg jab." },
      { type: "special", value: 1, note: "damageTakenMultiplier:0.8 (webbed plating for 1 cycle)." },
      { type: "attack", value: 26, note: "Telegraphed impale." }
    ],
    abilities: ["damageTakenMultiplier:0.8"],
    visual: "Wide spider on rail-legs; neon-yellow joint sparks; black abdomen.",
    loreHook: "A mother of tracks that binds travelers into the timetable forever."
  },
  {
    id: "a2_b01_catacomb_clockwork_abbot",
    name: "Clockwork Abbot",
    class: "main_boss",
    act: 2,
    hp: 260,
    maxHp: 260,
    boss: true,
    art: "⛪",
    baseAttack: 14,
    intents: [
      { type: "debuff", value: 1, note: "applyStatusOnHit:{curse_vow:1} (theme: vows/curse)." },
      { type: "special", value: 1, note: "reduceMaxMana:-1 for next 2 turns (telegraphed gears)." },
      { type: "attack", value: 30, note: "Sanction strike (big hit; intended as answerable burst)." }
    ],
    abilities: ["applyStatusOnHit:{curse_vow:1}", "reduceMaxMana:-1"],
    visual: "Robed abbot made of clock gears; cyan pendulum; purple-black cloak.",
    loreHook: "It offers absolution only in exchange for your options."
  },

  /* ---------- ACT 3: VOID CROWN ---------- */
  {
    id: "a3_n01_void_titheling",
    name: "Void Titheling",
    class: "normal",
    act: 3,
    hp: 56,
    maxHp: 56,
    art: "😈",
    baseAttack: 12,
    intents: [
      { type: "special", value: 1, note: "damageTakenMultiplier:0.9 (self-ward) vs burst builds." },
      { type: "attack", value: 12, note: "Tithe strike." },
      { type: "attack", value: 22, note: "Telegraphed collection." }
    ],
    abilities: ["damageTakenMultiplier:0.9"],
    visual: "Small crown-headed imp, neon-magenta crown tips, black body.",
    loreHook: "It collects a percentage of every victory, even yours."
  },
  {
    id: "a3_n02_crown_guardian",
    name: "Crown Guardian",
    class: "normal",
    act: 3,
    hp: 70,
    maxHp: 70,
    art: "💂",
    baseAttack: 13,
    intents: [
      { type: "defend", value: 18, note: "Heavy guard; forces planning." },
      { type: "attack", value: 13, note: "Halberd poke." },
      { type: "attack", value: 26, note: "Telegraphed execution swing." }
    ],
    abilities: ["thorns:+1"],
    visual: "Tall halberd silhouette, cyan blade edge, purple armor plates.",
    loreHook: "A knight with no face—only rules."
  },
  {
    id: "a3_n03_blacklight_oracle",
    name: "Blacklight Oracle",
    class: "normal",
    act: 3,
    hp: 52,
    maxHp: 52,
    art: "👁️",
    baseAttack: 10,
    intents: [
      { type: "debuff", value: 1, note: "applyStatusOnHit:{doom:1} (warning stacks)." },
      { type: "buff", value: 1, note: "healPerTurn:+2 (forces tempo)." },
      { type: "attack", value: 24, note: "Prophecy beam after 2 doom applied." }
    ],
    abilities: ["applyStatusOnHit:{doom:1}", "healPerTurn:+2"],
    visual: "Floating eye-triangle with neon-green pupil; indigo corona.",
    loreHook: "It predicts your next mistake and charges you upfront."
  },
  {
    id: "a3_n04_gilded_thorn_column",
    name: "Gilded Thorn Column",
    class: "normal",
    act: 3,
    hp: 80,
    maxHp: 80,
    art: "🏛️",
    baseAttack: 9,
    intents: [
      { type: "buff", value: 1, note: "thorns:+3 (anti-multi-hit lesson)." },
      { type: "defend", value: 16, note: "Reinforces itself." },
      { type: "attack", value: 20, note: "Spine burst (telegraphed)." }
    ],
    abilities: ["thorns:+3"],
    visual: "Brutalist pillar with gold-neon thorns; black stone core.",
    loreHook: "A monument that grows sharper the more you touch it."
  },
  {
    id: "a3_n05_mana_reaver",
    name: "Mana Reaver",
    class: "normal",
    act: 3,
    hp: 60,
    maxHp: 60,
    art: "⚔️",
    baseAttack: 11,
    intents: [
      { type: "special", value: 1, note: "reduceMaxMana:-1 for 1 cycle (telegraph: siphon stance)." },
      { type: "attack", value: 11, note: "Reave." },
      { type: "attack", value: 28, note: "Overcharge punish if mana was reduced." }
    ],
    abilities: ["reduceMaxMana:-1"],
    visual: "Lean scythe silhouette with cyan siphon tube; purple-black cloak.",
    loreHook: "It drinks the fuel of your choices, then sells it back as pain."
  },
  {
    id: "a3_n06_oathbreaker_mask",
    name: "Oathbreaker Mask",
    class: "normal",
    act: 3,
    hp: 58,
    maxHp: 58,
    art: "🎭",
    baseAttack: 12,
    intents: [
      { type: "special", value: 1, note: "reducePlayHands:-1 for next turn only (brief clamp; clear tell)." },
      { type: "attack", value: 12, note: "Mask jab." },
      { type: "attack", value: 25, note: "Shame lash (telegraphed)." }
    ],
    abilities: ["reducePlayHands:-1"],
    visual: "Floating mask with neon-magenta cracks; black void behind.",
    loreHook: "It punishes promises you didn’t know you made."
  },
  {
    id: "a3_f01_void_tax_collector",
    name: "Void Tax Collector",
    class: "field_boss",
    act: 3,
    hp: 170,
    maxHp: 170,
    art: "💼",
    baseAttack: 16,
    intents: [
      { type: "special", value: 1, note: "reduceDiscards:-1 (stage) with a big stamp telegraph." },
      { type: "attack", value: 16, note: "Ledger strike." },
      { type: "attack", value: 34, note: "Foreclosure blow (telegraphed)." }
    ],
    abilities: ["reduceDiscards:-1"],
    visual: "Blocky clerk with stamp arm; cyan ledger glow; purple suit.",
    loreHook: "It audits your entire run in a single glance."
  },
  {
    id: "a3_f02_coronation_engine",
    name: "Coronation Engine",
    class: "field_boss",
    act: 3,
    hp: 160,
    maxHp: 160,
    art: "⚙️",
    baseAttack: 15,
    intents: [
      { type: "defend", value: 22, note: "Armor plating shift." },
      { type: "special", value: 1, note: "damageTakenMultiplier:0.75 (short 'invulnerable-ish' window; still fair)." },
      { type: "attack", value: 36, note: "Crown press (telegraphed massive hit)." }
    ],
    abilities: ["damageTakenMultiplier:0.75"],
    visual: "Huge press machine with crown-shaped ram; neon-yellow warning lights.",
    loreHook: "A machine built to crown kings by crushing everyone else."
  },
  {
    id: "a3_m01_thorn_chancellor",
    name: "Thorn Chancellor",
    class: "mini_boss",
    act: 3,
    hp: 220,
    maxHp: 220,
    miniboss: true,
    art: "👑",
    baseAttack: 15,
    intents: [
      { type: "buff", value: 1, note: "thorns:+4 (strong 'stop pecking' message)." },
      { type: "special", value: 1, note: "reducePlayHands:-1 for next 2 turns (telegraph: decree)." },
      { type: "attack", value: 40, note: "Decree slam (big punish if you ignored tell)." }
    ],
    abilities: ["thorns:+4", "reducePlayHands:-1"],
    visual: "Tall robed official with thorn-crown; cyan seal; black robe blocks.",
    loreHook: "It legislates your turns down to the bare minimum."
  },
  {
    id: "a3_m02_jester_eater",
    name: "Jester-Eater",
    class: "mini_boss",
    act: 3,
    hp: 210,
    maxHp: 210,
    miniboss: true,
    art: "👹",
    baseAttack: 14,
    intents: [
      { type: "special", value: 1, note: "damageTakenMultiplier:0.85 (self) + aggressive stance." },
      { type: "attack", value: 14, note: "Chew." },
      { type: "attack", value: 38, note: "Guffaw burst (telegraphed)." }
    ],
    abilities: ["damageTakenMultiplier:0.85"],
    visual: "Wide maw with jester-hat spikes; neon-magenta drool; black mass.",
    loreHook: "A predator that feeds on luck, jokes, and empty confidence."
  },
  {
    id: "a3_b01_void_crown",
    name: "The Void Crown",
    class: "main_boss",
    act: 3,
    hp: 420,
    maxHp: 420,
    boss: true,
    art: "👑",
    baseAttack: 18,
    intents: [
      { type: "special", value: 1, note: "reduceMaxMana:-1 for next 2 turns (telegraph: crown dims)." },
      { type: "special", value: 1, note: "reducePlayHands:-1 for next 2 turns (telegraph: crown tightens)." },
      { type: "attack", value: 55, note: "Coronation blow (huge hit after double tax; intended capstone check)." }
    ],
    abilities: ["reduceMaxMana:-1", "reducePlayHands:-1"],
    visual: "Floating brutalist crown-monolith, cyan inner void, neon-yellow edges.",
    loreHook: "It offers power by removing the very hands that could hold it."
  },
  {
    id: "a3_b02_oath_furnace",
    name: "Oath Furnace",
    class: "main_boss",
    act: 3,
    hp: 380,
    maxHp: 380,
    boss: true,
    art: "🔥",
    baseAttack: 17,
    intents: [
      { type: "buff", value: 1, note: "healPerTurn:+4 (forces decisive lines)." },
      { type: "special", value: 1, note: "damageTakenMultiplier:0.8 (heated armor window; telegraphed)." },
      { type: "attack", value: 50, note: "Forging strike (telegraphed)." }
    ],
    abilities: ["healPerTurn:+4", "damageTakenMultiplier:0.8"],
    visual: "Furnace torso with crown-shaped flame; magenta heat vents; black iron.",
    loreHook: "It forges bargains into chains—and calls it refinement."
  }
];

function getEnemyById(id) { return ENEMIES.find(e => e.id === id); }
