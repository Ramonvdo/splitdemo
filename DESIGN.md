# Design

The look of the demo stage and of every panel. Read this before changing a panel's view or adding one.

## Brief

- Subject: a scripted split-screen demo of an automation system.
- Audience: a business owner who is not technical, watching on a call, from a link, or in a short video.
- Job: within 30 seconds they can say what happened and what they gained from it.

## Concept

| | |
|---|---|
| Idea | A broadcast gallery: four monitors on a dark wall, and one tally light that shows which screen is live. |
| Metaphor | The vision-mixing desk of a TV studio: monitors, tally lights, a lower-third caption, a timecode. |
| Signature | The tally handoff. One accent-coloured light moves from label to label as the automation passes the work along. The live monitor is at full brightness, the others wait slightly dimmed. |
| Emotion | Calm control. Someone is clearly minding the shop. |
| Motion verb | Cut and settle. The tally cuts instantly; content lands and settles, with no bounce. |
| Screenshot | The last beat: every monitor filled, the lower third reading the outcome next to what it was before. |

Anchor: every screen must carry a small label saying what it is. In a broadcast multiview every monitor has exactly that, so the label belongs to the concept.

Rejected: "front of house, back of house" (a light customer side and a dark business side breaks when no panel faces the customer) and "contact sheet" (static, with no notion of which frame is live).

## Palette

Two surfaces: the stage (the wall) and the windows (the monitors). The wall has one palette. Each monitor has the palette of the app it stands for.

| Role | Value | Use |
|---|---|---|
| `stage` | `#0f1012` | The wall behind the monitors |
| `stage-raise` | `#1a1c20` | The bar, hover on stage controls |
| `stage-line` | `#2c2f36` | Hairlines on the stage |
| `stage-ink` | `#f1f2f4` | Caption, labels of the live monitor |
| `stage-muted` | `#9aa0ac` | Labels of waiting monitors, the clock |
| `tally` | `#ff5c35` | The accent. One per demo, set by `accent` in `demo.json` |

Inside a monitor the roles are the same for every app and the values are the app's own. The values below are the defaults a panel starts from.

| Role | Default | Use |
|---|---|---|
| `window` | `#ffffff` | Monitor surface |
| `wash` | `#f3f4f6` | Secondary surface inside a monitor |
| `ink` | `#16181d` | Text inside a monitor |
| `muted` | `#5d626e` | Secondary text inside a monitor |
| `line` | `#e2e4e9` | Hairlines inside a monitor |
| `app` | `#16181d` | The app's own colour: a top bar, a rail, a main button |
| `on-app` | `#ffffff` | Text and icons on `app` |
| `app-wash` | `#f3f4f6` | A tinted surface in the app's colour: a selected row, a column |
| `mark` | `#2457d6` | The app's second colour: a selection, a link, an unread dot |

Status colours live only inside monitors and never stand in for the tally: `good #0b6e4a`, `wait #8f5200`, `info #2457d6`, `idle #5d626e`, each with a 10% tint as its background. An app may shift them, as long as each still passes 4.5:1 as a tag on its own surfaces.

A view uses the tokens, never a hex value. An app's hex values live in one place, its `skin.css`.

## App looks

A wall of four monitors in one skin reads as one dashboard. So each panel looks like the kind of app it stands for, with its own ground, typeface and chrome, and like no product in particular.

