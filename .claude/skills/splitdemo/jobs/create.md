# Create a demo

Input: a job post, a problem in the user's words, a process description, a call transcript, or the slug of an existing demo with a change to make. Output: a `demo.json` in the workspace that passes `check` and `shots`, open in the browser.

Run every command from the `app` folder in the settings.

## Steps

1. **Read the input.** Pull out the prospect and their trade, who their customer is, what goes wrong today and what it costs them, what starts the process, what the system does about it step by step, and every number they stated. For a change to an existing demo, read `<workspace>/demos/<slug>/demo.json` and go to step 4 with the change.

2. **Write the story** as the seven lines in [../story.md](../story.md), in the chat. Done when step one is the trigger, each step after it names one thing the system does and what the owner gets from it, the outcome has a number with what it was, and the results line says where the money comes from.

3. **Pick the panels.** Read `src/panels/INDEX.md`, choose by role per [../story.md](../story.md), then read `panel.md`, `schema.ts` and `example.json` in the folder of each panel you chose, and `tones.ts` and `icon-names.ts` next to those folders.

4. **Write the demo** to `<workspace>/demos/<slug>/demo.json` per [../format.md](../format.md). The slug names the prospect and the system in lowercase with dashes: `harbor-dental-speed-to-lead`. When the input names no business, use the trade and the town: `phoenix-hvac-missed-calls`. When it names neither, use the kind of business and the system: `service-business-lead-follow-up`. Set `accent` from `brand.accent` in the settings when it is there, and `"lang": "nl"` when the script is Dutch.

5. **Check it** until it prints `<slug>: plays.` with no `problem` and no `note` lines:

   ```
   npm run check -- <slug>
   ```

   Each `problem` starts with its place in the file. Each `note` is a way the viewer gets less from the demo: a screen that shows twice in one step, more than three screens in a step, two workflow steps in one beat, a story past 110 seconds. Act on it. Keep one only when the story needs it that way, and say so in your report.

6. **Shoot it** until it exits clean, with no `does not fit` lines:

   ```
   npm run shots -- <slug>
   ```

   It writes to `<workspace>/demos/<slug>/shots/`:

   - the story: `explainer-00-start.png`, then per step its card (`explainer-03-0-card.png`) and each screen as the story leaves it (`explainer-03-1-flow.png`), then `explainer-NN-results.png`;
   - the wall: `00-start.png`, one `NN-beat.png` per beat, `NN-end.png`.

   It fails when text is cut off or ends in three dots, on a laptop screen or a phone. A state that fails on a phone gets a `-phone.png` picture to look at. Each `does not fit` line ends with the picture that shows it. `on the wall behind it` means a card or the results slide covers that panel in the picture: the text is cut on the wall, so look at the wall picture of the same step. While you iterate on one way of telling it, `--mode explainer` or `--mode fast` shoots that one alone.

7. **Do the cold read** in [../story.md](../story.md) on the story pictures, every one of them. Rewrite the steps that fail it, then repeat from step 5.

8. **Open it.** The dev server plays every demo at `http://localhost:4310/<slug>/` and reloads when its file changes. When nothing answers on port 4310, start `npm run dev` from the app in the background.

9. **Report** in a few lines: the address, the story in one sentence, both play times as `check` printed them, the outcome numbers, and every number you invented, the calculator's included. Say whether the results slide has a cost. Then offer the two next steps by name: a link (`/splitdemo-share <slug>`) or a film (`/splitdemo-video <slug>`).

## On the call

Worth telling the user once:

- The switch top left goes between Explainer and Fast and keeps the step. `?mode=fast` on the address opens the wall directly.
- Space plays and pauses, the arrow keys step through the story, `R` plays it again, `H` hides the bars.
- In fast mode `1` to `4` enlarge a panel.
- On the results slide the owner's own numbers go straight into the fields.
