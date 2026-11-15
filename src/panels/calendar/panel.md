# calendar

A week of bookings, one column a day, in time order. A new booking lands in its day.

Pick it when: the result is an appointment, visit, call or job on someone's calendar.

- Show two to four days on a four-panel wall (a fifth makes the columns too narrow for most titles, and `npm run shots` says so), mark `today`, and name the calendar's owner in the label: "Your crew's week".
- Start with a few bookings in place and room left on the day the story books into.
- `book` at the time a caption or a message already named, so the panels agree.
- `move` and `cancel` tell a rescheduling story. A cancelled booking stays, struck through, until its slot is booked again.
- A day fits three bookings.
- Write every time as `HH:MM` on a 24-hour clock, so bookings sort. For a viewer who reads "8:00 AM", set `ampm: true` and the calendar shows it that way.
