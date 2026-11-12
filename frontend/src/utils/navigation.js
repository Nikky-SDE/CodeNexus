const NAV_EVENT = 'codenexus:navigate';
const AUTH_EVENT = 'codenexus:auth';

let historyInitialized = false;

/**
 * Ensures the initial history entry carries CodeNexus state metadata so in-app
 * back navigation can distinguish internal history from external entry points.
 */
export function initNavigationHistory() {
  if (typeof window === 'undefined' || historyInitialized) return;
  historyInitialized = true;
  if (!window.history.state || typeof window.history.state.codenexusIndex !== 'number') {
    window.history.replaceState(
      { ...(window.history.state || {}), codenexusIndex: 0 },
      '',
      window.location.pathname + window.location.search + window.location.hash
    );
  }
}

/**
 * Normalizes a target URL or relative path into an internal path+search+hash string.
 * Returns null if the target points to a different origin or unsafe protocol.
 */
export function toInternalPath(to) {
  if (typeof to !== 'string' || !to.trim()) return null;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://codenexus.local';
  try {
    const url = new URL(to, origin);
    if (url.origin !== origin) return null;
    if (url.pathname.startsWith('/api/') || url.pathname === '/api') return null;
    const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
    return `${pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/**
 * Validates a `?next=` redirect target so auth redirects stay strictly same-origin
 * and do not bounce back to `/auth`.
 */
export function getSafeNextPath(rawNext, fallback = '/hub') {
  if (typeof rawNext !== 'string' || !rawNext.startsWith('/') || rawNext.startsWith('//')) {
    return fallback;
  }
  const normalized = toInternalPath(rawNext);
  if (!normalized || normalized === '/auth' || normalized.startsWith('/auth?')) {
    return fallback;
  }
  return normalized;
}

/**
 * Navigates cleanly using the HTML5 History API and notifies the SPA Router.
 */
export function navigate(to, { replace = false, preserveScroll = false } = {}) {
  if (typeof window === 'undefined') return;
  initNavigationHistory();

  const target = toInternalPath(to);
  if (!target) {
    if (replace) window.location.replace(to);
    else window.location.assign(to);
    return;
  }

  const current = `${window.location.pathname.length > 1 ? window.location.pathname.replace(/\/+$/, '') : window.location.pathname}${window.location.search}${window.location.hash}`;
  const currentIndex = typeof window.history.state?.codenexusIndex === 'number'
    ? window.history.state.codenexusIndex
    : 0;

  if (target === current && !replace) {
    return;
  }

  const nextState = replace
    ? { codenexusIndex: currentIndex }
    : { codenexusIndex: currentIndex + 1 };

  if (replace) {
    window.history.replaceState(nextState, '', target);
  } else {
    window.history.pushState(nextState, '', target);
  }

  if (!preserveScroll) {
    const hash = target.includes('#') ? target.slice(target.indexOf('#') + 1) : '';
    if (hash) {
      requestAnimationFrame(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        else window.scrollTo(0, 0);
      });
    } else {
      window.scrollTo(0, 0);
    }
  }

  window.dispatchEvent(new CustomEvent(NAV_EVENT, { detail: { path: target } }));
}

/**
 * Navigates back to the previous in-app route if available, or falls back to
 * a safe destination without exiting the application on direct-link loads.
 */
export function goBack(fallback = '/hub') {
  if (typeof window === 'undefined') return;
  const currentIndex = window.history.state?.codenexusIndex;
  if (typeof currentIndex === 'number' && currentIndex > 0) {
    window.history.back();
    return;
  }
  navigate(fallback, { replace: true });
}

/**
 * Subscribes a listener to browser popstate and programmatic SPA navigation events.
 */
export function subscribeNavigation(callback) {
  if (typeof window === 'undefined') return () => {};
  initNavigationHistory();
  const handler = () => callback(window.location.pathname + window.location.search);
  window.addEventListener('popstate', handler);
  window.addEventListener(NAV_EVENT, handler);
  return () => {
    window.removeEventListener('popstate', handler);
    window.removeEventListener(NAV_EVENT, handler);
  };
}

/**
 * Notifies listeners (such as the root App auth state) that session state changed.
 */
export function emitAuthChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EVENT));
  }
}

export function subscribeAuthChange(callback) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(AUTH_EVENT, callback);
  return () => window.removeEventListener(AUTH_EVENT, callback);
}
