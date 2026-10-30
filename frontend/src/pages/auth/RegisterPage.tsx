import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Camera, Mail, Lock, User, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth, getAuthErrorMessage } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
});

type RegisterForm = z.infer<typeof registerSchema>;

const passwordRequirements = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'Special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function RegisterPage() {
  const { register: authRegister } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema), mode: 'onChange' });

  const password = watch('password', '');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      await authRegister(data.email, data.password, data.name);
      navigate('/verify-email', { state: { email: data.email } });
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary-600/8 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center shadow-glow">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-white text-xl">CloudSnap</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-white">Create your account</h1>
          <p className="text-surface-400 text-sm mt-1">Start securing your memories today</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Full name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  {...register('name')}
                  id="reg-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Doe"
                  className={`input pl-10 ${errors.name ? 'input-error' : ''}`}
                />
              </div>
              {errors.name && <p className="text-danger-400 text-xs mt-1.5">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  {...register('email')}
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                />
              </div>
              {errors.email && <p className="text-danger-400 text-xs mt-1.5">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  {...register('password')}
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password requirements */}
              {password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req) => (
                    <div key={req.label} className="flex items-center gap-1.5">
                      <CheckCircle2
                        className={`w-3.5 h-3.5 flex-shrink-0 ${req.test(password) ? 'text-success-400' : 'text-surface-600'}`}
                      />
                      <span className={`text-xs ${req.test(password) ? 'text-success-400' : 'text-surface-500'}`}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                <input
                  {...register('confirmPassword')}
                  id="reg-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={`input pl-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-danger-400 text-xs mt-1.5">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button type="submit" id="reg-submit" disabled={isLoading} className="btn-primary w-full mt-2">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="divider my-6" />
          <p className="text-center text-sm text-surface-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
