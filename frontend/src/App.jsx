import './index.css';
import { useState, useEffect, lazy, Suspense } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LandingPage from './pages/LandingPage.jsx';
import FloatingMessageButton from './components/FloatingMessageButton.jsx';
import { API_BASE } from './apiConfig.js';

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

function Router({ currentUser }) {
  const path = window.location.pathname;
  if (path === '/')                  return <LandingPage currentUser={currentUser} />;
  if (path === '/hub')               return <HubPage />;
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
  if (path.startsWith('/profile/'))  return <ProfilePage />;
  if (path.startsWith('/post/') || path.startsWith('/editorial/')) return <PostPage />;
  if (path === '/arena')             return <ArenaPage />;
  if (path === '/messages')          return <MessagesPage />;

  return <HubPage />;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/auth/verify`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.isAuthenticated) setCurrentUser(d.user);
      })
      .catch(() => {});
  }, []);

  const path = window.location.pathname;
  const showChatBtn = currentUser && path !== '/' && path !== '/auth' && path !== '/arena' && path !== '/messages';
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const content = (
    <>
      <Suspense fallback={<PageLoader />}>
        <Router currentUser={currentUser} />
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
