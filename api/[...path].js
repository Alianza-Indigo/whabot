export const config = {
  runtime: 'edge',
};

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
]);

function backendUrlFor(request) {
  const backendBase = process.env.CHATBOX_API_URL;
  if (!backendBase) return null;

  const incoming = new URL(request.url);
  const upstreamPath = incoming.pathname.replace(/^\/api\/?/, '/') || '/';
  const base = backendBase.replace(/\/$/, '');
  return `${base}${upstreamPath}${incoming.search}`;
}

function filteredHeaders(source) {
  const headers = new Headers(source);
  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }
  return headers;
}

export default async function handler(request) {
  const target = backendUrlFor(request);
  if (!target) {
    return Response.json(
      { error: 'CHATBOX_API_URL is not configured for the Vercel API proxy' },
      { status: 500 },
    );
  }

  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: filteredHeaders(request.headers),
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
    });

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: filteredHeaders(upstream.headers),
    });
  } catch {
    return Response.json(
      { error: 'Unable to reach Chatbox API upstream' },
      { status: 502 },
    );
  }
}
