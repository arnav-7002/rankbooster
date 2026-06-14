import { json, staticJson } from "./_shared.js";
export async function onRequestOptions() { return json({ ok: true }); }
export async function onRequestGet({ request }) {
  const data = await staticJson(request, ["data", "library.json"], { courses: [] });
  return json(data);
}
