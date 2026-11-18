import { expect, it } from "vitest";
import { clamp, field, shown, sign, stages, target, typed, work } from "./roi.ts";
import type { Roi } from "./types.ts";

// A dentist: 40 messages a month after closing, 10 in 100 book today, a first visit is $180. The system adds 20 points.
const roi: Roi = {
  currency: "USD",
  inputs: [
    { id: "texts", label: "After-hours messages a month", ask: "How many messages come in after closing, in a month?", value: 40 },
    { id: "booked", label: "Share that books a visit", ask: "Of every 100, how many book a visit today?", value: 10, kind: "percent" },
    { id: "visit", label: "Worth of a first visit", ask: "What is a first visit worth?", value: 180, kind: "money" },
  ],
  lever: { input: "booked", add: 20 },
};
const today = { texts: 40, booked: 10, visit: 180 };

it("works the chain out twice, as it is today and with what the system adds", () => {
  // 40 x 0.10 x 180 today, 40 x 0.30 x 180 with the system.
  expect(work(roi, today)).toMatchObject({ before: 720, after: 2160, effect: 1440 });
});

it("follows the numbers the viewer types, and adds the system's points to their own", () => {
  // They book 25 in 100 already: 50 x 0.25 x 180 today, 50 x 0.45 x 180 with the system.
  expect(work(roi, { ...today, texts: 50, booked: 25 })).toMatchObject({ before: 2250, after: 4050, effect: 1800 });
  // A share stops at 100: 90 + 20 is 100, so 40 x 0.90 x 180 against 40 x 1.00 x 180.
  expect(target(roi, { ...today, booked: 90 })).toBe(100);
  expect(work(roi, { ...today, booked: 90 })).toMatchObject({ before: 6480, after: 7200, effect: 720 });
  // The viewer sets what the system reaches themselves: 40 x 0.15 x 180.
  expect(work(roi, today, 15)).toMatchObject({ after: 1080, effect: 360 });
});

// A recruiter spends 18 minutes on each of 275 applications a month, at 35 an hour. The system makes that 3 minutes.
const screening: Roi = {
  currency: "EUR",
  inputs: [
    { id: "applications", label: "Applications a month", ask: "How many applications come in a month?", value: 275 },
    { id: "minutes", label: "Minutes on each", ask: "How many minutes does screening one take?", value: 18 },
    { id: "hour", label: "Cost of a recruiter's hour", value: 35, kind: "money" },
  ],
  lever: { input: "minutes", to: 3 },
  times: 1 / 60,
  saving: true,
};
const desk = { applications: 275, minutes: 18, hour: 35 };

it("counts a cost that goes down as what is saved", () => {
  // 275 x 18 x 35 / 60 = 2,887.50 today, 275 x 3 x 35 / 60 = 481.25 with the system.
  const worked = work(screening, desk);
  expect(target(screening, desk)).toBe(3);
  expect(worked.before).toBeCloseTo(2887.5, 6);
  expect(worked.after).toBeCloseTo(481.25, 6);
  expect(worked.effect).toBeCloseTo(2406.25, 6);
});

it("never turns an answer that leaves nothing to gain into a loss", () => {
  // They already need 2 minutes, the system 3: nothing is saved, and nothing is "extra" either.
  expect(work(screening, { ...desk, minutes: 2 }).effect).toBe(0);
  // They already book 40 in 100 and the viewer sets the system at 30.
  expect(work(roi, { ...today, booked: 40 }, 30).effect).toBe(0);
});

it("runs the first year month by month, after what the system costs", () => {
  // 1,440 extra a month, 300 a month to run, 1,500 to set up: -1,500, then +1,140 a month.
  const worked = work({ ...roi, cost: { monthly: 300, once: 1500 } }, today);
  expect(worked.months).toEqual(Array(12).fill(1440));
  expect(worked.running).toEqual([-1500, -360, 780, 1920, 3060, 4200, 5340, 6480, 7620, 8760, 9900, 11040, 12180]);
  expect(worked.year).toBe(12180);
  expect(worked.payback).toBe(2);
  // Half the effect, the same costs: -1,500, then +420 a month.
  expect(worked.cautious).toEqual([-1500, -1080, -660, -240, 180, 600, 1020, 1440, 1860, 2280, 2700, 3120, 3540]);
});

