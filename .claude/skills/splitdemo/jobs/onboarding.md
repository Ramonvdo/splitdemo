# Set splitdemo up

Once per computer. Ends with a settings file, an app that runs, and, when the user wants links, a host that takes a build. Running it again changes single settings and keeps the rest.

The settings file is `~/.splitdemo/config.json`:

```json
{
  "app": "/path/to/splitdemo",
  "workspace": "/path/to/Documents/splitdemo",
  "hosting": { "provider": "cloudflare", "project": "acme-splitdemo" },
  "brand": { "name": "Acme Automation", "accent": "#ff5c35" },
  "share": "ask",
  "expiryDays": 30
}
```

## Steps

1. **Read what is there.** When the file exists, show it and ask what to change. Keep every key the user does not name.

2. **Find the app.** Use `app` from the settings when that folder holds a `package.json` named `splitdemo`. Otherwise look three folders up from this skill's own folder: when that is a splitdemo clone, use it. Otherwise ask where to put it (default `~/splitdemo`) and clone it:

   ```
   git clone https://github.com/Ramonvdo/splitdemo <folder>
   ```

3. **Install**, from the app folder. Node 22.18 or newer is required; say so and stop when `node -v` is older.

   ```
   npm ci
   npx playwright install chromium
   ```

4. **Ask the open settings in one round**, each with its default:
   - Workspace folder, where the user's demos live. Default `~/Documents/splitdemo`. It sits outside the app, so prospect data never lands in a clone of a public repo.
   - Hosting: `cloudflare` for links, or `none` for local demos, films and exported folders only.
   - Brand: the agency's name, and one accent colour as `#rrggbb` (optional).
   - Share mode: `ask` shows what a share will publish and waits for a yes (default). `auto` publishes straight away.
   - Days a shared demo stays online. Default 30.

5. **Cloudflare, when chosen.**
   - Check the login: `npx --yes wrangler@4.142.0 whoami`. When it says the user is not logged in, ask them to run `npx wrangler login` themselves and tell you when it is done.
   - Propose a Worker name of their own for the demos, `<agency>-splitdemo`, and check that it is free:

     ```
     npx --yes wrangler@4.142.0 deployments list --name <name>
     ```

     `This Worker does not exist on your account` means the name is free. Any other answer means a Worker with that name exists: pick another name. A publish replaces everything a Worker serves, so the demos get a Worker nothing else uses.
   - A domain of their own is optional: `"domain": "demos.example.com"` under `hosting`, for a domain already on their Cloudflare account.

6. **Write the settings file** and show it. Create the workspace folder with a `demos` folder in it.

7. **Prove it works**, from the app folder:

   ```
   npm run check
   ```

   Done when the three examples each print `plays`. With Cloudflare, also:

   ```
   npm run share -- speed-to-lead --dry-run
   ```

   Done when it prints `Dry run: the host takes this build.` A dry run publishes nothing and saves nothing.

8. **Check for ffmpeg** with `ffmpeg -version`. Only films need it. When it is missing, say so and give the install line (Windows: `winget install Gyan.FFmpeg`, Mac: `brew install ffmpeg`).

9. **Report** what is set, and that `/splitdemo <job post or problem>` makes the first demo.
