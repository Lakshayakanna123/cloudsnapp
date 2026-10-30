import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth, getAuthErrorMessage } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email address'); return; }
    setIsLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-4">
      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-glow">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </Link>
          <h1 className="text-2xl font-display font-bold text-white">Reset your password</h1>
          <p className="text-surface-400 text-sm mt-1">
            {sent ? "Check your email for reset instructions" : "Enter your email and we'll send a reset code"}
          </p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-success-500/15 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-success-400" />
              </div>
              <p className="text-surface-300 text-sm mb-6">
                If <span className="text-white font-medium">{email}</span> is registered, you'll receive a code shortly.
              </p>
              <Link to="/reset-password" state={{ email }} className="btn-primary w-full">
                Enter reset code
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-10"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>
              <button type="submit" id="forgot-submit" disabled={isLoading} className="btn-primary w-full">
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : 'Send reset code'}
              </button>
            </form>
          )}

          <div className="divider my-4" />
          <Link to="/login" className="btn-ghost w-full text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
