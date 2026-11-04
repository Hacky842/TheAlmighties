import { getConfig, isAuthed, json } from "../config.js";

const MAX_SIZE = 200 * 1024 * 1024; // 200MB

const safeName = (n) =>
  String(n || "file").replace(/[^\w.\-() ]+/g, "_").slice(0, 120);

export async function onRequest({ request, env, params }) {
  const segs = Array.isArray(params.path) ? params.path : [params.path];
  const first = segs[0];
  const method = request.method;
  const url = new URL(request.url);

  // ---------- Upload endpoints (password required) ----------
  if (first === "init" || first === "part" || first === "complete") {
    const cfg = await getConfig(env);
    if (!isAuthed(request, cfg)) return json({ ok: false, error: "Unauthorized" }, 401);

    if (first === "init" && method === "POST") {
      const b = await request.json();
      if (b.size && b.size > MAX_SIZE) {
        return json({ ok: false, error: "File exceeds 200MB." }, 413);
      }
      const key = `${crypto.randomUUID()}/${safeName(b.name)}`;
      const mp = await env.BUCKET.createMultipartUpload(key, {
        httpMetadata: { contentType: b.type || "application/octet-stream" },
      });
      return json({ ok: true, key, uploadId: mp.uploadId });
    }

    if (first === "part" && method === "PUT") {
      const key = url.searchParams.get("key");
      const uploadId = url.searchParams.get("uploadId");
      const n = parseInt(url.searchParams.get("n"), 10);
      if (!key || !uploadId || !n) return json({ ok: false, error: "Bad params" }, 400);
      const mp = env.BUCKET.resumeMultipartUpload(key, uploadId);
      const part = await mp.uploadPart(n, request.body);
      return json({ ok: true, partNumber: part.partNumber, etag: part.etag });
    }

    if (first === "complete" && method === "POST") {
      const b = await request.json();
      const mp = env.BUCKET.resumeMultipartUpload(b.key, b.uploadId);
      const obj = await mp.complete(b.parts);
      if (obj.size > MAX_SIZE) {
        await env.BUCKET.delete(b.key);
        return json({ ok: false, error: "File exceeds 200MB." }, 413);
      }
      return json({ ok: true, key: b.key, size: obj.size });
    }

    return json({ ok: false, error: "Not found" }, 404);
  }

  // ---------- Download proxy: GET /api/file/<uuid>/<name> ----------
  if (method === "GET" || method === "HEAD") {
    const key = segs.join("/");
    const obj = await env.BUCKET.get(key);
    if (!obj) return new Response("Not found", { status: 404 });

    const name = key.split("/").pop().replace(/"/g, "");
    const headers = new Headers();
    obj.writeHttpMetadata(headers);
    headers.set("Content-Disposition", `attachment; filename="${name}"`);
    headers.set("Content-Length", String(obj.size));
    headers.set("Cache-Control", "private, max-age=3600");
    return new Response(method === "HEAD" ? null : obj.body, { headers });
  }

  return new Response("Method not allowed", { status: 405 });
}
