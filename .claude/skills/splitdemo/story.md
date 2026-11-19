# The story

A demo is a sequence of steps. Each step opens on a card with one line of text, alone on the screen, and then shows what that line said on the screens it touches, one screen at a time. The owner reads what is about to happen, watches it happen, and at the end works out on a results slide what it is worth with their own numbers. That is explainer mode, and it is what a link and a film open in. Fast mode plays the same steps on one wall of panels.

So write for the card. A step whose caption cannot stand alone on an empty screen is a step to rewrite.

## Seven lines before any JSON

Write these in the chat first. They are the demo; the JSON only carries them.

1. **Viewer**: the prospect and their trade. "The owner of a two-chair dental practice."
2. **Their customer**: the person the story follows, with a name. "Dana Whitfield, a new patient."
3. **Before**: what happens today, with its cost as a number. "A text after six waits 14 hours for a reply."
4. **Trigger**: the one thing that starts the system, at the moment that makes the before hurt. "9:14 PM, a new patient texts. The practice closed at six."
5. **Steps**: six to nine. The first is the trigger; each one after it is one thing the system does and what the owner gets from it.
6. **Outcome**: up to three numbers, each next to what it was.
7. **Results**: one or two sentences on why this is worth money, then the chain the calculator multiplies, in order, and the one number in it the system changes.

## Steps

One step is one beat in the JSON: a caption (`say`) and the changes it brings (`do`).

- **Step one is the trigger.** Its caption opens on the money at stake, what the one customer in the story is worth or what the task costs today, and then says what starts everything: "A $180 new patient texts at 9:14 PM. You closed at six. Press send." or "A $1,800 job starts here: at 6:30 it finds offices that fit." Take the figure from the calculator's chain, so the card and the results slide agree.
  - A customer who sends or submits something: show their screen (a `phone`, a `form`) and let the viewer press it with `wait: "click"`. Step two then runs the first workflow step, with a caption that hands over: "Nobody is at the desk. The text starts the automation anyway."
  - A `form` takes two beats, because a press opens its beat: in step one the customer fills it in, in step two the viewer presses the button and the first workflow step runs.
  - A customer who emails: their mail lands on the owner's `inbox`, a screen with nothing to press. Step one is a `receive` and an `open` there, so the viewer reads the request, and it plays by itself. Step two runs the first workflow step.
  - A time or a schedule: the caption names the time and the step runs the first workflow step.
- **One workflow step per beat.** The viewer sees the whole workflow at rest, then the line draws from the step before to this one and it lights up. Its card has said what this step does, so run one, and give the next one its own beat.
- **The workflow first, then what it caused.** Order the `do` list as the eye should travel: the workflow step, then the app it wrote to. Each screen shows full size, in that order.
- **At most three screens in a beat, each once.** Keep all changes to one screen next to each other in `do`. A screen that leaves and comes back reads as two things happening. `check` notes both.
- **Show what a person receives.** A reply, a follow-up or an alert that exists only as a `note` on a workflow step is a claim. Land it on the screen of whoever gets it: the customer's `phone` or `inbox`, the owner's `inbox`. A `note` is enough for what the system checks or decides: "No duplicate found".
  - The caption of the step where a reply lands says the system wrote it: "It answers with real times, 38 seconds later. Nobody typed it."
  - A team alert in a chat app (Slack, Teams) shows on a `phone`, the one panel with a message thread. Give it that screen when the tall slot is free: "Your team's chat". When the customer's phone or form holds the slot, the alert stays a workflow step with the chat app in `app` and what it posted in the `note`, and its caption names who was told.
- **One step, one gain.** The caption says what the moment means for the business, in the owner's words. "Dana is on your patient list before you have seen her text." beats "Webhook creates a CRM record."
  - The owner's words are what they call their customers and their tools, and they go on everything the viewer reads: captions, labels, workflow steps, tiles, the results slide. Where a builder says "lead", "pipeline", "CRM" and "AI", the owner says "a new patient", "your patient list", "your job board" and "it". A workflow step's `app` names a tool the owner knows ("Calendar", "Gmail") or is left out.
- **Captions** speak to the owner as "you", in the present tense, in 72 characters or fewer. Write whole sentences: the card shows nothing else. Whoever the system tells or hands work to has one name in the whole demo, "you" or "your front desk": the caption, the workflow step and the screen's label all use it.
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

Name the workflow's steps as things the system does, in the owner's words: "Reads the message", "Finds open slots". The viewer reads all of them when the workflow first shows. The workflow needs no step for the trigger. Give it one that names what came in ("New text message", "New quote request") when a customer's message starts the story: it is the step that step two runs, and it shows the message reached the system. A story that starts on a time opens on the first thing the system does ("Finds offices that fit").

A label says whose screen it is or which tool it is, in 40 characters or fewer (about 24 over a phone or a form, which stands in a narrow column): "Patient's phone", "Your jobs in ClickUp", "This week". Name the tool the prospect uses when you know it. App names are plain text.

## Results

The slide after the last step. It opens on the outcome numbers. With a calculator it then offers "Work it out for your business", asks the owner their own numbers one question a screen, and shows a report on the answers: what the system adds a month and over the first year, the numbers behind it, each one open to change, and two charts. A film or a picture has nobody to ask, so it ends on the report with your example numbers.

A `results` block carries it. The fields and their limits are in [format.md](format.md).

- `title`: the claim in a few words. "What a missed evening text costs".
- `text`: why it is worth money, in a sentence the owner would repeat to a partner, then the sum behind the monthly figure on the example numbers, so they can check it, with every rate you estimated called an estimate: "We estimate 20 more of every 100 would book: 40 × 20% × $180 = $1,440 a month."
- `roi`: the calculator. Leave it out only when the gain cannot be counted, in money or in hours.

