import { Info, AlertTriangle, ShieldAlert, Lightbulb } from 'lucide-react';
import { CALLOUT_META } from '../../utils/markdown';

const ICONS = { tip: Lightbulb, warning: AlertTriangle, danger: ShieldAlert, info: Info };

const STYLES = {
  tip: 'bg-success-bg border-success/30 text-success',
  warning: 'bg-warning-bg border-warning/30 text-warning',
  danger: 'bg-danger-bg border-danger/30 text-danger',
  info: 'bg-primary-50 border-primary/30 text-primary',
};

/**
 * Rendered from ":::tip / :::warning / :::danger / :::info" container
 * directives — see utils/markdown.js `remarkCallouts` for how the raw
 * directive becomes this component's `type` prop.
 */
export default function CalloutBlock({ type = 'info', children }) {
  const Icon = ICONS[type] || Info;
  const meta = CALLOUT_META[type] || CALLOUT_META.info;

  return (
    <div
      role="note"
      aria-label={meta.label}
      className={`not-prose flex gap-3 rounded-lg border px-4 py-3.5 mb-4 ${STYLES[type] || STYLES.info}`}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
      <div className="text-sm text-text-primary [&>p]:mb-0 [&>p:not(:last-child)]:mb-2 [&_a]:underline">
        <p className="font-semibold mb-1">{meta.label}</p>
        {children}
      </div>
    </div>
  );
}
