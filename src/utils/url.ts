export function resolveAbsoluteUrl(inputUrl: string | null | undefined, baseUrl: string | null | undefined) {
  if (!inputUrl) return null;

  const trimmed = inputUrl.trim();
  if (!trimmed) return null;

  // Already absolute (or special schemes we should leave alone)
  if (
    /^https?:\/\//i.test(trimmed) ||
    /^data:/i.test(trimmed) ||
    /^blob:/i.test(trimmed) ||
    /^\/\//.test(trimmed)
  ) {
    return trimmed;
  }

  if (!baseUrl) return trimmed;

  try {
    const origin = new URL(baseUrl).origin;
    const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    return `${origin}${path}`;
  } catch {
    return trimmed;
  }
}
