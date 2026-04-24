import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { errMsg } from '../api/client';
import Spinner from '../components/Spinner';

export default function LoginPage() {
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('admin@kinucafe.com');
  const [password, setPassword] = useState('admin123');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && user) {
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (ex) {
      setErr(errMsg(ex, 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-gradient-to-br from-brand-100 to-brand-300">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-3xl mb-2">☕</div>
          <h1 className="text-2xl font-semibold">Kinu's Cafe</h1>
          <p className="text-sm text-slate-500">Admin console sign in</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {err && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {err}
            </div>
          )}
          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? <Spinner size="sm" /> : 'Sign in'}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-6">
          Default admin: <code>admin@kinucafe.com</code> / <code>admin123</code>
          <br />
          Change the password from Settings after first login.
        </p>
      </div>
    </div>
  );
}
