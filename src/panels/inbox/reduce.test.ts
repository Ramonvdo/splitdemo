import { expect, it } from "vitest";
import { logic } from "./reduce.ts";
import type { Action, Config } from "./schema.ts";

const config: Config = { mails: [{ id: "news", from: "Dental Weekly", subject: "This week in dentistry", time: "Mon" }] };
const dana: Action = { type: "receive", id: "dana", from: "Dana Whitfield", subject: "Re: Quick question", body: "Yes, send me the details.", time: "09:12" };
const run = (actions: Action[]) => actions.reduce((state, action) => logic.reduce(state, action, config), logic.initial(config));

it("starts with the mail from the config, read and closed", () => {
  expect(logic.initial(config)).toEqual({ mails: [{ id: "news", from: "Dental Weekly", subject: "This week in dentistry", time: "Mon", unread: false, rev: 0 }] });
});

it("puts new mail on top, unread", () => {
  const { mails } = run([dana]);
  expect(mails.map((m) => m.id)).toEqual(["dana", "news"]);
  expect(mails[0]).toEqual({ id: "dana", from: "Dana Whitfield", subject: "Re: Quick question", body: "Yes, send me the details.", time: "09:12", unread: true, rev: 1, how: "land" });
});

it("opens a mail and marks it read, without flashing it", () => {
  const state = run([dana, { type: "open", mail: "dana" }]);
  expect(state.open).toBe("dana");
  expect(state.mails[0]).toMatchObject({ unread: false, rev: 1 });
});

it("labels a mail", () => {
  expect(run([dana, { type: "tag", mail: "dana", tag: "Interested", tone: "good" }]).mails[0]).toMatchObject({ tag: "Interested", tone: "good", rev: 2, how: "flash" });
});

it("puts a reply under a mail and opens it", () => {
  const state = run([dana, { type: "reply", mail: "dana", text: "Great, here they are.", label: "Drafted for you" }]);
  expect(state.open).toBe("dana");
  expect(state.mails[0]).toMatchObject({ unread: false, reply: { text: "Great, here they are.", label: "Drafted for you" } });
});

it("refuses what the inbox cannot show", () => {
  expect(() => run([dana, dana])).toThrow('there is already a mail "dana"');
  expect(() => run([{ type: "open", mail: "nope" }])).toThrow('there is no mail "nope". Mails: news');
  expect(() => run([dana, { type: "open", mail: "dana" }, { type: "open", mail: "dana" }])).toThrow('"dana" is already open');
  const many = Array.from({ length: 5 }, (_, i): Action => ({ type: "receive", id: `m${i}`, from: "A", subject: "B" }));
  expect(() => run(many)).toThrow("the inbox would hold 6 mails and fits 5");
});

it("says where a mail's words are read: sender and subject in the list, the rest once it is open", () => {
  const pace = (before: Action[], action: Action) => logic.pace?.(action, run(before), config);
  // "Dana Whitfield" and "Re: Quick question".
  expect(pace([], dana)).toEqual({ words: 5 });
  // "Yes, send me the details."
  expect(pace([dana], { type: "open", mail: "dana" })).toEqual({ words: 5 });
  const reply: Action = { type: "reply", mail: "dana", text: "Great, here they are." };
  // A reply opens the mail when it was closed, so the mail is read too.
  expect(pace([dana], reply)).toEqual({ words: 9 });
  expect(pace([dana, { type: "open", mail: "dana" }], reply)).toEqual({ words: 4 });
  expect(pace([dana], { type: "tag", mail: "dana", tag: "Interested" })).toBeUndefined();
});
