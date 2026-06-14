import { client, json, readJson, saveUser, userIdFrom, cleanId } from "./_shared.js";
export async function onRequestOptions() { return json({ ok: true }); }

function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || `item_${Date.now()}`;
}

function parseJson(value, fallback) {
  try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
}

async function upsertAttemptCourseAndTest(db, detail) {
  const src = detail.source || {};
  const courseId = cleanId(src.courseId || detail.courseId || slugify(src.courseTitle || detail.courseTitle || "course"));
  const courseTitle = String(src.courseTitle || detail.courseTitle || courseId);
  const folderName = String(src.folderName || detail.folderName || "Tests");
  const testId = cleanId(src.testId || detail.testId || src.sourceZip || detail.sourceZip || detail.attemptId);
  const testTitle = String(src.testName || detail.testName || testId);
  await db.execute({
    sql: `INSERT INTO courses (id, slug, title, subtitle, price_inr, original_price_inr, subjects_json, folders_json, is_published, updated_at)
          VALUES (?, ?, ?, '', 0, 0, '[]', '[]', 1, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET title=excluded.title, updated_at=CURRENT_TIMESTAMP`,
    args: [courseId, slugify(courseTitle), courseTitle],
  });
  await db.execute({
    sql: `INSERT INTO tests (id, course_id, folder_name, title, slug, duration_minutes, max_marks, total_questions, is_configured, is_published, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET title=excluded.title, max_marks=excluded.max_marks, total_questions=excluded.total_questions, updated_at=CURRENT_TIMESTAMP`,
    args: [testId, courseId, folderName, testTitle, slugify(testTitle), Number(detail.durationMinutes || 180), Number(detail.maxMarks || 0), Number(detail.totalQuestions || 0)],
  });
  return { courseId, testId };
}

export async function onRequestGet({ request, env }) {
  const db = client(env);
  const url = new URL(request.url);
  const userId = userIdFrom({ offlineId: url.searchParams.get("offlineId"), email: url.searchParams.get("email") });
  const userRow = userId ? await db.execute({ sql: "SELECT id,email,display_name,role,avatar_initials FROM users WHERE id=?", args: [userId] }) : { rows: [] };
  const rows = userId ? await db.execute({ sql: "SELECT detail_json FROM attempts WHERE user_id=? ORDER BY submitted_at DESC", args: [userId] }) : { rows: [] };
  const profileRow = userId ? await db.execute({ sql: "SELECT value_json FROM user_blobs WHERE user_id=? AND blob_key='profile'", args: [userId] }).catch(() => ({ rows: [] })) : { rows: [] };
  const profile = parseJson(profileRow.rows[0]?.value_json, {});
  const user = userRow.rows[0] ? { id: userRow.rows[0].id, offlineId: userRow.rows[0].id, email: userRow.rows[0].email, name: userRow.rows[0].display_name, role: userRow.rows[0].role, avatar: userRow.rows[0].avatar_initials, pass: profile.pass || null } : null;
  const attempts = rows.rows.map(r => parseJson(r.detail_json, {}));
  return json({ user, attempts, coursesOpted: profile.coursesOpted || [], pass: profile.pass || null });
}
export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const db = client(env);
  const user = await saveUser(db, body.user || {});
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
    },
  };
  const refs = await upsertAttemptCourseAndTest(db, detail);
  detail.source.courseId = refs.courseId;
  detail.source.testId = refs.testId;
  await db.execute({
    sql: `INSERT INTO attempts (id,user_id,course_id,test_id,score,max_marks,total_questions,attempted_questions,correct_questions,wrong_questions,paper_time_seconds,answers_json,question_times_json,subject_analysis_json,analysis_json,detail_json,submitted_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT(id) DO UPDATE SET score=excluded.score, max_marks=excluded.max_marks, total_questions=excluded.total_questions, attempted_questions=excluded.attempted_questions, correct_questions=excluded.correct_questions, wrong_questions=excluded.wrong_questions, paper_time_seconds=excluded.paper_time_seconds, answers_json=excluded.answers_json, question_times_json=excluded.question_times_json, subject_analysis_json=excluded.subject_analysis_json, analysis_json=excluded.analysis_json, detail_json=excluded.detail_json, submitted_at=excluded.submitted_at`,
    args: [attemptId, user.id, refs.courseId, refs.testId, Number(detail.score || 0), Number(detail.maxMarks || 0), Number(detail.totalQuestions || 0), Number((detail.attemptedQuestions || []).length || 0), Number(detail.correct || 0), Number(detail.wrong || 0), Number(detail.timeSpentSec || 0), JSON.stringify(detail.attemptedQuestions || []), JSON.stringify(detail.questionTimes || {}), JSON.stringify(detail.subjects || []), JSON.stringify(detail), JSON.stringify(detail), detail.submittedAt],
  });
  return json({ success: true, user, attempt: detail });
}
export async function onRequestDelete({ request, env }) {
  const body = await readJson(request);
  const db = client(env);
  const userId = userIdFrom(body.user || body.offlineId);
  const attemptId = cleanId(body.attemptId);
  if (!userId || !attemptId) return json({ error: "offlineId and attemptId required" }, 400);
  await db.execute({ sql: "DELETE FROM attempts WHERE user_id=? AND id=?", args: [userId, attemptId] });
  return json({ success: true, deleted: true });
}