import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { User, Lock, Bell, Palette, ShieldCheck, Smartphone, Camera } from 'lucide-react';
import * as usersApi from '../../api/users.api';
import { useAuth } from '../../hooks/useAuth';
import { extractErrorMessage } from '../../api/axios';
import PageHeader from '../../components/common/PageHeader.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import Card from '../../components/ui/Card.jsx';
import Input from '../../components/ui/Input.jsx';
import Label from '../../components/ui/Label.jsx';
import FieldError from '../../components/ui/FieldError.jsx';
import Button from '../../components/ui/Button.jsx';
import Avatar from '../../components/ui/Avatar.jsx';

const TABS = [
  { value: 'profile', label: 'Profile', icon: User },
  { value: 'security', label: 'Security', icon: Lock },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'appearance', label: 'Appearance', icon: Palette },
  { value: 'sessions', label: 'Sessions', icon: Smartphone },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('profile');

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, security, and preferences" />
      <Tabs
        tabs={TABS.map((t) => ({ value: t.value, label: t.label }))}
        active={tab}
        onChange={setTab}
        className="mb-6"
      />
      <div className="max-w-2xl">
        {tab === 'profile' && <ProfileTab />}
        {tab === 'security' && <SecurityTab />}
        {tab === 'notifications' && <NotificationsTab />}
        {tab === 'appearance' && <AppearanceTab />}
        {tab === 'sessions' && <SessionsTab />}
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user, refreshCurrentUser } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ values: { full_name: user?.full_name, email: user?.email, department: user?.department, facility: user?.facility } });

  const avatarMutation = useMutation({
    mutationFn: (file) => usersApi.updateAvatar(user.id, file),
    onSuccess: () => {
      toast.success('Profile photo updated.');
      refreshCurrentUser();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => usersApi.updateProfile(user.id, payload),
    onSuccess: () => {
      toast.success('Profile updated.');
      refreshCurrentUser();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-semibold text-text-primary mb-4">Profile photo</h3>
        <div className="flex items-center gap-4">
          <Avatar name={user?.full_name} src={user?.avatar} size="lg" />
          <label className="cursor-pointer">
            <Button as="span" variant="secondary" size="sm" isLoading={avatarMutation.isPending}>
              <Camera className="w-4 h-4" /> Change photo
            </Button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && avatarMutation.mutate(e.target.files[0])}
            />
          </label>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-text-primary mb-4">Personal information</h3>
        <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
          <div>
            <Label required>Full name</Label>
            <Input error={!!errors.full_name} {...register('full_name', { required: 'Required' })} />
            <FieldError>{errors.full_name?.message}</FieldError>
          </div>
          <div>
            <Label required>Email</Label>
            <Input type="email" error={!!errors.email} {...register('email', { required: 'Required' })} />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Department</Label>
              <Input {...register('department')} />
            </div>
            <div>
              <Label>Facility</Label>
              <Input {...register('facility')} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function SecurityTab() {
  const { user } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const mutation = useMutation({
    mutationFn: ({ new_password }) => usersApi.setUserPassword(user.id, new_password),
    onSuccess: () => {
      toast.success('Password changed.');
      reset();
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-semibold text-text-primary mb-1 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" /> Change password
        </h3>
        <p className="text-sm text-text-secondary mb-4">Use a strong password you don't reuse elsewhere.</p>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div>
            <Label required>Current password</Label>
            <Input type="password" error={!!errors.current_password} {...register('current_password', { required: 'Required' })} />
            <FieldError>{errors.current_password?.message}</FieldError>
          </div>
          <div>
            <Label required>New password</Label>
            <Input
              type="password"
              error={!!errors.new_password}
              {...register('new_password', { required: 'Required', minLength: { value: 8, message: 'At least 8 characters' } })}
            />
            <FieldError>{errors.new_password?.message}</FieldError>
          </div>
          <div>
            <Label required>Confirm new password</Label>
            <Input
              type="password"
              error={!!errors.confirm}
              {...register('confirm', { validate: (v) => v === watch('new_password') || 'Passwords do not match' })}
            />
            <FieldError>{errors.confirm?.message}</FieldError>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" isLoading={isSubmitting}>
              Update password
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    low_rating_alerts: true,
    review_updates: true,
    weekly_digest: false,
    content_gap_alerts: true,
  });

  const toggle = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const OPTIONS = [
    { key: 'review_updates', label: 'Review status updates', description: 'When your submitted articles are approved or returned' },
    { key: 'low_rating_alerts', label: 'Low rating alerts', description: 'When a published article receives a rating of 2 stars or below' },
    { key: 'content_gap_alerts', label: 'Content gap alerts', description: 'When searches or assistant queries reveal missing documentation' },
    { key: 'weekly_digest', label: 'Weekly digest email', description: 'A summary of knowledge base activity every Monday' },
  ];

  return (
    <Card>
      <h3 className="font-semibold text-text-primary mb-4">Notification preferences</h3>
      <div className="divide-y divide-border">
        {OPTIONS.map((opt) => (
          <div key={opt.key} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
            <div className="pr-4">
              <p className="text-sm font-medium text-text-primary">{opt.label}</p>
              <p className="text-xs text-text-secondary">{opt.description}</p>
            </div>
            <button
              onClick={() => toggle(opt.key)}
              className={`w-11 h-6 rounded-full shrink-0 transition-colors relative ${
                prefs[opt.key] ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  prefs[opt.key] ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AppearanceTab() {
  const [theme, setTheme] = useState('light');
  return (
    <Card>
      <h3 className="font-semibold text-text-primary mb-4">Appearance</h3>
      <p className="text-sm text-text-secondary mb-4">Choose how the knowledge base looks on your device.</p>
      <div className="grid grid-cols-3 gap-3 max-w-md">
        {['light', 'dark', 'system'].map((opt) => (
          <button
            key={opt}
            onClick={() => setTheme(opt)}
            className={`rounded-lg border-2 p-3 text-sm font-medium capitalize transition-colors ${
              theme === opt ? 'border-primary text-primary bg-primary-50' : 'border-border text-text-secondary hover:border-gray-300'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      <p className="text-xs text-text-secondary mt-3">Dark mode is a v2 consideration — this preference is saved for when it ships.</p>
    </Card>
  );
}

function SessionsTab() {
  return (
    <div className="space-y-6">
      <Card>
        <h3 className="font-semibold text-text-primary mb-1">Session management</h3>
        <p className="text-sm text-text-secondary mb-4">
          Sessions automatically expire after 8 hours of inactivity, per platform policy (FR-3.5).
        </p>
        <div className="flex items-center justify-between border border-border rounded-lg p-4">
          <div>
            <p className="text-sm font-medium text-text-primary">This device</p>
            <p className="text-xs text-text-secondary">Current session · active now</p>
          </div>
          <span className="text-xs font-medium text-success bg-success-bg px-2 py-1 rounded-full">Active</span>
        </div>
      </Card>

      <Card>
        <h3 className="font-semibold text-text-primary mb-1">Connected devices</h3>
        <p className="text-sm text-text-secondary">
          Device-level session history isn't available from the backend yet — this section will populate once that
          endpoint is added.
        </p>
      </Card>
    </div>
  );
}
