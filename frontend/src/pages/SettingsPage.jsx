import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar.jsx';
import { API_BASE } from '../apiConfig.js';

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('geminiApiKey') || '');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.isAuthenticated) setCurrentUser(d.user);
      })
      .catch(() => {});
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('geminiApiKey', apiKey.trim());
    } else {
      localStorage.removeItem('geminiApiKey');
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-bg-deep text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar user={currentUser} />
      <main className="flex-1 w-full max-w-2xl mx-auto py-10 px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              Settings
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage your app preferences and API integrations.</p>
          </div>
          <a href="/hub" className="text-xs font-semibold text-accent hover:underline">
            ← Back to Dashboard
          </a>
        </div>

        {/* Settings Card */}
        <div className="card p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-200 mb-4 flex items-center gap-2">
            <span className="text-2xl">🔑</span> Gemini API Key
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            CodeNexus&apos;s AI features (like Codeforces AI Hints) require a Google Gemini API key to operate.
            Because AI generation costs money, we allow you to use your own free tier API key to access this feature!
            Your key is <strong>stored locally in your browser</strong> and is never saved on our database.
          </p>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <label htmlFor="gemini-api-key" className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Your API Key
              </label>
              <input
                id="gemini-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="input-field py-3 font-mono text-sm"
              />
              <p className="text-[11px] text-slate-500 mt-2">
                Don&apos;t have one? Get a free API key from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  Google AI Studio
                </a>.
              </p>
            </div>

            <div className="flex items-center gap-4 mt-2">
              <button
                type="submit"
                className="btn-primary py-2.5 px-6 font-bold shadow-btn"
              >
                Save Settings
              </button>
              {saved && (
                <span className="text-emerald-500 dark:text-emerald-400 text-sm font-semibold flex items-center gap-1.5 animate-fade-in">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  Saved!
                </span>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
