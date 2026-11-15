# Security

## Reporting a problem

Report it in private through GitHub: open the repository's **Security** tab and choose **Report a vulnerability**. Please do not open a public issue for it.

Say what you did, what you expected and what happened. A demo file that shows the problem helps most.

## What matters here

splitdemo is a static site builder. A shared demo is HTML, CSS, JavaScript and one `demo.json`, served from the owner's own Cloudflare Worker. There is no server code, no login and no database.

The parts worth a report:

- A shared demo that leaks another one. Each demo's folder should hold only its own data, and there should be no way to list the folders.
- A `demo.json` that runs code or loads something from elsewhere. A demo is data: text is drawn as text, and the one link a demo can carry (`next.url`) is limited to `https://` and `mailto:`.
- A share that publishes more than it showed. What the script prints is what should go online.

## What a demo file is not

`demo.json` is published as it is. Anyone with the link can read all of it, so it is the wrong place for a key, a password or a real customer's details. The examples in this repo use invented people and businesses, and so should yours.

Settings and the list of shared links stay on your machine: `~/.splitdemo/config.json` and `shares.json` in your workspace. Neither holds a credential. Publishing uses your own `wrangler login`.
