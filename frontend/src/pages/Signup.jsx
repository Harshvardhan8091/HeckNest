import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ROLE_REDIRECT = {
  admin: '/admin/dashboard',
  organizer: '/organizer/dashboard',
  participant: '/participant/dashboard',
  judge: '/judge/dashboard',
};

const ROLES = [
  { value: 'participant', label: 'Participant' },
  { value: 'organizer',   label: 'Organizer'   },
  { value: 'judge',       label: 'Judge'        },
];

function InlineSpinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'participant' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required.';
    if (!form.email.trim()) {
      errs.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address.';
    }
    if (!form.password) {
      errs.password = 'Password is required.';
    } else if (form.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }
    if (!form.role) errs.role = 'Please select a role.';
    return errs;
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name, email: form.email, password: form.password, role: form.role,
      });
      login(data);
      navigate(ROLE_REDIRECT[data.role] ?? '/');
    } catch (err) {
      setServerError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldCls = (name) =>
    `w-full rounded-lg border bg-elevated px-4 py-2.5 text-sm text-text-primary placeholder-text-faint outline-none transition-colors
     focus:ring-1 focus:ring-accent
     ${errors[name] ? 'border-red-500' : 'border-border focus:border-accent'}`;

  return (
    <div className="min-h-screen bg-base flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">

        {/* Wordmark */}
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-faint mb-3">HeckNest</p>
          <h1 className="text-2xl font-semibold text-text-primary">Create your account</h1>
          <p className="mt-1 text-sm text-text-muted">Join and compete in world-class hackathons</p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-surface p-6">

          {serverError && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              <span className="mt-0.5 shrink-0">⚠</span>
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-text-muted">Full name</label>
              <input
                id="name" name="name" type="text" autoComplete="name"
                value={form.name} onChange={handleChange} placeholder="Jane Doe"
                className={fieldCls('name')}
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text-muted">Email address</label>
              <input
                id="email" name="email" type="email" autoComplete="email"
                value={form.email} onChange={handleChange} placeholder="you@example.com"
                className={fieldCls('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text-muted">Password</label>
              <input
                id="password" name="password" type="password" autoComplete="new-password"
                value={form.password} onChange={handleChange} placeholder="At least 6 characters"
                className={fieldCls('password')}
              />
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            {/* Role selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-muted">I am joining as</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(({ value, label }) => (
                  <label
                    key={value}
                    htmlFor={`role-${value}`}
                    className={`flex cursor-pointer items-center justify-center rounded-lg border py-2.5 text-xs font-medium transition-colors
                      ${form.role === value
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border bg-elevated text-text-muted hover:border-border-strong hover:text-text-primary'
                      }`}
                  >
                    <input
                      id={`role-${value}`} type="radio" name="role" value={value}
                      checked={form.role === value} onChange={handleChange}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
              {errors.role && <p className="mt-1 text-xs text-red-400">{errors.role}</p>}
            </div>

            <button
              type="submit" disabled={loading}
              className="mt-1 w-full rounded-lg bg-accent hover:bg-accent-hover px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <InlineSpinner /> Creating account…
                </span>
              ) : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-accent hover:text-accent-hover transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
