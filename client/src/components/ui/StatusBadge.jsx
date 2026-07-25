import Badge from './Badge.jsx';

// Maps article/user/queue statuses used across admin + editor screens to a consistent tone.
const STATUS_TONE = {
  published: 'green',
  active: 'green',
  approved: 'green',
  draft: 'gray',
  in_draft: 'gray',
  pending_review: 'amber',
  pending: 'amber',
  submitted: 'amber',
  archived: 'gray',
  rejected: 'red',
  suspended: 'red',
  inactive: 'red',
  high: 'red',
  normal: 'blue',
  low: 'gray',
};

const STATUS_LABEL = {
  pending_review: 'Pending Review',
  in_draft: 'Draft',
};

export default function StatusBadge({ status }) {
  const key = (status || '').toLowerCase();
  const tone = STATUS_TONE[key] || 'gray';
  const label = STATUS_LABEL[key] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : '—');
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}
