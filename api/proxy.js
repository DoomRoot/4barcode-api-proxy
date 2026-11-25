export const config = { runtime: "edge" };

const UPSTREAM = "https://api.4barcode.ru";
const ALLOW = [
  "https://4barcode.ru",
  "https://www.4barcode.ru",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];

export default async function handler(req) {
  var origin = req.headers.get("origin") || "";
  var allowed = ALLOW.includes(origin) ? origin : ALLOW[0];
  var cors = {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  var url = new URL(req.url);
  var target = UPSTREAM + url.pathname + url.search;

  try {
    var init = { method: req.method, headers: {} };
    var ct = req.headers.get("content-type");
    if (ct) init.headers["Content-Type"] = ct;
    if (req.method === "POST" || req.method === "PUT") {
      init.body = await req.arrayBuffer();
    }

    var upstream = await fetch(target, init);

    var respHeaders = Object.assign({}, cors);
    var upCt = upstream.headers.get("content-type");
    if (upCt) respHeaders["Content-Type"] = upCt;
    respHeaders["Cache-Control"] = "no-store";

    return new Response(upstream.body, {
      status: upstream.status,
      headers: respHeaders,
    });
  } catch (e) {
    return new Response("proxy error: " + e.message, {
      status: 502,
      headers: Object.assign({ "Content-Type": "text/plain" }, cors),
    });
  }
}
