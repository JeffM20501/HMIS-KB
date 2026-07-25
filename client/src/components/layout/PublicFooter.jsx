import { Link } from 'react-router-dom';
import Logo from '../common/Logo.jsx';

const COLUMNS = [
  {
    title: 'Support',
    links: [
      { label: 'Contact Support', href: '#' },
      { label: 'Escalate an Issue', href: '#' },
    ],
  },
  {
    title: 'Documentation',
    links: [
      { label: 'Browse Categories', to: '/' },
      { label: 'Release Notes', to: '/release-notes' },
    ],
  },
  {
    title: 'Product Status',
    links: [{ label: 'System Status', href: '#' }],
  },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-border bg-white mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2">
          <Logo />
          <p className="text-sm text-text-secondary mt-3 max-w-xs">
            The centralized documentation and support system for the TaifaCare HMIS product suite.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold text-text-primary mb-3">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  {link.to ? (
                    <Link to={link.to} className="text-sm text-text-secondary hover:text-primary">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="text-sm text-text-secondary hover:text-primary">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-text-secondary">
        © {new Date().getFullYear()} TaifaCare. Internal documentation — synthetic data only, no real patient information.
      </div>
    </footer>
  );
}
