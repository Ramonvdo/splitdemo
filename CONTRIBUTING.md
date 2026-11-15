# Contributing

Thanks for looking. Fixes, new panels and better examples are all welcome. For anything larger than a fix, open an issue first so we can agree on the shape.

## Setup

Node 22.18 or newer. The scripts are TypeScript and run on Node directly.

```bash
npm ci
npx playwright install chromium
npm run dev
```

Before a pull request:

```bash
npx tsc --noEmit
npm test
npm run e2e
```

The film tests need ffmpeg and skip themselves without it.

## How the code is laid out

| Folder | What is in it |
| --- | --- |
| `src/engine/` | The timeline (a demo compiled into timed cues), playback, the stage and the bar. |
| `src/panels/<name>/` | One panel each. `INDEX.md` is generated from them. |
| `scripts/` | `check`, `shots`, `share`, `export`, `record`, and what they share in `lib/`. |
| `examples/` | Three finished demos. The tests play them. |
| `tests/` | Browser tests: playback, layout at four widths, accessibility, sharing, filming. |
| `.claude/skills/` | The Claude Code skills. |

A demo is data, and the state of every panel at any moment is the result of replaying the actions so far. That is why stepping back, replaying, jumping to a beat for a screenshot and filming all work the same way.

## The panel contract

A panel is a folder in `src/panels/` with six files.

| File | What it holds |
| --- | --- |
| `schema.ts` | zod schemas for `config` and `action`. Every text and list has a limit that fits the screen. |
| `reduce.ts` | `logic`: an `icon`, `initial(config)` and a pure `reduce(state, action, config)`. |
| `reduce.test.ts` | A test for each action, and for each action that cannot happen. |
| `Panel.tsx` | The view. It draws config and state and keeps no clock of its own. |
| `panel.md` | A short guide for the agent that writes demos. |
| `example.json` | A label, a config and actions that work. |

The rules:

- An action that cannot happen throws, with a message the demo's author can act on. `npm run check` prints that message.
- `reduce.ts` and `Panel.tsx` import only types from `schema.ts`, so the validation library stays out of the page a prospect loads.
- Sizes are in `rem` and colours come from the tokens in `DESIGN.md`. The wall scales with the window.
- A panel shows a kind of tool, with the tool's name as text in its label. It carries no logo and copies no interface.

After adding or changing a panel, run `npm run panels` to rebuild `INDEX.md`. `npm test` fails when it is out of date. `http://localhost:4310/__panels` plays every panel with its example.

## Tests

Write the test first and watch it fail. Expected values come from the example worked by hand, not from running the code and copying what it printed.

## Examples and data

Use invented people and businesses in examples. Real prospect demos belong in your own workspace folder, outside this repo.
