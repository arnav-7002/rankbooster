import { json, readJson, saveUser, userIdFrom, supabaseRequest, upsertRows, eq } from "./_shared.js";
export async function onRequestOptions() { return json({ ok: true }); }
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const userId = userIdFrom({ offlineId: url.searchParams.get("offlineId"), email: url.searchParams.get("email") });
  const rows = userId ? await supabaseRequest(env, `user_blobs?select=value_json&user_id=${eq(userId)}&blob_key=${eq("notebooks")}&limit=1`).catch(() => []) : [];
  return json({ user: null, notebooks: rows[0]?.value_json || [] });
}
export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const user = await saveUser(env, body.user || {});
  const notebooks = Array.isArray(body.notebooks) ? body.notebooks : [];
  await upsertRows(env, "user_blobs", { user_id: user.id, blob_key: "notebooks", value_json: notebooks, updated_at: new Date().toISOString() }, "user_id,blob_key");
  return json({ success: true, user, notebooks });
}