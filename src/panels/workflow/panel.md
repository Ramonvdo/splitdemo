# workflow

The automation as a short flow, left to right. Each step lights up as it runs and says what it found.

Pick it when: the viewer should see that a system did the work, step by step, with nobody at a desk.

- Name each step for what it does for the business: "Reads what they need", "Checks open slots". The tool goes in `app`, in a word the owner uses for it: "Calendar", "Gmail". Give each step an `icon` from `src/panels/icon-names.ts`.
- Four to six steps. Merge the ones a business owner would not tell apart.
- `after` draws the lines. Steps that share an `after` stack on top of each other and read as "at the same time". A line turns once, between two columns, so it never runs under a label.
- A `note` is what the step found: "Urgent, new patient", "Thu 10:00 is free". Viewers read the notes, so give one to every step that decides something.
- Run one step per beat, in the same beat as what it causes in another panel, with the step first. In explainer mode the viewer watches the line draw from the step before, and two steps in one beat pass too quickly to read. `npm run check` notes it.
- A step runs only once a step it comes `after` has run.
- Three steps on top of each other fit only with one-line labels and short notes.
