import React, { useEffect, useMemo, useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import BlogHome from '@/pages/BlogHome';
import BlogPostDetail from '@/pages/BlogPostDetail';
import AdminLogin from '@/pages/admin/AdminLogin';
import AuthCallback from '@/pages/admin/AuthCallback';
import BlogEditor from '@/pages/admin/BlogEditor';
import NewsroomOverview from '@/pages/admin/newsroom/NewsroomOverview';
import NewsroomArticles from '@/pages/admin/newsroom/NewsroomArticles';
import NewsroomReviewQueue from '@/pages/admin/newsroom/NewsroomReviewQueue';
import NewsroomScheduler from '@/pages/admin/newsroom/NewsroomScheduler';
import NewsroomSources from '@/pages/admin/newsroom/NewsroomSources';
import NewsroomIngestion from '@/pages/admin/newsroom/NewsroomIngestion';
import NewsroomLogs from '@/pages/admin/newsroom/NewsroomLogs';
import NewsroomAnalytics from '@/pages/admin/newsroom/NewsroomAnalytics';
import NewsroomTranslation from '@/pages/admin/newsroom/NewsroomTranslation';
import NewsroomRules from '@/pages/admin/newsroom/NewsroomRules';
import NewsroomSettings from '@/pages/admin/newsroom/NewsroomSettings';
import NewsroomLayout from '@/components/newsroom/NewsroomLayout';
import RouteLoadingOverlay from '@/components/common/RouteLoadingOverlay';
import { AnimatePresence, motion } from 'framer-motion';

const queryClient = new QueryClient();

function NewsroomShell() {
  return (
    <ProtectedRoute roles={['admin', 'staff', 'content_admin']}>
      <NewsroomLayout />
    </ProtectedRoute>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  const [routeLoading, setRouteLoading] = useState(false);

  // Hiển thị loader ngắn khi chuyển trang để tránh "flash" trắng/đen lúc mount.
  useEffect(() => {
    setRouteLoading(true);
    const t = window.setTimeout(() => setRouteLoading(false), 520);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  const pageMotion = useMemo(
    () => ({
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -6 },
      transition: { duration: 0.18, ease: 'easeOut' },
    }),
    [],
  );

  return (
    <>
      <RouteLoadingOverlay active={routeLoading} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={location.pathname} {...pageMotion}>
          <Routes location={location}>
            <Route path="/" element={<BlogHome />} />
            <Route path="/en" element={<BlogHome />} />
            <Route path="/en/:slug" element={<BlogPostDetail />} />
            <Route path="/:slug" element={<BlogPostDetail />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/admin/editor"
              element={
                <ProtectedRoute roles={['admin', 'staff', 'content_admin']}>
                  <BlogEditor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/news/create"
              element={
                <ProtectedRoute roles={['admin', 'staff', 'content_admin']}>
                  <BlogEditor />
                </ProtectedRoute>
              }
            />

            <Route path="/admin/newsroom" element={<NewsroomShell />}>
              <Route index element={<NewsroomOverview />} />
              <Route path="articles" element={<NewsroomArticles />} />
              <Route path="review" element={<NewsroomReviewQueue />} />
              <Route path="scheduler" element={<NewsroomScheduler />} />
              <Route path="sources" element={<NewsroomSources />} />
              <Route path="ingestion" element={<NewsroomIngestion />} />
              <Route path="logs" element={<NewsroomLogs />} />
              <Route path="analytics" element={<NewsroomAnalytics />} />
              <Route path="translation" element={<NewsroomTranslation />} />
              <Route path="rules" element={<NewsroomRules />} />
              <Route path="settings" element={<NewsroomSettings />} />
            </Route>

            <Route path="/admin" element={<Navigate to="/admin/newsroom" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
