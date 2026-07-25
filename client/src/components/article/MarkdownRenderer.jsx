import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkDirective from 'remark-directive';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import CodeBlock from './CodeBlock.jsx';
import CalloutBlock from './CalloutBlock.jsx';
import SmartLink from './SmartLink.jsx';
import LazyImage from './LazyImage.jsx';
import { remarkCallouts } from '../../utils/markdown';

// Defined once at module scope — react-markdown re-parses the whole tree
// whenever `components`/`remarkPlugins`/`rehypePlugins` change identity,
// so these must be stable references, not re-created on every render.
const remarkPlugins = [remarkGfm, remarkDirective, remarkCallouts];
const rehypePlugins = [
  rehypeSlug,
  [rehypeAutolinkHeadings, { behavior: 'append', properties: { className: ['heading-anchor'], ariaLabel: 'Link to this section' } }],
];

function InlineCode({ children }) {
  return <code className="bg-gray-100 text-[13px] px-1.5 py-0.5 rounded">{children}</code>;
}

function ResponsiveTable({ children }) {
  return (
    <div className="overflow-x-auto mb-4 rounded-lg border border-border not-prose">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

const components = {
  pre: CodeBlock,
  code: InlineCode,
  a: SmartLink,
  img: LazyImage,
  table: ResponsiveTable,
  callout: CalloutBlock,
};

/**
 * The single canonical documentation renderer — used by the public
 * ArticlePage, the editor's Preview tab, the Review Queue preview, and
 * Release Notes, so "preview" always means exactly what will render live.
 * Supports GitHub Flavored Markdown (tables, task lists, strikethrough,
 * autolinks, footnotes via remark-gfm), slugged + anchor-linked headings,
 * syntax-highlighted code blocks with copy buttons, lazy-loaded images,
 * and ":::tip / :::warning / :::danger / :::info" callout blocks.
 */
function MarkdownRenderer({ content = '', className = '' }) {
  return (
    <div className={`kb-prose ${className}`}>
      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default memo(MarkdownRenderer);
