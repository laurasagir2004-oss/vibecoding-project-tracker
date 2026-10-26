import { useState } from 'react';
import { STAGES, dueState, memberLabel } from '../lib/model.js';
import {
  Avatar,
  DUE_BORDER,
  DueBadge,
  Icon,
  OutcomeBadge,
  TypeBadge,
  btnPrimary,
  field,
  focusRing,
  iconBtn,
  linkCls,
  typeStyle,
} from './ui.jsx';

export const EMPTY_FILTERS = { q: '', person: '', type: '', due: '' };

export function applyFilters(tasks, f) {
  const q = f.q.trim().toLowerCase();
  return tasks.filter((t) => {
    if (f.person === '__none' ? t.assignee : f.person && t.assignee !== f.person) return false;
    if (f.type && t.type !== f.type) return false;
    if (f.due) {
      const s = dueState(t).state;
      if (f.due !== s) return false;
    }
    if (q) {
      const hay = `${t.key} ${t.title} ${t.description} ${t.context}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// ---------- deliverable anchors (M11), collapsible to save screen space above the fold ----------
function toHref(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function Deliverables({ anchors, setAnchors, open, setOpen }) {
  const linked = anchors.filter((a) => a.url).length;
  const setUrl = (id, value) =>
    setAnchors((prev) => prev.map((a) => (a.id === id ? { ...a, url: value.trim() || null } : a)));

  return (
    <section aria-labelledby="anchors-title" className="rounded-lg border border-text-muted/20 bg-surface-card">
      <h2 id="anchors-title" className="m-0">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls="anchors-panel"
          className={`flex w-full flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-4 py-2.5 text-left touch:min-h-[44px] ${focusRing}`}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Final deliverables</span>
          <span className="font-mono text-xs text-text-muted">
            {linked} of {anchors.length} linked
          </span>
          {/* Status stays visible even when collapsed, so nothing looks missing ("expand for more" with care). */}
          <span className="flex flex-wrap items-center gap-3 text-xs text-text-primary">
            {anchors.map((a) => (
              <span key={a.id} className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`h-2 w-2 rounded-full ${a.url ? 'bg-due-safe' : 'border border-text-muted'}`}
                />
                {a.label}
                <span className="sr-only">{a.url ? 'linked' : 'empty'}</span>
              </span>
            ))}
          </span>
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-text-primary">
            {open ? 'Hide' : 'Edit links'}
            <Icon name={open ? 'chevronUp' : 'chevronDown'} size={14} />
          </span>
        </button>
      </h2>
      {open && (
        <ul id="anchors-panel" className="grid grid-cols-1 gap-3 border-t border-text-muted/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {anchors.map((a) => {
            const inputId = `anchor-${a.id}`;
            return (
              <li key={a.id} className={`rounded-md border p-3 ${a.url ? 'border-due-safe/40' : 'border-dashed border-text-muted/40'}`}>
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
                    {a.label}
                  </label>
                  <span className={`font-mono text-xs ${a.url ? 'text-due-safe' : 'text-text-muted'}`}>
                    {a.url ? 'Linked' : 'Empty'}
                  </span>
                </div>
                <input
                  id={inputId}
                  type="url"
                  inputMode="url"
                  placeholder="Paste a link…"
                  defaultValue={a.url ?? ''}
                  onBlur={(e) => setUrl(a.id, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                  className={`${field} text-xs`}
                />
                {a.url && (
                  <a href={toHref(a.url)} target="_blank" rel="noreferrer" className={`mt-2 inline-block text-xs ${linkCls}`}>
                    Open {a.label.toLowerCase()}
                    <span className="sr-only"> (opens in a new tab)</span> ↗
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ---------- toolbar: search + filters (filtered view pattern) ----------
function Toolbar({ team, tasks, filters, setFilters, shown, total }) {
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const active = filters.q || filters.person || filters.type || filters.due;
  const activeCount = (name) => tasks.filter((t) => t.assignee === name && t.status !== 'done').length;

  return (
    <section aria-label="Search and filters" className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <label htmlFor="search" className="sr-only">
            Search tasks
          </label>
          <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 mt-0.5 -translate-y-1/2 text-text-muted" />
          <input
            id="search"
            type="search"
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder="Search tasks, IDs or context…"
            className={`${field} mt-0 pl-9`}
          />
        </div>
        <div className="flex gap-2">
          <div>
            <label htmlFor="f-type-filter" className="sr-only">
              Filter by type
            </label>
            <select id="f-type-filter" value={filters.type} onChange={(e) => set({ type: e.target.value })} className={`${field} mt-0`}>
              <option value="">All types</option>
              <option value="feature">Features</option>
              <option value="bug">Bugs</option>
            </select>
          </div>
          <div>
            <label htmlFor="f-due-filter" className="sr-only">
              Filter by due date
            </label>
            <select id="f-due-filter" value={filters.due} onChange={(e) => set({ due: e.target.value })} className={`${field} mt-0`}>
              <option value="">Any due date</option>
              <option value="overdue">Overdue</option>
              <option value="warning">Due soon</option>
              <option value="safe">On track</option>
              <option value="none">No date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Who is driving what — each person is also a filter ("show only my tasks"). */}
      <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0" role="group" aria-label="Filter by person">
        <button
          type="button"
          aria-pressed={!filters.person}
          onClick={() => set({ person: '' })}
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium touch:min-h-[44px] ${focusRing} ${
            !filters.person ? 'border-brand-primary bg-brand-primary text-surface-card' : 'border-text-muted/30 bg-surface-card text-text-primary hover:bg-text-muted/10'
          }`}
        >
          Everyone
        </button>
        {team.map((m, i) => {
          const on = filters.person === m.name;
          return (
            <button
              key={m.id}
              type="button"
              aria-pressed={on}
              onClick={() => set({ person: on ? '' : m.name })}
              className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border py-0.5 pl-0.5 pr-3 text-xs touch:min-h-[44px] ${focusRing} ${
                on ? 'border-brand-primary bg-brand-primary text-surface-card' : 'border-text-muted/30 bg-surface-card text-text-primary hover:bg-text-muted/10'
              }`}
            >
              <Avatar name={m.name} index={i} size="h-6 w-6" />
              <span>{m.name}</span>
              {m.role && <span className={`hidden sm:inline ${on ? 'text-surface-card/80' : 'text-text-muted'}`}>· {m.role}</span>}
              <span className={`font-mono ${on ? 'text-surface-card/80' : 'text-text-muted'}`}>
                {activeCount(m.name)} active
              </span>
            </button>
          );
        })}
        {active && (
          <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className={`ml-1 shrink-0 whitespace-nowrap text-xs ${linkCls} touch:min-h-[44px]`}>
            Clear filters
          </button>
        )}
        <span className="ml-auto shrink-0 whitespace-nowrap text-xs text-text-muted" aria-live="polite">
          {active ? `Showing ${shown} of ${total} tasks` : `${total} tasks`}
        </span>
      </div>
    </section>
  );
}

// ---------- task card ----------
function TaskCard({ task, team, onOpen, onHandoff, onCopy, onMove, onArchive, highlighted }) {
  const style = typeStyle(task.type);
  const due = dueState(task);
  const done = task.checklist?.filter((c) => c.done).length ?? 0;
  const memberIndex = team.findIndex((m) => m.name === task.assignee);

  return (
    <li
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', task.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`group rounded-md border border-l-4 bg-surface-card transition-shadow hover:shadow-md ${DUE_BORDER[due.state]} ${style.stripe} ${
        highlighted ? 'ring-2 ring-brand-accent' : ''
      }`}
    >
      <button
        type="button"
        onClick={(e) => onOpen(task, e.currentTarget)}
        className={`w-full rounded-t-md p-3 pb-2 text-left ${focusRing}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-text-muted">
            <span className="sr-only">Open </span>
            {task.key}
          </span>
          {/* Grip = visible signifier that the card can be dragged (Gibson / Norman). */}
          <span className="cursor-grab text-text-muted" title="Drag to move">
            <Icon name="grip" size={14} />
          </span>
        </div>
        <div className="mt-1 flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-text-primary">{task.title}</p>
          <TypeBadge type={task.type} />
        </div>
        {task.description && <p className="mt-1 line-clamp-2 text-xs text-text-muted">{task.description}</p>}
        {(task.checklist?.length > 0 || task.outcome?.result) && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {task.checklist?.length > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-xs text-text-muted">
                <Icon name="check" size={12} />
                {done}/{task.checklist.length}
                <span className="sr-only"> ready-when items done</span>
              </span>
            )}
            <OutcomeBadge result={task.outcome?.result} />
          </div>
        )}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 px-3 pb-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar name={task.assignee} index={memberIndex < 0 ? 0 : memberIndex} />
          <label htmlFor={`handoff-${task.id}`} className="sr-only">
            Hand off {task.key} to
          </label>
          {/* The card shows just the name; the open list shows "Name · Role" so you can see who you are handing to. */}
          <div className="relative flex min-w-0 items-center rounded border border-transparent hover:border-text-muted/40 focus-within:ring-2 focus-within:ring-brand-accent touch:min-h-[44px]">
            <span aria-hidden="true" className="truncate py-1 pl-1 pr-5 text-xs text-text-primary">
              {task.assignee || 'Unassigned'}
            </span>
            <Icon name="chevronDown" size={12} className="pointer-events-none absolute right-1 text-text-muted" />
            <select
              id={`handoff-${task.id}`}
              value={task.assignee}
              onChange={(e) => onHandoff(task.id, e.target.value)}
              title="Hand off to…"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            >
              <option value="">Unassigned</option>
              {team.map((m) => (
                <option key={m.id} value={m.name}>
                  {memberLabel(m)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DueBadge task={task} />
      </div>

      <div className="flex items-stretch border-t border-text-muted/15 text-xs">
        <button
          type="button"
          onClick={() => onCopy(task)}
          className={`flex min-w-0 flex-1 basis-0 items-center justify-center gap-1.5 rounded-bl-md py-2 font-medium text-text-primary hover:bg-text-muted/10 touch:min-h-[44px] ${focusRing}`}
          aria-label={`Copy context for ${task.key}`}
        >
          <Icon name="copy" size={12} />
          Copy context
        </button>
        <span aria-hidden="true" className="w-px bg-text-muted/15" />
        {/* "Move to…" works by touch and keyboard, where drag and drop does not (curb-cut effect). */}
        <label htmlFor={`move-${task.id}`} className="sr-only">
          Move {task.key} to
        </label>
        <select
          id={`move-${task.id}`}
          value={task.status}
          onChange={(e) => {
            if (e.target.value === '__archive') return onArchive(task.id);
            const r = e.currentTarget.getBoundingClientRect();
            onMove(task.id, e.target.value, r.left + r.width / 2, r.top);
          }}
          className={`min-w-0 flex-1 basis-0 cursor-pointer bg-transparent py-2 pl-2 text-center text-xs font-medium text-text-primary hover:bg-text-muted/10 touch:min-h-[44px] ${focusRing}`}
        >
          {STAGES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id === task.status ? `In ${s.label}` : `Move to ${s.label}`}
            </option>
          ))}
          {task.status === 'done' && <option value="__archive">Archive task</option>}
        </select>
      </div>
    </li>
  );
}

// ---------- column (collapsible) ----------
function Column({ stage, tasks, team, collapsed, toggle, onNew, onMove, filtered, highlightId, ...cardProps }) {
  const [dragOver, setDragOver] = useState(false);
  const headingId = `col-${stage.id}`;
  return (
    <section
      aria-labelledby={headingId}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const id = e.dataTransfer.getData('text/plain');
        if (id) onMove(id, stage.id, e.clientX, e.clientY);
      }}
      className={`flex flex-col rounded-lg p-3 transition-colors ${
        collapsed ? 'md:w-14 md:flex-none md:items-center' : 'min-h-[12rem] min-w-0 md:flex-1'
      } ${dragOver ? 'bg-brand-accent/15 ring-2 ring-dashed ring-brand-accent' : 'bg-text-muted/10'}`}
    >
      <div className={`flex items-center gap-1 ${collapsed ? 'md:flex-col md:gap-3' : ''}`}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-controls={`list-${stage.id}`}
          aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${stage.label}`}
          className={iconBtn}
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronDown'} size={16} />
        </button>
        <h2
          id={headingId}
          className={`flex flex-1 items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-primary ${
            collapsed ? 'md:flex-none md:[writing-mode:vertical-rl]' : ''
          }`}
        >
          {stage.label}
          <span className="rounded-full bg-surface-card px-2 py-0.5 font-mono text-xs font-medium text-text-primary">
            {tasks.length}
            <span className="sr-only"> tasks</span>
          </span>
        </h2>
        {!collapsed && (
          <button type="button" onClick={() => onNew(stage.id)} aria-label={`Add task to ${stage.label}`} className={iconBtn}>
            <Icon name="plus" size={16} />
          </button>
        )}
      </div>

      {!collapsed &&
        (tasks.length === 0 ? (
          <p id={`list-${stage.id}`} className="mt-3 flex flex-1 items-center justify-center rounded-md border-2 border-dashed border-text-muted/30 p-4 text-center text-xs text-text-muted">
            {dragOver ? 'Drop it here.' : filtered ? 'No tasks match the filters.' : 'Nothing here yet. Add a task to get moving.'}
          </p>
        ) : (
          <ul id={`list-${stage.id}`} className="mt-3 flex flex-col gap-2">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} team={team} onMove={onMove} highlighted={task.id === highlightId} {...cardProps} />
            ))}
          </ul>
        ))}
    </section>
  );
}

// ---------- the board view ----------
export function BoardView({ tasks, team, filters, setFilters, anchors, setAnchors, settings, setSettings, onNew, ...cardProps }) {
  const visible = applyFilters(tasks, filters);
  const filtered = visible.length !== tasks.length;
  const setCollapsed = (id) =>
    setSettings((s) => ({ ...s, collapsed: { ...s.collapsed, [id]: !s.collapsed?.[id] } }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Board</h1>
          <p className="hidden text-sm text-text-muted sm:block">Every task, its owner, its deadline and the AI context behind it.</p>
        </div>
        <button type="button" className={`${btnPrimary} hidden md:inline-flex`} onClick={() => onNew('todo')}>
          <Icon name="plus" size={16} />
          New task
        </button>
      </div>

      <Toolbar team={team} tasks={tasks} filters={filters} setFilters={setFilters} shown={visible.length} total={tasks.length} />

      <Deliverables
        anchors={anchors}
        setAnchors={setAnchors}
        open={settings.deliverablesOpen}
        setOpen={(open) => setSettings((s) => ({ ...s, deliverablesOpen: open }))}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        {STAGES.map((stage) => (
          <Column
            key={stage.id}
            stage={stage}
            tasks={visible.filter((t) => t.status === stage.id)}
            team={team}
            collapsed={!!settings.collapsed?.[stage.id]}
            toggle={() => setCollapsed(stage.id)}
            onNew={onNew}
            filtered={filtered}
            {...cardProps}
          />
        ))}
      </div>
      <p className="hidden text-xs text-text-muted md:block">
        Tip: drag a card by its <Icon name="grip" size={12} className="inline" /> handle, or use “Move to” on the card.
      </p>
    </div>
  );
}

