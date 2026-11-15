# splitdemo

Scripted split-screen demos: one `demo.json` plays a story across two to four panels. The viewer is a business owner, so every screen answers what happened and what they gained.

## Commands

- `npm run dev`: every demo at `http://localhost:4310/<slug>/`, the panel gallery at `/__panels`. Port 4310 is fixed.
- `npx tsc --noEmit`, `npm test` (Vitest), `npm run e2e` (Playwright; starts the dev server itself).
- `npm run check -- <slug>`, `npm run shots -- <slug>`: the two gates a demo passes before anyone sees it.
- `npm run panels`: rebuilds `src/panels/INDEX.md`. `npm test` fails when it is stale.
- `bash scripts/secret-scan.sh` before every push. It always lists its own file name; the section that counts is "secret-like content".

Scripts are `.ts` files run by Node itself (22.18 or newer). Use `import type` for types and keep the `.ts` extension in imports.

## What goes where

- `src/engine/`: timeline, playback, stage, bar. `timeline.ts` is pure and holds the rules of time.
- `src/panels/<name>/`: one panel in six files. The contract is in `CONTRIBUTING.md` and checked by `src/panels/contract.test.ts`.
- `scripts/lib/`: shared by the scripts. `load.ts` is the demo check, `publish.ts` the share ledger and site, `spills.ts` finds text that does not fit.
- `.claude/skills/splitdemo/`: the skill that writes demos. `format.md` there describes `demo.json`; keep it in step with `src/engine/schema.ts`.
- `DESIGN.md`: palette, type, motion and the rules a panel view follows.

## Rules

- A demo is data. A change that needs code per demo belongs in a panel or the engine instead.
- Panel state is the replay of all actions so far. A panel view keeps no clock and fetches nothing.
- A reducer throws on an action that cannot happen, with a message a demo author can act on.
- `zod` is for the scripts. Nothing the browser loads imports it: `reduce.ts` and `Panel.tsx` take only types from `schema.ts`.
- Sizes in `rem`, colours from the tokens. The wall scales with the window.
- Tests first, one at a time. Expected values come from the example worked by hand.
- Examples use invented people and businesses. Real prospect demos live in the workspace folder outside this repo and never in a commit.
- Prose in the README, the docs, captions and panel guides uses plain sentences without em dashes.
