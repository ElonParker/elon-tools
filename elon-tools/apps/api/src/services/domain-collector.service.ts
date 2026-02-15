/**
 * Domain metadata collector — best-effort fetch & parse.
 * Anti-SSRF: validates hostname (no private IPs, no localhost).
 */

export interface DomainMetadata {
  title: string | null;
  description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  favicon_url: string | null;
  language: string | null;
  robots: string | null;
  sitemap_url: string | null;
  social_links: string[];
  tech_hints: string[];
  status_code: number | null;
  redirected_url: string | null;
  headers: Record<string, string>;
  collected_at: string;
  error: string | null;
}

const FETCH_TIMEOUT_MS = 8000;
const MAX_BODY_SIZE = 512 * 1024; // 512KB max HTML
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
  /^localhost$/i,
];

const DOMAIN_REGEX = /^(?!:\/\/)([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;

/**
 * Validate domain — anti-SSRF.
 */
export function validateDomain(domain: string): { valid: boolean; error?: string } {
  if (!DOMAIN_REGEX.test(domain)) {
    return { valid: false, error: 'Domínio inválido' };
  }
  // Check for private IP patterns (in case someone passes an IP-like domain)
  for (const pattern of PRIVATE_IP_PATTERNS) {
    if (pattern.test(domain)) {
      return { valid: false, error: 'Domínio não permitido (IP privado)' };
    }
  }
  if (domain.length > 253) {
    return { valid: false, error: 'Domínio muito longo' };
  }
  return { valid: true };
}

/**
 * Collect metadata from a domain — best-effort.
 */
export async function collectDomainMetadata(domain: string): Promise<DomainMetadata> {
  const result: DomainMetadata = {
    title: null,
    description: null,
    og_title: null,
    og_description: null,
    og_image: null,
    favicon_url: null,
    language: null,
    robots: null,
    sitemap_url: null,
    social_links: [],
    tech_hints: [],
    status_code: null,
    redirected_url: null,
    headers: {},
    collected_at: new Date().toISOString(),
    error: null,
  };

  try {
    const url = `https://${domain}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ElonTools-Bot/1.0 (metadata collector)',
          Accept: 'text/html,application/xhtml+xml',
        },
        redirect: 'follow',
      });
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        result.error = 'Timeout ao acessar domínio';
        return result;
      }
      // Try HTTP fallback
      try {
        response = await fetch(`http://${domain}`, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'ElonTools-Bot/1.0 (metadata collector)',
            Accept: 'text/html,application/xhtml+xml',
          },
          redirect: 'follow',
        });
      } catch {
        result.error = 'Não foi possível acessar o domínio';
        return result;
      }
    } finally {
      clearTimeout(timeout);
    }

    result.status_code = response.status;
    result.redirected_url = response.url !== url ? response.url : null;

    // Capture useful headers
    const serverHeader = response.headers.get('server');
    const poweredBy = response.headers.get('x-powered-by');
    if (serverHeader) result.headers['server'] = serverHeader;
    if (poweredBy) result.headers['x-powered-by'] = poweredBy;

    // Read body with size limit
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      result.error = 'Resposta não é HTML';
      return result;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      result.error = 'Sem body na resposta';
      return result;
    }

    let html = '';
    let totalBytes = 0;
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_BODY_SIZE) {
        reader.cancel();
        html += decoder.decode(value, { stream: false });
        result.error = 'HTML truncado (excedeu 512KB)';
        break;
      }
      html += decoder.decode(value, { stream: true });
    }

    // Parse HTML
    parseHtml(html, domain, result);

    // Try to get favicon if not found in HTML
    if (!result.favicon_url) {
      result.favicon_url = `https://${domain}/favicon.ico`;
    }

    // Try robots.txt (best-effort, no failure)
    await collectRobots(domain, result);

  } catch (err) {
    result.error = `Erro inesperado: ${(err as Error).message}`;
  }

  return result;
}

/**
 * Parse HTML and extract metadata.
 */
