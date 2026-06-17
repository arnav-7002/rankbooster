import { json, readJson, cleanId, supabaseRequest, upsertRows } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

const AREA_LABELS = {
  content: "courses and tests",
  attempts: "attempts and analysis",
  users: "student accounts",
  notebooks: "notebooks",
  payments: "payments and subscriptions",
  plans: "pass plans",
  settings: "announcements/settings",
  activity: "admin activity log",
};

async function deleteRows(env, table, filter = "id=not.is.null") {
  await supabaseRequest(env, `${table}?${filter}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  }).catch(() => null);
}

async function logReset(env, actor, selectedAreas) {
  await upsertRows(env, "admin_events", {
    id: cleanId(`evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
    actor_user_id: cleanId(actor?.id || actor?.offlineId || ""),
    event_type: "site.reset",
    entity_type: "site",
    entity_id: "database",
    payload_json: {
      message: `Reset: ${selectedAreas.map(area => AREA_LABELS[area] || area).join(", ")}`,
      actor_email: String(actor?.email || "").toLowerCase(),
      selectedAreas,
    },
    created_at: new Date().toISOString(),
  }).catch(() => null);
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const actor = body.actor || {};
  const requested = body.fullReset ? Object.keys(AREA_LABELS) : (Array.isArray(body.areas) ? body.areas : []);
  const selected = [...new Set(requested.filter(area => AREA_LABELS[area]))];

  if (!selected.length) return json({ error: "Select at least one reset area." }, 400);
  if (String(body.confirmText || "").trim().toUpperCase() !== "RESET") {
    return json({ error: "Type RESET to confirm." }, 400);
  }
  if (actor?.role !== "admin") return json({ error: "Admin access required." }, 403);

  const wipeContent = selected.includes("content");
  const wipeUsers = selected.includes("users");
  const wipeAttempts = selected.includes("attempts") || wipeContent || wipeUsers;
  const wipeNotebooks = selected.includes("notebooks") || wipeContent || wipeUsers;
  const wipePayments = selected.includes("payments") || wipeUsers;

  if (wipeNotebooks) {
    await deleteRows(env, "notebook_questions");
    await deleteRows(env, "notebooks");
  }
  if (wipeAttempts) await deleteRows(env, "attempts");
  if (wipePayments) {
    await deleteRows(env, "payment_orders");
    await deleteRows(env, "subscriptions");
  }
  if (wipeUsers || wipeContent) await deleteRows(env, "enrollments");
  if (wipeUsers) {
    await deleteRows(env, "user_blobs");
    await deleteRows(env, "users", "role=neq.admin");
  }
  if (wipeContent) {
    await deleteRows(env, "tests");
    await deleteRows(env, "courses");
  }
  if (selected.includes("plans")) await deleteRows(env, "pass_plans");
  if (selected.includes("settings")) await deleteRows(env, "app_settings", "key=not.is.null");
  if (selected.includes("activity")) await deleteRows(env, "admin_events");

  await logReset(env, actor, selected);

  return json({ success: true, reset: true, selectedAreas: selected });
}
