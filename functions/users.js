import { client, json, readJson, saveUser, userIdFrom, cleanId } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

function parseJson(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || `item_${Date.now()}`;
}

async function loadProfile(db, userId) {
  const row = await db.execute({ sql: "SELECT value_json FROM user_blobs WHERE user_id=? AND blob_key='profile'", args: [userId] });
  return parseJson(row.rows[0]?.value_json, {});
}

async function saveProfile(db, userId, profile) {
  await db.execute({
    sql: `INSERT INTO user_blobs (user_id, blob_key, value_json, updated_at)
          VALUES (?, 'profile', ?, CURRENT_TIMESTAMP)
          ON CONFLICT(user_id, blob_key) DO UPDATE SET value_json=excluded.value_json, updated_at=CURRENT_TIMESTAMP`,
    args: [userId, JSON.stringify(profile)],
  });
}

async function upsertCourse(db, course) {
  const id = cleanId(course.id || slugify(course.title || course.folderName));
  const title = String(course.title || course.folderName || id);
  await db.execute({
    sql: `INSERT INTO courses (id, slug, title, subtitle, price_inr, original_price_inr, accent_color, text_color, subjects_json, folders_json, is_published, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET title=excluded.title, subtitle=excluded.subtitle, updated_at=CURRENT_TIMESTAMP`,
    args: [id, slugify(title), title, course.subtitle || "", Number(course.price || 0), Number(course.originalPrice || course.price || 0), course.color || "#7C3AED", course.textColor || "#A78BFA", JSON.stringify(course.subjects || []), JSON.stringify(course.testFolders || [])],
  });
  return id;
}

async function saveEnrollments(db, userId, coursesOpted = []) {
  for (const course of coursesOpted) {
    const courseId = await upsertCourse(db, course);
    await db.execute({
      sql: `INSERT INTO enrollments (id, user_id, course_id, status, created_at)
            VALUES (?, ?, ?, 'active', CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, course_id) DO UPDATE SET status='active'`,
      args: [`${userId}_${courseId}`, userId, courseId],
    });
  }
}

export async function onRequestGet({ request, env }) {
  const db = client(env);
  const url = new URL(request.url);
  const rawUser = { offlineId: url.searchParams.get("offlineId"), email: url.searchParams.get("email") };
  const userId = userIdFrom(rawUser);
  if (!userId) return json({ user: null, coursesOpted: [], pass: null });
  const row = await db.execute({ sql: "SELECT id,email,display_name,role,avatar_initials FROM users WHERE id=?", args: [userId] });
  const profile = await loadProfile(db, userId);
  const user = row.rows[0]
    ? { id: row.rows[0].id, offlineId: row.rows[0].id, email: row.rows[0].email, name: row.rows[0].display_name, role: row.rows[0].role, avatar: row.rows[0].avatar_initials, pass: profile.pass || null }
    : null;
  return json({ success: true, user, coursesOpted: profile.coursesOpted || [], pass: profile.pass || null });
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const db = client(env);
  const rawUser = body.user || body;
  const user = await saveUser(db, rawUser);
  const existing = await loadProfile(db, user.id);
  const incomingCourses = Array.isArray(body.coursesOpted) ? body.coursesOpted : null;
  const nextCourses = incomingCourses && incomingCourses.length ? incomingCourses : (existing.coursesOpted || []);
  const nextPass = rawUser.pass || body.pass || existing.pass || null;
  const profile = { ...existing, coursesOpted: nextCourses, pass: nextPass, updatedAt: new Date().toISOString() };
  await saveProfile(db, user.id, profile);
  if (nextCourses.length) await saveEnrollments(db, user.id, nextCourses);
  return json({ success: true, user: { ...user, pass: nextPass }, coursesOpted: nextCourses, pass: nextPass });
}