/* ============================================================
   CURSES — negative cards added to the deck by events.
   They are real card-like entries so the deck/engine can show
   them, but they are unplayable (manaCost: -1 sentinel) and do
   nothing beneficial. They simply clog the hand.

   To add a curse: give it a unique id and a flavor description.
   ============================================================ */
const CURSES = [
  { id:"curse_static",  name:"Static",     manaCost:-1, type:"Curse", rarity:"Curse", art:"📶",
    description:"Unplayable. Glitches your hand." },
  { id:"curse_rust",    name:"Rust",       manaCost:-1, type:"Curse", rarity:"Curse", art:"🦀",
    description:"Unplayable. Dead weight." },
  { id:"curse_doubt",   name:"Doubt",      manaCost:-1, type:"Curse", rarity:"Curse", art:"💢",
    description:"Unplayable. Whispers distract you." },
  { id:"curse_decay",   name:"Decay",      manaCost:-1, type:"Curse", rarity:"Curse", art:"☠️",
    description:"Unplayable. Slowly rots your deck." },
];

function getCurseById(id) { return CURSES.find(c =&gt; c.id === id); }
function isCurseId(id) { return id &amp;&amp; id.indexOf("curse_") === 0; }
