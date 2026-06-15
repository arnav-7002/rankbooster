import { json, readJson, cleanId, slugify, supabaseRequest, upsertRows, eq } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

async function loadCourse(env, body) {
  const id = cleanId(body.courseId || body.id) || slugify(body.courseTitle || body.title || "");
  const filters = id ? `id=${eq(id)}` : `title=${eq(body.courseTitle || body.title || "")}`;
  const rows = await supabaseRequest(env, `courses?select=*&${filters}&limit=1`).catch(() => []);
  return rows?.[0] || null;
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const course = await loadCourse(env, body);
  const folderName = String(body.folderName || body.name || "").trim();
  if (!course || !folderName) return json({ error: "course and folderName required" }, 400);
  const folders = Array.isArray(course.folders_json) ? course.folders_json : [];
  const exists = folders.some(f => String(f.name || "").toLowerCase() === folderName.toLowerCase());
  const nextFolders = exists ? folders : [...folders, { id: body.folderId || `f_${slugify(folderName)}`, name: folderName, icon: body.icon || "folder" }];
  await upsertRows(env, "courses", {
    id: course.id,
    slug: course.slug,
    title: course.title,
    folders_json: nextFolders,
    updated_at: new Date().toISOString(),
  });
  return json({ success: true, folders: nextFolders });
}

export async function onRequestDelete({ request, env }) {
  const body = await readJson(request);
  const course = await loadCourse(env, body);
  const folderName = String(body.folderName || body.name || "").trim();
  if (!course || !folderName) return json({ error: "course and folderName required" }, 400);
  const nextFolders = (Array.isArray(course.folders_json) ? course.folders_json : []).filter(f => String(f.name || "").toLowerCase() !== folderName.toLowerCase());
  await supabaseRequest(env, `tests?course_id=${eq(course.id)}&folder_name=${eq(folderName)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }).catch(() => null);
  await upsertRows(env, "courses", {
    id: course.id,
    slug: course.slug,
    title: course.title,
    folders_json: nextFolders,
    updated_at: new Date().toISOString(),
  });
  return json({ success: true, deleted: true, folders: nextFolders });
}
