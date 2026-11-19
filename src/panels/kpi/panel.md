# kpi

The owner's numbers: up to four tiles, and one bar chart under them.

Pick it when: the gain is a number the owner already watches: reply time, bookings, hours saved, revenue.

- Label a tile the way the owner says it: "Time to first reply", "New patients booked".
- Start each tile on today's number and `set` it late in the story, with the before in `delta`: "was 14 h". The viewer watches the number they care about change.
- Give a tile that improved `tone: "good"`.
- A weekly or monthly total moves in the last beat, after the story's `clock` jumps ahead: "Mon 8 AM", "Day 7".
- `push` adds a bar or raises one. Use it for the count that grows, once or twice, near the end. It needs a `chart` in the config. Bars that start at 0 draw as an empty chart, which reads as the before.
- A bar prints its value as a whole number. Chart a measure that is whole (bookings a day, replies a week) and keep one with decimals ("8.3 h") on a tile, so the tiles and the bars agree.
- A chart earns its place when its bars end at different heights. Where the story would end on bars of one height (Mon 1, Tue 1, Wed 1), leave `chart` out and let the tiles carry the gain.
- Make the tiles agree with the demo's `outcome`, so the board and the bar under the wall say the same thing.
