// Netlify Function: secure proxy to the Gemini API.
// The key is read from the server environment (GEMINI_API_KEY) and never sent to the browser.
const BASE = "https://generativelanguage.googleapis.com/v1beta";
const MODEL_RE = /^gemini[a-z0-9.\-]*$/i;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export default async (req) => {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
  const defaults = {
    extract: process.env.GEMINI_EXTRACT_MODEL || "gemini-pro-latest",
    eval: process.env.GEMINI_EVAL_MODEL || "gemini-flash-latest",
    ocr: process.env.GEMINI_OCR_MODEL || "gemini-flash-latest",
  };

  // Optional: only accept calls from your own site
  const allowed = process.env.ALLOWED_ORIGIN;
  const origin = req.headers.get("origin");
  if (allowed && origin && origin !== allowed) return json({ error: "Origin not allowed" }, 403);

  const url = new URL(req.url);

  if (req.method === "GET") {
    if (url.searchParams.has("models")) {
      if (!key) return json({ error: "GEMINI_API_KEY is not set" }, 503);
      const r = await fetch(`${BASE}/models?pageSize=200`, { headers: { "x-goog-api-key": key } });
      return new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json" } });
    }
    return json({ ok: true, configured: Boolean(key), defaults });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!key) return json({ error: "GEMINI_API_KEY is not set on the server" }, 503);

  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400); }
  const { model, payload } = body || {};
  if (!model || !MODEL_RE.test(model)) return json({ error: "Invalid model name" }, 400);
  if (!payload || !Array.isArray(payload.contents)) return json({ error: "Missing contents" }, 400);

  try {
    const r = await fetch(`${BASE}/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(payload),
    });
    return new Response(await r.text(), {
      status: r.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (e) {
    return json({ error: "Upstream request to Gemini failed" }, 502);
  }
};

export const config = { path: "/api/gemini" };
