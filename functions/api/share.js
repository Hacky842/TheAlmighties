import { getConfig, isAuthed, json } from "./config.js";

const MAX = 50 * 1024 * 1024; // Telegram bot upload limit = 50MB

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const api = (env, method) =>
  `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`;

async function sendText(env, chatId, text) {
  return fetch(api(env, "sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
}

export async function onRequestPost({ request, env }) {
  const cfg = await getConfig(env);
  if (!isAuthed(request, cfg)) return json({ ok: false, error: "Unauthorized" }, 401);

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: "Bad request" }, 400);
  }

  const message = String(form.get("message") || "").trim();
  const file = form.get("file");
  const hasFile = file && typeof file === "object" && file.size > 0;

  if (!message && !hasFile) {
    return json({ ok: false, error: "Write a message or attach a file." }, 400);
  }
  if (hasFile && file.size > MAX) {
    return json({ ok: false, error: "File is larger than 50 MB (Telegram limit)." }, 413);
  }

  const text = "<b>TheAlmighties</b>" + (message ? "\n\n" + esc(message).slice(0, 3500) : "");
  const longText = text.length > 1000; // caption limit is 1024 chars

  let sent = 0, failed = 0, fileId = null;

  for (const chatId of cfg.chatIds) {
    try {
      if (!hasFile) {
        const r = await sendText(env, chatId, text);
        r.ok ? sent++ : failed++;
        continue;
      }

      const fd = new FormData();
      fd.append("chat_id", chatId);
      fd.append("parse_mode", "HTML");
      fd.append("caption", longText ? "<b>TheAlmighties</b>" : text);
      // First chat: upload real file. Others: reuse Telegram file_id (no re-upload)
      if (fileId) fd.append("document", fileId);
      else fd.append("document", file, file.name || "file");

      const r = await fetch(api(env, "sendDocument"), { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));

      if (r.ok && d.ok) {
        sent++;
        if (!fileId && d.result && d.result.document) fileId = d.result.document.file_id;
        if (longText) await sendText(env, chatId, text);
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }
  return json({ ok: true, sent, failed });
}
