import { Link } from 'react-router-dom';
import { Camera, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-6 text-center">
      <div className="animate-slide-up">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500/20 to-violet-500/10 border border-primary-500/20 flex items-center justify-center mx-auto mb-6">
          <Camera className="w-10 h-10 text-primary-400" />
        </div>
        <h1 className="text-7xl font-display font-bold text-white mb-3">404</h1>
        <p className="text-xl font-display font-semibold text-surface-200 mb-2">Page not found</p>
        <p className="text-surface-400 mb-8 max-w-sm mx-auto">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => history.back()} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
          <Link to="/" className="btn-primary">
            <Home className="w-4 h-4" /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