it("names a month it pays for itself only when there is something to pay back", () => {
  expect(work(roi, today).payback).toBeUndefined();
  expect(work(roi, today).year).toBe(17280);
  // Only a monthly cost, and more comes in than goes out: the first month already.
  expect(work({ ...roi, cost: { monthly: 300 } }, today).payback).toBe(1);
  // 1,140 a month never earns back 20,000 within the year.
  expect(work({ ...roi, cost: { monthly: 300, once: 20000 } }, today).payback).toBeUndefined();
});

// A cleaner emails 20 offices a month by hand, the system 160. 5 in 100 reply, half of those take a visit,
// 1 visit in 5 becomes a client, and a client pays 400 every month from then on.
const outreach: Roi = {
  currency: "USD",
  inputs: [
    { id: "emails", label: "Offices emailed a month", stage: "Emails", ask: "How many offices do you email in a month now?", value: 20 },
    { id: "reply", label: "Offices that reply", stage: "Replies", value: 5, kind: "percent" },
    { id: "visit", label: "Replies that take a visit", stage: "Visits", value: 50, kind: "percent" },
    { id: "client", label: "Visits that become a client", stage: "Clients", value: 20, kind: "percent" },
    { id: "fee", label: "What a client pays a month", ask: "What does a client pay you a month?", value: 400, kind: "money" },
  ],
  lever: { input: "emails", to: 160 },
  monthly: true,
  cost: { monthly: 450, once: 1500 },
};
const mailing = { emails: 20, reply: 5, visit: 50, client: 20, fee: 400 };

it("lets what was won keep paying when the calculator says it pays every month", () => {
  // 20 x 0.05 x 0.5 x 0.2 x 400 = 40 of new fees a month today, 320 with 160 emails: 280 more, every month again.
  const worked = work(outreach, mailing);
  expect(worked).toMatchObject({ before: 40, after: 320, effect: 280 });
  expect(worked.months).toEqual([280, 560, 840, 1120, 1400, 1680, 1960, 2240, 2520, 2800, 3080, 3360]);
  // Running: the sum of those so far, minus 450 a month and 1,500 once.
  expect(worked.running.slice(0, 6)).toEqual([-1500, -1670, -1560, -1170, -500, 450]);
  expect(worked.year).toBe(14940);
  expect(worked.payback).toBe(5);
});

it("says what one more point on the last share is worth in a year", () => {
  // The lever is that share: 31 in 100 against 30, on 40 messages of 180, twelve months.
  const point = work(roi, today).point;
  expect(point?.id).toBe("booked");
  expect(point?.year).toBeCloseTo(864, 6);
  // 21 in 100 visits against 20: 16 more a month, and paid every month that is 16 x (1 + 2 + ... + 12).
  const kept = work(outreach, mailing).point;
  expect(kept?.id).toBe("client");
  expect(kept?.year).toBeCloseTo(1248, 6);
  // A saving has no share to win on, and neither has a chain without one.
  expect(work(screening, desk).point).toBeUndefined();
  // Nothing lies above 100 in 100.
  expect(work(roi, { ...today, booked: 90 }).point).toBeUndefined();
});

// A plumber: 25 requests a month, half book a visit today and the system adds 20 points, 3 visits in 10 become a job of 1,800.
const intake: Roi = {
  currency: "USD",
  inputs: [
    { id: "requests", label: "Quote requests a month", stage: "Requests", ask: "How many quote requests do you get in a month?", value: 25 },
    { id: "visit", label: "Requests that book a visit", stage: "Visits", ask: "Of every 100 requests, how many book a visit?", value: 50, kind: "percent" },
    { id: "won", label: "Visits that become a job", stage: "Jobs", value: 30, kind: "percent" },
    { id: "job", label: "Worth of an average job", ask: "What is an average job worth?", value: 1800, kind: "money" },
  ],
  lever: { input: "visit", add: 20 },
};
const plumbing = { requests: 25, visit: 50, won: 30, job: 1800 };

it("lays the chain out as a funnel over a year, today next to the system", () => {
  // 25 x 12 requests; half of them and 7 in 10 of them visit; 3 in 10 visits become a job. Money is not a stage.
  expect(stages(intake, plumbing)).toEqual({
    lead: [],
    drawn: [
      { name: "Requests", today: 300, after: 300 },
      { name: "Visits", today: 150, after: 210 },
      { name: "Jobs", today: 45, after: 63 },
    ],
    pair: true,
  });
});

