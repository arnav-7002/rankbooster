import { json, supabaseRequest } from "./_shared.js";

export async function onRequestOptions() { return json({ ok: true }); }

export async function onRequestGet({ env }) {
  try {
    const started = Date.now();
    await supabaseRequest(env, "users?select=id&limit=1");
    return json({ ok: true, supabase: true, latencyMs: Date.now() - started, message: "Supabase connected" });
  } catch (error) {
    return json({ ok: false, supabase: false, message: error?.message || "Supabase check failed" }, 500);
  }
}