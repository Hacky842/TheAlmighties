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
    const data = await r.json();
    return { ...DEFAULTS, ...data };
  }
  // First run: basket does not exist yet -> create it
  const init = {
    ...DEFAULTS,
    password: env.INITIAL_PASSWORD,
    chatIds: [String(env.ADMIN_TELEGRAM_ID)],
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
  const given = request.headers.get("x-portal-password") || "";
  return given.length > 0 && given === cfg.password;
}

export async function onRequestGet({ env }) {
  const cfg = await getConfig(env);
  // Public: only definitions. No names, no password, no chat IDs.
  return json({
    almightyDef: cfg.almightyDef,
    almightiesDef: cfg.almightiesDef,
  });
}
