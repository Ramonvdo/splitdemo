# splitdemo

Split-screen demos for automation and AI systems. One scripted story plays across up to four app-like screens at once, so a business owner sees what happened and what they got out of it in about 30 seconds.

![A new patient texts a dental practice after closing time. The automation reads the message, replies with open slots, saves the lead and books the visit, across four screens at once.](docs/speed-to-lead.gif)

## Why

Most automation demos show the workflow canvas. The person paying for the system does not read canvases. They want to know what their customer sees, where the lead ends up, and what changed in their numbers.

splitdemo puts those on one wall. The customer's phone, the automation, the CRM and the week's numbers sit next to each other, and a single story moves through all of them. The viewer sends the first message, then watches the reply arrive, the lead land in the pipeline and the reply time drop from 14 hours to 38 seconds.

## What is in the box

- A demo is one JSON file: the panels, a story in beats and the outcome. There is no code per demo, so swapping the CRM for a spreadsheet means changing one `type`.
- Nine panels come with it: phone, form, inbox, workflow, CRM board, sheet, calendar, email campaign and a numbers board with a chart. They share one neutral look and take the tool's name as a label, like "CRM in ClickUp".
- You can show a demo live on a call from your own machine, send it as a private link, or film it (1920x1080, upright for a phone, or a gif).
- The Claude Code skills write a demo from a job post, a process description or a call transcript. They check it and look at every frame before they hand it over.
- Two checks catch a bad demo before a prospect does. One finds an action that cannot happen or a caption that is too long. The other finds text that gets cut off or ends in three dots, on a laptop or a phone.

Every demo carries a small "Scripted example" tag. Nothing connects to a real system; it is a simulation of what the system will do.

## Start with Claude Code

```
/plugin install splitdemo --marketplace Ramonvdo/splitdemo
/splitdemo-onboarding
/splitdemo <paste a job post, or describe the problem>
```

Onboarding runs once. It installs the app, asks where your demos should live and whether you want links (Cloudflare) or local demos only, and writes `~/.splitdemo/config.json`.

After that:

| Command | What it does |
| --- | --- |
| `/splitdemo <job post or problem>` | Writes the story, picks the panels, builds the demo, checks it and opens it. |
| `/splitdemo <slug> <change>` | Changes a demo you already have. |
| `/splitdemo-share <slug>` | Publishes it under a link nobody can guess, after showing you what goes online. |
| `/splitdemo-video <slug>` | Films it as an mp4, with `--portrait` for a phone and `--gif` for a README or an email. |
| `/splitdemo panel <what it shows>` | Adds a panel type for a screen the nine cannot show. |

## Start by hand

Needs Node 22.18 or newer.

```bash
git clone https://github.com/Ramonvdo/splitdemo
cd splitdemo
npm ci
npm run dev
```

Open http://localhost:4310 for the three examples. http://localhost:4310/__panels shows every panel on its own.

On a call: space plays and pauses, the arrow keys step through the story, `R` plays it again, `1` to `4` enlarge a panel and `H` hides the bar.

## What a demo looks like

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
      "say": "21:14. The practice closed at six. Send the text a new patient would.",
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

Each beat has a caption and the actions that happen while it is on screen. Timing follows from the text, so you write no numbers unless you want a pause. A beat with `"wait": "click"` holds until the viewer presses the button themselves.

The full examples are in [`examples/`](examples). The list of panels with their actions is [`src/panels/INDEX.md`](src/panels/INDEX.md), and each panel's folder says how to use it well.

Your own demos live outside this repo, in a workspace folder you choose: `<workspace>/demos/<slug>/demo.json`. That keeps prospect data out of a clone you might push.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Plays every demo at `http://localhost:4310/<slug>/` and reloads when its file changes. |
| `npm run check -- <slug>` | Says whether the demo can play and where in the file it goes wrong. |
| `npm run shots -- <slug>` | One picture per beat, and a failure when any text is cut off or shortened. |
| `npm run share -- <slug>` | Publishes the demo to your Cloudflare Worker. `--dry-run` publishes nothing. |
| `npm run export -- <slug>` | Writes the demo as one plain folder for any static host. |
| `npm run record -- <slug>` | Films it. `--portrait` and `--gif` as above. Needs ffmpeg. |
| `npm test`, `npm run e2e` | Unit tests, and the browser tests. |

## Sharing

A shared demo gets its own folder under a name like `harbor-dental-x7k2`. There is no index page, a wrong address returns a real 404, and the pages ask search engines to stay out. One prospect's folder holds nothing of another's.

Every link has an end date. A demo is shared for 30 days unless you say otherwise, and it drops out at the next publish after that. `npm run share -- --stop <slug>` takes one offline sooner.

By default a share shows you what will go online and waits for a yes. Set `"share": "auto"` in the settings to skip the question.

## Adding a panel

A panel is one folder in `src/panels/` with six files: a schema, a pure reducer with its tests, a view, a short guide for the agent and a working example. The app picks it up by name. [`CONTRIBUTING.md`](CONTRIBUTING.md) has the contract.

## License

MIT. The chart components come from [Bklit UI](https://github.com/bklit/bklit-ui), also MIT. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
