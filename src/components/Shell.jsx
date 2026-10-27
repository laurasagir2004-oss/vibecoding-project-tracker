import { useRef } from 'react';
import { Avatar, Icon, Logo, focusRing, iconBtn, useDialog } from './ui.jsx';

export const VIEWS = [
  { id: 'board', label: 'Board', icon: 'board' },
  { id: 'archive', label: 'Archive', icon: 'archive' },
  { id: 'library', label: 'Prompt library', icon: 'library' },
  { id: 'team', label: 'Team', icon: 'team' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

// The menu doubles as the site map: every view is one click away (Web Usability).
// The current view is highlighted and marked aria-current (replaces breadcrumbs: the app is only 2 levels deep).
function NavList({ view, setView, counts, onNavigate, compact = false }) {
  return (
    <ul className="space-y-1">
      {VIEWS.map((v) => {
        const active = v.id === view;
        return (
          <li key={v.id}>
            <button
              type="button"
              onClick={() => {
                setView(v.id);
                onNavigate?.();
              }}
              aria-current={active ? 'page' : undefined}
              title={compact ? v.label : undefined}
              className={`flex w-full items-center gap-3 rounded-md py-2 text-sm ${compact ? 'justify-center px-0' : 'px-3'} touch:min-h-[44px] ${focusRing} ${
                active
                  ? 'bg-brand-primary font-semibold text-surface-card'
                  : 'text-text-primary hover:bg-text-muted/10'
              }`}
            >
              <Icon name={v.icon} size={18} />
              <span className={compact ? 'sr-only' : 'flex-1 text-left'}>{v.label}</span>
              {!compact && counts[v.id] != null && (
                <span className={`font-mono text-xs ${active ? 'text-surface-card/80' : 'text-text-muted'}`}>
                  {counts[v.id]}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function QuickToggles({ isDark, toggleTheme, sound, toggleSound }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={toggleSound}
        aria-pressed={sound}
        aria-label={sound ? 'Turn celebration sound off' : 'Turn celebration sound on'}
        title={sound ? 'Sound on' : 'Sound off'}
        className={iconBtn}
      >
        <Icon name={sound ? 'volumeOn' : 'volumeOff'} size={18} />
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        aria-pressed={isDark}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Light mode' : 'Dark mode'}
        className={iconBtn}
      >
        <Icon name={isDark ? 'sun' : 'moon'} size={18} />
      </button>
    </div>
  );
}

// Who is signed in, with a way to sign out (switch user). Compact = icon rail.
function UserBlock({ user, onSignOut, compact = false }) {
  if (!user) return null;
  const signOut = (
    <button type="button" onClick={onSignOut} className={iconBtn} aria-label={`Sign out ${user.name}`} title="Sign out">
      <Icon name="logout" size={18} />
    </button>
  );
  if (compact) {
    return (
      <div className="mb-3 flex flex-col items-center gap-2 border-t border-text-muted/20 pt-3" title={`${user.name} · ${user.role}`}>
        <Avatar name={user.name} index={user.index} size="h-8 w-8" />
        <span className="sr-only">Signed in as {user.name}</span>
        {signOut}
      </div>
    );
  }
  return (
    <div className="mb-3 flex items-center gap-3 border-t border-text-muted/20 px-2 pt-3">
      <Avatar name={user.name} index={user.index} size="h-8 w-8" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">
          <span className="sr-only">Signed in as </span>
          {user.name}
        </p>
        {user.role && <p className="truncate text-xs text-text-muted">{user.role}</p>}
      </div>
      {signOut}
    </div>
  );
}

// Desktop: a sidebar that can collapse to an icon-only rail, so the menu never disappears
// (the menu stays visible alongside the content) but the board gets more room. The choice is remembered.
export function Sidebar({ view, setView, counts, onHome, toggles, collapsed, onToggle, user, onSignOut }) {
  const toggle = (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-controls="sidebar-nav"
      aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
      title={collapsed ? 'Expand menu' : 'Collapse menu'}
      className={iconBtn}
    >
      <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={18} />
    </button>
  );
  return (
    <aside
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-text-muted/20 bg-surface-card py-4 transition-[width] duration-200 motion-reduce:transition-none md:flex ${
        collapsed ? 'w-16 px-2' : 'w-60 px-3'
      }`}
    >
      {collapsed ? (
        <div className="flex flex-col items-center gap-2">
          <Logo onHome={onHome} compact />
          {toggle}
        </div>
      ) : (
        <div className="px-2">
          <div className="flex items-center justify-between gap-2">
            <Logo onHome={onHome} />
            {toggle}
          </div>
          <p className="mt-1 text-xs text-text-muted">Anchor every prompt. Keep every task flowing.</p>
        </div>
      )}
      <nav id="sidebar-nav" aria-label="Main" className="mt-6 flex-1">
        <NavList view={view} setView={setView} counts={counts} compact={collapsed} />
      </nav>
      <UserBlock user={user} onSignOut={onSignOut} compact={collapsed} />
      <div
        className={`border-t border-text-muted/20 pt-3 ${
          collapsed ? 'flex justify-center [&>div]:flex-col' : 'flex items-center justify-between px-2'
        }`}
      >
        {!collapsed && <span className="text-xs text-text-muted">Quick settings</span>}
        {toggles}
      </div>
    </aside>
  );
}

// Phones: a slim top bar plus a slide-in menu (less is more on small screens).
export function MobileBar({ view, setView, counts, onHome, menuOpen, setMenuOpen, onNewTask, toggles, user, onSignOut }) {
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-text-muted/20 bg-surface-card px-3 py-2 md:hidden">
        {/* Menu button left, logo beside it: the drawer opens from the left, matching the desktop sidebar. */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={iconBtn}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" size={20} />
          </button>
          <Logo onHome={onHome} />
        </div>
        <button type="button" className={iconBtn} aria-label="New task" onClick={onNewTask}>
          <Icon name="plus" size={20} />
        </button>
      </header>
      {menuOpen && (
        <MobileMenu view={view} setView={setView} counts={counts} onClose={() => setMenuOpen(false)} toggles={toggles} user={user} onSignOut={onSignOut} />
      )}
    </>
  );
}

function MobileMenu({ view, setView, counts, onClose, toggles, user, onSignOut }) {
  const ref = useRef(null);
  useDialog(ref, onClose);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="flex h-full w-72 max-w-[85vw] flex-col bg-surface-card p-4 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-text-primary">Menu</span>
          <button type="button" className={iconBtn} aria-label="Close menu" onClick={onClose} data-autofocus>
            <Icon name="x" size={20} />
          </button>
        </div>
        <nav aria-label="Main" className="flex-1">
          <NavList view={view} setView={setView} counts={counts} onNavigate={onClose} />
        </nav>
        <UserBlock
          user={user}
          onSignOut={() => {
            onClose();
            onSignOut();
          }}
        />
        <div className="flex items-center justify-between border-t border-text-muted/20 pt-3">
          <span className="text-xs text-text-muted">Quick settings</span>
          {toggles}
        </div>
      </div>
    </div>
  );
}
