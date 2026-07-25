import { Link as RouterLink } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

const INTERNAL_PATTERN = /^\/(?!\/)/; // starts with a single "/" — treat as an in-app route

/**
 * Internal links (/articles/..., /categories/...) route through React
 * Router so navigating doesn't trigger a full page reload. Everything else
 * (https://, mailto:, #anchors) is a plain external link, opened in a new
 * tab with rel="noopener noreferrer" for security (no window.opener access,
 * no referrer leakage) per the "secure rel attributes" requirement.
 */
export default function SmartLink({ href = '', children, ...props }) {
  if (INTERNAL_PATTERN.test(href)) {
    return (
      <RouterLink to={href} {...props}>
        {children}
      </RouterLink>
    );
  }

  if (href.startsWith('#')) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
      {children}
      <ExternalLink className="inline w-3 h-3 ml-0.5 mb-0.5" aria-hidden="true" />
    </a>
  );
}
