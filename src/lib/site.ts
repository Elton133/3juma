/** Production canonical origin for meta tags, sitemap parity, and OG URLs. Set `VITE_SITE_URL` in `.env` (e.g. https://3juma.app). */
export function getSiteOrigin(): string {
  const raw = import.meta.env.VITE_SITE_URL as string | undefined;
  if (raw?.trim()) return raw.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return 'https://3juma.app';
}

export function absoluteUrl(path: string): string {
  const origin = getSiteOrigin();
  if (!path || path === '/') return `${origin}/`;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${p}`;
}

export function getOgImageUrl(): string {
  const raw = import.meta.env.VITE_OG_IMAGE_URL as string | undefined;
  if (raw?.trim()) return raw.trim();
  return `${getSiteOrigin()}/og-image.png`;
}
