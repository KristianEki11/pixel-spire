/* ============================================================
   EVENTS — data-driven non-combat map encounters.

   Event model:
     { id, title, subtitle, description, art,
       actRange:[min,max], weight, oncePerRun?,
       choices:[ { label, hint?, conditions?, effects:[...] } ] }

   conditions (all optional, ALL must pass for the choice to be enabled):
     minHp:N         player.hp >= N
     minGold:N       player.currency >= N
     hasRelic:id     player owns relic id
     notCurse:id     player does NOT already have curse id
     deckMin:N       deck has at least N cards (for remove/transform)

   effect types (resolved by Run.applyEffect in game.js):
     { type:"gold",         value:+/-N }
     { type:"heal",         value:+N }
     { type:"healPercent",  value:0.0-1.0 }          // % of maxHp, rounded
     { type:"maxHp",        value:+/-N }
     { type:"addCard",      cardId:"id" }            // OR rarity:"Common"
     { type:"addCard",      rarity:"Rare" }          // random card of rarity
     { type:"upgradeCard",  fromDeck:true }          // opens deck picker
     { type:"removeCard",   fromDeck:true }          // opens deck picker
     { type:"transformCard",fromDeck:true }          // pick 1 -> random same rarity
     { type:"addRelic",     relicId:"id" }
     { type:"addRelicRandom", tier:"common" }        // grants 1 random relic of tier
     { type:"relicDraft",   tier:"common", count:3 } // opens CHOOSE-ONE relic screen
     { type:"cardDraft",    rarity:"Rare", count:3 } // opens CHOOSE-ONE card screen
     { type:"addCurse",     curseId:"id" }           // OR curseId:"random"
     { type:"setFlag",      flag:"guaranteeElite", value:true }
     { type:"setFlag",      flag:"shopMarkup", value:0.20 }

   To add your own event: copy a block, give it a unique id, set actRange /
   weight, and list choices. The map generator picks events by weight whose
   actRange includes the current act (see Run.generateRun in game.js).
   ============================================================ */