| Panel | Stands for | Ground and colour | Typeface | Recognised by |
|---|---|---|---|---|
| `sheet` | A spreadsheet in the browser | White grid, green file mark, blue selection | Arimo in the cells, Roboto around them | Column letters, row numbers, a formula bar, a spare column and spare rows, a sheet tab, status chips with a caret |
| `crm` | A sales CRM | Pale blue-grey board, dark navy rail, teal links | Source Sans 3 | An icon rail, stage columns with a coloured top edge and a count, deal cards |
| `inbox` | A webmail client | Blue-tinted grey, a white reading card | Roboto | A top bar with search, the list next to the open mail, a reply card |
| `phone` | A phone's messages app | White, blue and grey bubbles | Inter | A status bar, the contact on top, a composer, the home bar |
| `calendar` | A work calendar in the browser | White, indigo events | Figtree | A slim bar with the week and a view switch, day columns, a pill on today, events as blocks with a coloured edge |
| `campaign` | An email marketing tool | Warm paper, a yellow top bar | DM Sans | The sequence as a timeline, a strip of counters |
| `form` | A page on the business's own website | Cream paper, one dark button | Instrument Serif for the title, Inter below it | A browser bar with the address, a serif headline |
| `kpi` | A reporting dashboard | Light grey, white cards, graphite bars | IBM Plex Sans | Number cards over one bar chart |
| `workflow` | An automation builder | A dark canvas with a dot grid and an edge | Inter | Step tiles that take the colour of what they do, lines that turn green once run |

The stage sets `data-app="<type>"` on a monitor, and a panel's `skin.css` gives the tokens their values under that attribute. The tally is the one thing no skin touches. The label light, the tap dot and the flash on a changed value stay in the demo's accent, so one signal still runs across all the apps. No two apps that often share a wall have the same main colour: the inbox is blue, the calendar indigo, the CRM teal on navy.

Inside a monitor the tally is a fill, a border or a tint, never the colour of text: an accent picked by a demo's author has no promised contrast on white. Text that sits on a tally fill uses `on-tally`, which the stage works out from the accent (ink or white, whichever reads better).

Charts have one series (`--chart-1`). In the `kpi` monitor it is the dashboard's own graphite, set in its skin. Anywhere else it falls back to the tally. The grid, labels and tooltip use the monitor's own neutrals. The mapping is on `.stage` in `src/index.css`.

## Type

- Schibsted Grotesk (variable, 400 to 700) for the wall: labels, the caption, the outcome, the transport. A newsroom grotesk, which suits a lower third.
- Inside a monitor the app's own typeface, named in its `skin.css` and listed under App looks. Weights there run from 400 to 600, and headings are in sentence case.
- JetBrains Mono only on the developer pages: the list of demos and the panel gallery. Nothing on the wall is monospaced.
- The stage scales as one picture. The root font size follows the viewport (`clamp(13px, min(1.016vw, 1.806vh), 20px)`), so 1rem is 13 px at 1280x720 and every size is in rem. A recording at 1920x1080 is the same frame, larger.
- Inside a monitor: `body` 1rem, `meta` 0.923rem as the floor. A count that is digits only uses tabular figures. A value with a comma or a colon keeps the font's own spacing, since the tabular set widens both ("$5 , 400").
- Monitor labels: `meta`, weight 500.
- Caption: 1.7rem, weight 600, tracking -0.01em. It is the largest running text on the stage.
- Outcome value: 2.38rem (1.4 times the caption), weight 700.

## Shape

One radius rule: monitors 10 px, controls inside a monitor 6 px, pills fully round (at 1280 wide; they scale with the rest). An app may set its own control radius with `--radius-control`. Hairlines are 1 px. The stage has no shadows: monitors are flat. Inside a monitor an app may lift a card with a faint shadow, where the real one does.

A line between two steps of a flow leaves level, turns once and arrives level. The turn is a right angle rounded by 14 px and sits on the boundary between two columns, where no label reaches. A line that has not run is dotted, one that has is solid.

## Motion

