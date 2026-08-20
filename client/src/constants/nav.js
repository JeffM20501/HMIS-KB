import {
  LayoutDashboard, CheckSquare, BookOpen, Archive, Users, FolderOpen,
  ClipboardList, BarChart3, Activity, Settings, FilePlus2, FileText,
  Send, FolderClock, Bell,Package,
} from 'lucide-react';
import { ROUTES } from './routes';

export const ADMIN_NAV = [
  { label: 'Dashboard', to: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard, end: true },
  { label: 'Review Queue', to: ROUTES.ADMIN_REVIEW_QUEUE, icon: CheckSquare, badgeKey: 'pendingReview' },
  { label: 'Published Articles', to: ROUTES.ADMIN_PUBLISHED, icon: BookOpen },
  { label: 'Archived Articles', to: ROUTES.ADMIN_ARCHIVED, icon: Archive },
  { label: 'User Management', to: ROUTES.ADMIN_USERS, icon: Users },
  { label: 'Categories', to: ROUTES.ADMIN_CATEGORIES, icon: FolderOpen },
  { label: 'Templates', to: ROUTES.ADMIN_TEMPLATES, icon: ClipboardList },
  { label: 'Products',  to: ROUTES.ADMIN_PRODUCTS, icon: Package },
  { label: 'Analytics', to: ROUTES.ADMIN_ANALYTICS, icon: BarChart3 },
  { label: 'Audit Logs', to: ROUTES.ADMIN_AUDIT_LOGS, icon: Activity },
  { label: 'Notifications', to: ROUTES.ADMIN_NOTIFICATIONS, icon: Bell, badgeKey: 'notifications' },
  { label: 'Settings', to: ROUTES.ADMIN_SETTINGS, icon: Settings },
];

export const EDITOR_NAV = [
  { label: 'Dashboard', to: ROUTES.EDITOR_DASHBOARD, icon: LayoutDashboard, end: true },
  { label: 'Create Article', to: ROUTES.EDITOR_CREATE, icon: FilePlus2 },
  { label: 'My Drafts', to: ROUTES.EDITOR_DRAFTS, icon: FileText, badgeKey: 'drafts' },
  { label: 'Submitted', to: ROUTES.EDITOR_SUBMITTED, icon: Send },
  { label: 'My Articles', to: ROUTES.EDITOR_MY_ARTICLES, icon: FolderClock },
  { label: 'Notifications', to: ROUTES.EDITOR_NOTIFICATIONS, icon: Bell, badgeKey: 'notifications' },
  { label: 'Settings', to: ROUTES.EDITOR_SETTINGS, icon: Settings },
];
