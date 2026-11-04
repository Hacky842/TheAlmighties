import { getConfig, isAuthed, json } from "./config.js";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const fmtSize = (b) =>
  b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : (b / 1024).toFixed(1) + " KB";

export async function onRequestPost({ request, env }) {
  const cfg = await getConfig(env);
  if (!isAuthed(request, cfg)) return json({ ok: false, error: "Unauthorized" }, 401);

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Bad request" }, 400);
  }

  const message = (body.message || "").trim();
  const { fileKey, fileName, fileSize } = body;
  if (!message && !fileKey) {
    return json({ ok: false, error: "Write a message or attach a file." }, 400);
  }

  let text = "<b>TheAlmighties</b>\n";
  if (message) text += "\n" + esc(message).slice(0, 3000) + "\n";
  if (fileKey) {
    const origin = new URL(request.url).origin;
    const link = `${origin}/api/file/${String(fileKey).split("/").map(encodeURIComponent).join("/")}`;
    text += `\n📎 <a href="${esc(link)}">${esc(fileName || "Download file")}</a>`;
    if (fileSize) text += ` (${fmtSize(fileSize)})`;
  }

  let sent = 0;
  let failed = 0;
  for (const chatId of cfg.chatIds) {
    const r = await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }
    );
    r.ok ? sent++ : failed++;
  }
  return json({ ok: true, sent, failed });
}
