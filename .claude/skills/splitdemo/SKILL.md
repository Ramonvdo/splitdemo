---
name: splitdemo
description: Build a split-screen demo that shows a prospect what an automation or AI system does for their business, as one scripted story playing across up to four app-like panels (phone, workflow, CRM, sheet, inbox, calendar, numbers). Use when the user says splitdemo, wants a visual or interactive demo of a system for a client, or wants a job post, process description or call transcript turned into something a non-technical owner can watch. Also shares a demo as a link, films it, and adds a panel type.
---

# splitdemo

A demo is one `demo.json`: a story in beats that plays across two to four panels at once and ends on what the business gained. The app plays it. This skill writes it.

The viewer is a business owner who has never opened a workflow canvas. Every picture answers two questions for them: what just happened, and what did I get out of it.

## Where things are

Read the settings first: `~/.splitdemo/config.json`, or the file `SPLITDEMO_CONFIG` names.

- `app`: the splitdemo clone. Every `npm run` command in this skill runs from that folder.
- `workspace`: the user's own demos, one folder each: `<workspace>/demos/<slug>/demo.json`. Prospect data lives here. The app keeps one copy outside git: the last site a share built, in `.build/share/`.
- `hosting`, `brand`, `share`, `expiryDays`: read by the jobs that use them.

When the file is missing, or has no `app` or `workspace`, do [jobs/onboarding.md](jobs/onboarding.md) first and then return to the job.

## Pick the job

| The user wants | Job |
| --- | --- |
| A demo from a job post, a problem, a process or a transcript. Or a change to a demo they name by its slug. | [jobs/create.md](jobs/create.md) |
| To set splitdemo up, or change the workspace, hosting or brand. | [jobs/onboarding.md](jobs/onboarding.md) |
| A link to send, or a link taken offline. | [jobs/share.md](jobs/share.md) |
| An mp4 or a gif of a demo. | [jobs/video.md](jobs/video.md) |
| A screen none of the panels can show. | [jobs/panel.md](jobs/panel.md) |

When the first word after `/splitdemo` is `share`, `video`, `panel` or `onboarding`, it names the job. Anything else is the input for `create`. `/splitdemo-share`, `/splitdemo-video` and `/splitdemo-onboarding` run the same jobs.

Read the one job file and follow it. `create` also reads [story.md](story.md) (what makes a demo land) and [format.md](format.md) (the shape of `demo.json`).
