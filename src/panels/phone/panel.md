# phone

One message thread on a phone: the conversation as the person holding it lives it.

Pick it when: the system talks to someone by text, WhatsApp or chat, or turns a missed call into a message.

- Decide whose phone it is and say so in the label: "Patient's phone", "Your phone". `send` is the holder typing, `receive` is the other side.
- Open the story here. A `send` on a beat with `wait: "click"` lets the viewer press send themselves, and everything after reads as the answer to what they did.
- Write each message the way that person would type it, with the real problem in it: "Hi, I chipped a tooth. Can I come in this week?"
- `typing` before a `receive` shows the reply being written. Once or twice in a demo makes the speed felt.
- `event` puts a small line in the thread that nobody typed: "Missed call", "Voicemail, 0:12". A missed-call story opens with it.
- `notify` drops a banner in under the title, for an owner hearing the result: "New booking, Thu 10:00". The next message clears it.
- The screen holds about five short messages. Older ones slide off the top.
