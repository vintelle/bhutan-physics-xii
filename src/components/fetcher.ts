/** Small client-side JSON helper that surfaces API error messages. */
export async function api<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    method: init?.method ?? (init?.json !== undefined ? "POST" : "GET"),
    headers: { ...(init?.json !== undefined ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = Array.isArray(data?.details) ? `: ${data.details.map((d: { path?: string[]; message?: string }) => `${(d.path ?? []).join(".")} ${d.message ?? ""}`).join("; ")}` : "";
    throw new Error((data?.error ?? `Request failed (${res.status})`) + details);
  }
  return data as T;
}
