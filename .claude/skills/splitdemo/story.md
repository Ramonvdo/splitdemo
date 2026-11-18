# The story

A demo is a sequence of steps. Each step opens on a card with one line of text, alone on the screen, and then shows what that line said on the screens it touches, one screen at a time. The owner reads what is about to happen, watches it happen, and at the end reads what they gained on a results slide. That is explainer mode, and it is what a link and a film open in. Fast mode plays the same steps on one wall of panels.

So write for the card. A step whose caption cannot stand alone on an empty screen is a step to rewrite.

## Seven lines before any JSON

Write these in the chat first. They are the demo; the JSON only carries them.

1. **Viewer**: the prospect and their trade. "The owner of a two-chair dental practice."
2. **Their customer**: the person the story follows, with a name. "Dana Whitfield, a new patient."
3. **Before**: what happens today, with its cost as a number. "A text after six waits 14 hours for a reply."
4. **Trigger**: the one thing that starts the system, at the moment that makes the before hurt. "9:14 PM, a new patient texts. The practice closed at six."
5. **Steps**: six to nine. The first is the trigger; each one after it is one thing the system does and what the owner gets from it.
6. **Outcome**: up to three numbers, each next to what it was.
7. **Results**: one or two sentences on why this is worth money, and the three or so numbers the calculator multiplies.

## Steps

One step is one beat in the JSON: a caption (`say`) and the changes it brings (`do`).

- **Step one is the trigger.** Its caption says what starts everything, so the card reads like the first line of a recipe: "Every morning at 6:30, while you are on a job, it finds offices that fit." or "9:14 PM. The practice closed at six. Send the text a new patient would."
  - A customer who sends or submits something: show their screen (a `phone`, a `form`) and let the viewer press it with `wait: "click"`. Step two then runs the first workflow step, with a caption that hands over: "Nobody is at the desk. The text starts the automation anyway."
  - A `form` takes two beats, because a press opens its beat: in step one the customer fills it in, in step two the viewer presses the button and the first workflow step runs.
  - A time or a schedule: the caption names the time and the step runs the first workflow step.
- **One workflow step per beat.** The viewer sees the whole workflow at rest, then the line draws from the step before to this one and it lights up. Its card has said what this step does, so run one, and give the next one its own beat.
- **The workflow first, then what it caused.** Order the `do` list as the eye should travel: the workflow step, then the app it wrote to. Each screen shows full size, in that order.
- **At most three screens in a beat, each once.** Keep all changes to one screen next to each other in `do`. A screen that leaves and comes back reads as two things happening. `check` notes both.
- **Show what a person receives.** A reply, a follow-up or an alert that exists only as a `note` on a workflow step is a claim. Land it on the screen of whoever gets it: the customer's `phone` or `inbox`, the owner's `inbox`. A `note` is enough for what the system checks or decides: "No duplicate found".
- **One step, one gain.** The caption says what the moment means for the business, in the owner's words. "The lead is in your pipeline before you have seen it." beats "Webhook creates a CRM record."
- **Captions** speak to the owner as "you", in the present tense, in 72 characters or fewer. Write whole sentences: the card shows nothing else.
- **A beat may be the workflow alone.** "It looks in your calendar for times that are really open." with one workflow step and its `note` is a full step.
- **Every panel changes.** A screen that stays still for the whole demo looks broken. Give it something to do or leave it out.
- **End on the gain.** The last beat turns the before numbers into the after numbers, on the screen where the owner reads their numbers. The results slide follows it.
- **Show time with the clock.** Put `clock` on the beats where the time carries the point: 9:14 PM when the text arrives, 9:16 PM when it is booked. The card shows it next to the step number.
- **Jump ahead for a total.** One customer does not move a weekly number. In the last beat set `clock` to "Mon 8 AM" or "Day 7" and show the week's total there.
- **Length.** `npm run check` prints both: `Explainer about 79 s, fast about 36 s.` Aim for 60 to 100 seconds of explainer. Past 110 `check` notes it: cut a step, or show less in each.

## Panels by role

Read `src/panels/INDEX.md` in the app, then pick by role:

| Role | Panels | How many |
| --- | --- | --- |
| Where the customer is | `phone`, `form`, `inbox` | one; a `form` and their `inbox` when they ask on one and are answered on the other |
| The system at work | `workflow` | one, in almost every demo: its steps are the spine the story walks along |
| Where the owner's work lives | `crm`, `sheet`, `calendar`, `inbox`, `campaign` | one or two |
| What the owner gains | `kpi` | one, when the gain is a number |

Four panels by default. Use three or two when a fourth would have nothing to do. When four slots are too few, the `kpi` gives up its slot first: the results slide shows the numbers either way, and the last beat can land on the owner's own screen. When the prospect names more screens than four slots hold, keep the customer's screen, the workflow and the screen where the gain shows. Fold each of the others into a workflow step, with its tool in `app` and its result in the step's `note`.

Name the workflow's steps as things the system does, in the owner's words: "Reads the message", "Finds open slots". The viewer reads all of them when the workflow first shows.

A label says whose screen it is or which tool it is, in 40 characters or fewer (about 24 over a phone or a form, which stands in a narrow column): "Patient's phone", "CRM in ClickUp", "This week". Name the tool the prospect uses when you know it. App names are plain text.

## Results

The slide after the last step. It always shows the outcome numbers. A `results` block adds the rest:

- `title`: the claim in a few words. "What a missed message costs".
- `text`: why it is worth money, in one or two sentences the owner would repeat to a partner.
- `roi`: a calculator the owner fills in live. Two to five numbers of their business, and one to three gains that are each the product of some of them: 40 messages a month × 30% you now book × $180 a patient. The slide draws the charts from it and recalculates as they type.
- `roi.label`: what the monthly figure counts when it is not new income: "saved a month" for a calculator of hours. Left out, the slide says "extra a month".
- `roi.cost`: add it only when the user, the one who sends this demo, named their price. A budget in a job post is the prospect's number, not a price. With a cost the slide shows the gain against the cost and the month it pays for itself.

Numbers the prospect stated go in as stated. Guess the others low, also when the input states none: the fields are there for the owner to type their own, and your report lists every guess so the user can replace it. Leave `roi` out only when the gain cannot be counted, in money or in hours.

## Numbers and names

- A number the prospect stated goes in as they stated it.
- A number you invent stays modest and plausible for a business that size. List the invented ones in your report so the user can replace them. The page itself carries a "Scripted example" tag.
- At least one outcome carries `was`: "38 sec", was "14 h". A value is 12 characters or fewer. `was` can be a few words when the before has no number: "no reply".
- Write times, dates and money the way the viewer does: "6:42 PM" and "$450" for an owner in the US, "18:42" and "€450" for one in the Netherlands. A calendar panel shows AM and PM with `ampm: true`.
- A Dutch script gets `"lang": "nl"`, so the buttons, the step counter and the results slide are Dutch too.
- Use the prospect's business name. When the input gives none, write the trade where the name would go ("Your HVAC office") and say so in your report. Invent its customers: names that fit the trade and the place, problems that customer would really have.

## The cold read

Before you report, look at the story pictures (`explainer-*.png`) in order as the owner would, without the JSON in mind.

1. **Each card, alone.** Say what is about to happen and who does it. A card you cannot answer that from names the mechanism or leans on a screen the viewer has not seen yet.
2. **Each screen after it.** Say what changed there and what the business gained. The opening step shows the trigger, so it carries no gain yet. From the second step on, a screen where you cannot name one usually shows nothing new.
3. **The results slide.** Say what the owner gains in a month and which of their numbers it comes from.

Rewrite every step that fails, then check and shoot again.
