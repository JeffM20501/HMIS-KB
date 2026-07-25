import { visit } from 'unist-util-visit';

const CALLOUT_TYPES = new Set(['tip', 'warning', 'danger', 'info']);

/**
 * remark plugin: converts remark-directive container directives
 * (:::tip ... :::) into a synthetic `callout` hast node so react-markdown's
 * `components.callout` renderer (see CalloutBlock) can pick it up.
 *
 * This must run *after* remarkDirective in the plugin pipeline — directive
 * syntax has to be parsed into `containerDirective` mdast nodes first.
 */
export function remarkCallouts() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type !== 'containerDirective') return;
      if (!CALLOUT_TYPES.has(node.name)) return; // leave unrecognized ::: directives alone

      node.data = node.data || {};
      node.data.hName = 'callout';
      node.data.hProperties = { type: node.name };
    });
  };
}

/**
 * Fallback / escape hatch: if the Tiptap-side markdown-it-container hook
 * (see components/editor/extensions/CalloutExtension.js) ever fails to
 * pick up ":::type" blocks on load, this converts them into a form the
 * editor's default paragraph/blockquote handling can still render without
 * crashing, rather than dropping the content. Not wired in by default —
 * only use if editor-side parsing verification (see project README) finds
 * the primary path isn't working.
 */
export function preprocessCalloutsForBlockquoteFallback(markdown = '') {
  return markdown.replace(
    /:::(tip|warning|danger|info)\n([\s\S]*?)\n:::/g,
    (_match, type, body) => {
      const label = type.charAt(0).toUpperCase() + type.slice(1);
      return `> **${label}:** ${body.trim().replace(/\n/g, '\n> ')}`;
    }
  );
}

export const CALLOUT_META = {
  tip: { label: 'Tip', tone: 'success' },
  warning: { label: 'Warning', tone: 'warning' },
  danger: { label: 'Danger', tone: 'danger' },
  info: { label: 'Info', tone: 'info' },
};
