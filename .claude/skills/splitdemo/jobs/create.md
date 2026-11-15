# Create a demo

Input: a job post, a problem in the user's words, a process description, a call transcript, or the slug of an existing demo with a change to make. Output: a `demo.json` in the workspace that passes `check` and `shots`, open in the browser.

Run every command from the `app` folder in the settings.

## Steps

1. **Read the input.** Pull out the prospect and their trade, who their customer is, what goes wrong today and what it costs them, the moment it goes wrong, what the system does about it, and every number they stated. For a change to an existing demo, read `<workspace>/demos/<slug>/demo.json` and go to step 4 with the change.

2. **Write the story** as the six lines in [../story.md](../story.md), in the chat. Done when the opening beat shows the trigger, each beat after it names a gain for the owner, and the outcome has a number with what it was.

3. **Pick the panels.** Read `src/panels/INDEX.md`, choose by role per [../story.md](../story.md), then read `panel.md`, `schema.ts` and `example.json` in the folder of each panel you chose, and `tones.ts` and `icon-names.ts` next to those folders.

4. **Write the demo** to `<workspace>/demos/<slug>/demo.json` per [../format.md](../format.md). The slug names the prospect and the system in lowercase with dashes: `harbor-dental-speed-to-lead`. When the input names no business, use the trade and the town: `phoenix-hvac-missed-calls`. Set `accent` from `brand.accent` in the settings when it is there.

5. **Check it** until it prints `<slug>: plays.` with no `problem` lines:

   ```
   npm run check -- <slug>
   ```

   Each `problem` starts with its place in the file. Each `note` is a way the viewer gets less from the demo: act on it, or keep it only when the story needs it that way.

6. **Shoot it** until it exits clean, with no `does not fit` lines:

   ```
   npm run shots -- <slug>
   ```

   It writes `00-start.png`, one picture per beat and the end state to `<workspace>/demos/<slug>/shots/`, and fails when text is cut off or ends in three dots, on a laptop screen or a phone. A state that fails on a phone gets a `-phone.png` picture to look at.

7. **Do the cold read** in [../story.md](../story.md) on those pictures, every one of them. Rewrite the beats that fail it, then repeat from step 5.

8. **Open it.** The dev server plays every demo at `http://localhost:4310/<slug>/` and reloads when its file changes. When nothing answers on port 4310, start `npm run dev` from the app in the background.

9. **Report** in a few lines: the address, the story in one sentence, the outcome numbers, and which numbers you invented. Then offer the two next steps by name: a link (`/splitdemo-share <slug>`) or a film (`/splitdemo-video <slug>`).

## On the call

Worth telling the user once: space plays and pauses, the arrow keys step through the beats, `R` plays it again, `1` to `4` enlarge a panel, `H` hides the bar for a clean wall.