### One chain, one lever

Pick the one chain of the business the system changes and write it as two to five numbers that multiply in order: 25 requests a month × 50% book a visit × 30% become a job × $1,800 a job. Then name the **lever**: the one number in that chain the system changes.

- **A rate the system improves gets `add`**: points on top of whatever the owner answers. `"add": 20` turns their 50% into 70% and another owner's 35% into 55%.
- **A number the system sets itself gets `to`**: `"to": 160` when it emails 160 offices a month whatever they email today, `"to": 3` when a task takes 3 minutes with it.
- **`saving: true`** when the chain is a cost that goes down. Time saved goes in as money: minutes of work × an hourly cost you ask the owner for. The slide then says "saved a month".
- **`monthly: true`** when what is won pays again every month, like a cleaning contract. Month 12 then counts twelve months of new clients, on the assumption that they stay the year. A job paid once stays without it, and so does an amount paid once a year (that one takes `"times": 0.0833`).
- **`times`** carries every fixed factor, multiplied into one number: a unit (minutes to hours is `0.0167`) and a constant nobody would change (21 working days a month). Emails a day × minutes each becomes hours a month with `"times": 0.35`. A constant written as an input would show as an "estimate" the owner is invited to change.
- **One gain per calculator.** A second gain the story shows (a follow-up job, fewer calls, a certain answer on every quote) stays in `outcome`.

### What to ask

Give `ask` to the numbers an owner knows from memory: how many requests come in, what a job is worth, how many customers they have. Three questions as a rule, four at most. Write each the way you would ask it across a table, and ask a share as "of every 100": "Of every 100 requests, how many end up booking a visit?" The lever's own input takes an `ask` like any other when the owner knows today's number. Their answer is today, and the report puts the system's number beside it as the estimate.

Every other number is your estimate. It has no `ask`, so the slide passes over it, shows it in the report with an "estimate" tag, and lets the owner change it there. A rate the owner never measured, like the reply rate on cold email they never sent, is always an estimate. An estimate with a source says so in its `note`, and says where your number sits against it: "ServiceTitan's median close rate is 31 to 38%. We count 30." Read [benchmarks.md](benchmarks.md) before you fill in a rate: it has the sourced numbers per trade and the places where no source exists.

### Stages

When the chain is a pipeline, give `stage` to its count and to each rate after it: "Requests", "Visits", "Jobs". Three stages or more draw as a funnel, so the owner sees which stage widens. Without stages the second chart is bars: a year as they work today against a year with the system.

### Numbers

- A number the prospect stated goes in as stated.
- Guess the others so the gain comes out low, also when the input states none: a low rate, a small `add`, and for a `to` on a cost the higher number (2 minutes with the system where you hope for 1). The number in a field pulls the owner's answer toward it, and a figure they can raise is believed sooner than a headline they have to talk down.
- Work the chain by hand, today's and the system's, with `times` as the file has it, before you trust the file: 25 × 0.20 × 0.30 × 1,800 = 2,700 extra a month.
- An `outcome` number's `was` and the calculator's today describe the same business: "was 6 a year" beside a chain that comes to 6 visits a year today.
- `roi.cost` only when the user, the one who sends this demo, named their price. A budget in a job post is the prospect's number. With a cost the report shows what is left after it, names the cost, and says in which month the system has paid for itself.
- The slide ends on one reply action, signed with the sender's name: the user's first name, or `brand.name` from the settings. When the user gives a booking page or an address it is `next`, the one thing to press: "Email Maya", "Book a call with Maya". Without one, `text` closes on it: "Reply to Maya and she sets it up." Say in your report which of the two the demo has.

## Numbers and names

- A number the prospect stated goes in as they stated it.
- A number you invent stays modest and plausible for a business that size. List the invented ones in your report so the user can replace them. The page itself carries a "Scripted example" tag.
- At least one outcome carries `was`: "38 sec", was "14 h". A value is 12 characters or fewer. `was` can be a few words when the before has no number: "no reply".
- Write times, dates and money the way the viewer does: "6:42 PM" and "$450" for an owner in the US, "18:42" and "€450" for one in the Netherlands. For any other country, use its own currency sign and the clock people there write: "£450" and "6:42 PM" for an owner in the UK. A calendar panel shows AM and PM with `ampm: true`. A `clock` holds 8 characters, so a day goes with a whole hour in AM or PM ("Fri 4 PM"). A three-letter day with a 24-hour time ("Fri 16:00") is nine: write the time alone, or "Day 5".
- A Dutch script gets `"lang": "nl"`, so the buttons, the step counter and the results slide are Dutch too.
- Use the prospect's business name. When the input gives none, write the trade where the name would go ("Your HVAC office") and say so in your report. When it gives no trade either, write the kind of business it does describe ("Your office", "Your shop"), or "Your business". Invent its customers: names that fit the trade and the place, problems that customer would really have. With no trade or place to go on, they get everyday names in the script's language and the problem the input itself describes.

## The cold read

Before you report, look at the story pictures (`explainer-*.png`) in order as the owner would, without the JSON in mind.

1. **Each card, alone.** Say what is about to happen and who does it. A card you cannot answer that from names the mechanism or leans on a screen the viewer has not seen yet.
2. **Each screen after it.** Say what changed there and what the business gained. The opening step shows the trigger, so it carries no gain yet. From the second step on, a screen where you cannot name one usually shows nothing new.
3. **The slide at the end.** Answer each question picture as the owner, from memory. A question you would have to look up loses its `ask` and becomes an estimate. Then the report: say what the owner gains in a month, which number the system changes, and which of their own numbers the rest comes from.

Rewrite every step that fails, then check and shoot again.
