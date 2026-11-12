/**
 * Reusable CodeNexus SVG mark + wordmark component.
 */
export default function BrandLogo({ showWordmark = true, size = 'md', className = '' }) {
  const iconSize = size === 'sm' ? 'w-7 h-7' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-lg';

  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        fill="none"
        className={`${iconSize} flex-shrink-0`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="cn-brand-grad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="55%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="16" fill="#0d1120" stroke="url(#cn-brand-grad)" strokeWidth="3.5" />
        <path d="M23 22L14 32L23 42" stroke="url(#cn-brand-grad)" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M41 22L50 32L41 42" stroke="url(#cn-brand-grad)" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M27 41L37 23" stroke="currentColor" className="text-slate-100" strokeWidth="3.8" strokeLinecap="round" />
        <circle cx="27" cy="41" r="3.2" fill="#34d399" />
        <circle cx="37" cy="23" r="3.2" fill="#34d399" />
      </svg>
      {showWordmark && (
        <span className={`font-extrabold tracking-tight text-slate-900 dark:text-white ${textSize}`}>
          Code<span className="text-accent">Nexus</span>
        </span>
      )}
    </span>
  );
}
