# Share a demo as a link

Publishes the demo to the user's own host under a link nobody can guess: `<slug>-<four random characters>`. There is no list of demos, a wrong link is a real 404, and search engines are told to stay out. Each demo's folder holds only its own data.

Run every command from the `app` folder. Needs `hosting.provider: "cloudflare"` in the settings; without it, do [onboarding.md](onboarding.md) or use the export at the end of this file.

A publish replaces the whole site with every demo that is still shared. So it is always the full list that goes online, and a demo past its end date drops out by itself.

## Share

1. **Check the demo plays:** `npm run check -- <slug>`.

2. **Build the plan:**

   ```
   npm run share -- <slug>
   ```

   Add `--days <n>` when the user names how long it should stay online. Otherwise the end date is the demo's own `expires`, or `expiryDays` from the settings, or 30 days.

   It prints the Worker, every demo that will be online with its link and end date, what drops out and why, and the size.

3. **Share mode `ask`** (the default): the command stops at `Nothing is published yet.` Show the user that plan as printed and wait for their yes in this conversation. On yes:

   ```
   npm run share -- --yes
   ```

   **Share mode `auto`:** step 2 already published. Go on to step 4.

4. **Report** the link from the `Published:` lines and its end date. The link is the demo's for good: sharing it again later keeps the same address.

   After the very first publish from a workspace the command says to share once more. Do that (`npm run share -- --yes`): the address was not known until then, and the second publish gives each link its preview picture.

Sending the link to the prospect belongs to whoever asked for it. Hand it over with one line they can paste, and send nothing yourself unless the user asks for that in this conversation.

## Other requests

- **Take a link offline:** `npm run share -- --stop <slug>`, then the same plan and yes as above. The link answers 404 after the publish.
- **Try it without publishing:** add `--dry-run`. The host checks the build; nothing goes online and nothing is saved.
- **What is shared now:** `<workspace>/shares.json` holds the site's address and, for every shared demo, its folder name and end date.
- **A folder for another host:** `npm run export -- <slug>` writes the demo as one plain folder and prints where. Any static host takes it. That folder has no guessable-link protection of its own; the host's address is the link.
