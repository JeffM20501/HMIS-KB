import GithubSlugger from 'github-slugger';

/**
 * Extracts a nested heading tree (H2–H4) from raw Markdown for the Table
 * of Contents. Uses github-slugger — the same slugging library rehype-slug
 * uses internally — so the ids generated here are guaranteed to match the
 * ids actually rendered onto <h2>/<h3>/<h4> by MarkdownRenderer. If these
 * two ever used different slug algorithms, TOC links would silently 404
 * against the in-page anchors.
 *
 * Returns a flat array with a `depth` field (2-4); TableOfContents nests
 * them visually by depth rather than requiring a tree structure here.
 */
export function extractHeadings(markdown = '') {
  const slugger = new GithubSlugger();
  const lines = markdown.split('\n');
  const headings = [];
  let inFence = false;

  for (const raw of lines) {
    // Don't pick up "###" inside fenced code blocks (e.g. shell comments, bash headers).
    if (/^\s*```/.test(raw)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,4})\s+(.*)$/.exec(raw.trim());
    if (!match) continue;

    const depth = match[1].length;
    const text = match[2].replace(/[*_`]/g, '').trim();
    if (!text) continue;

    headings.push({ id: slugger.slug(text), text, depth });
  }

  return headings;
}
