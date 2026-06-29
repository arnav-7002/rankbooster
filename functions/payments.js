import { json, readJson, cleanId, userIdFrom, supabaseRequest, upsertRows, eq } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

function mapOrder(row = {}) {
  const payload = row.payload_json || {};
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    userName: row.user_name,
    planId: row.plan_id,
    planName: row.plan_name,
    amount: Number(row.amount_inr || 0),
    utr: row.utr || "",
    status: row.status || "pending",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    note: payload.note || "",
    pass: payload.pass || null,
  };
}

function createPass(plan, orderId, utr, existingPass = null) {
  const now = new Date();
  const addDays = Number(plan.durationDays || plan.duration_days || 1);
  const existingExpiry = existingPass?.expiresAt ? new Date(existingPass.expiresAt) : null;
  const base = existingExpiry && existingExpiry.getTime() > now.getTime() ? existingExpiry : now;
  const expires = new Date(base.getTime() + addDays * 86400000);
  const effectiveDays = base === now ? addDays : Math.max(addDays, Math.ceil((expires.getTime() - now.getTime()) / 86400000));
  return {
    planId: plan.id,
    planName: plan.name,
    durationDays: effectiveDays,
    addedDays: addDays,
    price: Number(plan.price || plan.price_inr || 0),
    activatedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    paymentMode: "upi_manual",
    paymentStatus: "paid",
    paymentRef: utr,
    orderId,
  };
}

async function loadProfile(env, userId) {
  const rows = await supabaseRequest(env, `user_blobs?select=value_json&user_id=${eq(userId)}&blob_key=${eq("profile")}&limit=1`).catch(() => []);
  return rows[0]?.value_json || {};
}

async function saveProfile(env, userId, profile) {
  await upsertRows(env, "user_blobs", { user_id: userId, blob_key: "profile", value_json: profile, updated_at: new Date().toISOString() }, "user_id,blob_key");
}

async function closeActiveSubscriptions(env, userId, reason = "renewed") {
  await supabaseRequest(env, `subscriptions?user_id=${eq(userId)}&status=${eq("active")}`, {
    method: "PATCH",
    body: { status: reason, metadata_json: { closedAt: new Date().toISOString(), reason } },
    headers: { Prefer: "return=minimal" },
  }).catch(() => null);
}

