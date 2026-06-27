import { json, readJson, supabaseRequest, upsertRows, eq } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

const DEFAULT_SETTINGS = {
  banner: { enabled: false, text: "", variant: "info" },
  homeAnnouncement: { enabled: false, title: "", body: "", target: "all", courseId: "" },
  payments: { enabled: false, upiId: "", payeeName: "RankBooster", note: "Scan the QR, complete payment, then enter the UTR/reference ID." },
  resumes: { expiryHours: 24 },
  cleanup: { noPassInactiveDays: "never", freeCourseInactiveDays: "never" },
};

export async function onRequestGet({ env }) {
  const rows = await supabaseRequest(env, `app_settings?select=key,value_json&key=${eq("announcements")}&limit=1`).catch(() => []);
  return json({ success: true, settings: { ...DEFAULT_SETTINGS, ...(rows?.[0]?.value_json || {}) } });
}

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const settings = { ...DEFAULT_SETTINGS, ...(body.settings || body) };
  await upsertRows(env, "app_settings", {
    key: "announcements",
    value_json: settings,
    updated_at: new Date().toISOString(),
  }, "key");
  return json({ success: true, settings });
}
