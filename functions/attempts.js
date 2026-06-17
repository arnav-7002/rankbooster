import { json, readJson, saveUser, userIdFrom, cleanId, slugify, supabaseRequest, upsertRows, eq } from "./_shared.js";
export async function onRequestOptions() { return json({ ok: true }); }

async function upsertAttemptCourseAndTest(env, detail) {
  const src = detail.source || {};
  const courseId = cleanId(src.courseId || detail.courseId || slugify(src.courseTitle || detail.courseTitle || "course"));
  const courseTitle = String(src.courseTitle || detail.courseTitle || courseId);
  const folderName = String(src.folderName || detail.folderName || "Tests");
  const testId = cleanId(src.testId || detail.testId || src.sourceZip || detail.sourceZip || detail.attemptId);
  const testTitle = String(src.testName || detail.testName || testId);
  await upsertRows(env, "courses", { id: courseId, slug: slugify(courseTitle), title: courseTitle, subjects_json: [], folders_json: [], is_published: true, updated_at: new Date().toISOString() });
  await upsertRows(env, "tests", {
    id: testId, course_id: courseId, folder_name: folderName, title: testTitle, slug: slugify(testTitle),
    duration_minutes: Number(detail.durationMinutes || 180), max_marks: Number(detail.maxMarks || 0), total_questions: Number(detail.totalQuestions || 0),
    source_url: src.sourceUrl || detail.sourceUrl || "",
    is_configured: true, is_published: true, updated_at: new Date().toISOString(),
  });
  return { courseId, testId };
}

async function loadProfile(env, userId) {
  const rows = await supabaseRequest(env, `user_blobs?select=value_json&user_id=${eq(userId)}&blob_key=${eq("profile")}&limit=1`).catch(() => []);
  return rows[0]?.value_json || {};
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const userId = userIdFrom({ offlineId: url.searchParams.get("offlineId"), email: url.searchParams.get("email") });
  const userRows = userId ? await supabaseRequest(env, `users?select=id,email,display_name,role,avatar_initials&id=${eq(userId)}&limit=1`).catch(() => []) : [];
  const rows = userId ? await supabaseRequest(env, `attempts?select=detail_json&user_id=${eq(userId)}&order=submitted_at.desc`).catch(() => []) : [];
  const profile = userId ? await loadProfile(env, userId) : {};
  const user = userRows[0] ? { id: userRows[0].id, offlineId: userRows[0].id, email: userRows[0].email, name: userRows[0].display_name, role: userRows[0].role, avatar: userRows[0].avatar_initials, pass: profile.pass || null } : null;
  return json({ user, attempts: rows.map(r => r.detail_json || {}), coursesOpted: profile.coursesOpted || [], pass: profile.pass || null });
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const user = await saveUser(env, body.user || {});
  const attempt = body.attempt || {};
  const attemptId = cleanId(attempt.attemptId || `attempt_${Date.now()}`);
  const source = attempt.source || {};
  const detail = {
    ...attempt,
    attemptId,
    submittedAt: attempt.submittedAt || new Date().toISOString(),
    source: {
      courseId: attempt.courseId || source.courseId || null,
      courseTitle: attempt.courseTitle || source.courseTitle || "",
      folderId: attempt.folderId || source.folderId || null,
      folderName: attempt.folderName || source.folderName || "",
      testId: attempt.testId || source.testId || null,
      testName: attempt.testName || source.testName || "",
      sourceZip: attempt.sourceZip || source.sourceZip || "",
      sourceUrl: attempt.sourceUrl || source.sourceUrl || "",
    },
  };
  const refs = await upsertAttemptCourseAndTest(env, detail);
  detail.source.courseId = refs.courseId;
  detail.source.testId = refs.testId;
  await upsertRows(env, "attempts", {
    id: attemptId, user_id: user.id, course_id: refs.courseId, test_id: refs.testId,
    score: Number(detail.score || 0), max_marks: Number(detail.maxMarks || 0), total_questions: Number(detail.totalQuestions || 0),
    attempted_questions: Number((detail.attemptedQuestions || []).length || 0), correct_questions: Number(detail.correct || 0), wrong_questions: Number(detail.wrong || 0), paper_time_seconds: Number(detail.timeSpentSec || 0),
    answers_json: detail.attemptedQuestions || [], question_times_json: detail.questionTimes || {}, subject_analysis_json: detail.subjects || [], analysis_json: detail, detail_json: detail, submitted_at: detail.submittedAt,
  });
  await upsertRows(env, "admin_events", {
    id: cleanId(`evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
    actor_user_id: user.id,
    event_type: "attempt.submitted",
    entity_type: "attempt",
    entity_id: attemptId,
    payload_json: { message: `${user.name || user.email} submitted ${detail.source.testName || detail.testName || "a test"}`, actor_email: user.email, metadata: { attemptId, courseId: refs.courseId, testId: refs.testId, score: Number(detail.score || 0), maxMarks: Number(detail.maxMarks || 0) } },
    created_at: new Date().toISOString(),
  }).catch(() => null);
  return json({ success: true, user, attempt: detail });
}

export async function onRequestDelete({ request, env }) {
  const body = await readJson(request);
  const actor = body.actor || {};
  const userId = userIdFrom(body.user || body.offlineId || body.userId);
  const attemptId = cleanId(body.attemptId);
  const testIds = Array.isArray(body.testIds) ? body.testIds.map(cleanId).filter(Boolean) : [];
  const testId = cleanId(body.testId);

  if (attemptId) {
    const filter = userId ? `user_id=${eq(userId)}&id=${eq(attemptId)}` : `id=${eq(attemptId)}`;
    await supabaseRequest(env, `attempts?${filter}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    await logDelete(env, actor, "attempt.deleted", "Deleted one attempt", { attemptId, userId });
    return json({ success: true, deleted: true, mode: "attempt" });
  }

  if (userId && body.allForUser) {
    await supabaseRequest(env, `attempts?user_id=${eq(userId)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    await logDelete(env, actor, "attempts.user_deleted", "Deleted all attempts for a user", { userId });
    return json({ success: true, deleted: true, mode: "user" });
  }

  const ids = testIds.length ? testIds : (testId ? [testId] : []);
  if (ids.length) {
    for (const id of ids) {
      await supabaseRequest(env, `attempts?test_id=${eq(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    }
    await logDelete(env, actor, "attempts.test_deleted", `Deleted attempts for ${ids.length} test${ids.length === 1 ? "" : "s"}`, { testIds: ids });
    return json({ success: true, deleted: true, mode: "tests", testIds: ids });
  }

  return json({ error: "attemptId, allForUser, testId, or testIds required" }, 400);
}

async function logDelete(env, actor, type, message, metadata = {}) {
  await upsertRows(env, "admin_events", {
    id: cleanId(`evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`),
    actor_user_id: cleanId(actor.id || actor.offlineId || ""),
    event_type: type,
    entity_type: "attempt",
    entity_id: cleanId(metadata.attemptId || metadata.userId || metadata.testIds?.[0] || ""),
    payload_json: { message, actor_email: String(actor.email || "").toLowerCase(), metadata },
    created_at: new Date().toISOString(),
  }).catch(() => null);
}
