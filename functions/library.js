import { json, staticJson, supabaseRequest } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestGet({ request, env }) {
  const data = await staticJson(request, ["data", "library.json"], { courses: [] }).catch(() => ({ courses: [] }));
  let courses = [...(data.courses || [])];
  try {
    const [courseRows, testRows] = await Promise.all([
      supabaseRequest(env, "courses?select=*&is_published=eq.true&order=created_at.asc"),
      supabaseRequest(env, "tests?select=*&is_published=eq.true&order=created_at.asc"),
    ]);
    const byCourse = new Map();
    for (const row of courseRows || []) {
      byCourse.set(row.id, {
        id: row.id,
        title: row.title,
        subtitle: row.subtitle || "",
        description: row.description || "",
        price: row.price_inr || 0,
        originalPrice: row.original_price_inr || row.price_inr || 0,
        badge: row.badge || "New",
        color: row.accent_color || "#7C3AED",
        textColor: row.text_color || "#A78BFA",
        subjects: row.subjects_json || [],
        testFolders: (row.folders_json || []).map(f => ({ id: f.id || f.name, name: f.name, icon: f.icon || "folder", tests: [] })),
      });
    }
    const seenTests = new Set();
    for (const row of testRows || []) {
      const course = byCourse.get(row.course_id);
      if (!course) continue;
      let folder = course.testFolders.find(f => f.name === row.folder_name);
      if (!folder) {
        folder = { id: `f_${row.folder_name || "Tests"}`, name: row.folder_name || "Tests", icon: "folder", tests: [] };
        course.testFolders.push(folder);
      }
      const sourceKey = String(row.source_url || "").trim();
      const dedupeKey = `${row.course_id}::${row.folder_name || "Tests"}::${sourceKey || row.id}`;
      if (seenTests.has(dedupeKey)) continue;
      seenTests.add(dedupeKey);
      folder.tests.push({
        id: row.id,
        name: row.title,
        duration: row.duration_minutes || 180,
        maxMarks: row.max_marks || 0,
        totalQuestions: row.total_questions || 0,
        sourceUrl: row.source_url || "",
        configured: !!row.is_configured,
        examConfig: row.config_json || {},
        scheduledAt: row.scheduled_at || "",
        scheduledUntil: row.scheduled_until || "",
      });
    }
    courses = [...courses.filter(c => !byCourse.has(c.id)), ...byCourse.values()];
  } catch (err) {
    return json({ ...data, courses, dbWarning: err.message || "Supabase library unavailable" });
  }
  return json({ ...data, courses });
}
