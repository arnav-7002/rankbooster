import { client, json, cleanId } from "./_shared.js";
export async function onRequestOptions() { return json({ ok: true }); }
export async function onRequestGet({ request, env }) {
  const db = client(env);
  const url = new URL(request.url);
  const userId = cleanId(url.searchParams.get("offlineId"));
  const attemptId = cleanId(url.searchParams.get("attemptId"));
  const row = await db.execute({ sql: "SELECT detail_json FROM attempts WHERE user_id=? AND id=?", args: [userId, attemptId] });
  const attempt = row.rows[0] ? JSON.parse(row.rows[0].detail_json || "{}") : null;
  return json({ attempt });
}
