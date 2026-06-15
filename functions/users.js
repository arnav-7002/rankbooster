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
  const existing = await supabaseRequest(env, `courses?select=id&id=${eq(id)}&limit=1`).catch(() => []);
  if (existing?.[0]?.id) return id;
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

async function saveSubscription(env, userId, pass) {
  if (!pass?.planId || !pass?.expiresAt) return;
  await upsertRows(env, "subscriptions", {
    id: `${userId}_${pass.planId}`,
    user_id: userId,
    plan_id: pass.planId,
    status: "active",
    starts_at: pass.startedAt || new Date().toISOString(),
    expires_at: pass.expiresAt,
    payment_provider: pass.paymentProvider || "mock",
    payment_ref: pass.paymentRef || "",
    metadata_json: pass,
  });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  if (url.searchParams.get("all") === "1") {
    const [userRows, blobRows, enrollmentRows, attemptRows, courseRows, subscriptionRows, planRows] = await Promise.all([
      supabaseRequest(env, "users?select=id,email,display_name,role,avatar_initials,created_at&order=created_at.asc").catch(() => []),
      supabaseRequest(env, `user_blobs?select=user_id,value_json&blob_key=${eq("profile")}`).catch(() => []),
      supabaseRequest(env, "enrollments?select=user_id,course_id,status,created_at").catch(() => []),
      supabaseRequest(env, "attempts?select=user_id,id,score,max_marks,submitted_at").catch(() => []),
      supabaseRequest(env, "courses?select=id,title").catch(() => []),
      supabaseRequest(env, "subscriptions?select=user_id,plan_id,status,starts_at,expires_at&status=eq.active").catch(() => []),
      supabaseRequest(env, "pass_plans?select=id,name,duration_days,price_inr").catch(() => []),
    ]);
    const profiles = new Map((blobRows || []).map(row => [row.user_id, row.value_json || {}]));
    const courseNames = new Map((courseRows || []).map(row => [row.id, row.title]));
    const planNames = new Map((planRows || []).map(row => [row.id, row.name]));
    const users = (userRows || []).map(row => {
      const profile = profiles.get(row.id) || {};
      const subscription = (subscriptionRows || []).find(s => s.user_id === row.id && new Date(s.expires_at).getTime() > Date.now());
      const pass = profile.pass || (subscription ? {
        planId: subscription.plan_id,
        planName: planNames.get(subscription.plan_id) || subscription.plan_id,
        startedAt: subscription.starts_at,
        expiresAt: subscription.expires_at,
      } : null);
      const enrollments = (enrollmentRows || [])
        .filter(e => e.user_id === row.id)
        .map(e => ({ id: e.course_id, title: courseNames.get(e.course_id) || e.course_id, status: e.status, createdAt: e.created_at }));
      const attempts = (attemptRows || []).filter(a => a.user_id === row.id);
      const bestScore = attempts.reduce((best, a) => Math.max(best, Number(a.score || 0)), 0);
      return {
        id: row.id,
        offlineId: row.id,
        email: row.email,
        name: row.display_name,
        role: row.role || "user",
        avatar: row.avatar_initials || String(row.display_name || row.email || "U").slice(0, 2).toUpperCase(),
        joinedAt: row.created_at ? new Date(row.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "",
        pass,
        coursesOpted: profile.coursesOpted || enrollments,
        enrollments,
        attemptCount: attempts.length,
        bestScore,
      };
    });
    return json({ success: true, users });
  }
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
  if (nextPass) await saveSubscription(env, user.id, nextPass);
  return json({ success: true, user: { ...user, pass: nextPass }, coursesOpted: nextCourses, pass: nextPass });
}
