# Panels

Written by `npm run panels` from each panel's folder. To change a row, change that panel's `panel.md` or schema and run it again.

| Panel | The viewer sees | Pick it when | Actions |
| --- | --- | --- | --- |
| `calendar` | A week of bookings, one column a day, in time order. A new booking lands in its day. | the result is an appointment, visit, call or job on someone's calendar. | `book`, `move`, `cancel` |
| `campaign` | An email campaign: the sequence that goes out, and the counters that show how it is doing. | the system sends outreach, follow-ups or a newsletter in steps, and the proof is in opens, replies and bookings. | `status`, `send`, `stat` |
| `crm` | A pipeline board: one card per lead or deal, moving left to right through the stages. | the result is a lead, deal or job that reaches a stage: captured, qualified, booked, won. | `add`, `move`, `set` |
| `form` (tall) | A web form the customer fills in: a few fields and a button. Once it is sent the answers stay on screen and the confirmation lands where the button was. | the story starts with a request on a website: a quote, a booking, a sign-up, an application. | `fill`, `submit` (pressable) |
| `inbox` | A mailbox: the list of mail, and next to it the opened mail with its reply. | the system reads, sorts, answers or sends email, or the customer gets a confirmation by mail. | `receive`, `open`, `tag`, `reply` |
| `kpi` | The owner's numbers: up to four tiles, and one bar chart under them. | the gain is a number the owner already watches: reply time, bookings, hours saved, revenue. | `set`, `push` |
| `phone` (tall) | One message thread on a phone: the conversation as the person holding it lives it. | the system talks to someone by text, WhatsApp or chat, or turns a missed call into a message. | `send` (pressable), `receive`, `event`, `typing`, `notify` |
| `sheet` | A spreadsheet: one row per lead, order or request. New rows land at the bottom and changed cells flash. | the prospect runs on Google Sheets, Excel or Airtable, or the system fills in a list someone types by hand today. | `add`, `set`, `fill` |
| `workflow` | The automation as a short flow, left to right. Each step lights up as it runs and says what it found. | the viewer should see that a system did the work, step by step, with nobody at a desk. | `run` |

- **tall**: drawn tall and narrow. It takes the full-height slot on the left, and a wall has one such slot.
- **pressable**: a beat can `wait: "click"` on this action, so the viewer presses it themselves.

For each panel you pick, read its folder: `panel.md` (what makes it land), `schema.ts` (the shape and its limits), `example.json` (a config and actions that work).
