import { json, readJson, cleanId, slugify, supabaseRequest, upsertRows, eq } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

function courseRow(input = {}) {
  const title = String(input.title || input.courseTitle || "Course").trim();
  const id = cleanId(input.id) || slugify(title);
  const folders = Array.isArray(input.testFolders) ? input.testFolders : [];
  return {
    id,
    slug: slugify(title),
    title,
    subtitle: input.subtitle || "",
    description: input.description || "",
    price_inr: Number(input.price || input.price_inr || 0),
    original_price_inr: Number(input.originalPrice || input.original_price_inr || input.price || 0),
    badge: input.badge || "New",
    color: input.color || "#7C3AED",
    text_color: input.textColor || input.text_color || "#A78BFA",
    subjects_json: Array.isArray(input.subjects) ? input.subjects : String(input.subjects || "").split(",").map(s => s.trim()).filter(Boolean),
    folders_json: folders.map(f => ({ id: f.id, name: f.name, icon: f.icon || "folder" })),
    config_json: input.config || input.config_json || {},
    is_published: input.is_published !== false,
    updated_at: new Date().toISOString(),
  };
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const row = courseRow(body);
  await upsertRows(env, "courses", row);
  return json({
    success: true,
    course: {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      description: row.description,
      price: row.price_inr,
      originalPrice: row.original_price_inr,
      badge: row.badge,
      color: row.color,
      textColor: row.text_color,
      subjects: row.subjects_json,
      testFolders: body.testFolders || row.folders_json.map(f => ({ ...f, tests: [] })),
    },
  });
}

export async function onRequestDelete({ request, env }) {
  const body = await readJson(request);
  const id = cleanId(body.courseId || body.id) || slugify(body.courseTitle || body.title || "");
  if (!id) return json({ error: "courseId or courseTitle required" }, 400);
  await supabaseRequest(env, `tests?course_id=${eq(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }).catch(() => null);
  await supabaseRequest(env, `courses?id=${eq(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  return json({ success: true, deleted: true });
}
