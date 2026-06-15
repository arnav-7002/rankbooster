import { json, readJson, saveUser, userIdFrom, cleanId, slugify, parseJson, supabaseRequest, upsertRows, eq } from "./_shared.js";
export async function onRequestOptions() { return json({ ok: true }); }

async function loadProfile(env, userId) {
  const rows = await supabaseRequest(env, `user_blobs?select=value_json&user_id=${eq(userId)}&blob_key=${eq("profile")}&limit=1`).catch(() => []);
  return rows[0]?.value_json || {};
}

async function saveProfile(env, userId, profile) {
  await upsertRows(env, "user_blobs", { user_id: userId, blob_key: "profile", value_json: profile, updated_at: new Date().toISOString() }, "user_id,blob_key");
}

async function upsertCourse(env, course) {
  const id = cleanId(course.id || slugify(course.title || course.folderName));
  const title = String(course.title || course.folderName || id);
  await upsertRows(env, "courses", {
    id, slug: slugify(title), title, subtitle: course.subtitle || "", description: course.description || "",
    badge: course.badge || "", price_inr: Number(course.price || 0), original_price_inr: Number(course.originalPrice || course.price || 0),
    accent_color: course.color || "#7C3AED", text_color: course.textColor || "#A78BFA",
    subjects_json: course.subjects || [], folders_json: course.testFolders || [], is_published: true, updated_at: new Date().toISOString(),
  });
  return id;
}

async function saveEnrollments(env, userId, coursesOpted = []) {
  for (const course of coursesOpted) {
    const courseId = await upsertCourse(env, course);
    await upsertRows(env, "enrollments", { id: `${userId}_${courseId}`, user_id: userId, course_id: courseId, status: "active" });
  }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const rawUser = { offlineId: url.searchParams.get("offlineId"), email: url.searchParams.get("email") };
  const userId = userIdFrom(rawUser);
  if (!userId) return json({ user: null, coursesOpted: [], pass: null });
  const rows = await supabaseRequest(env, `users?select=id,email,display_name,role,avatar_initials&id=${eq(userId)}&limit=1`).catch(() => []);
  const profile = await loadProfile(env, userId);
  const user = rows[0] ? { id: rows[0].id, offlineId: rows[0].id, email: rows[0].email, name: rows[0].display_name, role: rows[0].role, avatar: rows[0].avatar_initials, pass: profile.pass || null } : null;
  return json({ success: true, user, coursesOpted: profile.coursesOpted || [], pass: profile.pass || null });
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const rawUser = body.user || body;
  const user = await saveUser(env, rawUser);
  const existing = await loadProfile(env, user.id);
  const incomingCourses = Array.isArray(body.coursesOpted) ? body.coursesOpted : null;
  const nextCourses = incomingCourses && incomingCourses.length ? incomingCourses : (existing.coursesOpted || []);
  const nextPass = rawUser.pass || body.pass || existing.pass || null;
  const profile = { ...existing, coursesOpted: nextCourses, pass: nextPass, updatedAt: new Date().toISOString() };
  await saveProfile(env, user.id, profile);
  if (nextCourses.length) await saveEnrollments(env, user.id, nextCourses);
  return json({ success: true, user: { ...user, pass: nextPass }, coursesOpted: nextCourses, pass: nextPass });
}