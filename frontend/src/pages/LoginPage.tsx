import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Loader2, Eye } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const loginSchema = Yup.object({
  email: Yup.string().required('Email is required').email('Enter a valid email'),
  password: Yup.string().required('Password is required').min(6, 'At least 6 characters'),
});

export default function LoginPage() {
  const [error, setError] = useState('');
  const { login, enterAsGuest } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      setError('');
      try {
        await login(values.email, values.password);
        navigate('/agenda');
      } catch {
        setError('Invalid email or password');
      }
    },
  });

  const fillDemo = (email: string) => {
    formik.setFieldValue('email', email);
    formik.setFieldValue('password', 'community2026');
  };

  const handleGuest = () => {
    enterAsGuest();
    navigate('/agenda');
  };

  const fieldError = (name: 'email' | 'password') =>
    formik.touched[name] && formik.errors[name] ? formik.errors[name] : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-primary-600 to-primary-800">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Community Day</h1>
          <p className="text-primary-200 mt-1 text-sm">Your event companion</p>
        </div>

        <form onSubmit={formik.handleSubmit} className="bg-slate-800/95 rounded-2xl p-6 shadow-xl border border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Sign In</h2>

          {error && (
            <div className="bg-red-900/50 text-red-300 text-sm px-4 py-2.5 rounded-xl mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="email" className="text-xs font-medium text-slate-400 mb-1 block">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                className={`input-field ${fieldError('email') ? 'border-red-400' : ''}`}
                {...formik.getFieldProps('email')}
              />
              {fieldError('email') && <p className="text-xs text-red-500 mt-1">{fieldError('email')}</p>}
            </div>
            <div>
              <label htmlFor="password" className="text-xs font-medium text-slate-400 mb-1 block">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                className={`input-field ${fieldError('password') ? 'border-red-400' : ''}`}
                {...formik.getFieldProps('password')}
              />
              {fieldError('password') && <p className="text-xs text-red-500 mt-1">{fieldError('password')}</p>}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full mt-4 flex items-center justify-center gap-2" disabled={formik.isSubmitting}>
            {formik.isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
            {formik.isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="mt-4 pt-4 border-t border-slate-600">
            <p className="text-xs text-slate-500 text-center mb-2">Development shortcuts</p>
            <div className="space-y-2">
              <button
                type="button"
                className="btn-secondary w-full text-sm"
                onClick={() => fillDemo('marko@example.com')}
              >
                Use demo credentials
              </button>
              <button
                type="button"
                className="w-full text-sm px-4 py-2 rounded-xl font-medium border border-amber-500/50 bg-amber-900/30 text-amber-300 hover:bg-amber-800/40 transition-colors"
                onClick={() => fillDemo('admin@community.day')}
              >
                Use admin demo credentials
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-600">
            <button
              type="button"
              onClick={handleGuest}
              className="w-full text-sm px-4 py-2.5 rounded-xl font-medium text-slate-400 hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Eye size={16} />
              Continue as Guest
            </button>
            <p className="text-[10px] text-slate-500 text-center mt-1">Browse the agenda without signing in</p>
          </div>
        </form>
      </div>
    </div>
  );
}

function Calendar(props: { className?: string; size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <path d="M8 2v4M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}
