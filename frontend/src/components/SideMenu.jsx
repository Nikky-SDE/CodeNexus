import BrandLogo from './BrandLogo.jsx';

/**
 * SideMenu Component
 * A slide-in drawer for primary navigation links.
 */
export default function SideMenu({ isOpen, onClose, user }) {
  const currentPath = typeof window !== 'undefined'
    ? (window.location.pathname.length > 1 ? window.location.pathname.replace(/\/+$/, '') : window.location.pathname)
    : '';

  const isActive = (href) => {
    if (href === '/hub') return currentPath === '/hub' || currentPath === '/dashboard';
    return currentPath === href;
  };

  const menuItems = [
    {
      label: 'Main',
      items: [
        { href: '/hub', label: 'Dashboard', icon: '📊', color: 'bg-emerald-500/10' },
        { href: '/editorials', label: 'Wing Editorials', icon: '📖', color: 'bg-amber-500/10' },
        ...(user ? [{ href: '/messages', label: 'Direct Messages', icon: '💬', color: 'bg-sky-500/10' }] : []),
        { href: '/contributors', label: 'About & Creator', icon: '✨', color: 'bg-indigo-500/10' },
      ],
    },
    {
      label: 'Competitive',
      items: [
        { href: '/arena', label: 'CodeArena', icon: '⚔️', color: 'bg-red-500/10' },
        { href: '/contests', label: 'Contests Hub', icon: '🏆', color: 'bg-yellow-500/10' },
      ],
    },
    {
      label: 'Tools',
      items: [
        { href: '/recommender', label: 'Problem Recommender', icon: '🎯', color: 'bg-blue-500/10' },
        { href: '/ai-hints', label: 'AI Editorials', icon: '🔮', color: 'bg-accent/10' },
        { href: '/playground', label: 'Code Playground', icon: '💻', color: 'bg-emerald-500/10' },
      ],
    },
    {
      label: 'Account',
      items: [
        ...(user?.isAdmin ? [{ href: '/admin', label: 'Admin Console', icon: '🛡️', color: 'bg-yellow-500/10' }] : []),
        { href: '/settings', label: 'Settings', icon: '⚙️', color: 'bg-slate-500/10' },
      ],
    },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      <aside
        aria-label="Primary navigation drawer"
        className={`fixed left-0 top-0 h-full w-72 z-[70] bg-white dark:bg-bg-deep border-r border-black/10 dark:border-white/10 transition-transform duration-300 ease-out transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl flex flex-col`}
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-accent/5 blur-3xl pointer-events-none" />

        <div className="p-6 pb-4 flex items-center justify-between border-b border-black/5 dark:border-white/5 relative z-10">
          <a href="/" onClick={onClose} className="flex items-center gap-3">
            <BrandLogo showWordmark={false} size="lg" />
            <div>
              <span className="font-extrabold text-lg text-slate-900 dark:text-white block">CodeNexus</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Navigation</span>
            </div>
          </a>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
            aria-label="Close Menu"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 relative z-10 custom-scrollbar">
          {menuItems.map((group, idx) => (
            <div key={idx} className="space-y-3">
              <h3 className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-3.5 p-3 rounded-xl transition-all group border ${
                        active
                          ? 'bg-accent/10 text-accent border-accent/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 border-transparent hover:border-black/5 dark:hover:border-white/5'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg ${item.color} flex items-center justify-center text-base group-hover:scale-110 transition-transform duration-200`}>
                        {item.icon}
                      </div>
                      <span className="font-bold text-sm tracking-tight">{item.label}</span>
                      <div className={`ml-auto transition-opacity ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <svg className="w-4 h-4 text-current opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-6 mt-6 border-t border-black/5 dark:border-white/5">
            <div className="px-4 mb-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Profile</span>
            </div>
            {user ? (
              <a
                href={`/profile/${user.username}`}
                onClick={onClose}
                className="flex items-center gap-3.5 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white group border border-transparent hover:border-black/5 dark:hover:border-white/5"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent to-accent-violet flex items-center justify-center text-sm font-bold text-white">
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <span className="font-bold text-sm block tracking-tight">{user.username}</span>
                  <span className="text-[10px] text-slate-500">View Profile</span>
                </div>
              </a>
            ) : (
              <a
                href="/auth"
                onClick={onClose}
                className="flex items-center gap-3.5 p-3 rounded-xl bg-accent/10 hover:bg-accent/20 text-accent transition-all border border-accent/20"
              >
                <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center text-base">
                  🔐
                </div>
                <div>
                  <span className="font-bold text-sm block tracking-tight">Log In / Sign Up</span>
                  <span className="text-[10px] text-slate-500">Access Arena & Profile</span>
                </div>
              </a>
            )}
          </div>
        </nav>

        <div className="px-6 py-3 border-t border-black/5 dark:border-white/5 text-[11px] text-slate-500 relative z-10">
          Built by <span className="text-slate-700 dark:text-slate-300 font-semibold">Nikky</span>
        </div>
      </aside>
    </>
  );
}
