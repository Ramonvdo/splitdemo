import type { Lang } from "./types.ts";

/**
 * The stage's own words. A demo's script is written in the prospect's language; these are the words around it,
 * so a Dutch demo does not end on an English slide.
 */
const WORDS = {
  en: {
    explainer: "Explainer",
    fast: "Fast",
    mode: "Mode",
    start: "Play the demo",
    play: "Play",
    pause: "Pause",
    again: "Play again",
    back: "Step back",
    forward: "Step forward",
    step: (n: number, of: number) => `Step ${n} of ${of}`,
    scripted: "Scripted example",
    panels: "Panels",
    enlarge: "Enlarge",
    all: "Show all panels",
    results: "Results",
    was: "was",
    numbers: "Try it with your own numbers",
    monthly: "extra a month",
    net: (cost: string) => `a month after ${cost} in costs`,
    year: "in the first year",
    payback: (month: number) => `Pays for itself in month ${month}`,
    cost: "Cost",
    each: "Each month",
    added: (once?: string) => (once ? `The first 12 months added up, after ${once} to set up` : "The first 12 months, added up"),
    month: (n: string) => `Month ${n}`,
    sum: "Added up",
  },
  nl: {
    explainer: "Uitleg",
    fast: "Snel",
    mode: "Weergave",
    start: "Demo afspelen",
    play: "Afspelen",
    pause: "Pauze",
    again: "Opnieuw afspelen",
    back: "Stap terug",
    forward: "Stap vooruit",
    step: (n: number, of: number) => `Stap ${n} van ${of}`,
    scripted: "Nagespeeld voorbeeld",
    panels: "Schermen",
    enlarge: "Vergroten",
    all: "Alle schermen tonen",
    results: "Resultaat",
    was: "was",
    numbers: "Reken het na met eigen cijfers",
    monthly: "extra per maand",
    net: (cost: string) => `per maand na ${cost} kosten`,
    year: "in het eerste jaar",
    payback: (month: number) => `Terugverdiend in maand ${month}`,
    cost: "Kosten",
    each: "Per maand",
    added: (once?: string) => (once ? `De eerste 12 maanden opgeteld, na ${once} eenmalig` : "De eerste 12 maanden, opgeteld"),
    month: (n: string) => `Maand ${n}`,
    sum: "Opgeteld",
  },
};

export type Words = (typeof WORDS)["en"];

export const words = (lang: Lang = "en"): Words => WORDS[lang];
