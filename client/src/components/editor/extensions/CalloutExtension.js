import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import container from 'markdown-it-container';
import CalloutView from './CalloutView.jsx';

export const CALLOUT_TYPES = ['tip', 'warning', 'danger', 'info'];

/**
 * A real block-level node (not a styled blockquote hack). Round-trips to
 * Markdown as a ":::type" container directive:
 *
 *   :::tip
 *   Some **rich** content, more than one paragraph if needed.
 *   :::
 *
 * Editor -> Markdown (serialize): uses the standard prosemirror-markdown
 * MarkdownSerializerState API (state.write/renderContent/closeBlock) that
 * tiptap-markdown exposes via `addStorage().markdown.serialize`. This half
 * is on solid, well-documented ground.
 *
 * Markdown -> Editor (parse): registers `markdown-it-container` — one
 * instance per callout type — via tiptap-markdown's
 * `addStorage().markdown.parse.setup(markdownit)` hook, so a ":::tip"
 * fence in loaded article content becomes this node rather than being
 * flattened into plain text. This is the one integration point in the
 * whole editor rebuild that depends on tiptap-markdown's exact plugin-hook
 * shape, which could not be verified against the live package here (no
 * network access in this environment to install and run it). Test it by
 * loading an existing article whose Markdown contains a ":::tip" block —
 * if it doesn't come back as a Callout node, see
 * utils/markdown.js `preprocessCalloutsForBlockquoteFallback` for a
 * guaranteed-working fallback while this gets patched.
 */
export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,

  addAttributes() {
    return {
      type: {
        default: 'info',
        parseHTML: (element) => element.getAttribute('data-callout-type') || 'info',
        renderHTML: (attributes) => ({ 'data-callout-type': attributes.type }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout-type]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutView);
  },

  addCommands() {
    return {
      setCallout:
        (type = 'info') =>
        ({ commands }) =>
          commands.wrapIn(this.name, { type }),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state, node) {
          const type = CALLOUT_TYPES.includes(node.attrs.type) ? node.attrs.type : 'info';
          state.write(`:::${type}\n`);
          state.renderContent(node);
          state.ensureNewLine();
          state.write(':::');
          state.closeBlock(node);
        },
        parse: {
          setup(markdownit) {
            CALLOUT_TYPES.forEach((type) => {
              markdownit.use(container, type, {
                validate: (params) => params.trim() === type,
                render(tokens, idx) {
                  return tokens[idx].nesting === 1 ? `<div data-callout-type="${type}">\n` : '</div>\n';
                },
              });
            });
          },
        },
      },
    };
  },
});

export default Callout;
