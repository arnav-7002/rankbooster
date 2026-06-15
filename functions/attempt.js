import { json, userIdFrom, cleanId, supabaseRequest, eq } from "./_shared.js";
export async function onRequestOptions() { return json({ ok: true }); }
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const userId = userIdFrom({ offlineId: url.searchParams.get("offlineId"), email: url.searchParams.get("email") });
  const attemptId = cleanId(url.searchParams.get("attemptId"));
  const rows = userId && attemptId ? await supabaseRequest(env, `attempts?select=detail_json&user_id=${eq(userId)}&id=${eq(attemptId)}&limit=1`).catch(() => []) : [];
  return json({ attempt: rows[0]?.detail_json || null });
}