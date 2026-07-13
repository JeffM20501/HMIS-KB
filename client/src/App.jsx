import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import KnowledgeBasePage from "./pages/KnowledgeBasePage.jsx";
import ArticlePage from "./pages/ArticlePage.jsx";
import ArticleEditorPage from "./pages/ArticleEditorPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import VerifyOtpPage from "./pages/auth/VerifyOTPPage.jsx";
import UserDetailPage from "./pages/UserDetailPage.jsx";
import CategoryEditorPage from "./pages/CategoryEditorPage.jsx";
import { ROLES } from "./utils/constants";
import EditorDraftsPage from "./pages/EditorDraftsPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* Public marketing + auth routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path='/verify-otp' element={<VerifyOtpPage/>}/>

      {/* Authenticated app shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/app/users/:id" element={<UserDetailPage/>}/>
          <Route path="/app/dashboard" element={<DashboardPage />} />
          <Route path="/app/knowledge-base" element={<KnowledgeBasePage />} />
          <Route path="/app/knowledge-base/:slug" element={<ArticlePage />} />
          <Route path="/app/settings" element={<SettingsPage />} />

          {/* Editor/Admin only */}
          <Route element={<ProtectedRoute roles={[ROLES.EDITOR, ROLES.ADMIN]} />}>
            <Route path="/app/articles/new" element={<ArticleEditorPage />} />
            <Route path="/app/articles/:id/edit" element={<ArticleEditorPage />} />
            <Route path="/app/my-drafts" element={<EditorDraftsPage/>}/>
          </Route>

          {/* Admin only */}
          <Route element={<ProtectedRoute roles={[ROLES.ADMIN]} />}>
            <Route path="/app/admin" element={<AdminPage />} />
            <Route path="/app/admin/categories/new" element={<CategoryEditorPage/>}/>
            <Route path="/app/admin/categories/:id/edit" element={<CategoryEditorPage/>}/>
          </Route>

          <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
