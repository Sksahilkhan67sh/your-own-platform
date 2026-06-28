import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-content flex-col items-center px-4 py-32 text-center sm:px-6 lg:px-8">
      <p className="font-display text-display-lg text-ink">404</p>
      <h1 className="mt-2 font-display text-xl text-ink">This page doesn't exist</h1>
      <p className="mt-3 max-w-md text-ink-soft">
        The page you're looking for may have moved, or the link might be out of date.
      </p>
      <Button as={Link} to="/" variant="primary" size="md" className="mt-8">
        Back to home
      </Button>
    </div>
  );
}
