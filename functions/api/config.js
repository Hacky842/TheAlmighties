// Shared helpers + public GET /api/config (definitions only)

const DEFAULTS = {
  password: "",
  almightyDef:
    "Almighty (adjective): having complete power; unlimited in authority, capability and influence.",
  almightiesDef:
    "Almighties (noun, plural): a collective of individuals united by trust, capability and shared purpose.",
  members: [],
  chatIds: [],
};

const basketUrl = (env) =>
  `https://getpantry.cloud/apiv1/pantry/${env.PANTRY_ID}/basket/config`;

export const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export async function getConfig(env) {
  const r = await fetch(basketUrl(env), { cache: "no-store" });
  if (r.ok) {
    const data = { ...DEFAULTS, ...(await r.json()) };
    // Safety: if saved password is empty, fall back to INITIAL_PASSWORD
    if (!data.password && env.INITIAL_PASSWORD) data.password = String(env.INITIAL_PASSWORD).trim();
    // Safety: drop junk chat ids like "undefined"
    data.chatIds = (data.chatIds || []).map(String).filter((c) => c && c !== "undefined" && c !== "null");
    if (!data.chatIds.length && env.ADMIN_TELEGRAM_ID) data.chatIds = [String(env.ADMIN_TELEGRAM_ID).trim()];
    return data;
  }
  // First run: basket does not exist yet -> create it
  const init = {
    ...DEFAULTS,
    password: String(env.INITIAL_PASSWORD || "").trim(),
    chatIds: env.ADMIN_TELEGRAM_ID ? [String(env.ADMIN_TELEGRAM_ID).trim()] : [],
  };
  await fetch(basketUrl(env), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(init),
  });
  return init;
}

export async function saveConfig(env, cfg) {
  const r = await fetch(basketUrl(env), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cfg),
  });
  return r.ok;
}

export function isAuthed(request, cfg) {
  const given = (request.headers.get("x-portal-password") || "").trim();
  return given.length > 0 && given === String(cfg.password).trim();
}

export async function onRequestGet({ env }) {
  const cfg = await getConfig(env);
  // Public: only definitions. No names, no password, no chat IDs.
  return json({
    almightyDef: cfg.almightyDef,
    almightiesDef: cfg.almightiesDef,
  });
}
