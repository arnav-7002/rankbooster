import { json, readJson, saveUser, userIdFrom, supabaseRequest, eq, patchRows, upsertRows, cleanId } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

const ADMIN_EMAIL = "admin@rankbooster.com";
const ADMIN_PASSWORD = "Admin@123";

function makeSessionToken() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}_${Math.random().toString(36).slice(2)}`;
}

function requestLoginMeta(request) {
  const h = request?.headers;
  return {
    loginAt: new Date().toISOString(),
    userAgent: h?.get("user-agent") || "",
    ip: h?.get("cf-connecting-ip") || (h?.get("x-forwarded-for") || "").split(",")[0].trim(),
    country: h?.get("cf-ipcountry") || "",
    ray: h?.get("cf-ray") || "",
    platform: h?.get("sec-ch-ua-platform") || "",
    mobile: h?.get("sec-ch-ua-mobile") || "",
  };
}

async function saveSession(env, userId, request, reason = "login") {
  const token = makeSessionToken();
  const meta = requestLoginMeta(request);
  await upsertRows(env, "user_blobs", {
    user_id: userId,
    blob_key: "session",
    value_json: { token, updatedAt: new Date().toISOString(), reason, ...meta },
    updated_at: new Date().toISOString(),
  }, "user_id,blob_key");
  return { token, meta };
}

async function loadSession(env, userId) {
  const rows = await supabaseRequest(env, `user_blobs?select=value_json&user_id=${eq(userId)}&blob_key=${eq("session")}&limit=1`).catch(() => []);
  return rows[0]?.value_json?.token || "";
}

function withCookie(data, userId, sessionToken, status = 200) {
  const res = json(data, status);
  res.headers.append("set-cookie", `rb_user=${encodeURIComponent(userId || "")}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
  if (sessionToken) res.headers.append("set-cookie", `rb_session=${encodeURIComponent(sessionToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`);
  return res;
}

function clearCookie(data = { success: true }) {
  const res = json(data);
  res.headers.append("set-cookie", "rb_user=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  res.headers.append("set-cookie", "rb_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
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

async function logEvent(env, type, message, actor = {}, metadata = {}) {
  await upsertRows(env, "admin_events", {
    id: cleanId(`evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
    actor_user_id: actor.id || "",
    event_type: type,
    entity_type: "user",
    entity_id: actor.id || "",
    payload_json: { message, actor_email: actor.email || "", metadata },
    created_at: new Date().toISOString(),
  }).catch(() => null);
}

export async function onRequestGet({ request, env }) {
  const userId = cookieValue(request, "rb_user");
  const sessionToken = cookieValue(request, "rb_session");
  const loaded = await userById(env, userId);
  if (!loaded) return json({ success: false, user: null }, 401);
  const activeSession = await loadSession(env, userId);
  if (activeSession && activeSession !== sessionToken) {
    const res = clearCookie({ success: false, user: null, error: "This account was opened on another device." });
    return new Response(res.body, { status: 409, headers: res.headers });
  }
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
    const existing = await supabaseRequest(env, `users?select=*&email=${eq(email)}&limit=1`);
    if (existing?.length) {
      const existingRow = existing[0];
      if (String(existingRow.password_hash || "") !== "local-only") return json({ success: false, error: "Email already registered." }, 409);
      const displayName = name || existingRow.display_name || email.split("@")[0];
      await patchRows(env, "users", `id=${eq(existingRow.id)}`, {
        password_hash: password,
        display_name: displayName,
        avatar_initials: (displayName || email).split(/\s+|@/).filter(Boolean).map(part => part[0]).join("").toUpperCase().slice(0, 2),
        updated_at: new Date().toISOString(),
      });
      const repaired = await supabaseRequest(env, `users?select=*&id=${eq(existingRow.id)}&limit=1`);
      const row = repaired?.[0] || existingRow;
      const profile = await loadProfile(env, row.id);
      const session = await saveSession(env, row.id, request, "signup_repair");
      await logEvent(env, "user.signup", `${displayName} signed up`, { id: row.id, email: row.email }, { repaired: true, login: session.meta });
      return withCookie({ success: true, user: publicUser(row, profile), coursesOpted: profile.coursesOpted || [], pass: profile.pass || null }, row.id, session.token);
    }
    const user = await saveUser(env, {
      email,
      password,
      name: name || email.split("@")[0],
      role: "user",
      avatar: (name || email).split(/\s+|@/).filter(Boolean).map(part => part[0]).join("").toUpperCase().slice(0, 2),
    });
    const session = await saveSession(env, user.id, request, "signup");
    await logEvent(env, "user.signup", `${user.name || user.email} signed up`, user, { login: session.meta });
    return withCookie({ success: true, user }, user.id, session.token);
  }

  const rows = await supabaseRequest(env, `users?select=*&email=${eq(email)}&limit=1`);
  let row = rows?.[0];
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD && (!row || String(row.password_hash || "") !== password || row.role !== "admin")) {
    const admin = await ensureAdmin(env);
    const repaired = await supabaseRequest(env, `users?select=*&id=${eq(admin.id)}&limit=1`);
    row = repaired?.[0];
  }
  if (row && String(row.password_hash || "") === "local-only") {
    await patchRows(env, "users", `id=${eq(row.id)}`, { password_hash: password, updated_at: new Date().toISOString() });
    const repaired = await supabaseRequest(env, `users?select=*&id=${eq(row.id)}&limit=1`);
    row = repaired?.[0] || { ...row, password_hash: password };
  }
  if (!row || String(row.password_hash || "") !== password) {
    return json({ success: false, error: "Invalid email or password." }, 401);
  }
  const profile = await loadProfile(env, row.id || userIdFrom({ email }));
  const session = await saveSession(env, row.id, request, "login");
  await logEvent(env, "user.login", `${row.email} logged in`, { id: row.id, email: row.email }, { login: session.meta });
  return withCookie({ success: true, user: publicUser(row, profile), coursesOpted: profile.coursesOpted || [], pass: profile.pass || null }, row.id, session.token);
}

export async function onRequestDelete() {
  return clearCookie();
}
