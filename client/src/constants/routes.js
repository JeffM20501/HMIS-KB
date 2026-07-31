export const ROUTES = {
  // Public
  HOME: '/',
  SEARCH: '/search',
  CATEGORY: (slug = ':slug') => `/categories/${slug}`,
  ARTICLE: (slug = ':slug') => `/articles/${slug}`,
  RELEASE_NOTES: '/release-notes',

  // Auth
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_OTP: '/verify-otp',
  RESET_PASSWORD: '/reset-password',

  // Admin
  ADMIN_DASHBOARD: '/admin',
  ADMIN_REVIEW_QUEUE: '/admin/review-queue',
  ADMIN_PUBLISHED: '/admin/published',
  ADMIN_ARCHIVED: '/admin/archived',
  ADMIN_USERS: '/admin/users',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_TEMPLATES: '/admin/templates',
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_PROFILE: '/admin/profile',

  // Editor
  EDITOR_DASHBOARD: '/editor',
  EDITOR_CREATE: '/editor/articles/new',
  EDITOR_EDIT: (slug = ':slug') => `/editor/articles/${slug}/edit`,
  EDITOR_DRAFTS: '/editor/drafts',
  EDITOR_SUBMITTED: '/editor/submitted',
  EDITOR_MY_ARTICLES: '/editor/my-articles',
  EDITOR_NOTIFICATIONS: '/editor/notifications',
  EDITOR_SETTINGS: '/editor/settings',
};
