import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import PageLoader from './components/common/PageLoader.jsx';

import PublicLayout from './layouts/PublicLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import AuthBrandPanel from './components/auth/AuthBrandPanel.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import EditorLayout from './layouts/EditorLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import RoleRoute from './routes/RoleRoute.jsx';
import { ROLES } from './constants/auth';

// --- Public ---
const HomePage = lazy(() => import('./pages/public/HomePage.jsx'));
const SearchResultsPage = lazy(() => import('./pages/public/SearchResultsPage.jsx'));
const CategoryPage = lazy(() => import('./pages/public/CategoryPage.jsx'));
const ArticlePage = lazy(() => import('./pages/public/ArticlePage.jsx'));
const ReleaseNotesPage = lazy(() => import('./pages/public/ReleaseNotesPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/public/NotFoundPage.jsx'));

// --- Auth ---
const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'));
const SignUpPage = lazy(() => import('./pages/auth/SignUpPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage.jsx'));
const VerifyOtpPage = lazy(() => import('./pages/auth/VerifyOtpPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage.jsx'));

// --- Admin ---
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx'));
const ReviewQueuePage = lazy(() => import('./pages/admin/ReviewQueuePage.jsx'));
const PublishedArticlesPage = lazy(() => import('./pages/admin/PublishedArticlesPage.jsx'));
const ArchivedArticlesPage = lazy(() => import('./pages/admin/ArchivedArticlesPage.jsx'));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage.jsx'));
const UserDetailPage = lazy(()=>import('./pages/admin/UserDetailPage.jsx'));
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage.jsx'));
const TemplatesPage = lazy(() => import('./pages/admin/TemplatesPage.jsx'));
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage.jsx'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage.jsx'));
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage.jsx'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage.jsx'));

// --- Editor ---
const EditorDashboardPage = lazy(() => import('./pages/editor/EditorDashboardPage.jsx'));
const EditorArticleViewPage = lazy(() => import('./pages/editor/EditorArticleViewPage.jsx'));
const ArticleEditorPage = lazy(() => import('./pages/editor/ArticleEditorPage.jsx'));
const DraftsPage = lazy(() => import('./pages/editor/DraftsPage.jsx'));
const SubmittedPage = lazy(() => import('./pages/editor/SubmittedPage.jsx'));
const MyArticlesPage = lazy(() => import('./pages/editor/MyArticlesPage.jsx'));
const EditorNotificationsPage = lazy(() => import('./pages/editor/EditorNotificationsPage.jsx'));
const EditorSettingsPage = lazy(() => import('./pages/editor/EditorSettingsPage.jsx'));

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Knowledge Base */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/categories/:slug" element={<CategoryPage />} />
          <Route path="/articles/:slug" element={<ArticlePage />} />
          <Route path="/release-notes" element={<ReleaseNotesPage />} />
        </Route>

        {/* Auth — Login and Sign Up render their own two-panel layout
            (see AuthBrandPanel) since the new design differs per page.
            Forgot Password / Verify OTP / Reset Password are unchanged
            and keep the existing shared AuthLayout. */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Admin (protected + role-gated) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowed={[ROLES.ADMIN]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="review-queue" element={<ReviewQueuePage />} />
              <Route path="published" element={<PublishedArticlesPage />} />
              <Route path="archived" element={<ArchivedArticlesPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="users/:id" element={<UserDetailPage/>}/>
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="profile" element={<AdminSettingsPage />} />
            </Route>
          </Route>

          {/* Editor (admins may also access editor tools) */}
          <Route element={<RoleRoute allowed={[ROLES.EDITOR, ROLES.ADMIN]} />}>
            <Route path="/editor" element={<EditorLayout />}>
              <Route index element={<EditorDashboardPage />} />
              <Route path="articles/new" element={<ArticleEditorPage />} />
              <Route path="articles/:slug" element={<EditorArticleViewPage />} />
              <Route path="articles/:slug/edit" element={<ArticleEditorPage />} />
              <Route path="drafts" element={<DraftsPage />} />
              <Route path="submitted" element={<SubmittedPage />} />
              <Route path="my-articles" element={<MyArticlesPage />} />
              <Route path="notifications" element={<EditorNotificationsPage />} />
              <Route path="settings" element={<EditorSettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