it("leaves a first stage that dwarfs the next out of the funnel, and draws one funnel when the system changes how much goes in", () => {
  // 160 x 12 emails, 5 in 100 reply: a spike and a sliver. The emails become a sentence; the funnel starts at the replies.
  const funnel = stages(outreach, mailing)!;
  expect(funnel.lead).toEqual([{ name: "Emails", today: 240, after: 1920 }]);
  expect(funnel.drawn.map((stage) => stage.name)).toEqual(["Replies", "Visits", "Clients"]);
  // 1,920 x 0.05, x 0.5, x 0.2 with the system; 240 x the same today.
  [96, 48, 9.6].forEach((count, i) => expect(funnel.drawn[i].after).toBeCloseTo(count, 6));
  [12, 6, 1.2].forEach((count, i) => expect(funnel.drawn[i].today).toBeCloseTo(count, 6));
  // 12 replies a year against 96: the two do not start level, so they are not drawn side by side.
  expect(funnel.pair).toBe(false);
});

it("draws no funnel where there is none to see", () => {
  // No stage names at all.
  expect(stages(roi, today)).toBeUndefined();
  // Two levels are a bar chart's work.
  const two: Roi = { ...intake, inputs: intake.inputs.map((input) => (input.id === "won" ? { ...input, stage: undefined } : input)) };
  expect(stages(two, plumbing)).toBeUndefined();
  // The viewer sets the system at nothing: a stage of zero has no width.
  expect(stages(intake, plumbing, 0)).toBeUndefined();
  // Nothing books today: the system's funnel is drawn alone, with today's zeros beside its counts.
  expect(stages(intake, { ...plumbing, visit: 0 })).toMatchObject({ pair: false, drawn: [{ after: 300 }, { today: 0, after: 60 }, { today: 0, after: 18 }] });
});

it("keeps a typed number within what the field allows", () => {
  const leads = roi.inputs[0];
  expect(clamp(leads, 50)).toBe(50);
  // No max given: ten times the starting value.
  expect(clamp(leads, 999)).toBe(400);
  expect(clamp(leads, -3)).toBe(0);
  expect(clamp(leads, Number.NaN)).toBe(0);
  // A share stops at 100.
  expect(clamp(roi.inputs[1], 250)).toBe(100);
  expect(clamp({ ...leads, min: 5, max: 60 }, 1)).toBe(5);
  expect(clamp({ ...leads, min: 5, max: 60 }, 61)).toBe(60);
  // A count that starts at nothing takes its ceiling from what the system reaches: ten times 120.
  expect(clamp({ ...leads, value: 0 }, 300, 120)).toBe(300);
  expect(clamp({ ...leads, value: 0 }, 5000, 120)).toBe(1200);
});

it("writes a number the way the demo's language does", () => {
  expect(shown(2160, "money", "USD", "en")).toBe("$2,160");
  // Dutch puts a space after the sign and a dot in the thousands.
  expect(shown(2160, "money", "EUR", "nl").replace(/\s/g, " ")).toBe("€ 2.160");
  expect(shown(30, "percent", "USD", "en")).toBe("30%");
  expect(shown(1500, undefined, "USD", "nl")).toBe("1.500");
  expect(shown(-3140, "money", "USD", "en")).toBe("-$3,140");
});

it("reads what was typed in a field, with the language's own decimal mark", () => {
  expect(typed("50")).toBe(50);
  expect(typed("1,500")).toBe(1500);
  expect(typed("2.5")).toBe(2.5);
  expect(typed("$50 ")).toBe(50);
  expect(typed("")).toBe(0);
  // Dutch: the comma is the decimal mark, the dot groups thousands.
  expect(typed("2,5", "nl")).toBe(2.5);
  expect(typed("1.500", "nl")).toBe(1500);
  // Not a number: the field's own limits decide.
  expect(typed("1.2.3")).toBeNaN();
});

it("puts a number in a field so that reading it back gives the same number", () => {
  expect(field(1500)).toBe("1500");
  expect(field(2.5)).toBe("2.5");
  expect(field(2.5, "nl")).toBe("2,5");
  expect(typed(field(2.5, "nl"), "nl")).toBe(2.5);
});

it("knows the sign a currency is written with", () => {
  expect(sign("USD")).toBe("$");
  expect(sign("EUR", "nl")).toBe("€");
});
