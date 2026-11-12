import './index.css';
import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LandingPage from './pages/LandingPage.jsx';
import FloatingMessageButton from './components/FloatingMessageButton.jsx';
import { API_BASE } from './apiConfig.js';
import {
  initNavigationHistory,
  subscribeNavigation,
  subscribeAuthChange,
  navigate,
  toInternalPath,
} from './utils/navigation.js';

const HubPage = lazy(() => import('./pages/HubPage.jsx'));
const VerifyPage = lazy(() => import('./pages/VerifyPage.jsx'));
const CreateEditorialPage = lazy(() => import('./pages/CreateEditorialPage.jsx'));
const EditorialsPage = lazy(() => import('./pages/EditorialsPage.jsx'));
const AuthPage = lazy(() => import('./pages/AuthPage.jsx'));
const AdminPage = lazy(() => import('./pages/AdminPage.jsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));
const ContestsPage = lazy(() => import('./pages/ContestsPage.jsx'));
const PostPage = lazy(() => import('./pages/PostPage.jsx'));
const ArenaPage = lazy(() => import('./pages/ArenaPage.jsx'));
const RecommenderPage = lazy(() => import('./pages/RecommenderPage.jsx'));
const AiHintsPage = lazy(() => import('./pages/AiHintsPage.jsx'));
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'));
const ContributorsPage = lazy(() => import('./pages/ContributorsPage.jsx'));
const MessagesPage = lazy(() => import('./pages/MessagesPage.jsx'));
const PlaygroundPage = lazy(() => import('./pages/PlaygroundPage.jsx'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-bg-deep flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400 tracking-wider uppercase">Loading CodeNexus...</span>
      </div>
    </div>
  );
}

function Router({ currentUser, pathname }) {
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (path === '/')                  return <LandingPage currentUser={currentUser} />;
  if (path === '/hub' || path === '/dashboard') return <HubPage />;
  if (path === '/auth')              return <AuthPage />;
  if (path === '/admin')             return <AdminPage />;
  if (path === '/verify')            return <VerifyPage />;
  if (path === '/create-editorial')  return <CreateEditorialPage />;
  if (path === '/editorials')        return <EditorialsPage />;
  if (path === '/contests')          return <ContestsPage />;
  if (path === '/recommender')       return <RecommenderPage />;
  if (path === '/ai-hints')          return <AiHintsPage />;
  if (path === '/playground')        return <PlaygroundPage />;
  if (path === '/settings')          return <SettingsPage />;
  if (path === '/contributors')      return <ContributorsPage />;
  if (path.startsWith('/profile/'))  return <ProfilePage key={path} />;
  if (path.startsWith('/post/') || path.startsWith('/editorial/')) return <PostPage key={path} />;
  if (path === '/arena')             return <ArenaPage />;
  if (path === '/messages')          return <MessagesPage />;

  return <HubPage />;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [locationKey, setLocationKey] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/'
  );

  const refreshAuth = useCallback(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setCurrentUser(d?.isAuthenticated ? d.user : null);
      })
      .catch(() => setCurrentUser(null));
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    initNavigationHistory();
    refreshAuth();

    const unsubNav = subscribeNavigation((nextKey) => setLocationKey(nextKey));
    const unsubAuth = subscribeAuthChange(refreshAuth);

    const handleDocumentClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = e.target.closest?.('a[href]');
      if (!anchor) return;
      if (anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;

      const rawHref = anchor.getAttribute('href');
      if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
        return;
      }

      const internal = toInternalPath(rawHref);
      if (!internal) return;

      e.preventDefault();
      navigate(internal);
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      unsubNav();
      unsubAuth();
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [refreshAuth]);

  const pathname = locationKey.split('?')[0] || '/';
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const showChatBtn = currentUser && normalizedPath !== '/' && normalizedPath !== '/auth' && normalizedPath !== '/arena' && normalizedPath !== '/messages';
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const content = (
    <>
      <Suspense fallback={<PageLoader />}>
        <Router currentUser={currentUser} pathname={pathname} />
      </Suspense>
      {showChatBtn && <FloatingMessageButton currentUser={currentUser} />}
    </>
  );

  return clientId ? (
    <GoogleOAuthProvider clientId={clientId}>{content}</GoogleOAuthProvider>
  ) : (
    content
  );
}
