import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Camera, Loader2 } from 'lucide-react';
import { useAuth, getAuthErrorMessage } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { resetPasswordConfirm } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = (location.state as { email?: string })?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setIsLoading(true);
    try {
      await resetPasswordConfirm(email, code, password);
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
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
          <h1 className="text-2xl font-display font-bold text-white">Set new password</h1>
          <p className="text-surface-400 text-sm mt-1">Enter your verification code and new password</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!emailFromState && (
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Verification code</label>
              <input
                id="reset-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="input text-center tracking-[0.5em] font-mono"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">New password</label>
              <input id="reset-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Confirm new password</label>
              <input id="reset-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input" placeholder="••••••••" />
            </div>
            <button type="submit" id="reset-submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</> : 'Reset password'}
            </button>
          </form>
          <div className="divider my-4" />
          <p className="text-center text-sm">
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
