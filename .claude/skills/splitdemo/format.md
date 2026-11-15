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
  "outcome": [{ "value": "38 sec", "label": "to first reply", "was": "14 h" }]
}
```

## Fields

| Field | What it is | Limits |
| --- | --- | --- |
| `v` | Always `1`. | |
| `title` | The story in one line. It opens a film and titles a link preview. | 60 characters |
| `panels` | The screens, in the order they sit on the wall. | 2 to 4 |
| `panels[].id` | The name actions use for this panel. | lowercase letters, digits, dashes |
| `panels[].type` | A panel from `src/panels/INDEX.md`. | |
| `panels[].label` | The small label top left: whose screen or which tool. | 40 characters; about 24 over a tall panel |
| `panels[].config` | What the screen shows before anything happens. Its shape is the panel's `schema.ts`. | per panel |
| `beats` | The story, in order. | 1 to 16; five to eight tell it best |
| `beats[].say` | The caption. | 72 characters |
| `beats[].clock` | The time in the story from this beat on: "21:14", "6:42 PM", "Mon 8 AM", "Day 7". | 8 characters |
| `beats[].do` | The actions of this beat, in order. | up to 6 |
| `beats[].wait` | `"click"`: the beat waits for the viewer to press its first action. | first action must be pressable |
| `beats[].hold` | How long the beat stays after its last action, in ms. Leave it out. | |
| `outcome` | What the business gained, shown when the story ends. | 1 to 3 |
| `outcome[].value`, `.label`, `.was` | "38 sec", "to first reply", "14 h". `was` is the before, as a number or a few words. | 12, 32, 12 characters |
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

## Timing

Timing is worked out for you, so most beats carry no numbers.

- A caption stands for 400 ms before the first action of its beat.
- Actions in one beat follow each other 500 ms apart.
- After its last action a beat stays long enough to read the caption: 1300 ms plus 140 ms a word.

`after` on an action replaces the 500 ms: it is the wait since the action before it in that beat. Use `"after": 0` to make two things land together, or a longer wait where a pause tells the story (a reply that takes a moment to be typed).

## Pressing

A beat with `"wait": "click"` holds until the viewer presses its first action: the send button on a phone, the submit button on a form. `INDEX.md` marks which actions are pressable. Left alone, the demo presses it after four seconds, so it never stalls. One or two such beats in a demo, the first where the customer first sends or submits something. That is usually the opening beat.

## Layout

Leave `layout` out and the wall arranges itself. Four panels make a two by two grid. When one of them is tall (a phone or a form, marked in `INDEX.md`), it takes the full height on the left and the other three share the right. Three and two panels get their own arrangement. A wall has one tall slot, so a demo has one tall panel.

On a phone the viewer sees one panel at a time, and the view follows the action. Nothing to write for that.

## What fits

Each screen holds a small amount: a sheet of seven rows, a board column of four cards, four number tiles, a week of four days on a four-panel wall. The limits are in each `schema.ts`. `npm run shots` goes further than the limits: it looks at every beat on a laptop screen and on a phone and fails when any text is cut off or ends in three dots, naming the panel and the text. A state that does not fit on a phone also gets a picture, `<state>-phone.png`. `the page scrolls` names the first text that reaches past the edge. Shorten that text or show less in that panel.
