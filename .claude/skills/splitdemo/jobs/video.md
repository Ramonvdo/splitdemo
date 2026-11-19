# Film a demo

Plays the demo by itself and films it. The film opens on the title, plays the story step by step, presses what a viewer would press, and holds the results slide for five seconds. A film has nobody to answer the slide's questions, so it ends on the report with the demo's example numbers.

Needs ffmpeg on the path. Run from the `app` folder:

```
npm run record -- <slug> [--fast] [--portrait] [--gif]
```

| Ask | Flags | Result |
| --- | --- | --- |
| A film for a call recording, an email or a proposal | none | `<slug>.mp4`, 1920x1080, the story in explainer mode |
| The short version: every panel at once | `--fast` | `<slug>-fast.mp4`, the wall, ending on the outcome |
| A film for a phone: a chat message, a story, a short | `--portrait` | `<slug>-portrait.mp4`, 1080x1920 |
| A picture that moves in a README or an email body | `--gif` | also `<slug>.gif`, always the wall, made smaller until it is under 8 MB |

A film is as long as `npm run check -- <slug>` says that mode plays, plus the hold at the end. The files land next to the demo's `demo.json` (for one of the app's own examples: in the app's `.build/video/`), and the command prints each path with its size and length.

## Steps

1. Check the demo plays: `npm run check -- <slug>`.
2. Run the command with the flags the ask calls for. It takes about as long as the film, plus a build. With `--gif` and no `--fast` it films twice, once for each.
3. Report each file's path, size and length as printed. When the gif line says `Still heavy`, say that a shorter demo makes a lighter gif.

When the command says ffmpeg is missing, pass on its install line and stop there.
