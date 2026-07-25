import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy } from 'lucide-react';

/**
 * Overrides react-markdown's `pre` (not `code`) — react-markdown v9 removed
 * the `inline` flag from the `code` component, so the reliable way to tell
 * a fenced code block apart from inline code is that fenced blocks are
 * always wrapped in <pre><code class="language-x">...</code></pre>, while
 * inline code renders as a bare <code> with no wrapper. Overriding `pre`
 * means we only ever hit this for block-level code.
 */
export default function CodeBlock({ children }) {
  const [copied, setCopied] = useState(false);

  const codeElement = Array.isArray(children) ? children[0] : children;
  const className = codeElement?.props?.className || '';
  const language = /language-(\w+)/.exec(className)?.[1] || 'text';
  const code = String(codeElement?.props?.children ?? '').replace(/\n$/, '');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be unavailable (older browsers, insecure context) — fail silently.
    }
  };

  return (
    <div className="relative group rounded-lg overflow-hidden border border-border mb-4 not-prose">
      <div className="flex items-center justify-between px-4 py-1.5 bg-gray-50 border-b border-border">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">{language}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" /> Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneLight}
        customStyle={{ margin: 0, padding: '1rem', fontSize: '13px', background: '#fff' }}
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
