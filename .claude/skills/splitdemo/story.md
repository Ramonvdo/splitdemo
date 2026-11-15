# The story

A demo runs about 30 seconds. In that time the owner watches their own customer do something, sees the system act with nobody at a desk, sees the result land where they already look, and reads what they gained next to what it was.

## Six lines before any JSON

Write these in the chat first. They are the demo; the JSON only carries them.

1. **Viewer**: the prospect and their trade. "The owner of a two-chair dental practice."
2. **Their customer**: the person who starts the story, with a name. "Dana Whitfield, a new patient."
3. **Before**: what happens today, with its cost as a number. "A text after six waits 14 hours for a reply."
4. **Trigger**: the one moment the story opens on, at the time of day that makes the before hurt. "21:14, the practice closed at six."
5. **Beats**: five to eight. The first shows the trigger; each one after it is one thing the owner gains.
6. **Outcome**: up to three numbers, each next to what it was.

## Beats

- **One beat, one gain.** The caption says what the moment means for the business, in the owner's words. The panels show how. "The lead is in your pipeline before you have seen it." beats "Webhook creates a CRM record."
- **Captions** speak to the owner as "you", in the present tense, in 72 characters or fewer.
- **Open on the customer.** When a pressable panel leads (a phone, a form), let the viewer press it with `wait: "click"`. They cause everything that follows, so they watch it. When the customer's first act cannot be pressed (a call nobody answers), open on that as an ordinary beat and put the press on their first message.
- **Cause, then effect, on different panels.** The system acts on one screen and the result lands on another, so the eye travels across the wall. A beat lights every panel it touches.
- **Every panel changes.** A screen that stays still for the whole demo looks broken. Give it something to do or leave it out.
- **End on the gain.** The last beat turns the before numbers into the after numbers, on the screen where the owner reads their numbers.
- **Show time with the clock.** Put `clock` on the beats where the time of day carries the point: 21:14 when the text arrives, 21:16 when it is booked.
- **Jump ahead for a total.** One customer does not move a weekly number. In the last beat set `clock` to "Mon 8 AM" or "Day 7" and show the week's total there.
- **Five to eight beats, about 30 seconds.** `npm run check` prints the length. Over 45 seconds, cut a beat.

## Panels by role

Read `src/panels/INDEX.md` in the app, then pick by role:

| Role | Panels | How many |
| --- | --- | --- |
| Where the customer is | `phone`, `form`, `inbox` | one |
| The system at work | `workflow` | one, in almost every demo: it is the proof that nobody was at a desk |
| Where the owner's work lives | `crm`, `sheet`, `calendar`, `inbox`, `campaign` | one or two |
| What the owner gains | `kpi` | one, when the gain is a number |

Four panels by default. Use three or two when a fourth would have nothing to do. When the prospect names more screens than four slots hold, keep the customer's screen, the workflow and the screen where the gain shows. Fold each of the others into a workflow step, with its tool in `app` and its result in the step's `note`.

A label says whose screen it is or which tool it is, in 40 characters or fewer (about 24 over a phone or a form, which stands in a narrow column): "Patient's phone", "CRM in ClickUp", "This week". Name the tool the prospect uses when you know it. App names are plain text.

## Numbers and names

- A number the prospect stated goes in as they stated it.
- A number you invent stays modest and plausible for a business that size. List the invented ones in your report so the user can replace them. The page itself carries a "Scripted example" tag.
- At least one outcome carries `was`: "38 sec", was "14 h". A value is 12 characters or fewer. `was` can be a few words when the before has no number: "no reply".
- Write times, dates and money the way the viewer does: "6:42 PM" and "$450" for an owner in the US, "18:42" and "€450" for one in the Netherlands. A calendar panel shows AM and PM with `ampm: true`.
- Use the prospect's business name. When the input gives none, write the trade where the name would go ("Your HVAC office") and say so in your report. Invent its customers: names that fit the trade and the place, problems that customer would really have.

## The cold read

Before you report, look at the shots in order as the owner would, without the JSON in mind. For each one say what just happened and what the business gained, from the picture and its caption alone. The start shot shows the before and the opening beat shows the trigger, so those two carry no gain yet. From the second beat on, a shot where you cannot name one is a beat to rewrite: usually the caption names the mechanism, or the effect landed on a screen that shows nothing new.
