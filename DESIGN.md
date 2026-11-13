# Design

The look of the demo stage and of every panel. Read this before changing a panel's view or adding one.

## Brief

- **Subject:** a scripted split-screen demo of an automation system.
- **Audience:** a business owner watching on a call, from a link, or in a short video. Not technical.
- **Job:** within 30 seconds they can say what happened and what they gained from it.

## Concept

| | |
|---|---|
| Idea | A broadcast gallery: four monitors on a dark wall, and one tally light that shows which screen is live. |
| Metaphor | The vision-mixing desk of a TV studio: monitors, tally lights, a lower-third caption, a timecode. |
| Signature | The tally handoff. One accent-coloured light moves from label to label as the automation passes the work along. The live monitor is at full brightness, the others wait slightly dimmed. |
| Emotion | Calm control. Someone is clearly minding the shop. |
| Motion verb | Cut and settle. The tally cuts instantly; content lands and settles, with no bounce. |
| Screenshot | The last beat: every monitor filled, the lower third reading the outcome next to what it was before. |

Anchor: every screen must carry a small label saying what it is. In a broadcast multiview every monitor has exactly that, so the label is the concept and not decoration.

Rejected: "front of house, back of house" (a light customer side and a dark business side breaks when no panel faces the customer) and "contact sheet" (static, with no notion of which frame is live).

## Palette

Two surfaces: the stage (the wall) and the windows (the monitors, which imitate business software and are light).

| Role | Value | Use |
|---|---|---|
| `stage` | `#0f1012` | The wall behind the monitors |
| `stage-raise` | `#1a1c20` | The bar, hover on stage controls |
| `stage-line` | `#2c2f36` | Hairlines on the stage |
| `stage-ink` | `#f1f2f4` | Caption, labels of the live monitor |
| `stage-muted` | `#9aa0ac` | Labels of waiting monitors, the clock |
| `window` | `#ffffff` | Monitor surface |
| `wash` | `#f3f4f6` | Secondary surface inside a monitor |
| `ink` | `#16181d` | Text inside a monitor |
| `muted` | `#5d626e` | Secondary text inside a monitor |
| `line` | `#e2e4e9` | Hairlines inside a monitor |
| `tally` | `#ff5c35` | The accent. One per demo, set by `accent` in `demo.json` |

Status colours live only inside monitors and never stand in for the tally: `good #0f7b54`, `wait #a15c00`, `info #2457d6`, `idle #5d626e`, each with a 10% tint as its background.

Components use the tokens, never a hex value. Charts use `--chart-1` to `--chart-5`.

## Type

- **Schibsted Grotesk** (variable, 400 to 700) for everything. A newsroom grotesk, which suits a lower third.
- **JetBrains Mono** only where the text is data: the timecode and spreadsheet cells.
- Inside a monitor: 13 px base, 12 px floor for meta, tabular figures for every number.
- Monitor labels: 12 px, weight 500.
- Caption: `clamp(1.05rem, 0.7rem + 1vw, 1.6rem)`, weight 600, tracking -0.01em. It is the largest text on the stage.
- Outcome value: 1.4 times the caption size, weight 700, tabular.

## Shape

One radius rule: monitors 10 px, controls inside a monitor 6 px, pills fully round. Hairlines are 1 px. No shadows on the stage: monitors are flat.

## Motion

- Ease: `cubic-bezier(0.16, 1, 0.3, 1)` for everything.
- `land` 420 ms: up from 10 px with opacity. Rows, cards, bubbles, mail.
- `pop` 320 ms: scale from 0.96. Chips, notes, the tap dot.
- `flash` 1100 ms: a tally-tinted wash that fades. A value that changed.
- Tally: on is an instant cut, off fades over 240 ms. Waiting monitors dim to 78% brightness over 240 ms.
- Only `transform`, `opacity` and `filter` animate.
- The timeline is the one clock. A seek, a step back and reduced motion set `data-still` on the stage, which removes every animation and transition.
- Charts follow the Bklit motion policy as decorative: the library's reveal on first show.

## Layout

```
rail (a portrait panel first)        quad
+------+---------------------+       +-----------+-----------+
|      |          b          |       |     a     |     b     |
|  a   +----------+----------+       +-----------+-----------+
|      |    c     |    d     |       |     c     |     d     |
+------+----------+----------+       +-----------+-----------+
| > || <  caption        00:14 |     | > || <  caption  00:14 |
+------------------------------+     +-----------------------+
```

- `trio`: `a` on the left at full height, `b` and `c` stacked on the right. `duo`: two columns.
- Under 720 px wide: one monitor at a time, with a row of tabs that follows the tally.
- Panels size themselves with container queries, never with the viewport.

## Genericness test

A generic answer is a light SaaS dashboard: a header, a grid of rounded cards with soft shadows, a gradient. Changed: no header, a dark wall, flat monitors, a tally light instead of a highlight ring, a lower-third caption, a timecode.

## Rules for a panel view

1. Tokens only. No hex, no font names.
2. App names appear as plain text in the label. No third-party logos and no copied interface.
3. Render every string as text. Never as HTML.
4. Stable React keys on everything that can appear, move or change, so the mount animation is the "what changed" signal.
5. Fit the content budget in `panel.md`. A panel never scrolls on its own, except the phone thread, which follows its last message.
