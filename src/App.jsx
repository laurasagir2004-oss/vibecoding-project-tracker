import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from './lib/storage.js';
import {
  DEFAULT_ANCHORS,
  DEFAULT_SETTINGS,
  DEFAULT_TEAM,
  blankTask,
  newId,
  normaliseMember,
  normaliseTask,
  seedLibrary,
  seedTasks,
  taskToBriefing,
  withStatus,
} from './lib/model.js';
import { celebrate, copyText, playShipSound } from './lib/effects.js';
import { Toast } from './components/ui.jsx';
import { MobileBar, QuickToggles, Sidebar, VIEWS } from './components/Shell.jsx';
import { BoardView, EMPTY_FILTERS } from './components/Board.jsx';
import { TaskModal } from './components/TaskModal.jsx';
import { ArchiveView, LibraryView, SettingsView, TeamView } from './components/Views.jsx';
import { LoginView } from './components/Login.jsx';

/**
 * AnchorFlow — a Kanban tracker for AI-assisted ("vibe-coded") software projects.
 * Evolved from the CM6312 hackathon starter (Prof. Dr. Ignacio Alvarez).
 * State lives here and flows down as props; components send actions back up
 * (one-way data flow). Everything is saved in localStorage (no backend).
 */

const viewFromHash = () => {
  const id = window.location.hash.replace('#', '');
  return VIEWS.some((v) => v.id === id) ? id : 'board';
};

