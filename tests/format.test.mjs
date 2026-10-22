// Run: node --test tests/format.test.mjs
// esc() in format.js, the only escaping function (06 section 7; section 12, P1-13 item 5).
import test from "node:test";
import assert from "node:assert/strict";
import { esc } from "../format.js";

test("esc escapes the five HTML characters (P1-13 item 5)", () => {
  assert.equal(esc('<a href="x">&\''), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;");
});

test("esc turns null into empty text, and numbers and plain text into the same text", () => {
  // No assertion on undefined: it keeps String()'s result, as before format.js.
  assert.equal(esc(null), "");
  assert.equal(esc(2025), "2025");
  assert.equal(esc(0), "0");
  assert.equal(esc(""), "");
  assert.equal(esc("Lone Tree <A"), "Lone Tree &lt;A");
  assert.equal(esc("North Flat"), "North Flat");
});
