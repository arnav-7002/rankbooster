import { json, readJson, cleanId, supabaseRequest, upsertRows, eq } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

const TABLES = [
  "users",
  "courses",
  "tests",
  "pass_plans",
  "subscriptions",
  "payment_orders",
  "enrollments",
  "attempts",
  "attempt_resumes",
  "notebooks",
  "notebook_questions",
  "user_blobs",
  "admin_events",
  "app_settings",
];

const CONFLICT_KEYS = {
  user_blobs: "user_id,blob_key",
  app_settings: "key",
};

const DELETE_FILTERS = {
  users: "id=neq.__rankbooster_never__",
  courses: "id=neq.__rankbooster_never__",
  tests: "id=neq.__rankbooster_never__",
  pass_plans: "id=neq.__rankbooster_never__",
  subscriptions: "id=neq.__rankbooster_never__",
  payment_orders: "id=neq.__rankbooster_never__",
  enrollments: "id=neq.__rankbooster_never__",
  attempts: "id=neq.__rankbooster_never__",
  attempt_resumes: "id=neq.__rankbooster_never__",
  notebooks: "id=neq.__rankbooster_never__",
  notebook_questions: "id=neq.__rankbooster_never__",
  user_blobs: "user_id=neq.__rankbooster_never__",
  admin_events: "id=neq.__rankbooster_never__",
  app_settings: "key=neq.__rankbooster_never__",
};

function cookieValue(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const part = cookie.split(";").map(v => v.trim()).find(v => v.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : "";
}

async function requireAdmin(request, env, actor = {}) {
  const userId = cleanId(actor.id || actor.offlineId || cookieValue(request, "rb_user"));
  if (!userId) return null;
  const rows = await supabaseRequest(env, `users?select=id,email,role&id=${eq(userId)}&limit=1`).catch(() => []);
  const user = rows?.[0];
  return user?.role === "admin" ? user : null;
}

async function logEvent(env, actor, type, message, metadata = {}) {
  await upsertRows(env, "admin_events", {
    id: cleanId(`evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
    actor_user_id: cleanId(actor?.id || actor?.offlineId || ""),
    event_type: type,
    entity_type: "backup",
    entity_id: "",
    payload_json: { message, actor_email: String(actor?.email || "").toLowerCase(), metadata },
    created_at: new Date().toISOString(),
  }).catch(() => null);
}

async function readTable(env, table) {
  const out = [];
  const pageSize = 1000;
  for (let offset = 0; offset < 1000000; offset += pageSize) {
    const rows = await supabaseRequest(env, `${table}?select=*&limit=${pageSize}&offset=${offset}`).catch(() => []);
    if (!Array.isArray(rows) || rows.length === 0) break;
    out.push(...rows);
    if (rows.length < pageSize) break;
  }
  return out;
}

async function deleteTable(env, table) {
  const filter = DELETE_FILTERS[table];
  if (!filter) return;
  await supabaseRequest(env, `${table}?${filter}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  }).catch(() => null);
}

async function upsertTable(env, table, rows = []) {
  if (!Array.isArray(rows) || rows.length === 0) return 0;
  let count = 0;
  const conflict = CONFLICT_KEYS[table] || "id";
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    await upsertRows(env, table, chunk, conflict);
    count += chunk.length;
  }
  return count;
}

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: "Admin access required." }, 403);
  const tables = {};
  const counts = {};
  for (const table of TABLES) {
    tables[table] = await readTable(env, table);
    counts[table] = tables[table].length;
  }
  await logEvent(env, admin, "backup.downloaded", "Downloaded full database backup", { counts });
  return json({
    format: "rankbooster.supabase.backup.v1",
    exportedAt: new Date().toISOString(),
    tables,
    counts,
  });
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const admin = await requireAdmin(request, env, body.actor || {});
  if (!admin) return json({ error: "Admin access required." }, 403);
  const backup = body.backup || {};
  if (backup.format !== "rankbooster.supabase.backup.v1" || !backup.tables) {
    return json({ error: "Invalid RankBooster backup file." }, 400);
  }

  if (body.wipeFirst) {
    for (const table of [...TABLES].reverse()) await deleteTable(env, table);
  }

  const restored = {};
  for (const table of TABLES) {
    restored[table] = await upsertTable(env, table, backup.tables[table] || []);
  }
  await logEvent(env, admin, "backup.restored", "Restored database backup", { restored, wipeFirst: !!body.wipeFirst, exportedAt: backup.exportedAt || "" });
  return json({ success: true, restored });
}
