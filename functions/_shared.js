export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "access-control-allow-headers": "content-type",
      ...headers,
    },
  });
}

export async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}

export function cleanId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

export function accountIdFromEmail(email) {
  const slug = String(email || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 64);
  return slug ? cleanId(`acct_${slug}`) : "";
}

export function userIdFrom(userOrId) {
  if (typeof userOrId === "string") return cleanId(userOrId);
  const user = userOrId || {};
  return accountIdFromEmail(user.email) || cleanId(user.offlineId || user.id || "");
}

export function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || `item_${Date.now()}`;
}

export function parseJson(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

function supabaseConfig(env) {
  const url = String(env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return { url, key };
}

export async function supabaseRequest(env, path, options = {}) {
  const { url, key } = supabaseConfig(env);
  const headers = {
    apikey: key,
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
    ...(options.headers || {}),
  };
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const message = data?.message || data?.hint || data?.details || text || `Supabase ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export function eq(value) {
  return `eq.${encodeURIComponent(String(value || ""))}`;
}

export async function upsertRows(env, table, rows, onConflict = "id") {
  const body = Array.isArray(rows) ? rows : [rows];
  return supabaseRequest(env, `${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST",
    body,
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
  });
}

export async function patchRows(env, table, filter, patch) {
  return supabaseRequest(env, `${table}?${filter}`, {
    method: "PATCH",
    body: patch,
    headers: { Prefer: "return=minimal" },
  });
}

export async function saveUser(env, rawUser = {}, extra = {}) {
  const id = userIdFrom(rawUser) || cleanId(crypto.randomUUID());
  const previousId = cleanId(rawUser.previousOfflineId || rawUser.offlineId || rawUser.id || "");
  const email = String(rawUser.email || `${id}@rankbooster.local`).toLowerCase();
  const name = rawUser.name || rawUser.displayName || rawUser.display_name || "Student";
  const role = rawUser.role || "user";
  const avatar = rawUser.avatar || rawUser.avatar_initials || "";
  const passwordHash = rawUser.password_hash || rawUser.password || "local-only";
  await upsertRows(env, "users", {
    id, email, password_hash: passwordHash, display_name: name, role, avatar_initials: avatar, updated_at: new Date().toISOString(),
  });
  if (previousId && previousId !== id) {
    await patchRows(env, "attempts", `user_id=${eq(previousId)}`, { user_id: id }).catch(() => null);
    await patchRows(env, "enrollments", `user_id=${eq(previousId)}`, { user_id: id }).catch(() => null);
    await patchRows(env, "notebooks", `user_id=${eq(previousId)}`, { user_id: id }).catch(() => null);
    await patchRows(env, "notebook_questions", `user_id=${eq(previousId)}`, { user_id: id }).catch(() => null);
    await patchRows(env, "user_blobs", `user_id=${eq(previousId)}`, { user_id: id }).catch(() => null);
  }
  if (Object.keys(extra).length) {
    await upsertRows(env, "user_blobs", { user_id: id, blob_key: "profile", value_json: extra, updated_at: new Date().toISOString() }, "user_id,blob_key");
  }
  return { ...rawUser, id, offlineId: id, email, name, role, avatar };
}

export async function staticJson(request, parts, fallback = null) {
  const path = "/" + parts.map(part => encodeURIComponent(String(part || ""))).join("/");
  const res = await fetch(new URL(path, request.url));
  if (!res.ok) {
    if (fallback !== null) return fallback;
    throw new Error(`Static JSON not found: ${path}`);
  }
  return res.json();
}
