import { cleanId, eq, json, readJson, supabaseRequest, upsertRows, userIdFrom } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

const SETTINGS_KEY = "announcements";

async function loadSettings(env) {
  const rows = await supabaseRequest(env, `app_settings?select=value_json&key=${eq(SETTINGS_KEY)}&limit=1`).catch(() => []);
  return rows[0]?.value_json || {};
}

function expiresAtFromSettings(settings) {
  const raw = settings?.resumes?.expiryHours;
  if (raw === "infinite" || raw === 0 || raw === "0") return null;
  const hours = Math.max(1, Number(raw || 24));
  return new Date(Date.now() + hours * 3600000).toISOString();
}

function isExpired(row) {
  if (!row?.expires_at) return false;
  const t = new Date(row.expires_at).getTime();
  return Number.isFinite(t) && t <= Date.now();
}

function mapResume(row) {
  const detail = row.detail_json || {};
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    testId: row.test_id,
    courseTitle: row.course_title || detail.courseTitle || "",
    folderName: row.folder_name || detail.folderName || "",
    testName: row.test_name || detail.testName || "",
    expiresAt: row.expires_at || null,
    updatedAt: row.updated_at,
    state: detail.state || detail,
    detail,
  };
}

async function deleteResume(env, filter) {
  await supabaseRequest(env, `attempt_resumes?${filter}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  }).catch(() => null);
}

async function cleanupExpired(env, rows) {
  const expired = (rows || []).filter(isExpired);
  for (const row of expired) {
    await deleteResume(env, `id=${eq(row.id)}`);
  }
  return (rows || []).filter(row => !isExpired(row));
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const all = url.searchParams.get("all") === "1";
  const userId = userIdFrom({ offlineId: url.searchParams.get("offlineId"), email: url.searchParams.get("email") });
  const testId = cleanId(url.searchParams.get("testId"));

  const filters = ["select=*"];
  if (!all) {
    if (!userId) return json({ resumes: [] });
    filters.push(`user_id=${eq(userId)}`);
  }
  if (testId) filters.push(`test_id=${eq(testId)}`);
  filters.push("order=updated_at.desc");

  const rows = await supabaseRequest(env, `attempt_resumes?${filters.join("&")}`).catch(() => []);
  const activeRows = await cleanupExpired(env, rows);
  return json({ resumes: activeRows.map(mapResume) });
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const userId = userIdFrom(body.user || body.offlineId || body.userId);
  const state = body.state || {};
  const test = body.test || {};
  const source = state.source || {};
  const testId = cleanId(body.testId || state.testId || source.testId || test.id || test.testId || test.sourceZip || test.name);
  const courseId = cleanId(body.courseId || state.courseId || source.courseId || test.courseId || "course");
  if (!userId || !testId) return json({ error: "user and test are required" }, 400);

  const settings = await loadSettings(env);
  const expiresAt = expiresAtFromSettings(settings);
  const id = cleanId(`resume_${userId}_${testId}`);
  const now = new Date().toISOString();
  const detail = {
    ...state,
    userId,
    courseId,
    testId,
    courseTitle: state.courseTitle || source.courseTitle || test.courseTitle || "",
    folderName: state.folderName || source.folderName || test.folderName || test.folder || "",
    testName: state.testName || source.testName || test.name || "Test",
    expiresAt,
    updatedAt: now,
  };

  const rows = await upsertRows(env, "attempt_resumes", {
    id,
    user_id: userId,
    course_id: courseId,
    test_id: testId,
    course_title: detail.courseTitle,
    folder_name: detail.folderName,
    test_name: detail.testName,
    expires_at: expiresAt,
    detail_json: detail,
    updated_at: now,
  });

  return json({ success: true, resume: mapResume(rows?.[0] || { id, user_id: userId, course_id: courseId, test_id: testId, detail_json: detail, updated_at: now, expires_at: expiresAt }) });
}

export async function onRequestDelete({ request, env }) {
  const body = await readJson(request);
  const actor = body.actor || {};
  const userId = userIdFrom(body.user || body.offlineId || body.userId);
  const testId = cleanId(body.testId);
  const resumeId = cleanId(body.resumeId || body.id);

  if (body.expiredOnly) {
    const rows = await supabaseRequest(env, "attempt_resumes?select=id,expires_at").catch(() => []);
    const expired = rows.filter(isExpired);
    for (const row of expired) await deleteResume(env, `id=${eq(row.id)}`);
    await logEvent(env, actor, "resume.expired_deleted", `Deleted ${expired.length} expired resume${expired.length === 1 ? "" : "s"}`, { count: expired.length });
    return json({ success: true, deleted: expired.length, mode: "expired" });
  }

  if (body.all) {
    await deleteResume(env, "id=not.is.null");
    await logEvent(env, actor, "resumes.deleted", "Deleted all in-progress test resumes", {});
    return json({ success: true, deleted: true, mode: "all" });
  }

  if (resumeId) {
    await deleteResume(env, `id=${eq(resumeId)}`);
    await logEvent(env, actor, "resume.deleted", "Deleted one in-progress test resume", { resumeId });
    return json({ success: true, deleted: true, mode: "resume" });
  }

  if (userId && testId) {
    await deleteResume(env, `user_id=${eq(userId)}&test_id=${eq(testId)}`);
    await logEvent(env, actor, "resume.deleted", "Deleted user test resume", { userId, testId });
    return json({ success: true, deleted: true, mode: "user_test" });
  }

  if (userId && body.allForUser) {
    await deleteResume(env, `user_id=${eq(userId)}`);
    await logEvent(env, actor, "resumes.user_deleted", "Deleted all resumes for a user", { userId });
    return json({ success: true, deleted: true, mode: "user" });
  }

  return json({ error: "resumeId, userId+testId, expiredOnly, allForUser, or all required" }, 400);
}

async function logEvent(env, actor, type, message, metadata = {}) {
  await upsertRows(env, "admin_events", {
    id: cleanId(`evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
    actor_user_id: cleanId(actor.id || actor.offlineId || ""),
    event_type: type,
    entity_type: "resume",
    entity_id: cleanId(metadata.resumeId || metadata.userId || metadata.testId || ""),
    payload_json: { message, actor_email: String(actor.email || "").toLowerCase(), metadata },
    created_at: new Date().toISOString(),
  }).catch(() => null);
}
