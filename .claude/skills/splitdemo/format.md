# demo.json

Three finished demos to match are in the app: `examples/speed-to-lead`, `examples/cold-outreach`, `examples/intake-to-booking`. `npm run check` is the authority on every limit below and says where in the file a demo goes wrong.

```json
{
  "v": 1,
  "title": "A new patient texts after closing time",
  "panels": [
    { "id": "phone", "type": "phone", "label": "Patient's phone", "config": { "contact": "Harbor Dental" } },
    { "id": "crm", "type": "crm", "label": "Patient pipeline", "config": { "columns": [{ "id": "new", "title": "New" }, { "id": "booked", "title": "Booked" }] } }
  ],
  "beats": [
    {
      "say": "9:14 PM. The practice closed at six. Send the text a new patient would.",
      "clock": "9:14 PM",
      "wait": "click",
      "do": [{ "on": "phone", "type": "send", "text": "Hi, I chipped a tooth. Can I come in this week?" }]
    },
    {
      "say": "The lead is in your pipeline before you have seen it.",
      "do": [{ "on": "crm", "type": "add", "id": "dana", "to": "new", "title": "Dana Whitfield" }]
    }
  ],
  "outcome": [{ "value": "38 sec", "label": "to first reply", "was": "14 h" }],
  "results": {
    "title": "What a missed message costs",
    "text": "Every evening message used to wait until morning. By then most people had booked somewhere else.",
    "roi": {
      "currency": "USD",
      "inputs": [
        { "id": "texts", "label": "After-hours texts a month", "ask": "How many texts come in after closing, in a month?", "value": 40 },
        { "id": "booked", "label": "Share of those that book a visit", "ask": "Of every 100 of those texts, how many book a visit today?", "value": 10, "kind": "percent" },
        { "id": "visit", "label": "Worth of a first visit", "ask": "What is a first visit worth to you?", "value": 180, "kind": "money" }
      ],
      "lever": { "input": "booked", "add": 20 },
      "cost": { "monthly": 300, "once": 1500 }
    }
  }
}
```

## Fields

| Field | What it is | Limits |
| --- | --- | --- |
| `v` | Always `1`. | |
| `title` | The story in one line. It is the opening card, and it titles a link preview. | 60 characters |
| `lang` | `"en"` or `"nl"`: the language of the words around the script (buttons, "Step 2 of 8", the results slide). Leave it out for English. | |
| `panels` | The screens, in the order they sit on the wall. | 2 to 4 |
| `panels[].id` | The name actions use for this panel. | lowercase letters, digits, dashes |
| `panels[].type` | A panel from `src/panels/INDEX.md`. | |
| `panels[].label` | The small label top left: whose screen or which tool. | 40 characters; about 24 over a tall panel |
| `panels[].config` | What the screen shows before anything happens. Its shape is the panel's `schema.ts`. | per panel |
| `beats` | The steps of the story, in order. | 1 to 16; six to nine tell it best |
| `beats[].say` | The caption: the step's card in explainer mode, the line under the wall in both. | 72 characters |
| `beats[].clock` | The time in the story from this beat on: "21:14", "6:42 PM", "Mon 8 AM", "Day 7". | 8 characters |
| `beats[].do` | The actions of this beat, in order. Explainer mode shows their screens in this order. | up to 6 |
| `beats[].wait` | `"click"`: the beat waits for the viewer to press its first action. | first action must be pressable |
| `beats[].hold` | How long the beat stays after its last action on the wall, in ms. Leave it out. | |
| `outcome` | What the business gained: the numbers on the results slide, and under the wall when it ends. | 1 to 3 |
| `outcome[].value`, `.label`, `.was` | "38 sec", "to first reply", "14 h". `was` is the before, as a number or a few words. | 12, 32, 12 characters |
| `results` | What the results slide says besides the outcome. See Results. | |
| `layout` | `rail`, `quad`, `trio` or `duo`. Leave it out. | |
| `accent` | The demo's one colour, like `#ff5c35`. Use `brand.accent` from the settings when it is set. | |
| `next` | A link shown when the story ends: `{ "label": "Book a call", "url": "https://..." }`. Add it when the user gives a booking page or an email address. | label 28 characters; `https://` or `mailto:` |
| `expires` | The last day a share serves this demo, `YYYY-MM-DD`. Leave it out: a share sets the end date. | |

## Actions

```json
{ "on": "<panel id>", "type": "<action>", "after": 300, "...": "what the action needs" }
```

Each panel has its own actions and their fields. For every panel you use, read its folder in the app, `src/panels/<type>/`: `panel.md` (what makes it land), `schema.ts` (the config, the actions and their limits), `example.json` (a config and actions that work).

Two lists sit one folder up, in `src/panels/`. `tones.ts` has the values of every `tone`: `good` (green), `wait` (amber, also the one for urgent), `info` (blue), `idle` (grey). `icon-names.ts` has every `icon` a workflow step can carry.

An action that cannot happen stops the demo from playing, and `check` says which: moving a card that is not on the board, running a step that does not exist, a fifth card in a column that fits four.

## Results

The example at the top has a whole `results` block. Every part of it is optional, `results` itself too. The slide always shows `outcome`. How to choose the chain, the lever and the questions is in [story.md](story.md).

