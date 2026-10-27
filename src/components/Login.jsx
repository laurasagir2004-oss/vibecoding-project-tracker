import { useRef, useState } from 'react';
import { Avatar, Icon, LogoMark, btnPrimary, field, focusRing, labelCls } from './ui.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BENEFITS = [
  { icon: 'prompt', title: 'Context saved with every task', text: 'Prompts, the AI tool used and what happened, kept with the work.' },
  { icon: 'team', title: 'Hand off without losing work', text: 'The next person picks up exactly where you stopped.' },
  { icon: 'library', title: 'Reuse prompts that worked', text: 'Keep your best prompts in a shared library.' },
];

/**
 * Sign-in screen (front-end prototype only).
 * The client asked for a login because the tool has more than one user. The app opens signed in as a
 * demo user so assessors never have to log in; this screen appears after "Sign out" and is used to switch user.
 * - Split layout: the brand panel tells first-time users what the tool is for before they sign in.
 * - "Choose your account": recognition rather than recall, and less typing (one tap to switch user).
 * - Show/hide password: fewer typing errors (WCAG 2.2 SC 3.3.8 Accessible Authentication).
 * No password is checked or stored, because there is no server.
 */
export function LoginView({ team, onSignIn }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const emailRef = useRef(null);
  const example = team[0]?.email ?? 'name@example.com';

  const submit = (e) => {
    e.preventDefault();
    const err = {};
    const email = form.email.trim().toLowerCase();
    const member = team.find((m) => m.email.toLowerCase() === email);
    if (!email) err.email = 'Enter your email address.';
    else if (!EMAIL_RE.test(email)) err.email = 'Enter an email address like name@example.com.';
    else if (!member) err.email = 'No team member uses this email. Choose your account below instead.';
    if (!form.password) err.password = 'Enter your password.';
    setErrors(err);
    if (Object.keys(err).length) {
      emailRef.current?.focus();
      return;
    }
    onSignIn(member);
  };

  return (
    <main id="main" className="grid min-h-screen bg-surface-page md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Brand panel */}
      <section
        aria-labelledby="brand-title"
        className="flex flex-col justify-between bg-brand-primary px-6 py-6 text-surface-card md:px-12 md:py-12"
      >
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-surface-card p-0.5">
            <LogoMark size={36} />
          </span>
          <span id="brand-title" className="text-xl font-semibold tracking-tight">
            AnchorFlow
          </span>
        </div>
        <div className="mt-4 md:mt-0">
          <p className="text-lg font-medium leading-snug md:text-3xl md:leading-tight">
            Anchor every prompt.
            <br />
            Keep every task flowing.
          </p>
          <ul className="mt-8 hidden space-y-5 md:block">
            {BENEFITS.map((b) => (
              <li key={b.title} className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-card/10">
                  <Icon name={b.icon} size={18} />
                </span>
                <span>
                  <span className="block font-semibold">{b.title}</span>
                  <span className="block text-sm opacity-80">{b.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-10 hidden text-xs opacity-70 md:block">A Kanban tracker for AI-assisted software teams.</p>
      </section>

      {/* Sign-in */}
      <div className="flex items-start justify-center px-4 py-8 md:items-center md:px-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Sign in</h1>
          <p className="mt-1 text-sm text-text-muted">Welcome back. Pick up where your team left off.</p>

          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className={labelCls}>
                Email<span className="sr-only"> (required)</span>
              </label>
              <input
                id="login-email"
                ref={emailRef}
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'login-email-err' : undefined}
                className={`${field} ${errors.email ? 'border-due-overdue' : ''}`}
                placeholder="name@example.com"
              />
              {errors.email && (
                <p id="login-email-err" className="mt-1 flex items-center gap-1 text-xs text-due-overdue">
                  <Icon name="overdue" size={12} />
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="login-password" className={labelCls}>
                Password<span className="sr-only"> (required)</span>
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'login-password-err' : undefined}
                  className={`${field} pr-12 ${errors.password ? 'border-due-overdue' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  className={`absolute right-1 top-1/2 mt-0.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-text-muted hover:bg-text-muted/10 touch:h-11 touch:w-11 ${focusRing}`}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
              {errors.password && (
                <p id="login-password-err" className="mt-1 flex items-center gap-1 text-xs text-due-overdue">
                  <Icon name="overdue" size={12} />
                  {errors.password}
                </p>
              )}
            </div>
            <button type="submit" className={`${btnPrimary} w-full`}>
              Sign in
            </button>
          </form>

          {team.length > 0 && (
            <section aria-labelledby="pick-title" className="mt-8">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-text-muted/20" aria-hidden="true" />
                <h2 id="pick-title" className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Or choose your account
                </h2>
                <span className="h-px flex-1 bg-text-muted/20" aria-hidden="true" />
              </div>
              <ul className="mt-4 space-y-2">
                {team.map((m, i) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => onSignIn(m)}
                      className={`flex w-full items-center gap-3 rounded-lg border border-text-muted/20 bg-surface-card px-3 py-2.5 text-left hover:border-brand-accent hover:bg-text-muted/5 ${focusRing}`}
                    >
                      <Avatar name={m.name} index={i} size="h-9 w-9" />
                      <span className="min-w-0 flex-1">
                        <span className="sr-only">Continue as </span>
                        <span className="block truncate text-sm font-medium text-text-primary">{m.name}</span>
                        {m.role && <span className="block truncate text-xs text-text-muted">{m.role}</span>}
                      </span>
                      <Icon name="chevronRight" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="mt-6 text-xs text-text-muted">
            <strong className="font-semibold text-text-primary">Prototype:</strong> passwords are not checked because there is
            no server. Sign in with any team member's email (e.g. <span className="font-mono">{example}</span>) and any
            password, or choose an account above.
          </p>
        </div>
      </div>
    </main>
  );
}
