import { createClient } from "@libsql/client/web";

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

export async function readJson(request) {
  try { return await request.json(); } catch { return {}; }
}

export function client(env) {
  if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
    throw new Error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN");
  }
  return createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });
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
export async function saveUser(db, rawUser = {}, extra = {}) {
  const id = userIdFrom(rawUser) || cleanId(crypto.randomUUID());
  const previousId = cleanId(rawUser.offlineId || rawUser.id || "");
  const email = String(rawUser.email || `${id}@rankbooster.local`).toLowerCase();
  const name = rawUser.name || rawUser.displayName || rawUser.display_name || "Student";
  const role = rawUser.role || "user";
  const avatar = rawUser.avatar || rawUser.avatar_initials || "";
  const passwordHash = rawUser.password_hash || rawUser.password || "local-only";
  await db.execute({
    sql: `INSERT INTO users (id,email,password_hash,display_name,role,avatar_initials,updated_at)
          VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET email=excluded.email, display_name=excluded.display_name, role=excluded.role, avatar_initials=excluded.avatar_initials, updated_at=CURRENT_TIMESTAMP`,
    args: [id, email, passwordHash, name, role, avatar],
  });
  if (previousId && previousId !== id) {
    await db.execute({ sql: "UPDATE attempts SET user_id=? WHERE user_id=?", args: [id, previousId] });
    await db.execute({ sql: "UPDATE notebooks SET user_id=? WHERE user_id=?", args: [id, previousId] }).catch(() => null);
    await db.execute({ sql: "UPDATE notebook_questions SET user_id=? WHERE user_id=?", args: [id, previousId] }).catch(() => null);
    await db.execute({ sql: "UPDATE user_blobs SET user_id=? WHERE user_id=?", args: [id, previousId] }).catch(() => null);
  }
  if (Object.keys(extra).length) {
    await db.execute({
      sql: `INSERT INTO user_blobs (user_id, blob_key, value_json, updated_at)
            VALUES (?, 'profile', ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, blob_key) DO UPDATE SET value_json=excluded.value_json, updated_at=CURRENT_TIMESTAMP`,
      args: [id, JSON.stringify(extra)],
    });
  }
  return { ...rawUser, id, offlineId: rawUser.offlineId || id, email, name, role, avatar };
}
