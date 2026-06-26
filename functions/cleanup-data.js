import { cleanId, eq, json, readJson, supabaseRequest, upsertRows } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

function cutoffIso(days) {
  if (days === "never" || days === 0 || days === "0" || days === null || days === undefined) return null;
  const n = Number(days);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(Date.now() - n * 86400000).toISOString();
}

async function deleteRows(env, table, filter) {
  await supabaseRequest(env, `${table}?${filter}`, { method: "DELETE", headers: { Prefer: "return=minimal" } }).catch(() => null);
}

async function logEvent(env, actor, type, message, metadata = {}) {
  await upsertRows(env, "admin_events", {
    id: cleanId(`evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
    actor_user_id: cleanId(actor?.id || actor?.offlineId || ""),
    event_type: type,
    entity_type: "cleanup",
    entity_id: cleanId(metadata.userId || metadata.courseId || type),
    payload_json: { message, actor_email: String(actor?.email || "").toLowerCase(), metadata },
    created_at: new Date().toISOString(),
  }).catch(() => null);
}

async function updateProfile(env, userId, updater) {
  const rows = await supabaseRequest(env, `user_blobs?select=value_json&user_id=${eq(userId)}&blob_key=${eq("profile")}&limit=1`).catch(() => []);
  const profile = rows?.[0]?.value_json || {};
  const next = updater(profile);
  await upsertRows(env, "user_blobs", { user_id: userId, blob_key: "profile", value_json: next, updated_at: new Date().toISOString() }, "user_id,blob_key").catch(() => null);
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const mode = String(body.mode || "").trim();
  const actor = body.actor || {};

  if (mode === "no_pass_inactive") {
    const cutoff = cutoffIso(body.days);
    if (!cutoff) return json({ success: true, skipped: true, reason: "Rule is set to never." });
    const [users, subs] = await Promise.all([
      supabaseRequest(env, `users?select=id,email,role,updated_at&role=neq.admin&updated_at=lt.${encodeURIComponent(cutoff)}`).catch(() => []),
      supabaseRequest(env, "subscriptions?select=user_id,expires_at,status&status=eq.active").catch(() => []),
    ]);
    const activeUsers = new Set((subs || []).filter(s => new Date(s.expires_at).getTime() > Date.now()).map(s => s.user_id));
    const targets = (users || []).filter(u => !activeUsers.has(u.id));
    for (const user of targets) {
      await deleteRows(env, "attempts", `user_id=${eq(user.id)}`);
      await deleteRows(env, "attempt_resumes", `user_id=${eq(user.id)}`);
      await deleteRows(env, "notebook_questions", `user_id=${eq(user.id)}`);
      await deleteRows(env, "notebooks", `user_id=${eq(user.id)}`);
      await deleteRows(env, "enrollments", `user_id=${eq(user.id)}`);
      await deleteRows(env, "subscriptions", `user_id=${eq(user.id)}&status=neq.active`);
      await updateProfile(env, user.id, profile => ({ ...profile, coursesOpted: [], pass: null, cleanupAt: new Date().toISOString() }));
    }
    await logEvent(env, actor, "cleanup.no_pass_inactive", `Cleaned ${targets.length} inactive no-pass user${targets.length === 1 ? "" : "s"}`, { count: targets.length, days: body.days });
    return json({ success: true, cleanedUsers: targets.length });
  }

  if (mode === "free_course_inactive") {
    const cutoff = cutoffIso(body.days);
    if (!cutoff) return json({ success: true, skipped: true, reason: "Rule is set to never." });
    const courses = await supabaseRequest(env, "courses?select=id,title,config_json").catch(() => []);
    const freeCourseIds = (courses || []).filter(c => !!c.config_json?.freeAccess).map(c => c.id);
    if (!freeCourseIds.length) return json({ success: true, cleanedEnrollments: 0, freeCourses: 0 });
    const enrollments = await supabaseRequest(env, `enrollments?select=user_id,course_id,created_at&created_at=lt.${encodeURIComponent(cutoff)}`).catch(() => []);
    const targets = (enrollments || []).filter(e => freeCourseIds.includes(e.course_id));
    const touchedUsers = new Set();
    for (const item of targets) {
      await deleteRows(env, "attempts", `user_id=${eq(item.user_id)}&course_id=${eq(item.course_id)}`);
      await deleteRows(env, "attempt_resumes", `user_id=${eq(item.user_id)}&course_id=${eq(item.course_id)}`);
      await deleteRows(env, "enrollments", `user_id=${eq(item.user_id)}&course_id=${eq(item.course_id)}`);
      touchedUsers.add(item.user_id);
    }
    for (const userId of touchedUsers) {
      await updateProfile(env, userId, profile => ({
        ...profile,
        coursesOpted: (profile.coursesOpted || []).filter(c => !freeCourseIds.includes(c.id)),
        freeCourseCleanupAt: new Date().toISOString(),
      }));
    }
    await logEvent(env, actor, "cleanup.free_courses", `Cleaned ${targets.length} stale free-course enrollment${targets.length === 1 ? "" : "s"}`, { count: targets.length, days: body.days, freeCourseIds });
    return json({ success: true, cleanedEnrollments: targets.length, touchedUsers: touchedUsers.size, freeCourses: freeCourseIds.length });
  }

  return json({ error: "Unknown cleanup mode." }, 400);
}
