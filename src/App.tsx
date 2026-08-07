import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PUBLIC_ROUTES, ADMIN_ROUTES } from './constants/routes';

// Layouts
import AppShell from './components/layout/AppShell';
import PublicShell from './components/layout/PublicShell';

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
