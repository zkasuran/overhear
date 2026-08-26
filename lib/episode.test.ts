import { test } from "node:test";
import assert from "node:assert/strict";
import { extractJson, parseEpisode } from "./episode";
import { buildTimeline } from "./audioEngine";

test("extractJson: plain object", () => {
  assert.deepEqual(extractJson('{"a":1}'), { a: 1 });
});

test("extractJson: fenced json block", () => {
  assert.deepEqual(extractJson('```json\n{"a":2}\n```'), { a: 2 });
});

test("extractJson: ignores trailing prose after the object (the real M3 bug)", () => {
  const raw = '{"title":"x","segments":[]}\n\nHope that helps!';
  assert.deepEqual(extractJson(raw), { title: "x", segments: [] });
});

test("extractJson: tolerates braces and quotes inside strings", () => {
  const raw = 'noise {"text":"a } and a \\" quote","n":1} tail';
  assert.deepEqual(extractJson(raw), { text: 'a } and a " quote', n: 1 });
});

test("extractJson: throws when there is no object", () => {
  assert.throws(() => extractJson("no json here"));
});

const good = JSON.stringify({
  title: "T",
  dek: "d",
  outline: ["a", "b"],
  segments: [
    { speaker: "host", emotion: "happy", text: "hi" },
    { speaker: "wizard", emotion: "smug", text: "yo" },
    { speaker: "expert", emotion: "calm", text: "" },
  ],
  music: { title: "M", prompt: "p", lyrics: "[Verse]\nla" },
});

test("parseEpisode: coerces bad speaker/emotion and drops empty lines", () => {
  const ep = parseEpisode(good);
  assert.equal(ep.segments.length, 2); // empty-text line dropped
  assert.equal(ep.segments[0].speaker, "host");
  assert.equal(ep.segments[1].speaker, "host"); // "wizard" -> host
  assert.equal(ep.segments[1].emotion, "auto"); // "smug" -> auto
  assert.equal(ep.music.title, "M");
});

test("parseEpisode: throws when there are no usable segments", () => {
  assert.throws(() => parseEpisode('{"title":"x","segments":[]}'));
});

test("buildTimeline: intro offset, spacing, and total", () => {
  const tl = buildTimeline([2, 3]);
  assert.equal(tl.starts[0], 6); // INTRO
  assert.ok(tl.starts[1] > tl.starts[0] + 2); // gap after first line
  assert.ok(tl.total > tl.bodyEnd); // outro tail
});
