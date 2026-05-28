import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * NotFoundPage — friendly 404 for any unmatched route.
 */
export default function NotFoundPage() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-hero">
      <div className="absolute inset-0 bg-dotted opacity-60" />
      <div className="container-page relative text-center">
        <p className="font-display text-[7rem] font-semibold leading-none text-pine-200 sm:text-[10rem]">
          404
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-pine-900 sm:text-4xl">
          This page took a sick day
        </h1>
        <p className="mx-auto mt-3 max-w-md text-paper-600">
          The page you're looking for doesn't exist or may have been
          moved. Let's get you back to safety.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button as={Link} to="/" size="lg">
            <Home className="h-4 w-4" />
            Back to home
          </Button>
          <Button
            as="button"
            onClick={() => window.history.back()}
            variant="outline"
            size="lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Go back
          </Button>
        </div>
      </div>
    </section>
  );
}
