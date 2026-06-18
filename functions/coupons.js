import { json, readJson, cleanId, userIdFrom, supabaseRequest, upsertRows, eq } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 32);
}

async function loadCoupons(env) {
  const rows = await supabaseRequest(env, `app_settings?select=value_json&key=${eq("coupons")}&limit=1`).catch(() => []);
  return Array.isArray(rows?.[0]?.value_json?.items) ? rows[0].value_json.items : [];
}

async function saveCoupons(env, items) {
  await upsertRows(env, "app_settings", {
    key: "coupons",
    value_json: { items },
    updated_at: new Date().toISOString(),
  }, "key");
}

async function loadCouponOrders(env) {
  const rows = await supabaseRequest(env, "payment_orders?select=id,user_id,status,payload_json,created_at&status=eq.approved&order=created_at.desc").catch(() => []);
  return (rows || []).filter(row => row.payload_json?.method === "coupon");
}

async function loadProfile(env, userId) {
  const rows = await supabaseRequest(env, `user_blobs?select=value_json&user_id=${eq(userId)}&blob_key=${eq("profile")}&limit=1`).catch(() => []);
  return rows?.[0]?.value_json || {};
}

async function saveProfile(env, userId, profile) {
  await upsertRows(env, "user_blobs", {
    user_id: userId,
    blob_key: "profile",
    value_json: profile,
    updated_at: new Date().toISOString(),
  }, "user_id,blob_key");
}

