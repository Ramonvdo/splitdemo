# Changelog

## 0.1.0 (2026-11-15)

First version.

- The player: a demo is one `demo.json` that plays across two to four panels, with play, pause, step, replay, a caption per beat, a story clock and an outcome at the end. On a phone it shows one panel at a time and follows the action.
- Nine panels: `phone`, `form`, `inbox`, `workflow`, `crm`, `sheet`, `calendar`, `campaign` and `kpi`.
- Three examples: speed to lead for a dental practice, cold outreach from a sheet, and a web form that ends as a booking.
- `npm run check` says whether a demo can play and where it goes wrong. `npm run shots` takes a picture per beat and fails when text is cut off or ends in three dots, on a laptop or a phone.
- `npm run share` publishes demos to a Cloudflare Worker under links nobody can guess, with an end date. `npm run export` writes a plain folder for any host.
- `npm run record` films a demo as an mp4, upright for a phone, or as a gif.
- Claude Code skills: `/splitdemo`, `/splitdemo-onboarding`, `/splitdemo-share` and `/splitdemo-video`.
