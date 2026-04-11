import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { resolvePageSeo } from '@/config/seo';

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const sel = attr === 'name' ? `meta[name="${key}"]` : `meta[property="${key}"]`;
  let el = document.head.querySelector(sel) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  const sel = `link[rel="${rel}"]`;
  let el = document.head.querySelector(sel) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function removeMeta(attr: 'name' | 'property', key: string) {
  const sel = attr === 'name' ? `meta[name="${key}"]` : `meta[property="${key}"]`;
  document.head.querySelector(sel)?.remove();
}

/**
 * Updates document title, canonical, description, Open Graph, and Twitter tags on SPA navigations.
 */
export default function PageSeo() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    const seo = resolvePageSeo(pathname);
    document.title = seo.title;

    upsertMeta('name', 'description', seo.description);

    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:url', seo.canonicalHref);
    upsertMeta('property', 'og:title', seo.title);
    upsertMeta('property', 'og:description', seo.description);
    upsertMeta('property', 'og:image', seo.ogImage);
    upsertMeta('property', 'og:locale', 'en_GH');
    upsertMeta('property', 'og:site_name', 'Ejuma');

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:url', seo.canonicalHref);
    upsertMeta('name', 'twitter:title', seo.title);
    upsertMeta('name', 'twitter:description', seo.description);
    upsertMeta('name', 'twitter:image', seo.ogImage);

    upsertLink('canonical', seo.canonicalHref);

    if (seo.noindex) {
      upsertMeta('name', 'robots', 'noindex, nofollow');
    } else {
      removeMeta('name', 'robots');
    }
  }, [pathname]);

  return null;
}
