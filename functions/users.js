import { client, json, readJson, saveUser } from "./_shared.js";
export async function onRequestOptions() { return json({ ok: true }); }
export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const db = client(env);
  const user = await saveUser(db, body.user || body, { coursesOpted: body.coursesOpted || [] });
  return json({ success: true, user });
}
