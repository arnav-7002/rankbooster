import { client, json } from "./_shared.js";

export async function onRequestOptions() {
  return json({ ok: true });
}

export async function onRequestGet({ env }) {
  try {
    const db = client(env);
    const started = Date.now();
    await db.execute("SELECT 1 AS ok");
    return json({ ok: true, turso: true, latencyMs: Date.now() - started, message: "Turso DB connected" });
  } catch (error) {
    return json({ ok: false, turso: false, message: error?.message || "Turso DB check failed" }, 500);
  }
}