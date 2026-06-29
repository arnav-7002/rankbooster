import { json, readJson, cleanId, supabaseRequest, upsertRows, eq } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

function normalizeItem(raw = {}) {
  const id = cleanId(raw.id || `chg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  return {
    id,
    version: String(raw.version || "").trim(),
    title: String(raw.title || "Website update").trim(),
    body: String(raw.body || "").trim(),
    published: raw.published !== false,
    createdAt: raw.createdAt || new Date().toISOString(),
  };
}

async function loadItems(env) {
  const rows = await supabaseRequest(env, `app_settings?select=value_json&key=${eq("changelog")}&limit=1`).catch(() => []);
  const items = Array.isArray(rows?.[0]?.value_json?.items) ? rows[0].value_json.items : [];
  return items.map(normalizeItem).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function saveItems(env, items) {
  await upsertRows(env, "app_settings", {
    key: "changelog",
    value_json: { items },
    updated_at: new Date().toISOString(),
  }, "key");
}

async function logEvent(env, actor, type, message, metadata = {}) {
  await upsertRows(env, "admin_events", {
    id: cleanId(`evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
    actor_user_id: cleanId(actor?.id || actor?.offlineId || ""),
    event_type: type,
    entity_type: "changelog",
    entity_id: cleanId(metadata.id || ""),
    payload_json: { message, actor_email: String(actor?.email || "").toLowerCase(), metadata },
    created_at: new Date().toISOString(),
  }).catch(() => null);
}

export async function onRequestGet({ env }) {
  const items = await loadItems(env);
  return json({ success: true, items });
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const actor = body.actor || {};
  const item = normalizeItem(body.item || body);
  if (!item.title) return json({ error: "Title is required." }, 400);
  const items = await loadItems(env);
  const next = [item, ...items.filter(i => i.id !== item.id)].slice(0, 80);
  await saveItems(env, next);
  await logEvent(env, actor, "changelog.updated", `Updated changelog: ${item.title}`, { id: item.id, title: item.title });
  return json({ success: true, item, items: next });
}

export async function onRequestDelete({ request, env }) {
  const body = await readJson(request);
  const id = cleanId(body.id);
  if (!id) return json({ error: "id required" }, 400);
  const items = await loadItems(env);
  const next = items.filter(i => i.id !== id);
  await saveItems(env, next);
  await logEvent(env, body.actor || {}, "changelog.deleted", "Deleted changelog item", { id });
  return json({ success: true, items: next });
}
