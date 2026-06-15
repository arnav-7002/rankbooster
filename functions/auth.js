import { json, readJson, saveUser, userIdFrom, supabaseRequest, eq } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

const ADMIN_EMAIL = "admin@rankbooster.com";
const ADMIN_PASSWORD = "Admin@123";

function withCookie(data, userId, status = 200) {
  const res = json(data, status);
  res.headers.append("set-cookie", `rb_user=${encodeURIComponent(userId || "")}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
  return res;
}

function clearCookie(data = { success: true }) {
  const res = json(data);
  res.headers.append("set-cookie", "rb_user=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  return res;
}

function cookieValue(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const part = cookie.split(";").map(v => v.trim()).find(v => v.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : "";
}

async function loadProfile(env, userId) {
  const rows = await supabaseRequest(env, `user_blobs?select=value_json&user_id=${eq(userId)}&blob_key=${eq("profile")}&limit=1`).catch(() => []);
  return rows[0]?.value_json || {};
}

function publicUser(row, profile = {}) {
  if (!row) return null;
  return {
    id: row.id,
    offlineId: row.id,
    email: row.email,
    name: row.display_name,
    role: row.role || "user",
    avatar: row.avatar_initials || String(row.display_name || row.email || "U").slice(0, 2).toUpperCase(),
    joinedAt: row.created_at ? new Date(row.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "",
    pass: profile.pass || null,
  };
}

async function userById(env, userId) {
  const rows = userId ? await supabaseRequest(env, `users?select=*&id=${eq(userId)}&limit=1`).catch(() => []) : [];
  const row = rows?.[0];
  if (!row) return null;
  const profile = await loadProfile(env, userId);
  return { row, profile };
}

async function ensureAdmin(env) {
  return saveUser(env, {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    name: "Admin",
    role: "admin",
    avatar: "AD",
  });
}

export async function onRequestGet({ request, env }) {
  const userId = cookieValue(request, "rb_user");
  const loaded = await userById(env, userId);
  if (!loaded) return json({ success: false, user: null }, 401);
  return json({
    success: true,
    user: publicUser(loaded.row, loaded.profile),
    coursesOpted: loaded.profile.coursesOpted || [],
    pass: loaded.profile.pass || null,
  });
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const action = String(body.action || "login").toLowerCase();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const name = String(body.name || "").trim();

  if (!email || !password) return json({ success: false, error: "Email and password required." }, 400);

  if (action === "signup") {
    const existing = await supabaseRequest(env, `users?select=id&email=${eq(email)}&limit=1`);
    if (existing?.length) return json({ success: false, error: "Email already registered." }, 409);
    const user = await saveUser(env, {
      email,
      password,
      name: name || email.split("@")[0],
      role: "user",
      avatar: (name || email).split(/\s+|@/).filter(Boolean).map(part => part[0]).join("").toUpperCase().slice(0, 2),
    });
    return withCookie({ success: true, user }, user.id);
  }

  const rows = await supabaseRequest(env, `users?select=*&email=${eq(email)}&limit=1`);
  let row = rows?.[0];
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD && (!row || String(row.password_hash || "") !== password || row.role !== "admin")) {
    const admin = await ensureAdmin(env);
    const repaired = await supabaseRequest(env, `users?select=*&id=${eq(admin.id)}&limit=1`);
    row = repaired?.[0];
  }
  if (!row || String(row.password_hash || "") !== password) {
    return json({ success: false, error: "Invalid email or password." }, 401);
  }
  const profile = await loadProfile(env, row.id || userIdFrom({ email }));
  return withCookie({ success: true, user: publicUser(row, profile), coursesOpted: profile.coursesOpted || [], pass: profile.pass || null }, row.id);
}

export async function onRequestDelete() {
  return clearCookie();
}
