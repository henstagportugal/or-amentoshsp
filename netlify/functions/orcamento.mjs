import { getStore } from "@netlify/blobs";

// GET /orcamentos/:slug — serve o orçamento publicado
export const config = { path: "/orcamentos/:slug" };

const NOT_FOUND_HTML = `<!doctype html><html lang="pt"><head><meta charset="utf-8">
<title>Orçamento não encontrado</title></head>
<body style="font-family:sans-serif;background:#141414;color:#F6EDDC;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px">
<div><h1>Orçamento não encontrado</h1><p>Este link pode ter expirado ou estar incorreto. Contacta a HenStag Portugal para receberes um novo link.</p></div>
</body></html>`;

export default async (req, context) => {
  const slug = context.params && context.params.slug;
  if (!slug) {
    return new Response(NOT_FOUND_HTML, { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
  }
  const store = getStore("orcamentos");
  const html = await store.get(slug, { type: "text" });
  if (!html) {
    return new Response(NOT_FOUND_HTML, { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
  }
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
};
