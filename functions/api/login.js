import { getConfig, json } from "./config.js";

export async function onRequestPost({ request, env }) {
  let body = {};
  try {
    body = await request.json();
  } catch {}
  const cfg = await getConfig(env);

  const given = String(body.password || "").trim();
  if (!given || given !== String(cfg.password).trim()) {
    return json({ ok: false, error: "Incorrect password." }, 401);
  }
  // Members are revealed only after a correct password
  return json({ ok: true, members: cfg.members });
}
