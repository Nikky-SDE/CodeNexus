import * as cheerio from 'cheerio';

/**
 * Escapes special RegExp characters in user-supplied strings before building a RegExp
 * or MongoDB $regex query to prevent ReDoS and regex injection.
 */
export function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validates that a URL uses http: or https: protocol.
 */
export function isSafeHttpUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return false;
  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates that a URL is a valid Codeforces problem URL (prevents SSRF).
 */
export function isValidCodeforcesProblemUrl(rawUrl) {
  if (typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl.trim());
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'codeforces.com') {
      return false;
    }
    return /^\/(?:problemset\/problem\/\d+\/[A-Za-z0-9]+|contest\/\d+\/problem\/[A-Za-z0-9]+)\/?$/.test(
      parsed.pathname
    );
  } catch {
    return false;
  }
}

/**
 * Strips executable elements, inline event handlers, and unsafe URI schemes
 * from scraped HTML fragments before sending them to the client.
 */
export function sanitizeScrapedHtml(html = '') {
  if (typeof html !== 'string' || !html) return '';
  const $ = cheerio.load(html, null, false);

  $('script, iframe, object, embed, style, link, meta, base, form').remove();

  $('*').each((_, el) => {
    const attribs = el.attribs || {};
    for (const attr of Object.keys(attribs)) {
      const lower = attr.toLowerCase();
      const val = String(attribs[attr] || '').trim();
      if (lower.startsWith('on')) {
        $(el).removeAttr(attr);
      } else if ((lower === 'href' || lower === 'src') && /^\s*(javascript|vbscript|data):/i.test(val)) {
        $(el).removeAttr(attr);
      }
    }
  });

  return $.html();
}
