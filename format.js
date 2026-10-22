// HTML escaping for the ranch operations dashboard (docs/audit/06-phase1-spec.md section 7, "Safe rendering").
// Pure: no DOM, no fetch, no clock, so the page (app.js) and the node:test suite load the same code. Phase 1 adds its
// fixed en-US formatters here in a later step (06 section 2.2); for now esc() is the only export.

// CSV text is data, not markup: escape it before it goes into innerHTML, insertAdjacentHTML or a double-quoted
// attribute written as markup. It is the only escaping function. null becomes "" (06 section 7); any other value,
// undefined included, goes through String() as it did when esc() lived in app.js.
export const esc = (s) => (s === null ? "" : String(s)).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
