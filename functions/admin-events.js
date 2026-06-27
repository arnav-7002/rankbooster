import { json, readJson, cleanId, supabaseRequest, upsertRows } from "./_shared.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const days = String(url.searchParams.get("days") || "7").toLowerCase();
  const limit = Math.max(1, Math.min(Number(url.searchParams.get("limit") || (days === "all" ? 1000 : 500)), 2000));
  const cutoff = days === "all" ? "" : Number(days);
  const filter = cutoff && Number.isFinite(cutoff)
    ? `&created_at=gte.${encodeURIComponent(new Date(Date.now() - cutoff * 86400000).toISOString())}`
    : "";
  const events = await supabaseRequest(
    env,
    `admin_events?select=*&order=created_at.desc&limit=${limit}${filter}`
  ).catch(() => []);
  return json({ events });
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const actor = body.actor || {};
  const type = String(body.type || "admin.event").slice(0, 80);
  const message = String(body.message || type).slice(0, 240);
  const id = cleanId(`evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
  const event = {
    id,
    actor_user_id: cleanId(actor.id || actor.offlineId || ""),
    event_type: type,
    entity_type: String(body.entityType || type.split(".")[0] || "admin").slice(0, 80),
    entity_id: cleanId(body.entityId || body.metadata?.courseId || body.metadata?.testId || body.metadata?.planId || ""),
    payload_json: { message, actor_email: String(actor.email || "").toLowerCase(), metadata: body.metadata || {} },
    created_at: new Date().toISOString(),
  };
  const saved = await upsertRows(env, "admin_events", event);
  return json({ success: true, event: saved?.[0] || event });
}
