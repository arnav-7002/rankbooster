import { json, readJson, cleanId, supabaseRequest, upsertRows, eq } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

async function loadNotes(env, userId) {
  const rows = await supabaseRequest(env, `user_blobs?select=value_json&user_id=${eq(userId)}&blob_key=${eq("admin_notes")}&limit=1`).catch(() => []);
  return Array.isArray(rows?.[0]?.value_json?.notes) ? rows[0].value_json.notes : [];
}

async function saveNotes(env, userId, notes) {
  await upsertRows(env, "user_blobs", {
    user_id: userId,
    blob_key: "admin_notes",
    value_json: { notes },
    updated_at: new Date().toISOString(),
  }, "user_id,blob_key");
}

async function logEvent(env, actor, type, message, metadata = {}) {
  await upsertRows(env, "admin_events", {
    id: cleanId(`evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
    actor_user_id: cleanId(actor?.id || actor?.offlineId || ""),
    event_type: type,
    entity_type: "user",
    entity_id: cleanId(metadata.userId || ""),
    payload_json: { message, actor_email: String(actor?.email || "").toLowerCase(), metadata },
    created_at: new Date().toISOString(),
  }).catch(() => null);
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const userId = cleanId(url.searchParams.get("userId"));
  if (!userId) return json({ error: "userId required" }, 400);
  const notes = await loadNotes(env, userId);
  return json({ success: true, notes });
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const userId = cleanId(body.userId);
  const text = String(body.text || "").trim();
  if (!userId) return json({ error: "userId required" }, 400);
  if (!text) return json({ error: "Note text required." }, 400);
  const note = {
    id: cleanId(`note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`),
    text,
    createdAt: new Date().toISOString(),
    actorEmail: String(body.actor?.email || "").toLowerCase(),
  };
  const notes = [note, ...(await loadNotes(env, userId))].slice(0, 100);
  await saveNotes(env, userId, notes);
  await logEvent(env, body.actor || {}, "user.note_added", "Added admin note", { userId, noteId: note.id });
  return json({ success: true, note, notes });
}

export async function onRequestDelete({ request, env }) {
  const body = await readJson(request);
  const userId = cleanId(body.userId);
  const noteId = cleanId(body.noteId);
  if (!userId || !noteId) return json({ error: "userId and noteId required" }, 400);
  const notes = (await loadNotes(env, userId)).filter(note => cleanId(note.id) !== noteId);
  await saveNotes(env, userId, notes);
  await logEvent(env, body.actor || {}, "user.note_deleted", "Deleted admin note", { userId, noteId });
  return json({ success: true, notes });
}
