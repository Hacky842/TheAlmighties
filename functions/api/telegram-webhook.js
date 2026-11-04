import { getConfig, saveConfig, json } from "./config.js";

async function reply(env, chatId, text) {
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function onRequestPost({ request, env }) {
  if (env.WEBHOOK_SECRET) {
    const h = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
    if (h !== env.WEBHOOK_SECRET) return new Response("forbidden", { status: 403 });
  }

  let update;
  try {
    update = await request.json();
  } catch {
    return json({ ok: true });
  }

  const msg = update.message;
  if (!msg || !msg.text || !msg.from) return json({ ok: true });

  const chatId = msg.chat.id;
  const userId = String(msg.from.id);

  if (userId !== String(env.ADMIN_TELEGRAM_ID)) {
    await reply(env, chatId, "⛔ Unauthorized.");
    return json({ ok: true });
  }

  const parts = msg.text.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase().split("@")[0];
  const arg = msg.text.trim().slice(parts[0].length).trim();

  const cfg = await getConfig(env);
  let out = "";

  switch (cmd) {
    case "/start":
      out =
        "TheAlmighties admin.\n\n/setpassword [new_pass]\n/addchat [chat_id]\n/delchat [chat_id]\n/addmember [name]\n/delmember [name]\n/status";
      break;

    case "/setpassword":
      if (!arg) { out = "Usage: /setpassword [new_pass]"; break; }
      cfg.password = arg;
      out = (await saveConfig(env, cfg)) ? "✅ Password updated." : "❌ Save failed.";
      break;

    case "/addchat":
      if (!arg) { out = "Usage: /addchat [chat_id]"; break; }
      if (!cfg.chatIds.includes(arg)) cfg.chatIds.push(arg);
      out = (await saveConfig(env, cfg)) ? `✅ Chat added: ${arg}` : "❌ Save failed.";
      break;

    case "/delchat":
      if (!arg) { out = "Usage: /delchat [chat_id]"; break; }
      cfg.chatIds = cfg.chatIds.filter((c) => c !== arg);
      out = (await saveConfig(env, cfg)) ? `✅ Chat removed: ${arg}` : "❌ Save failed.";
      break;

    case "/addmember":
      if (!arg) { out = "Usage: /addmember [name]"; break; }
      if (!cfg.members.includes(arg)) cfg.members.push(arg);
      out = (await saveConfig(env, cfg)) ? `✅ Member added: ${arg}` : "❌ Save failed.";
      break;

    case "/delmember":
      if (!arg) { out = "Usage: /delmember [name]"; break; }
      cfg.members = cfg.members.filter((m) => m.toLowerCase() !== arg.toLowerCase());
      out = (await saveConfig(env, cfg)) ? `✅ Member removed: ${arg}` : "❌ Save failed.";
      break;

    case "/status":
      out =
        `📊 Status\n\nPassword: ${cfg.password}\n\n` +
        `Chats (${cfg.chatIds.length}):\n${cfg.chatIds.join("\n") || "-"}\n\n` +
        `Members (${cfg.members.length}):\n${cfg.members.join("\n") || "-"}`;
      break;

    default:
      out = "Unknown command. Send /start";
  }

  await reply(env, chatId, out);
  return json({ ok: true });
}
