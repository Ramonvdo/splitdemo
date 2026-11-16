# Add a panel

For a screen none of the panels in `src/panels/INDEX.md` can show: a map with a route, a call transcript, an invoice. First try the existing ones with another label and config. A `sheet` labelled "Orders in Airtable" is still a sheet.

A panel is one folder in the app, `src/panels/<name>/`, picked up by its name. Nothing else in the app changes. Read one existing panel end to end before you write (`crm` is a good size), and `DESIGN.md` for the tokens.

## The seven files

| File | What it holds |
| --- | --- |
| `schema.ts` | Two zod schemas, `config` and `action`, with no React. Every text has a `max` that fits the screen, every list a `max` that fits the panel. A comment on a field is its documentation. |
| `reduce.ts` | `logic`: `icon` (a name from `src/panels/icon-names.ts`, shown on the phone tab), `initial(config)`, and a pure `reduce(state, action, config)`. Add `triggers` for actions a viewer can press, `portrait: true` for a tall panel. |
| `reduce.test.ts` | One test per action, and one per impossible action. |
| `Panel.tsx` | Draws `config` and `state`, and nothing else. No timers and no fetching: the timeline is the only clock. Its first line is `import "./skin.css";`. |
| `skin.css` | The app's look: values for the colour tokens, a typeface and a control radius under `[data-app="<name>"]`, plus any paint a utility class cannot say, keyed on data attributes the view sets. |
| `panel.md` | For the agent writing demos: one line on what the viewer sees, `Pick it when:`, then what makes this panel land. |
| `example.json` | A `label`, a `config` and a list of `actions` that work. The gallery and the contract test play it. |

## Rules that keep it playable

- **An impossible action throws**, with a message the demo's author can act on: what is missing and what exists. `there is no card "dana". Cards: omar, marta`. That message is what `npm run check` prints.
- **State counts its changes.** Give anything that animates a `rev` that goes up when the demo touches it, and key the element on it, so stepping back and forward replays the right motion.
- **`live`** is true while the action is on this panel. Anything shown as running runs only while `live` is true.
- **`still`** is true after a jump (a step back, a screenshot). CSS motion is already stopped; skip motion you drive from JavaScript.
- **`pending` and `onTrigger`** carry a press the demo waits for: draw the pending action ready to press and call `onTrigger` on the press.
- **`reduce.ts` and `Panel.tsx` import only types from `schema.ts`** (`import type`). The schema brings the validation library with it, and a demo on a phone should not load that.
- **Size in `rem` and the design tokens.** The whole wall scales with the window, so a pixel value breaks on a projector.
- **Its own look, nobody's brand.** A panel looks like the kind of app it stands for, so a wall of four reads as four apps. Give it a ground, a typeface and one piece of chrome no other panel has (`DESIGN.md`, App looks, lists what is taken). Hex values and the font go in `skin.css`; the view uses the tokens (`bg-app`, `text-on-app`, `bg-app-wash`, `text-mark`, `bg-wash`, `border-line`). The tool's name is text in the label: draw your own generic glyphs (`src/panels/glyphs.tsx`) and leave out logos, wordmarks and product names.
- **The accent belongs to the wall.** The label light, the tap dot and the flash on a changed value use the demo's accent. A skin picks other colours, and uses `::before` for a pseudo-element on anything that flashes, since the flash is drawn in `::after`.
- **Chrome is decoration.** A search field or toolbar icon that only makes the app recognisable gets `aria-hidden="true"` and is never a button or a link.
- **A new typeface** comes from a `@fontsource` package under the SIL Open Font License, imported in `src/main.tsx` and listed in `THIRD_PARTY_NOTICES.md`.

## Steps

1. Write the first reducer test, see it fail, write the schema and reducer that pass it. One action at a time.
2. Write `skin.css`, `Panel.tsx`, `example.json` and `panel.md`.
3. Rebuild the index: `npm run panels`.
4. Look at it: `npm run dev`, then `http://localhost:4310/__panels` plays every panel with its example.
5. Done when `npm test` passes (it includes the contract every panel must meet) and a demo using the panel passes `npm run check` and `npm run shots`.
