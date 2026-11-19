# form

A web form the customer fills in: a few fields and a button. Once it is sent the answers stay on screen and the confirmation lands where the button was.

Pick it when: the story starts with a request on a website: a quote, a booking, a sign-up, an application.

- Open the story here, and say where the form lives in the label: "Your website's quote form".
- `site` puts the form in a browser window with that address: "ridgelineroofing.com/quote". Use the prospect's own domain, or "yourwebsite.com/quote" when you do not know it, and leave it out for a form inside an app.
- Two to four fields the prospect really asks. A field with `options` becomes a choice with buttons.
- `fill` the fields and `submit` in one beat. For a demo presented live, give `submit` the next beat with `wait: "click"`, and the viewer presses the button themselves.
- A choice takes an answer from its `options`, spelled the same.
- Write `done` as what the customer now expects: "Request received", "Your inspection time is on its way."
