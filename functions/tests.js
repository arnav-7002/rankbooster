import { json, readJson, cleanId, slugify, supabaseRequest, upsertRows, eq } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

function normalizeGitHubUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    if (u.hostname === "github.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      const blobIdx = parts.indexOf("blob");
      if (parts.length >= 5 && blobIdx === 2) {
        return `https://raw.githubusercontent.com/${parts[0]}/${parts[1]}/${parts.slice(3).join("/")}`;
      }
    }
  } catch {}
  return raw;
}

async function ensureCourse(env, body) {
  const title = String(body.courseTitle || body.course?.title || "Course");
  const id = cleanId(body.courseId || body.course?.id) || slugify(title);
  await upsertRows(env, "courses", {
    id,
    slug: slugify(title),
    title,
    is_published: true,
    updated_at: new Date().toISOString(),
  });
  return id;
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const courseId = await ensureCourse(env, body);
  const title = String(body.name || body.title || body.testName || "Test").trim();
  const id = cleanId(body.id || body.testId) || cleanId(`${courseId}_${slugify(body.folderName || "Tests")}_${slugify(title)}`);
  const sourceUrl = normalizeGitHubUrl(body.sourceUrl || body.githubUrl || body.testUrl);
  const examConfig = body.examConfig || body.config || {};
  const configured = body.configured !== false && !!sourceUrl;
  const row = {
    id,
    course_id: courseId,
    folder_name: body.folderName || "Tests",
    title,
    slug: slugify(title),
    exam_type: examConfig.examType || body.examType || "other",
    duration_minutes: Number(body.duration || body.durationMinutes || 180),
    max_marks: Number(body.maxMarks || body.max_marks || 0),
    total_questions: Number(body.totalQuestions || 0),
    source_url: sourceUrl,
    config_json: examConfig,
    scheduled_at: body.scheduledAt || null,
    scheduled_until: body.scheduledUntil || null,
    is_configured: configured,
    is_published: body.isPublished !== false,
    updated_at: new Date().toISOString(),
  };
  await upsertRows(env, "tests", row);
  return json({
    success: true,
    test: {
      id,
      name: title,
      folderName: row.folder_name,
      duration: row.duration_minutes,
      maxMarks: row.max_marks,
      sourceUrl,
      configured,
      examConfig,
      isPublished: row.is_published !== false,
      scheduledAt: body.scheduledAt || "",
      scheduledUntil: body.scheduledUntil || "",
    },
  });
}

export async function onRequestDelete({ request, env }) {
  const body = await readJson(request);
  const id = cleanId(body.testId || body.id);
  if (!id) return json({ error: "testId required" }, 400);
  await supabaseRequest(env, `tests?id=${eq(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
  return json({ success: true, deleted: true });
}
