# Changelog

## 0.2.1 (2026-11-18)

- On a phone the results slide shows the monthly figure before the calculator and the charts, uses the caption's row in the bar, and takes the demo's title when it has none of its own.
- `results.roi.label` says what the monthly figure counts when it is not new income: "saved a month".
- The mode switch takes a press just over or under it, and its pressed segment is filled.
- `npm run shots` shoots the wall first, and says `on the wall behind it` when a cut text sits under a card or the results slide. Each line now names a picture that shows the problem.
- In explainer mode a screen grows slightly as it fades in.
- Skill files: a form trigger takes two beats, a calculator starts from low guesses when the input states no numbers, a prospect's budget is not a price, and a message a person receives is shown on their screen.

## 0.2.0 (2026-11-18)

- Explainer mode, which is now how a demo opens. The story plays one step at a time: a card with the step's caption alone on the screen, then each screen that step touches at full size, one change at a time. A link, a film and the dev server open in it.
- Fast mode is the split-screen wall of 0.1.0, a little slower: a caption stands 800 ms before the first action and actions follow 700 ms apart (they were 400 and 500). `?mode=fast` opens it. A switch top left goes between the two modes and keeps the step.
- A results slide after the last step: the outcome numbers, a title and a text, and with `results.roi` a calculator the viewer fills in, with two bar charts that follow it.
- New optional fields in `demo.json`: `results`, and `lang` (`"nl"` puts the buttons, the step counter and the results slide in Dutch). `v` stays 1, and a demo written for 0.1.0 plays in both modes unchanged.
- In explainer mode the workflow's line draws itself from the step before to the step it reaches, and the step lights when it arrives.
- `npm run check` prints how long each mode plays, and notes a step that asks too much of the viewer: a screen that shows twice, more than three screens, more than one workflow step in a beat, a story past 110 seconds.
- `npm run shots` shoots both modes, and `--mode` picks one. `npm run record` films the story, or the wall with `--fast`. A gif is always the wall.
- A panel can say how long one of its changes takes to read, with `pace` in its logic.
- The three examples are retold step by step, each with a `results` block.
- Every panel now looks like the kind of app it stands for, so a wall reads as several apps working together. Each has its own colours, typeface and chrome in a `skin.css`: the sheet has column letters, a formula bar and a selected cell, the CRM a board with stage columns and deal cards, the inbox a list next to the open mail.
- New optional fields: `title` and `tab` on `sheet`, `title` on `calendar`, and `site` on `form`, which puts the form in a browser window with that address.
- The bar chart on the numbers board is drawn in the dashboard's own colour. The demo's accent now only marks what is live and what changed.
- The sheet's selection follows the cell the last action wrote.
- A workflow step takes the colour of what it does once it has run.
- A panel is seven files now: `skin.css` joins the six.

## 0.1.0 (2026-11-15)

First version.

- The player: a demo is one `demo.json` that plays across two to four panels, with play, pause, step, replay, a caption per beat, a story clock and an outcome at the end. On a phone it shows one panel at a time and follows the action.
- Nine panels: `phone`, `form`, `inbox`, `workflow`, `crm`, `sheet`, `calendar`, `campaign` and `kpi`.
- Three examples: speed to lead for a dental practice, cold outreach from a sheet, and a web form that ends as a booking.
- `npm run check` says whether a demo can play and where it goes wrong. `npm run shots` takes a picture per beat and fails when text is cut off or ends in three dots, on a laptop or a phone.
- `npm run share` publishes demos to a Cloudflare Worker under links nobody can guess, with an end date. `npm run export` writes a plain folder for any host.
- `npm run record` films a demo as an mp4, upright for a phone, or as a gif.
- Claude Code skills: `/splitdemo`, `/splitdemo-onboarding`, `/splitdemo-share` and `/splitdemo-video`.
