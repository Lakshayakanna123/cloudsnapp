import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Camera, Loader2, RefreshCw } from 'lucide-react';
import { useAuth, getAuthErrorMessage } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const { confirmEmail, resendCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || '';

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [emailInput, setEmailInput] = useState(email);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 6) { toast.error('Enter your 6-digit verification code'); return; }
    setIsVerifying(true);
    try {
      await confirmEmail(emailInput, code);
      toast.success('Email verified! You can now sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!emailInput) { toast.error('Enter your email address'); return; }
    setIsResending(true);
    try {
      await resendCode(emailInput);
      toast.success('Verification code resent!');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setIsResending(false);
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
          <h1 className="text-2xl font-display font-bold text-white">Verify your email</h1>
          <p className="text-surface-400 text-sm mt-1">
            Enter the 6-digit code sent to <span className="text-surface-200">{emailInput || 'your email'}</span>
          </p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleVerify} className="space-y-4">
            {!email && (
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Verification code</label>
              <input
                id="verify-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input text-center tracking-[0.5em] text-xl font-mono"
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
              />
            </div>
            <button type="submit" id="verify-submit" disabled={isVerifying} className="btn-primary w-full">
              {isVerifying ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : 'Verify email'}
            </button>
          </form>

          <button
            onClick={handleResend}
            disabled={isResending}
            className="btn-ghost w-full mt-3 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
            {isResending ? 'Resending…' : 'Resend code'}
          </button>

          <div className="divider my-4" />
          <p className="text-center text-sm text-surface-400">
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