- Ease: `cubic-bezier(0.16, 1, 0.3, 1)` for everything.
- `land` 420 ms: up from 10 px with opacity. Rows, cards, bubbles, mail.
- `pop` 320 ms: scale from 0.96. Chips, notes, the tap dot.
- `flash` 1100 ms: a tally-tinted wash that fades. A value that changed.
- Tally: on is an instant cut, off fades over 240 ms. Waiting monitors dim to 88% brightness over 200 ms. Before the first press nothing waits yet, so the whole wall is lit.
- A beat lights every monitor it has acted on so far, so the cause stays lit next to its effect. The label light sits on the last one. A press the demo is waiting for lights only the monitor to press. A beat that has not acted yet keeps the picture of the one before.
- A workflow step is tally-coloured only while the action is on the workflow. Once the story moves to another monitor, or ends, the step takes the colour of what it does and carries its done check, so nothing looks like it is still running.
- Only `transform`, `opacity` and `filter` animate.
- The timeline is the one clock. A seek and a step back show the picture finished: `data-still` on the stage sets every animation and transition to zero length (not `none`, so nothing replays when motion returns), and a panel gets `still` for motion it drives from JavaScript.
- Reduced motion keeps the story and drops the movement. The demo opens at the start and plays beat by beat, and every animation and transition has zero length, so content cuts in where it would have landed.
- Charts follow the Bklit motion policy as decorative: the library's reveal, 700 ms, on first show and again when the demo changes the chart. The replay is how a viewer sees that the chart changed.

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
- Under 720 px wide: one monitor at a time, with a row of tabs above the wall. The shown tab is wide and carries its label. The others are round and carry their panel's icon, and the live one takes the tally colour. The wall follows the tally until the viewer picks a tab. Nothing dims here, because the one monitor on screen is always the one to read.
- Enlarge: click a label, or press 1 to 4. That monitor covers the wall and its content scales up by the same factor the window grew, so it reads from the back of a room. Escape, or the label again, brings the wall back. The other monitors stay mounted and hidden, so nothing restarts. A portrait panel keeps a phone's width when enlarged.
- Panels size themselves with container queries, never with the viewport.

## After the last beat

The lower third reads the outcome, each value next to what it was before. A demo that names a `next` step gets one button there: a label and an `https://` or `mailto:` link, opened in a new tab. It is the only link on the stage, and a recording leaves it out.

## Loading

The first picture is the wall, the caption and the play button, and it waits for nothing else. What a browser loads from a panel folder takes only types from `schema.ts`, so the validation library stays with the scripts. The bar chart brings its library in a file of its own: its place in the KPI monitor keeps its size and carries `data-loading` until it lands, and anything that judges a still picture waits for that mark to go. Autoplay waits for it too, and for the fonts, so a demo never starts on a half-drawn wall. A recording then holds that first picture for 1.2 s with the demo's title as its caption: the title card.

## Gallery

The dev server draws every preset with the example from its folder at `/__panels`: wide panels at 44 by 22 rem, portrait ones at 22 by 46 rem, each under its name and above the first paragraph of its `panel.md`. Replay runs the example's actions one at a time. It is a workbench, so it borrows the stage's tokens and adds none. A build is one demo and leaves the gallery out.

## Left out on purpose

- A switcher between demos. A shared demo is one prospect's page and knows of no other.
- A skip link. The stage is one screen with a handful of stops: the monitors first, then the transport.
- Anything for search engines. A shared demo is marked noindex; it is found by its link.
- Motion while idle. The tap dot on the play button is the one thing that moves before the first press.

## Genericness test

A generic answer is a light SaaS dashboard: a header, a grid of rounded cards with soft shadows, a gradient. Changed: no header, a dark wall, flat monitors, a tally light instead of a highlight ring, a lower-third caption, a timecode.

A second generic answer is every panel in one neutral skin. Four of those next to each other read as one dashboard, and the point of the wall is that several tools work together. Changed: each monitor has its own ground, typeface and chrome.

## Rules for a panel view

1. Use the tokens. A view names no hex value and no font. Both live in the panel's `skin.css`, under `[data-app="<name>"]`.
2. A panel looks like the kind of app it stands for and like no product in particular. App names appear as plain text in the label. A view carries no third-party logo, wordmark or product name.
3. Render every string as text, never as HTML.
4. Stable React keys on everything that can appear, move or change, so the mount animation is the "what changed" signal.
5. Fit the content budget in `panel.md`. A panel never scrolls on its own, except the phone thread, which follows its last message.
6. Leave the tally to the wall. A skin does not use the accent for its own chrome. The flash is drawn in `::after`, so a skin that needs a pseudo-element on something that flashes uses `::before`.
7. Chrome that is only there to look like the app (a search field, a toolbar icon) is hidden from screen readers and takes no focus.
