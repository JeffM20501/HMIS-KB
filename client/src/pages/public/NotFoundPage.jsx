import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-5">
        <Compass className="w-8 h-8 text-primary" />
      </div>
      <p className="text-sm font-semibold text-primary mb-2">404</p>
      <h1 className="text-3xl font-bold text-text-primary mb-3">Page not found</h1>
      <p className="text-text-secondary max-w-sm mb-6">
        The page you're looking for doesn't exist or may have been moved. Try searching the knowledge base instead.
      </p>
      <div className="flex items-center gap-3">
        <Button as={Link} to="/">
          Back to home
        </Button>
        <Button as={Link} to="/search" variant="secondary">
          Search articles
        </Button>
      </div>
    </div>
  );
}