const EVENTS = [

  /* 1) NEON SHRINE ------------------------------------------------------ */
  {
    id: "neon_shrine",
    title: "NEON SHRINE",
    subtitle: "A humming altar of broken light",
    art: "🛍️",
    description: "A flickering shrine pulses in the dark, its neon veins begging " +
      "for tribute. Power radiates from it — but power always asks a price.",
    actRange: [1, 3],
    weight: 10,
    choices: [
      {
        label: "Pray",
        hint: "Heal 20% Max HP, but gain a minor Curse.",
        effects: [
          { type: "healPercent", value: 0.20 },
          { type: "addCurse", curseId: "random" }
        ]
      },
      {
        label: "Offer Coin",
        hint: "-60 gold, gain a random Common relic.",
        conditions: { minGold: 60 },
        effects: [
          { type: "gold", value: -60 },
          { type: "addRelicRandom", tier: "common" }
        ]
      },
      {
        label: "Leave",
        hint: "Walk away untouched.",
        effects: []
      }
    ]
  },

  /* 2) GLITCHED TERMINAL ------------------------------------------------ */
  {
    id: "glitched_terminal",
    title: "GLITCHED TERMINAL",
    subtitle: "Corrupted code, tempting fixes",
    art: "🖥️",
    description: "A half-dead terminal offers an update. The patch could sharpen " +
      "one of your techniques — if the download doesn't fry something first.",
    actRange: [1, 3],
    weight: 9,
    choices: [
      {
        label: "Download Patch",
        hint: "Upgrade 1 deck card, but -2 Max HP.",
        conditions: { deckMin: 1 },
        effects: [
          { type: "upgradeCard", fromDeck: true },
          { type: "maxHp", value: -2 }
        ]
      },
      {
        label: "Ignore",
        hint: "Leave the terminal alone.",
        effects: []
      }
    ]
  },

  /* 3) WANDERING SMITH -------------------------------------------------- */
  {
    id: "wandering_smith",
    title: "WANDERING SMITH",
    subtitle: "Hammer, anvil, and a sly grin",
    art: "🔨",
    description: "A soot-stained smith sets up a portable forge. 'I can sharpen " +
      "what you carry,' she says, 'or trade you something fresher.'",
    actRange: [1, 3],
    weight: 8,
    choices: [
      {
        label: "Pay 50 gold to upgrade a card",
        hint: "-50 gold, upgrade 1 deck card.",
        conditions: { minGold: 50, deckMin: 1 },
        effects: [
          { type: "gold", value: -50 },
          { type: "upgradeCard", fromDeck: true }
        ]
      },
      {
        label: "Trade a card",
        hint: "Remove 1 card, add 1 random card of the same rarity.",
        conditions: { deckMin: 16 },
        effects: [
          { type: "transformCard", fromDeck: true }
        ]
      },
      {
        label: "Move on",
        hint: "Decline the smith's offer.",
        effects: []
      }
    ]
  },

  /* 4) BLOOD VENDOR ----------------------------------------------------- */
  {
    id: "blood_vendor",
    title: "BLOOD VENDOR",
    subtitle: "Pay in something redder than coin",
    art: "🩸",
    description: "A cloaked figure weighs vials of blood against gold. 'Coin is " +
      "common,' it rasps. 'Vitality — now that is currency.'",
    actRange: [1, 3],
    weight: 8,
    choices: [
      {
        label: "Bleed for coin",
        hint: "Lose 6 HP, gain 120 gold.",
        conditions: { minHp: 7 },
        effects: [
          { type: "heal", value: -6 },
          { type: "gold", value: 120 }
        ]
      },
      {
        label: "Bleed for power",
        hint: "Lose 10 HP, choose 1 Rare card.",
        conditions: { minHp: 11 },
        effects: [
          { type: "heal", value: -10 },
          { type: "cardDraft", rarity: "Rare", count: 3 }
        ]
      },
      {
        label: "Refuse",
        hint: "Keep your blood to yourself.",
        effects: []
      }
    ]
  },

  /* 5) VOID MIRROR ------------------------------------------------------ */
  {
    id: "void_mirror",
    title: "VOID MIRROR",
    subtitle: "Your reflection grins back wrong",
    art: "🪞",
    description: "A mirror of liquid void shows a sharper you. Reach in and you " +
      "might pull out a copy of your strength — or shatter it for treasure.",
    actRange: [1, 3],
    weight: 7,
    choices: [
      {
        label: "Duplicate a card",
        hint: "Copy 1 deck card, but gain a Curse.",
        conditions: { deckMin: 1 },
        effects: [
          { type: "duplicateCard", fromDeck: true },
          { type: "addCurse", curseId: "random" }
        ]
      },
      {
        label: "Shatter the mirror",
        hint: "Gain a relic, but the next Elite is guaranteed.",
        effects: [
          { type: "addRelicRandom", tier: "common" },
          { type: "setFlag", flag: "guaranteeElite", value: true }
        ]
      }
    ]
  },

  /* 6) MERCHANT'S DEBT -------------------------------------------------- */
  {
    id: "merchants_debt",
    title: "MERCHANT'S DEBT",
    subtitle: "Easy gold, future interest",
    art: "💰",
    description: "A nervous merchant offers a fat purse up front. 'Just remember " +
      "me kindly at my next stall,' he winks. The terms feel slippery.",
    actRange: [1, 3],
    weight: 7,
    oncePerRun: true,
    choices: [
      {
        label: "Take the gold",
        hint: "+90 gold, but next shop prices +20%.",
        effects: [
          { type: "gold", value: 90 },
          { type: "setFlag", flag: "shopMarkup", value: 0.20 }
        ]
      },
      {
        label: "Decline",
        hint: "Refuse the debt, gain a free Common card instead.",
        effects: [
          { type: "addCard", rarity: "Common" }
        ]
      }
    ]
  }

];

function getEventById(id) { return EVENTS.find(e => e.id === id); }
