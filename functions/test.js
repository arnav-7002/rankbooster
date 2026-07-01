import { json, staticJson } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const sourceUrl = url.searchParams.get("sourceUrl") || url.searchParams.get("url");
  if (sourceUrl) {
    const res = await fetch(sourceUrl, {
      headers: { accept: "application/json", "cache-control": "no-cache" },
      cf: { cacheTtl: 0, cacheEverything: false },
    });
    if (!res.ok) return json({ error: `Could not fetch source test (${res.status})` }, 502);
    const test = await res.json();
    return json({ test: { ...test, sourceUrl } }, 200, {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    });
  }
  const course = url.searchParams.get("course") || url.searchParams.get("courseTitle") || url.searchParams.get("courseName");
  const folder = url.searchParams.get("folder") || url.searchParams.get("folderName");
  const zip = url.searchParams.get("zip") || url.searchParams.get("zipName");
  const base = String(zip || "").replace(/\.zip$/i, "");
  const test = await staticJson(request, ["data", "courses", course, folder, `${base}.rbtest.json`]);
  return json({ test: { ...test, sourceZip: zip, sourceFolder: folder, folder } });
}