async function logEvent(env, actor, type, message, metadata = {}) {
  await upsertRows(env, "admin_events", {
    id: cleanId(`evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
    actor_user_id: cleanId(actor?.id || actor?.offlineId || ""),
    event_type: type,
    entity_type: "payment",
    entity_id: cleanId(metadata.orderId || ""),
    payload_json: { message, actor_email: String(actor?.email || "").toLowerCase(), metadata },
    created_at: new Date().toISOString(),
  }).catch(() => null);
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const userId = userIdFrom({ offlineId: url.searchParams.get("offlineId"), email: url.searchParams.get("email") });
  const filters = ["select=*"];
  if (status && status !== "all") filters.push(`status=${eq(status)}`);
  if (userId) filters.push(`user_id=${eq(userId)}`);
  filters.push("order=created_at.desc");
  const rows = await supabaseRequest(env, `payment_orders?${filters.join("&")}`).catch(() => []);
  return json({ success: true, orders: (rows || []).map(mapOrder) });
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const action = String(body.action || "").toLowerCase();
  if (action === "manual_grant") return manualGrant({ body, env });
  if (action === "manual_revoke") return manualRevoke({ body, env });

  const user = body.user || {};
  const plan = body.plan || {};
  const userId = userIdFrom(user);
  const utr = String(body.utr || "").trim();
  if (!userId || !user.email) return json({ error: "Login required." }, 400);
  if (!plan.id) return json({ error: "Pass plan required." }, 400);
  if (!utr || utr.length < 6) return json({ error: "Enter a valid UTR/reference ID." }, 400);

  const orderId = cleanId(`pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const amount = Number(plan.price || plan.price_inr || 0);
  const order = {
    id: orderId,
    user_id: userId,
    user_email: String(user.email || "").toLowerCase(),
    user_name: user.name || user.displayName || "",
    plan_id: cleanId(plan.id),
    plan_name: String(plan.name || "Pass"),
    amount_inr: amount,
    utr,
    status: "pending",
    payload_json: { plan, note: body.note || "" },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const saved = await upsertRows(env, "payment_orders", order);
  await logEvent(env, user, "payment.submitted", `${user.email} submitted payment UTR ${utr}`, { orderId, planId: plan.id, amount, utr });
  return json({ success: true, order: mapOrder(saved?.[0] || order) });
}

async function manualGrant({ body, env }) {
  const actor = body.actor || {};
  const target = body.user || {};
  const plan = body.plan || {};
  const userId = userIdFrom(target);
  if (!userId || !target.email) return json({ error: "Target user required." }, 400);
  if (!plan.id) return json({ error: "Pass plan required." }, 400);
  const orderId = cleanId(`manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const profile = await loadProfile(env, userId);
  const pass = createPass(plan, orderId, "manual-admin", profile.pass);
  pass.paymentMode = "manual_admin";
  pass.paymentStatus = "paid";
  await saveProfile(env, userId, { ...profile, pass, updatedAt: new Date().toISOString() });
  await closeActiveSubscriptions(env, userId, "renewed");
  await upsertRows(env, "subscriptions", {
    id: `${userId}_${orderId}`,
    user_id: userId,
    plan_id: pass.planId,
    status: "active",
    starts_at: pass.activatedAt,
    expires_at: pass.expiresAt,
    payment_provider: "manual_admin",
    payment_ref: "manual-admin",
    metadata_json: { pass, orderId, grantedBy: actor.email || actor.id || "admin" },
  });
  const amount = Number(plan.price || plan.price_inr || 0);
  const order = {
    id: orderId,
    user_id: userId,
    user_email: String(target.email || "").toLowerCase(),
    user_name: target.name || target.displayName || "",
    plan_id: cleanId(plan.id),
    plan_name: String(plan.name || "Pass"),
    amount_inr: amount,
    utr: "manual-admin",
    status: "approved",
    reviewed_by: actor.email || actor.id || "admin",
    reviewed_at: new Date().toISOString(),
    payload_json: { plan, pass, method: "manual_admin", note: body.note || "Pass granted manually from admin panel." },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const saved = await upsertRows(env, "payment_orders", order);
  await logEvent(env, actor, "payment.manual_grant", `Manually granted ${plan.name || "Pass"} to ${target.email}`, { orderId, userId, planId: plan.id, amount });
  return json({ success: true, order: mapOrder(saved?.[0] || order), pass });
}

async function manualRevoke({ body, env }) {
  const actor = body.actor || {};
  const target = body.user || {};
  const userId = userIdFrom(target);
  if (!userId || !target.email) return json({ error: "Target user required." }, 400);
  const profile = await loadProfile(env, userId);
  const oldPass = profile.pass || null;
  await saveProfile(env, userId, { ...profile, pass: null, updatedAt: new Date().toISOString() });
  await supabaseRequest(env, `subscriptions?user_id=${eq(userId)}&status=${eq("active")}`, {
    method: "PATCH",
    body: { status: "revoked", metadata_json: { revokedBy: actor.email || actor.id || "admin", oldPass } },
    headers: { Prefer: "return=minimal" },
  }).catch(() => null);
  const orderId = cleanId(`manual_revoke_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const order = {
    id: orderId,
    user_id: userId,
    user_email: String(target.email || "").toLowerCase(),
    user_name: target.name || target.displayName || "",
    plan_id: cleanId(oldPass?.planId || "manual_revoke"),
    plan_name: String(oldPass?.planName || "Pass removed"),
    amount_inr: 0,
    utr: "manual-remove",
    status: "declined",
    reviewed_by: actor.email || actor.id || "admin",
    reviewed_at: new Date().toISOString(),
    payload_json: { method: "manual_admin", note: body.note || "Pass removed manually from admin panel.", oldPass },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const saved = await upsertRows(env, "payment_orders", order);
  await logEvent(env, actor, "payment.manual_remove", `Manually removed pass from ${target.email}`, { orderId, userId, oldPass });
  return json({ success: true, order: mapOrder(saved?.[0] || order), pass: null });
}

export async function onRequestPatch({ request, env }) {
  const body = await readJson(request);
  const orderId = cleanId(body.orderId || body.id);
  const action = String(body.action || "").toLowerCase();
  const actor = body.actor || {};
  if (!orderId || !["approve", "decline"].includes(action)) return json({ error: "orderId and approve/decline action required" }, 400);

  const rows = await supabaseRequest(env, `payment_orders?select=*&id=${eq(orderId)}&limit=1`);
  const order = rows?.[0];
  if (!order) return json({ error: "Payment order not found" }, 404);
  if (order.status !== "pending") return json({ error: `Payment is already ${order.status}.` }, 409);

  if (action === "decline") {
    await supabaseRequest(env, `payment_orders?id=${eq(orderId)}`, {
      method: "PATCH",
      body: { status: "declined", reviewed_by: actor.email || actor.id || "admin", reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(), payload_json: { ...(order.payload_json || {}), declineReason: body.reason || "" } },
      headers: { Prefer: "return=minimal" },
    });
    await logEvent(env, actor, "payment.declined", `Declined payment ${order.utr} from ${order.user_email}`, { orderId, utr: order.utr, amount: order.amount_inr, userId: order.user_id });
    return json({ success: true, status: "declined" });
  }

  const profile = await loadProfile(env, order.user_id);
  const plan = order.payload_json?.plan || { id: order.plan_id, name: order.plan_name, durationDays: 1, price: order.amount_inr };
  const pass = createPass(plan, orderId, order.utr, profile.pass);
  const nextProfile = { ...profile, pass, updatedAt: new Date().toISOString() };
  await saveProfile(env, order.user_id, nextProfile);
  await closeActiveSubscriptions(env, order.user_id, "renewed");
  await upsertRows(env, "subscriptions", {
    id: `${order.user_id}_${orderId}`,
    user_id: order.user_id,
    plan_id: pass.planId,
    status: "active",
    starts_at: pass.activatedAt,
    expires_at: pass.expiresAt,
    payment_provider: "upi_manual",
    payment_ref: order.utr,
    metadata_json: { pass, orderId },
  });
  await supabaseRequest(env, `payment_orders?id=${eq(orderId)}`, {
    method: "PATCH",
    body: { status: "approved", reviewed_by: actor.email || actor.id || "admin", reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString(), payload_json: { ...(order.payload_json || {}), pass } },
    headers: { Prefer: "return=minimal" },
  });
  await logEvent(env, actor, "payment.approved", `Approved ₹${order.amount_inr} payment for ${order.user_email}`, { orderId, utr: order.utr, amount: order.amount_inr, userId: order.user_id, planId: pass.planId });
  return json({ success: true, status: "approved", pass });
}
