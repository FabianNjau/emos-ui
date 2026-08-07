import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PUBLIC_ROUTES, ADMIN_ROUTES, DASHBOARD_ROUTES } from './constants/routes';

// Layouts
import AppShell from './components/layout/AppShell';
import PublicShell from './components/layout/PublicShell';
import DashboardShell from './components/layout/DashboardShell';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import ReviewQueue from './pages/admin/ReviewQueue';
import KnowledgeGraph from './pages/admin/KnowledgeGraph';
import SearchPage from './pages/admin/SearchPage';
import ChatPage from './pages/admin/ChatPage';
import ConceptsPage from './pages/admin/ConceptsPage';

// Public pages
import Landing from './pages/public/Landing';
import SearchResults from './pages/public/SearchResults';
import TopicBrowser from './pages/public/TopicBrowser';
import TopicPage from './pages/public/TopicPage';
import ConceptDetail from './pages/public/ConceptDetail';
import AskPage from './pages/public/AskPage';
import AboutPage from './pages/public/AboutPage';
import { AuthCallback } from './pages/public/auth/AuthCallback';
import LoginPage from './pages/public/auth/LoginPage';
import SignupPage from './pages/public/auth/SignupPage';

// Dashboard pages
import DashboardOverview from './pages/dashboard/DashboardOverview';
import SessionsPage from './pages/dashboard/SessionsPage';
import SavedPage from './pages/dashboard/SavedPage';
import ExplorePage from './pages/dashboard/ExplorePage';
import SessionChatPage from './pages/dashboard/SessionChatPage';
import ProfilePage from './pages/dashboard/ProfilePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* ── Public routes — PublicShell ───────────────────────────────── */}
          <Route element={<PublicShell />}>
            <Route path={PUBLIC_ROUTES.HOME} element={<Landing />} />
            <Route path={PUBLIC_ROUTES.SEARCH} element={<SearchResults />} />
            <Route path={PUBLIC_ROUTES.TOPICS} element={<TopicBrowser />} />
            <Route path={PUBLIC_ROUTES.TOPIC_PAGE} element={<TopicPage />} />
            <Route path={PUBLIC_ROUTES.CONCEPT} element={<ConceptDetail />} />
            <Route path={PUBLIC_ROUTES.ASK} element={<AskPage />} />
            <Route path={PUBLIC_ROUTES.ABOUT} element={<AboutPage />} />
            <Route path={PUBLIC_ROUTES.CALLBACK} element={<AuthCallback />} />
            <Route path={PUBLIC_ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={PUBLIC_ROUTES.SIGNUP} element={<SignupPage />} />
          </Route>

          {/* ── Dashboard routes — DashboardShell ──────────────────────────── */}
          <Route element={<DashboardShell />}>
            <Route path={DASHBOARD_ROUTES.HOME} element={<DashboardOverview />} />
            <Route path={DASHBOARD_ROUTES.CHATS} element={<SessionsPage />} />
            <Route path={DASHBOARD_ROUTES.SAVED} element={<SavedPage />} />
            <Route path={DASHBOARD_ROUTES.EXPLORE} element={<ExplorePage />} />
            <Route path={DASHBOARD_ROUTES.CHATS + '/:sessionId'} element={<SessionChatPage />} />
            <Route path={DASHBOARD_ROUTES.PROFILES} element={<ProfilePage />} />
          </Route>

          {/* ── Admin routes — AppShell ───────────────────────────────────── */}
          <Route element={<AppShell />}>
            <Route path={ADMIN_ROUTES.HOME} element={<Dashboard />} />
            <Route path={ADMIN_ROUTES.REVIEW} element={<ReviewQueue />} />
            <Route path={ADMIN_ROUTES.KNOWLEDGE_GRAPH} element={<KnowledgeGraph />} />
            <Route path={ADMIN_ROUTES.SEARCH} element={<SearchPage />} />
            <Route path={ADMIN_ROUTES.CHAT} element={<ChatPage />} />
            <Route path={ADMIN_ROUTES.CONCEPTS} element={<ConceptsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