export default function App() {
  const [tasks, setTasks] = useLocalStorage('anchorflow.tasks', seedTasks, {
    legacyKey: 'vibetracker.tasks',
    migrate: (list) => list.map(normaliseTask),
  });
  const [team, setTeam] = useLocalStorage('anchorflow.team', DEFAULT_TEAM, { migrate: (list) => list.map(normaliseMember) });
  const [anchors, setAnchors] = useLocalStorage('anchorflow.anchors', DEFAULT_ANCHORS, { legacyKey: 'vibetracker.anchors' });
  const [library, setLibrary] = useLocalStorage('anchorflow.library', seedLibrary);
  const [settings, setSettings] = useLocalStorage('anchorflow.settings', DEFAULT_SETTINGS, {
    migrate: (s) => ({ ...DEFAULT_SETTINGS, ...s, collapsed: { ...DEFAULT_SETTINGS.collapsed, ...(s.collapsed || {}) } }),
  });

  // Signed-in team member (front-end only; no passwords are stored or checked).
  // First visit opens already signed in as the demo user, so assessors never have to log in;
  // the sign-in screen appears only after "Sign out" (to switch user).
  const [sessionId, setSessionId] = useLocalStorage('anchorflow.session', DEFAULT_TEAM[0].id);
  const userIndex = team.findIndex((m) => m.id === sessionId);
  const currentUser = userIndex >= 0 ? { ...team[userIndex], index: userIndex } : null;

  const [view, setViewState] = useState(viewFromHash);
  const [menuOpen, setMenuOpen] = useState(false);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState('');
  const [highlightId, setHighlightId] = useState(null);
  const toastTimer = useRef(null);
  const mainRef = useRef(null);

  // ---------- navigation (the URL hash keeps the browser Back button working) ----------
  const setView = (id) => {
    window.location.hash = id;
    setViewState(id);
    mainRef.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    const onHash = () => setViewState(viewFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  useEffect(() => {
    const label = sessionId ? VIEWS.find((v) => v.id === view)?.label ?? 'Board' : 'Sign in';
    document.title = `${label} · AnchorFlow`;
  }, [view, sessionId]);
  const goHome = () => {
    setFilters(EMPTY_FILTERS);
    setView('board');
  };

  // ---------- theme: follows the device until the user picks ----------
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const isDark = settings.theme === 'system' ? systemDark : settings.theme === 'dark';
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  // ---------- accessibility preferences ----------
  useEffect(() => {
    const root = document.documentElement.dataset;
    root.text = settings.textSize;
    root.spacing = settings.lineSpacing;
    root.motion = settings.motion;
  }, [settings.textSize, settings.lineSpacing, settings.motion]);

  // ---------- auto-archive: done tasks older than N days leave the board ----------
  useEffect(() => {
    const days = settings.autoArchiveDays;
    if (!days) return;
    const cutoff = Date.now() - days * 86400000;
    setTasks((prev) => {
      let changed = false;
      const next = prev.map((t) => {
        if (t.status === 'done' && !t.archivedAt && t.doneAt && new Date(t.doneAt).getTime() < cutoff) {
          changed = true;
          return { ...t, archivedAt: new Date().toISOString() };
        }
        return t;
      });
      return changed ? next : prev;
    });
  }, [settings.autoArchiveDays, setTasks]);

  // ---------- feedback ----------
  const notify = (message, highlight = null) => {
    setToast(message);
    setHighlightId(highlight);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast('');
      setHighlightId(null);
    }, 5000);
  };

  const ship = (task, x, y) => {
    celebrate(x, y);
    if (settings.sound) playShipSound();
    notify(`Shipped ${task.key} "${task.title}". Nice work.`);
  };

  // ---------- task actions ----------
  const activeTasks = tasks.filter((t) => !t.archivedAt);
  const archived = tasks.filter((t) => t.archivedAt).sort((a, b) => (b.archivedAt > a.archivedAt ? 1 : -1));

  const openNew = (status = 'todo') => setEditing(blankTask(tasks, currentUser?.name ?? team[0]?.name ?? '', status));

  const saveTask = (draft) => {
    const before = tasks.find((t) => t.id === draft.id);
    const status = draft.status;
    const base = before ? withStatus(before, status) : withStatus({ ...draft, status: 'todo', doneAt: null }, status);
    const saved = { ...draft, doneAt: base.doneAt, id: draft.id ?? newId() };
    setTasks((prev) => (before ? prev.map((t) => (t.id === saved.id ? saved : t)) : [...prev, saved]));
    setEditing(null);
    if (status === 'done' && before?.status !== 'done') ship(saved);
    else notify(before ? `Saved ${saved.key}.` : `Added ${saved.key} to ${status === 'todo' ? 'To Do' : 'the board'}.`, saved.id);
  };

  const handoffTask = (id, name) => {
    const t = tasks.find((x) => x.id === id);
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, assignee: name } : x)));
    notify(name ? `Handed off ${t.key} to ${name}.` : `${t.key} is now unassigned.`, id);
  };

  const moveTask = (id, status, x, y) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    setTasks((prev) => prev.map((t) => (t.id === id ? withStatus(t, status) : t)));
    if (status === 'done') ship(task, x, y);
    else notify(`Moved ${task.key} to ${status === 'todo' ? 'To Do' : status === 'in-progress' ? 'In Progress' : 'Review'}.`, id);
  };

  const copyContext = async (task) => {
    const ok = await copyText(taskToBriefing(task));
    notify(ok ? 'Context copied. Paste it into your AI to pick up where you left off.' : "Couldn't copy. Try again.");
  };

  const copyPlain = async (text, message) => {
    const ok = await copyText(text);
    notify(ok ? message : "Couldn't copy. Try again.");
  };

  const archiveTask = (id) => {
    const t = tasks.find((x) => x.id === id);
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, archivedAt: new Date().toISOString() } : x)));
    setEditing(null);
    notify(`Archived ${t.key}. Find it under Archive.`);
  };

  const restoreTask = (id) => {
    const t = tasks.find((x) => x.id === id);
    // Restored tasks get a fresh doneAt so auto-archive doesn't move them straight back.
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, archivedAt: null, doneAt: x.status === 'done' ? new Date().toISOString() : null } : x)));
    notify(`Restored ${t.key} to the board.`);
  };

  const deleteTask = (id) => {
    const t = tasks.find((x) => x.id === id);
    setTasks((prev) => prev.filter((x) => x.id !== id));
    setEditing(null);
    notify(`Deleted ${t?.key ?? 'task'}.`);
  };

  const saveToLibrary = (task) => {
    setLibrary((prev) => [
      {
        id: newId(),
        title: task.title || 'Untitled prompt',
        technique: 'TACO structured',
        tool: task.contextTool || 'Other',
        prompt: task.context,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    notify('Saved to the prompt library.');
  };

  // ---------- team ----------
  const addMember = (m) => {
    setTeam((prev) => [...prev, m]);
    notify(`Added ${m.name} to the team.`);
  };
  const updateMember = (before, after) => {
    setTeam((prev) => prev.map((x) => (x.id === after.id ? after : x)));
    // Tasks store the owner's name, so a rename follows through to their tasks and the filter.
    if (before.name !== after.name) {
      setTasks((prev) => prev.map((t) => (t.assignee === before.name ? { ...t, assignee: after.name } : t)));
      if (filters.person === before.name) setFilters((f) => ({ ...f, person: after.name }));
    }
    notify(`Saved ${after.name}'s details.`);
  };
  const removeMember = (m) => {
    setTeam((prev) => prev.filter((x) => x.id !== m.id));
    setTasks((prev) => prev.map((t) => (t.assignee === m.name ? { ...t, assignee: '' } : t)));
    if (filters.person === m.name) setFilters((f) => ({ ...f, person: '' }));
    notify(`Removed ${m.name} from the team.`);
  };

  const signIn = (member) => {
    setSessionId(member.id);
    notify(`Signed in as ${member.name}.`);
  };
  const signOut = () => {
    setSessionId(null);
    setEditing(null);
    setMenuOpen(false);
    notify('Signed out.');
  };

  const resetData = () => {
    setTasks(seedTasks());
    setTeam(DEFAULT_TEAM);
    setAnchors(DEFAULT_ANCHORS);
    setLibrary(seedLibrary());
    setSettings(DEFAULT_SETTINGS);
    setFilters(EMPTY_FILTERS);
    // Stay signed in only if that person is still in the sample team.
    if (!DEFAULT_TEAM.some((m) => m.id === sessionId)) setSessionId(null);
    notify('Sample data restored.');
  };

  const toggles = (
    <QuickToggles
      isDark={isDark}
      toggleTheme={() => setSettings((s) => ({ ...s, theme: isDark ? 'light' : 'dark' }))}
      sound={settings.sound}
      toggleSound={() => setSettings((s) => ({ ...s, sound: !s.sound }))}
    />
  );
  const counts = {
    board: activeTasks.length,
    archive: archived.length,
    library: library.length,
    team: team.length,
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-surface-page font-sans text-text-primary">
        <LoginView team={team} onSignIn={signIn} />
        <Toast message={toast} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface-page font-sans text-text-primary">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
        className="sr-only z-[80] rounded-md bg-brand-primary px-4 py-2 text-surface-card focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to main content
      </a>

      <Sidebar
        view={view}
        setView={setView}
        counts={counts}
        onHome={goHome}
        toggles={toggles}
        collapsed={settings.sidebarCollapsed}
        onToggle={() => setSettings((s) => ({ ...s, sidebarCollapsed: !s.sidebarCollapsed }))}
        user={currentUser}
        onSignOut={signOut}
      />

      <div className="flex min-w-0 flex-1 flex-col" inert={editing ? "" : undefined}>
        <MobileBar
          view={view}
          setView={setView}
          counts={counts}
          onHome={goHome}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          onNewTask={() => openNew('todo')}
          user={currentUser}
          onSignOut={signOut}
          toggles={toggles}
        />
        <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 p-4 outline-none sm:p-6">
          {view === 'board' && (
            <BoardView
              tasks={activeTasks}
              team={team}
              filters={filters}
              setFilters={setFilters}
              anchors={anchors}
              setAnchors={setAnchors}
              settings={settings}
              setSettings={setSettings}
              onNew={openNew}
              onOpen={(task) => setEditing(task)}
              onHandoff={handoffTask}
              onCopy={copyContext}
              onMove={moveTask}
              onArchive={archiveTask}
              highlightId={highlightId}
            />
          )}
          {view === 'archive' && (
            <ArchiveView tasks={archived} days={settings.autoArchiveDays} onRestore={restoreTask} onDelete={deleteTask} onCopy={copyContext} team={team} />
          )}
          {view === 'library' && <LibraryView library={library} setLibrary={setLibrary} onCopy={copyPlain} notify={notify} />}
          {view === 'team' && <TeamView team={team} tasks={activeTasks} currentId={sessionId} onAdd={addMember} onUpdate={updateMember} onRemove={removeMember} />}
          {view === 'settings' && <SettingsView settings={settings} setSettings={setSettings} onReset={resetData} />}
        </main>
      </div>

      <Toast message={toast} />
      {editing && (
        <TaskModal
          key={editing.id ?? 'new'}
          task={editing}
          team={team}
          onSave={saveTask}
          onDelete={deleteTask}
          onCopy={copyContext}
          onArchive={archiveTask}
          onSaveToLibrary={saveToLibrary}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
