# Changelog

## Unreleased

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
