import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { ROUTES } from '../../constants/routes';

// Links that map to real, existing routes are wired live; the rest mirror
// the Figma design's own (also inert) placeholders — plain text rather
// than functional links, since there's no dedicated page for them yet and
// inventing new routes is outside this task's scope (Home + Auth only).
const COLUMNS = [
  {
    title: 'Documentation',
    links: [
      { label: 'Getting Started', to: '/categories/getting-started' },
      { label: 'Patient Management', to: '/categories/patient-management' },
      { label: 'Laboratory', to: '/categories/laboratory' },
      { label: 'Billing', to: '/categories/billing' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Submit a Ticket', to: `${ROUTES.HOME}#contact` },
      { label: 'System Status' },
      { label: 'Release Notes', to: ROUTES.RELEASE_NOTES },
      { label: 'Contact Us', to: `${ROUTES.HOME}#contact` },
    ],
  },
  {
    title: 'Platform',
    links: [{ label: 'HMIS Core' }, { label: 'Lab Module' }, { label: 'Pharmacy' }, { label: 'Admin Portal' }],
  },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-border bg-white mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </span>
            <span className="text-[15px] font-bold text-text-primary">TaifaCare</span>
          </Link>
          <p className="text-sm text-text-secondary mt-3 max-w-xs">
            Healthcare HMIS platform powering clinical operations across East Africa.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-3">{col.title}</h4>
            <ul className="space-y-2">
              {col.links.map((link) =>
                link.to ? (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-text-secondary hover:text-primary">
                      {link.label}
                    </Link>
                  </li>
                ) : (
                  <li key={link.label} className="text-sm text-text-secondary/70">
                    {link.label}
                  </li>
                )
              )}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-text-secondary">
          <span>© {new Date().getFullYear()} TaifaCare Health Technologies. All rights reserved.</span>
          <span className="flex items-center gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Accessibility</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
