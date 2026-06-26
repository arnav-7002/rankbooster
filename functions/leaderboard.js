import { cleanId, eq, json, supabaseRequest } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

function betterAttempt(a, b) {
  if (!b) return true;
  const scoreA = Number(a.score || 0);
  const scoreB = Number(b.score || 0);
  if (scoreA !== scoreB) return scoreA > scoreB;
  const timeA = Number(a.paper_time_seconds || 0) || Number.MAX_SAFE_INTEGER;
  const timeB = Number(b.paper_time_seconds || 0) || Number.MAX_SAFE_INTEGER;
  if (timeA !== timeB) return timeA < timeB;
  return new Date(a.submitted_at || 0).getTime() < new Date(b.submitted_at || 0).getTime();
}

function avatarFrom(row) {
  const base = row?.avatar_initials || row?.display_name || row?.email || "ST";
  return String(base).slice(0, 2).toUpperCase();
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const testId = cleanId(url.searchParams.get("testId"));
  const currentUserId = cleanId(url.searchParams.get("offlineId") || url.searchParams.get("userId"));
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 10), 3), 50);
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);
  if (!testId) return json({ entries: [], myRank: null, total: 0, error: "testId required" }, 400);

  const attemptRows = await supabaseRequest(
    env,
    `attempts?select=user_id,id,score,max_marks,total_questions,correct_questions,wrong_questions,paper_time_seconds,submitted_at,detail_json&test_id=${eq(testId)}&order=score.desc`
  ).catch(() => []);

  const bestByUser = new Map();
  for (const row of attemptRows || []) {
    if (!row.user_id) continue;
    if (betterAttempt(row, bestByUser.get(row.user_id))) bestByUser.set(row.user_id, row);
  }

  const ids = Array.from(bestByUser.keys()).map(cleanId).filter(Boolean);
  let users = [];
  if (ids.length) {
    const inList = ids.map(id => `"${id}"`).join(",");
    users = await supabaseRequest(env, `users?select=id,email,display_name,avatar_initials&id=in.(${inList})`).catch(() => []);
  }
  const usersById = new Map((users || []).map(row => [row.id, row]));

  const ranked = Array.from(bestByUser.entries())
    .map(([userId, attempt]) => {
      const user = usersById.get(userId) || {};
      const detail = attempt.detail_json || {};
      const name = user.display_name || detail.userName || "Student";
      return {
        userId,
        name,
        avatar: avatarFrom(user),
        isMe: currentUserId && currentUserId === userId,
        attemptId: attempt.id,
        score: Number(attempt.score || 0),
        maxMarks: Number(attempt.max_marks || detail.maxMarks || 0),
        correct: Number(attempt.correct_questions || detail.correct || 0),
        wrong: Number(attempt.wrong_questions || detail.wrong || 0),
        timeSpentSec: Number(attempt.paper_time_seconds || detail.timeSpentSec || 0),
        submittedAt: attempt.submitted_at,
      };
    })
    .sort((a, b) =>
      (b.score - a.score) ||
      ((a.timeSpentSec || Number.MAX_SAFE_INTEGER) - (b.timeSpentSec || Number.MAX_SAFE_INTEGER)) ||
      (new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime())
    );

  let lastScore = null;
  let lastTime = null;
  let rank = 0;
  const entries = ranked.map((entry, index) => {
    const tieTime = entry.timeSpentSec || Number.MAX_SAFE_INTEGER;
    if (entry.score !== lastScore || tieTime !== lastTime) {
      rank = index + 1;
      lastScore = entry.score;
      lastTime = tieTime;
    }
    return { ...entry, rank };
  });

  const mine = entries.find(e => e.isMe) || null;
  return json({ entries: entries.slice(offset, offset + limit), myRank: mine?.rank || null, mine, total: entries.length, offset, limit });
}