function parseHtml(html: string, domain: string, result: DomainMetadata): void {
  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  result.title = titleMatch?.[1]?.trim()?.slice(0, 500) ?? null;

  // Meta tags
  const metaRegex = /<meta\s+[^>]*?(?:name|property)\s*=\s*["']([^"']+)["'][^>]*?content\s*=\s*["']([^"']*?)["'][^>]*?>/gi;
  const metaRegex2 = /<meta\s+[^>]*?content\s*=\s*["']([^"']*?)["'][^>]*?(?:name|property)\s*=\s*["']([^"']+)["'][^>]*?>/gi;

  const metas = new Map<string, string>();
  let m: RegExpExecArray | null;

  while ((m = metaRegex.exec(html)) !== null) {
    metas.set(m[1]!.toLowerCase(), m[2]!);
  }
  while ((m = metaRegex2.exec(html)) !== null) {
    metas.set(m[2]!.toLowerCase(), m[1]!);
  }

  result.description = metas.get('description')?.slice(0, 1000) ?? null;
  result.og_title = metas.get('og:title')?.slice(0, 500) ?? null;
  result.og_description = metas.get('og:description')?.slice(0, 1000) ?? null;
  result.og_image = metas.get('og:image') ?? null;
  result.robots = metas.get('robots') ?? null;

  // Language
  const langMatch = html.match(/<html[^>]*\slang\s*=\s*["']([^"']+)["']/i);
  result.language = langMatch?.[1]?.slice(0, 10) ?? null;

  // Favicon from <link>
  const faviconMatch = html.match(/<link[^>]*rel\s*=\s*["'](?:shortcut )?icon["'][^>]*href\s*=\s*["']([^"']+)["']/i)
    || html.match(/<link[^>]*href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["'](?:shortcut )?icon["']/i);
  if (faviconMatch?.[1]) {
    const href = faviconMatch[1];
    result.favicon_url = href.startsWith('http') ? href : `https://${domain}${href.startsWith('/') ? '' : '/'}${href}`;
  }

  // Social links
  const socialPatterns = [
    /https?:\/\/(?:www\.)?(?:facebook|fb)\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(?:www\.)?instagram\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(?:www\.)?twitter\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(?:www\.)?x\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(?:www\.)?linkedin\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(?:www\.)?youtube\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(?:www\.)?tiktok\.com\/[^\s"'<>]+/gi,
  ];
  const socialSet = new Set<string>();
  for (const pattern of socialPatterns) {
    const matches = html.match(pattern);
    if (matches) matches.forEach((u) => socialSet.add(u));
  }
  result.social_links = [...socialSet].slice(0, 20);

  // Tech hints (heuristic)
  const techPatterns: [RegExp, string][] = [
    [/wp-content|wordpress/i, 'WordPress'],
    [/shopify/i, 'Shopify'],
    [/wix\.com/i, 'Wix'],
    [/squarespace/i, 'Squarespace'],
    [/next\.js|__next/i, 'Next.js'],
    [/nuxt/i, 'Nuxt'],
    [/react/i, 'React'],
    [/vue\.js|vue@/i, 'Vue'],
    [/angular/i, 'Angular'],
    [/gatsby/i, 'Gatsby'],
    [/cloudflare/i, 'Cloudflare'],
    [/google-analytics|gtag|ga\.js/i, 'Google Analytics'],
    [/gtm\.js|googletagmanager/i, 'Google Tag Manager'],
    [/hotjar/i, 'Hotjar'],
    [/bootstrap/i, 'Bootstrap'],
    [/tailwind/i, 'Tailwind CSS'],
    [/jquery/i, 'jQuery'],
    [/laravel/i, 'Laravel'],
  ];

  const techSet = new Set<string>();
  for (const [pattern, name] of techPatterns) {
    if (pattern.test(html)) techSet.add(name);
  }
  result.tech_hints = [...techSet];
}

/**
 * Try to fetch robots.txt (best-effort).
 */
async function collectRobots(domain: string, result: DomainMetadata): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`https://${domain}/robots.txt`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ElonTools-Bot/1.0' },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const text = await res.text();
      // Look for sitemap
      const sitemapMatch = text.match(/Sitemap:\s*(\S+)/i);
      if (sitemapMatch?.[1]) {
        result.sitemap_url = sitemapMatch[1];
      }
      // Store truncated robots
      result.robots = text.slice(0, 2000);
    }
  } catch {
    // Best-effort, ignore errors
  }
}