| Field | What it is | Limits |
| --- | --- | --- |
| `title` | The claim over the numbers. | 60 characters |
| `text` | Why it is worth money. | 220 characters |
| `roi.currency` | A currency code: `USD`, `EUR`. | three capitals |
| `roi.inputs` | The chain: numbers that multiply in the order written. Each has an `id`, a `label` and a starting `value`. `"kind": "percent"` makes 30 count as 0.30, `"kind": "money"` shows it as money. `min` and `max` bound what can be typed; without `max` that is 100 for a percentage, and otherwise ten times the value or the lever's `to`, whichever is larger. | 2 to 5; label 44 characters |
| `roi.inputs[].ask` | The question the slide asks for this number. Without one the number is an estimate: passed over by the questions, tagged "estimate" in the report. | 90 characters; 1 to 4 inputs carry one |
| `roi.inputs[].note` | Where an estimate comes from, shown with its question or its label. | 80 characters |
| `roi.inputs[].stage` | What this step of the chain yields, for the funnel: "Requests", "Visits", "Jobs". | 16 characters |
| `roi.lever` | The one input the system changes. `{ "input": "<id>", "add": 20 }` adds to whatever the viewer answers, and a percentage stops at 100. `{ "input": "<id>", "to": 160 }` is the system's own number. | one of `add` and `to` |
| `roi.times` | A factor on the whole chain, for units: `0.0167` turns minutes into hours, `0.0833` a yearly amount into a monthly one. | |
| `roi.saving` | `true` when the chain is a cost the lever brings down. | not with `monthly` |
| `roi.monthly` | `true` when what is won pays again every month, so each month adds to the ones before. | not with `saving` |
| `roi.label` | Replaces the words under the monthly figure. Left out: "extra a month", "saved a month" with `saving`, "more a month, every month again" with `monthly`. | 28 characters |
| `roi.cost` | `monthly`, `once` or both. Leave `cost` out when no price was given. | |

Today is the chain as written. With the system is the same chain with the lever applied. Work both by hand before you trust the file: 40 × 0.10 × 180 = 720 a month today and 40 × 0.30 × 180 = 2,160 with the system, so 1,440 extra a month. An answer that leaves the system nothing to win shows as zero with a sentence saying so.

`check` refuses a calculator whose example numbers show no effect, one without a question or with more than four, a lever with both or neither of `add` and `to`, a lever on an input that does not exist, and `saving` together with `monthly`.

The report draws two charts from the block:

- **Twelve months**, always: what the system adds month by month, after costs, against carrying on as today, with a dashed line for half the effect.
- **A funnel**, when three or more inputs before the first amount of money carry a `stage`, counted over a year. A first stage ten times the next or more is left out of the drawing and written as a sentence over it. Today's funnel stands over the system's when both start from the same count. When the lever changes the count that goes in, the system's funnel stands alone with today's count under each stage.
- **Bars** otherwise: a year as the business works today, a year with the system, and what the system costs.

## Two modes

One file, two ways to watch it. Nothing in `demo.json` chooses: the viewer does, with the switch top left, and an address can ask for one.

| | Explainer | Fast |
| --- | --- | --- |
| Shows | A card per step, then one screen at a time, then the results slide | Every panel on one wall, the outcome under it at the end, the results slide behind the Results button |
| Opens | By default: the dev server, a shared link, a film | With `?mode=fast` on the address |
| Timing | Worked out from the script alone | Worked out, and shaped by `after` and `hold` |

`?q=report` on an address makes the results slide open on the report, with the example numbers, and offer the questions from there ("Change my answers"). Use it for a link whose reader should see the figure before being asked anything. `?at=end&q=0` shows the slide's card, `q=1` to `q=4` one question: that is how `shots` pictures them.

## Timing

Timing is worked out for you, so most beats carry no numbers. `npm run check` prints how long each mode plays.

In explainer mode a card stands 1.3 s plus 0.18 s a word. A screen stands a moment before its first change, a second between changes, and long enough to read what a change put on it (0.16 s a word, ten words at most). The first time a screen shows it stands 1.2 s longer, so the viewer can take the app in. A step rests 1.5 s before the next card.

On the wall:

- A caption stands for 800 ms before the first action of its beat.
- Actions in one beat follow each other 700 ms apart.
- After its last action a beat stays long enough to read the caption: 1300 ms plus 140 ms a word.

`after` on an action replaces the 700 ms on the wall: it is the wait since the action before it in that beat. Use `"after": 0` to make two things land together, or a longer wait where a pause tells the story (a reply that takes a moment to be typed). Explainer mode ignores `after` and `hold`.

## Pressing

A beat with `"wait": "click"` holds until the viewer presses its first action: the send button on a phone, the submit button on a form. `INDEX.md` marks which actions are pressable. Left alone, the demo presses it after four seconds, so it never stalls. One or two such beats in a demo, the first where the customer first sends or submits something. That is usually the opening beat.

## Layout

Leave `layout` out and the wall arranges itself. Four panels make a two by two grid. When one of them is tall (a phone or a form, marked in `INDEX.md`), it takes the full height on the left and the other three share the right. Three and two panels get their own arrangement. A wall has one tall slot, so a demo has one tall panel.

On a phone the viewer sees one panel at a time, and the view follows the action. Nothing to write for that.

In explainer mode the one screen in view takes the whole wall and its content scales up with it. A phone or a form keeps its upright shape, centred. Under 30rem wide (a phone, an upright film) the workflow is a list: its steps light in turn, without the lines between them.

## What fits

Each screen holds a small amount: a sheet of seven rows, a board column of four cards, four number tiles, a week of four days on a four-panel wall. The limits are in each `schema.ts`. `npm run shots` goes further than the limits: it looks at every card, every screen and every beat, in both modes, on a laptop screen and on a phone, and fails when any text is cut off or ends in three dots, naming the panel and the text. A state that does not fit on a phone also gets a picture, `<state>-phone.png`. `the page scrolls` names the first text that reaches past the edge. Shorten that text or show less in that panel.
