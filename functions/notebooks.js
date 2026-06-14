import { client, json, readJson, saveUser, cleanId } from "./_shared.js";
export async function onRequestOptions() { return json({ ok: true }); }
export async function onRequestGet({ request, env }) {
  const db = client(env);
  const url = new URL(request.url);
  const userId = cleanId(url.searchParams.get("offlineId"));
  const row = await db.execute({ sql: "SELECT value_json FROM user_blobs WHERE user_id=? AND blob_key='notebooks'", args: [userId] });
  const notebooks = row.rows[0] ? JSON.parse(row.rows[0].value_json || "[]") : [];
  return json({ user: null, notebooks });
}
export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const db = client(env);
  const user = await saveUser(db, body.user || {});
  const notebooks = Array.isArray(body.notebooks) ? body.notebooks : [];
  await db.execute({
    sql: `INSERT INTO user_blobs (user_id, blob_key, value_json, updated_at)
          VALUES (?, 'notebooks', ?, CURRENT_TIMESTAMP)
          ON CONFLICT(user_id, blob_key) DO UPDATE SET value_json=excluded.value_json, updated_at=CURRENT_TIMESTAMP`,
    args: [user.id, JSON.stringify(notebooks)],
  });
  return json({ success: true, user, notebooks });
}
