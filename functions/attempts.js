import { client, json, readJson, saveUser, userIdFrom, cleanId } from "./_shared.js";
export async function onRequestOptions() { return json({ ok: true }); }
export async function onRequestGet({ request, env }) {
  const db = client(env);
  const url = new URL(request.url);
  const userId = cleanId(url.searchParams.get("offlineId") || url.searchParams.get("userId"));
  const userRow = userId ? await db.execute({ sql: "SELECT id,email,display_name,role,avatar_initials FROM users WHERE id=?", args: [userId] }) : { rows: [] };
  const rows = userId ? await db.execute({ sql: "SELECT detail_json FROM attempts WHERE user_id=? ORDER BY submitted_at DESC", args: [userId] }) : { rows: [] };
  const user = userRow.rows[0] ? { id: userRow.rows[0].id, offlineId: userRow.rows[0].id, email: userRow.rows[0].email, name: userRow.rows[0].display_name, role: userRow.rows[0].role, avatar: userRow.rows[0].avatar_initials } : null;
  const attempts = rows.rows.map(r => JSON.parse(r.detail_json || "{}"));
  return json({ user, attempts });
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
  await db.execute({
    sql: `INSERT INTO attempts (id,user_id,course_id,test_id,score,max_marks,total_questions,attempted_questions,correct_questions,wrong_questions,paper_time_seconds,answers_json,question_times_json,subject_analysis_json,analysis_json,detail_json,submitted_at)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [attemptId, user.id, detail.source.courseId || "", detail.source.testId || detail.testId || attemptId, Number(detail.score || 0), Number(detail.maxMarks || 0), Number(detail.totalQuestions || 0), Number((detail.attemptedQuestions || []).length || 0), Number(detail.correct || 0), Number(detail.wrong || 0), Number(detail.timeSpentSec || 0), JSON.stringify(detail.attemptedQuestions || []), JSON.stringify(detail.questionTimes || {}), JSON.stringify(detail.subjects || []), JSON.stringify(detail), JSON.stringify(detail), detail.submittedAt],
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
