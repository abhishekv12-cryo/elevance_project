async function call(method, url, body) {
  const opts = { method, credentials: 'include', headers: {} };
  if (body instanceof FormData) opts.body = body;
  else if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch('/api' + url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
export const api = {
  get: (u) => call('GET', u),
  post: (u, b = {}) => call('POST', u, b),
  del: (u) => call('DELETE', u),
};
