import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Info, AlertTriangle, ShieldAlert, Lightbulb, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { CALLOUT_TYPES } from './CalloutExtension.js';

const ICONS = { tip: Lightbulb, warning: AlertTriangle, danger: ShieldAlert, info: Info };
const STYLES = {
  tip: 'bg-success-bg border-success/30',
  warning: 'bg-warning-bg border-warning/30',
  danger: 'bg-danger-bg border-danger/30',
  info: 'bg-primary-50 border-primary/30',
};
const ICON_COLOR = { tip: 'text-success', warning: 'text-warning', danger: 'text-danger', info: 'text-primary' };

export default function CalloutView({ node, updateAttributes, deleteNode, editor }) {
  const type = node.attrs.type;
  const Icon = ICONS[type] || Info;

  return (
    <NodeViewWrapper
      className={clsx('not-prose group relative flex gap-3 rounded-lg border px-4 py-3.5 my-3', STYLES[type] || STYLES.info)}
      data-callout-type={type}
    >
      <Icon className={clsx('w-5 h-5 shrink-0 mt-0.5', ICON_COLOR[type] || ICON_COLOR.info)} contentEditable={false} />

      <NodeViewContent className="flex-1 min-w-0 text-sm [&>p]:mb-0 [&>p:not(:last-child)]:mb-2" />

      {editor?.isEditable && (
        <div
          contentEditable={false}
          className="absolute -top-3 right-2 hidden group-hover:flex items-center gap-1 bg-white border border-border rounded-full shadow-card px-1 py-0.5"
        >
          {CALLOUT_TYPES.map((t) => {
            const TypeIcon = ICONS[t];
            return (
              <button
                key={t}
                type="button"
                title={t}
                onClick={() => updateAttributes({ type: t })}
                className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-100',
                  type === t && 'ring-1 ring-primary'
                )}
              >
                <TypeIcon className={clsx('w-3.5 h-3.5', ICON_COLOR[t])} />
              </button>
            );
          })}
          <span className="w-px h-4 bg-border mx-0.5" />
          <button
            type="button"
            title="Remove callout"
            onClick={deleteNode}
            className="w-6 h-6 rounded-full flex items-center justify-center text-text-secondary hover:bg-danger-bg hover:text-danger"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </NodeViewWrapper>
  );
}
