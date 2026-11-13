# workflow

The automation as a short flow, left to right. Each step lights up as it runs and says what it found.

Pick it when: the viewer should see that a system did the work, step by step, with nobody at a desk.

- Name each step for what it does for the business: "Reads what they need", "Checks open slots". The tool goes in `app`, in a word: "AI", "Calendar".
- Four to six steps. Merge the ones a business owner would not tell apart.
- `after` draws the lines. Steps that share an `after` stack on top of each other and read as "at the same time".
- A `note` is what the step found: "Urgent, new patient", "Thu 10:00 is free". Viewers read the notes, so give one to every step that decides something.
- Run a step in the same beat as what it causes in another panel, with the step first.
- A step runs only once a step it comes `after` has run.
- Three steps on top of each other fit only with one-line labels and short notes.
