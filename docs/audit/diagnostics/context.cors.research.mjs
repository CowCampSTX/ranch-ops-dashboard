// CORS / browser-fetch probe for candidate public context sources (research-context worker).
// Run from the repo root on a machine with open internet:  node docs/audit/diagnostics/context.cors.research.mjs
//
// A static GitHub Pages site can only fetch a third-party endpoint from the browser if the response carries an
// Access-Control-Allow-Origin header that matches the page origin (or "*"). POST requests with a JSON body also need
// a successful OPTIONS preflight. This script sends each request with an Origin header that looks like a GitHub Pages
// site and prints the status, the CORS headers and the content type. It reads nothing from the repo and writes no files.
//
// What it cannot tell you: whether a browser will let the page set a User-Agent header (api.weather.gov asks for one;
// browsers send their own), or whether the service's terms allow the use. Those are documented in the audit notes.
//
// Observed in the audit sandbox (2026-10-16): every request failed before reaching the host. Plain `node` printed
// "FETCH FAILED: ENOTFOUND" for all ten probes (no direct DNS); with NODE_USE_ENV_PROXY=1 all ten failed through the
// egress proxy, and curl to the same hosts reported "CONNECT tunnel failed, response 403". So NO CORS header was
// observed in the audit; run this elsewhere before relying on browser-side fetching.

const ORIGIN = "https://example.github.io";
const UA = "(ranch-ops-dashboard CORS probe, https://github.com/CowCampSTX/ranch-ops-dashboard)";
const lat = 44.3683, lon = -100.351; // Pierre, SD: an arbitrary Great Plains point, not the fictional ranch

const probes = [
  { name: "USDM data services, county % area (CSV)", url: "https://usdmdataservices.unl.edu/api/CountyStatistics/GetDroughtSeverityStatisticsByAreaPercent?aoi=46065&startdate=9/1/2026&enddate=10/15/2026&statisticsType=1" },
  { name: "USDM data services, county % area (JSON)", url: "https://usdmdataservices.unl.edu/api/CountyStatistics/GetDroughtSeverityStatisticsByAreaPercent?aoi=46065&startdate=9/1/2026&enddate=10/15/2026&statisticsType=1", headers: { Accept: "application/json" } },
  { name: "USDM current (ArcGIS FeatureServer)", url: "https://services5.arcgis.com/0OTVzJS4K09zlixn/ArcGIS/rest/services/USDM_current/FeatureServer/0/query?where=1%3D1&outFields=DM,MapDate,ReleaseDate,ValidStart,ValidEnd&returnGeometry=false&f=json" },
  { name: "IEM USDM GeoJSON", url: "https://mesonet.agron.iastate.edu/geojson/usdm.py" },
  { name: "NWS points", url: `https://api.weather.gov/points/${lat},${lon}`, headers: { "User-Agent": UA } },
  { name: "NWS active alerts, SD", url: "https://api.weather.gov/alerts/active?area=SD", headers: { "User-Agent": UA } },
  { name: "RAP productionV3 (preflight only)", url: "https://us-central1-rap-data-365417.cloudfunctions.net/productionV3", preflight: "POST" },
  { name: "NRCS Soil Data Access (preflight only)", url: "https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest", preflight: "POST" },
  { name: "NASS Quick Stats (no key; expect 401/403)", url: "https://quickstats.nass.usda.gov/api/api_GET/?format=JSON" },
  { name: "Grass-Cast county averages CSV", url: "https://grasscast.unl.edu/docs/ANPP_county_stats_1981-2018.csv" },
];

const cors = (h) => ["access-control-allow-origin", "access-control-allow-methods", "access-control-allow-headers", "content-type", "last-modified", "cache-control"]
  .map((k) => `${k}=${h.get(k) ?? "-"}`).join("  ");

for (const p of probes) {
  try {
    const res = p.preflight
      ? await fetch(p.url, { method: "OPTIONS", headers: { Origin: ORIGIN, "Access-Control-Request-Method": p.preflight, "Access-Control-Request-Headers": "content-type" }, signal: AbortSignal.timeout(20000) })
      : await fetch(p.url, { headers: { Origin: ORIGIN, ...(p.headers ?? {}) }, signal: AbortSignal.timeout(20000) });
    const allow = res.headers.get("access-control-allow-origin");
    const verdict = allow === "*" || allow === ORIGIN ? "BROWSER-OK" : "NO-CORS (needs build-time fetch)";
    console.log(`${p.name}\n  ${res.status} ${verdict}\n  ${cors(res.headers)}`);
    if (!p.preflight) console.log(`  body starts: ${(await res.text()).slice(0, 160).replace(/\s+/g, " ")}`);
  } catch (e) {
    console.log(`${p.name}\n  FETCH FAILED: ${e.cause?.code ?? e.cause?.message ?? e.message}`);
  }
}
