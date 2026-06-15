import { json, readJson, supabaseRequest, upsertRows, eq, cleanId } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

function mapPlan(row = {}) {
  return {
    id: row.id,
    name: row.name,
    durationDays: Number(row.duration_days || 1),
    price: Number(row.price_inr || 0),
    originalPrice: Number(row.original_price_inr || row.price_inr || 0),
    label: row.label || row.duration_label || `${row.duration_days || 1} day${Number(row.duration_days || 1) === 1 ? "" : "s"}`,
    badge: row.badge || "",
    note: row.description || row.note || "",
    isActive: row.is_active !== false,
    sortOrder: Number(row.sort_order || 0),
  };
}

export async function onRequestGet({ env }) {
  const rows = await supabaseRequest(env, "pass_plans?select=*&order=sort_order.asc").catch(() => []);
  return json({ success: true, plans: (rows || []).map(mapPlan) });
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const plans = Array.isArray(body.plans) ? body.plans : [body.plan || body];
  const rows = plans.map((plan, idx) => {
    const id = cleanId(plan.id) || cleanId(String(plan.name || `plan_${idx}`).toLowerCase().replace(/[^a-z0-9]+/g, "_"));
    return {
      id,
      name: String(plan.name || "Pass").trim(),
      duration_days: Number(plan.durationDays || plan.duration_days || 1),
      price_inr: Number(plan.price || plan.price_inr || 0),
      original_price_inr: Number(plan.originalPrice || plan.original_price_inr || plan.price || plan.price_inr || 0),
      badge: plan.badge || "",
      description: plan.note || plan.description || "",
      is_active: plan.isActive !== false && plan.is_active !== false,
      sort_order: Number(plan.sortOrder ?? plan.sort_order ?? idx + 1),
    };
  });
  const saved = await upsertRows(env, "pass_plans", rows);
  return json({ success: true, plans: (saved || rows).map(mapPlan) });
}

export async function onRequestDelete({ request, env }) {
  const body = await readJson(request);
  const id = cleanId(body.id || body.planId);
  if (!id) return json({ error: "plan id required" }, 400);
  await supabaseRequest(env, `pass_plans?id=${eq(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  return json({ success: true, deleted: true });
}
