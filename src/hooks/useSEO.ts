import { useEffect } from 'react';

interface SEOOptions {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalPath?: string;
}

export function useSEO(options: SEOOptions = {}) {
  useEffect(() => {
    const {
      title = 'AURA Studio',
      description = 'Women-only Pilates studio in Addis Ababa. Book classes, purchase packages, and begin your wellness journey.',
      ogTitle,
      ogDescription,
      ogImage,
      canonicalPath,
    } = options;

    document.title = title;

    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(name.startsWith('og:') ? 'property' : 'name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setCanonical = (href: string) => {
      let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    setMeta('description', description);
    setMeta('og:title', ogTitle || title);
    setMeta('og:description', ogDescription || description);
    setMeta('og:type', 'website');
    if (ogImage) setMeta('og:image', ogImage);
    if (canonicalPath) {
      setCanonical(`https://aurastudio.et${canonicalPath}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);
}