async function logEvent(env, actor, type, message, metadata = {}) {
  await upsertRows(env, "admin_events", {
    id: cleanId(`evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
    actor_user_id: cleanId(actor?.id || actor?.offlineId || ""),
    event_type: type,
    entity_type: "coupon",
    entity_id: cleanId(metadata.code || ""),
    payload_json: { message, actor_email: String(actor?.email || "").toLowerCase(), metadata },
    created_at: new Date().toISOString(),
  }).catch(() => null);
}

function publicCoupon(coupon, usedCount = 0) {
  return {
    id: coupon.id,
    code: coupon.code,
    label: coupon.label || "",
    durationDays: Number(coupon.durationDays || 1),
    maxUses: Number(coupon.maxUses || 0),
    expiresAt: coupon.expiresAt || "",
    isActive: coupon.isActive !== false,
    usedCount,
    createdAt: coupon.createdAt || "",
  };
}

function validateCoupon(coupon, orders, userId) {
  if (!coupon) return "Invalid coupon code.";
  if (coupon.isActive === false) return "This coupon is disabled.";
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= Date.now()) return "This coupon has expired.";
  const redemptions = orders.filter(row => row.payload_json?.couponCode === coupon.code);
  if (redemptions.some(row => row.user_id === userId)) return "You have already used this coupon.";
  if (Number(coupon.maxUses || 0) > 0 && redemptions.length >= Number(coupon.maxUses)) return "This coupon has reached its usage limit.";
  return "";
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const coupons = await loadCoupons(env);
  const orders = await loadCouponOrders(env);
  const items = coupons.map(coupon => publicCoupon(coupon, orders.filter(row => row.payload_json?.couponCode === coupon.code).length));
  return json({ success: true, coupons: url.searchParams.get("all") === "1" ? items : items.filter(item => item.isActive) });
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const action = String(body.action || "").toLowerCase();
  const actor = body.actor || {};

  if (action === "save") {
    if (actor.role !== "admin") return json({ error: "Admin access required." }, 403);
    const input = body.coupon || {};
    const code = normalizeCode(input.code);
    if (!code) return json({ error: "Coupon code required." }, 400);
    const coupons = await loadCoupons(env);
    const existing = coupons.find(item => item.code === code);
    const coupon = {
      id: existing?.id || cleanId(`coupon_${code}`),
      code,
      label: String(input.label || "").trim(),
      durationDays: Math.max(1, Number(input.durationDays || 1)),
      maxUses: Math.max(0, Number(input.maxUses || 0)),
      expiresAt: input.expiresAt || "",
      isActive: input.isActive !== false,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const next = [...coupons.filter(item => item.code !== code), coupon];
    await saveCoupons(env, next);
    await logEvent(env, actor, existing ? "coupon.updated" : "coupon.created", `${existing ? "Updated" : "Created"} coupon ${code}`, { code, durationDays: coupon.durationDays });
    return json({ success: true, coupon: publicCoupon(coupon) });
  }

  const code = normalizeCode(body.code);
  const user = body.user || {};
  const userId = userIdFrom(user);
  if (!code) return json({ error: "Enter a coupon code." }, 400);
  if (!userId || !user.email) return json({ error: "Login required." }, 400);
  const coupons = await loadCoupons(env);
  const coupon = coupons.find(item => item.code === code);
  const orders = await loadCouponOrders(env);
  const error = validateCoupon(coupon, orders, userId);
  if (error) return json({ error }, 400);
  const profile = await loadProfile(env, userId);
  const currentExpiry = profile.pass?.expiresAt ? new Date(profile.pass.expiresAt) : null;
  if (currentExpiry && currentExpiry.getTime() > Date.now()) {
    return json({ error: "Coupon can only be used when you do not have an active pass." }, 409);
  }

  if (action === "validate") {
    return json({ success: true, coupon: publicCoupon(coupon), message: `This coupon will add ${coupon.durationDays} day${Number(coupon.durationDays) === 1 ? "" : "s"} of pass access to your account.` });
  }
  if (action !== "redeem") return json({ error: "Unknown coupon action." }, 400);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + Number(coupon.durationDays || 1) * 86400000);
  const orderId = cleanId(`coupon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const pass = {
    planId: `coupon_${coupon.code}`,
    planName: coupon.label || `${coupon.durationDays} Day Coupon Pass`,
    durationDays: Number(coupon.durationDays || 1),
    price: 0,
    activatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    paymentMode: "coupon",
    paymentStatus: "paid",
    paymentRef: coupon.code,
    orderId,
  };
  await saveProfile(env, userId, { ...profile, pass, updatedAt: now.toISOString() });
  await upsertRows(env, "subscriptions", {
    id: `${userId}_${orderId}`,
    user_id: userId,
    plan_id: pass.planId,
    status: "active",
    starts_at: now.toISOString(),
    expires_at: pass.expiresAt,
    payment_provider: "coupon",
    payment_ref: coupon.code,
    metadata_json: { pass, couponCode: coupon.code },
  });
  await upsertRows(env, "payment_orders", {
    id: orderId,
    user_id: userId,
    user_email: String(user.email).toLowerCase(),
    user_name: user.name || user.displayName || "",
    plan_id: pass.planId,
    plan_name: pass.planName,
    amount_inr: 0,
    utr: coupon.code,
    status: "approved",
    reviewed_by: "coupon-system",
    reviewed_at: now.toISOString(),
    payload_json: { method: "coupon", couponCode: coupon.code, coupon, pass },
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  });
  await logEvent(env, user, "coupon.redeemed", `${user.email} redeemed coupon ${coupon.code}`, { code: coupon.code, userId, durationDays: coupon.durationDays });
  return json({ success: true, pass, coupon: publicCoupon(coupon) });
}

export async function onRequestDelete({ request, env }) {
  const body = await readJson(request);
  const actor = body.actor || {};
  if (actor.role !== "admin") return json({ error: "Admin access required." }, 403);
  const code = normalizeCode(body.code);
  if (!code) return json({ error: "Coupon code required." }, 400);
  const coupons = await loadCoupons(env);
  await saveCoupons(env, coupons.filter(item => item.code !== code));
  await logEvent(env, actor, "coupon.deleted", `Deleted coupon ${code}`, { code });
  return json({ success: true, deleted: true });
}
