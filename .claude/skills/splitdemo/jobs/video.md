# Film a demo

Plays the demo by itself and films it. The film opens on the title, plays the story, presses what a viewer would press, and holds the outcome for three seconds.

Needs ffmpeg on the path. Run from the `app` folder:

```
npm run record -- <slug> [--portrait] [--gif]
```

| Ask | Flags | Result |
| --- | --- | --- |
| A film for a call recording, an email or a proposal | none | `<slug>.mp4`, 1920x1080 |
| A film for a phone: a chat message, a story, a short | `--portrait` | `<slug>-portrait.mp4`, 1080x1920, one panel at a time following the action |
| A picture that moves in a README or an email body | `--gif` | also `<slug>.gif`, made smaller until it is under 8 MB |

The files land next to the demo's `demo.json` (for one of the app's own examples: in the app's `.build/video/`), and the command prints each path with its size and length.

## Steps

1. Check the demo plays: `npm run check -- <slug>`.
2. Run the command with the flags the ask calls for. It takes about as long as the demo, plus a build.
3. Report each file's path, size and length as printed. When the gif line says `Still heavy`, say that a shorter demo makes a lighter gif.

When the command says ffmpeg is missing, pass on its install line and stop there.
