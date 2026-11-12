import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import { API_BASE } from '../apiConfig.js';

/**
 * Creator & Contributors Page
 * Showcases the builder and maintainers of the CodeNexus platform.
 */

const CREATORS = [
  {
    id: 1,
    name: 'Nikky',
    role: 'Creator & Full-Stack Engineer',
    github: 'Nikky-SDE',
    email: 'nikkycsai2006@gmail.com',
    photo: 'https://github.com/Nikky-SDE.png',
    bio: 'Building CodeNexus to bring real-time 1v1 algorithmic duels, structured editorials, and developer collaboration together.',
    highlights: [
      { label: 'Focus', value: 'Full-Stack MERN & Real-Time Systems' },
      { label: 'Stack', value: 'React, Node.js, Socket.IO, MongoDB' },
    ],
  },
];

export default function ContributorsPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.isAuthenticated) setUser(d.user);
      })
      .catch(() => {});

    document.title = 'Creator & About | CodeNexus';
  }, []);

  return (
    <div className="min-h-screen bg-bg-deep text-slate-100 flex flex-col selection:bg-accent/30 selection:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-accent/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent-violet/10 blur-[140px] rounded-full" />
      </div>

      <Navbar user={user} />

      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-6 py-16 sm:py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Built by Nikky</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-6 text-white text-gradient">
            About CodeNexus
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
            A real-time competitive programming hub featuring 1v1 CodeArena duels, progressive AI hints, live Codeforces sync, and community editorials.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          {CREATORS.map((person, idx) => (
            <ContributorCard key={person.id} person={person} delay={idx * 100} />
          ))}
        </div>

        <div className="mt-20 text-center py-12 border-t border-white/5">
          <h3 className="text-2xl font-bold text-white mb-4">Open Source on GitHub</h3>
          <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm">
            Explore the CodeNexus repository, report issues, or contribute new competitive programming tools.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://github.com/Nikky-SDE/CodeNexus"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost px-8 py-3 font-bold flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
            <a href="/hub" className="btn-primary px-8 py-3 font-bold">
              Explore Hub
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

function ContributorCard({ person, delay }) {
  return (
    <div
      className="group relative animate-fade-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="relative h-full bg-bg-card border border-white/10 p-6 sm:p-8 rounded-3xl flex flex-col backdrop-blur-xl shadow-2xl transition-all duration-300 group-hover:-translate-y-1 group-hover:border-accent/40">
        <div className="relative mb-6 flex justify-center">
          <div className="relative z-10 w-32 h-32 rounded-full border-4 border-white/10 overflow-hidden shadow-xl group-hover:border-accent/40 transition-all duration-300 bg-bg-surface">
            <img
              src={person.photo}
              alt={person.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>

        <div className="text-center mb-6 flex-1">
          <h2 className="text-2xl font-extrabold text-white mb-1 tracking-tight">{person.name}</h2>
          <p className="text-accent text-xs font-bold uppercase tracking-wider mb-4">{person.role}</p>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">{person.bio}</p>

          <div className="flex flex-col gap-2.5 text-left">
            {person.highlights.map((item) => (
              <div key={item.label} className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{item.label}</div>
                <div className="text-xs font-semibold text-slate-200">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <a
            href={`https://github.com/${person.github}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-accent text-white text-sm font-bold transition-all flex items-center justify-center gap-2 border border-white/10"
          >
            GitHub
          </a>
          <a
            href={`mailto:${person.email}`}
            className="flex-1 py-3 px-4 rounded-xl bg-accent/15 hover:bg-accent text-accent-light hover:text-white text-sm font-bold transition-all flex items-center justify-center gap-2 border border-accent/30"
          >
            Contact
          </a>
        </div>
      </div>
    </div>
  );
}
