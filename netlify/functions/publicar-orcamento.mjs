import { getStore } from "@netlify/blobs";

// POST /api/publicar-orcamento
// Body: { slug: string, html: string }
// Header: x-publish-secret: <PUBLISH_SECRET>
export const config = { path: "/api/publicar-orcamento" };

function slugify(s) {
  return String(s || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, x-publish-secret",
  "access-control-allow-methods": "POST, OPTIONS"
};

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), {
      status: 405, headers: { "content-type": "application/json", ...CORS_HEADERS }
    });
  }

  const expected = process.env.PUBLISH_SECRET;
  const got = req.headers.get("x-publish-secret");
  if (!expected || got !== expected) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), {
      status: 401, headers: { "content-type": "application/json", ...CORS_HEADERS }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid_json" }), {
      status: 400, headers: { "content-type": "application/json", ...CORS_HEADERS }
    });
  }

  const slug = slugify(body && body.slug);
  const html = body && body.html;
  if (!slug) {
    return new Response(JSON.stringify({ ok: false, error: "slug_invalido" }), {
      status: 400, headers: { "content-type": "application/json", ...CORS_HEADERS }
    });
  }
  if (!html || typeof html !== "string" || html.length < 20) {
    return new Response(JSON.stringify({ ok: false, error: "html_em_falta" }), {
      status: 400, headers: { "content-type": "application/json", ...CORS_HEADERS }
    });
  }
  // limite de segurança (Netlify Blobs aceita valores grandes, mas evita payloads absurdos)
  if (html.length > 15 * 1024 * 1024) {
    return new Response(JSON.stringify({ ok: false, error: "html_demasiado_grande" }), {
      status: 413, headers: { "content-type": "application/json", ...CORS_HEADERS }
    });
  }

  const store = getStore("orcamentos");
  await store.set(slug, html, {
    metadata: { publishedAt: new Date().toISOString() }
  });

  const url = new URL(req.url);
  const publicUrl = `${url.protocol}//${url.host}/orcamentos/${slug}`;

  return new Response(JSON.stringify({ ok: true, slug, url: publicUrl }), {
    headers: { "content-type": "application/json", ...CORS_HEADERS }
  });
};
