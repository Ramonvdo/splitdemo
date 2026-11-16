# sheet

A spreadsheet: one row per lead, order or request. New rows land at the bottom and changed cells flash.

Pick it when: the prospect runs on Google Sheets, Excel or Airtable, or the system fills in a list someone types by hand today.

- Three to five columns, named as in their own sheet. Mark the status column `tag: true` and the column with the longest text `wide: true`.
- `title` is the file's name, top left, and `tab` the name on the sheet tab at the bottom. Use the prospect's own: "Office cleaning leads", "Leads".
- The blue selection sits on the cell the last action wrote, and the formula bar shows that cell's text. The panel does this itself.
- Start with two to four rows filled in, so the new row arrives in a sheet that is in use.
- `add` the row the system writes. `set` only the cells that change, with a `tone` when the status moves: `good`, `wait`, `info` or `idle`.
- `fill` gives one column the same text in every row: the whole list turns "Sent" in one action.
- Keep a cell to a few words. On a four-panel wall a narrow column holds about ten characters and a status about eight. `npm run shots` fails on a cell that ends in three dots.
- The sheet fits seven rows.
