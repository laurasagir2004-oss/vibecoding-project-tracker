import { useRef, useState } from 'react';
import { CONTEXT_TEMPLATE, CONTEXT_TOOLS, OUTCOMES, STAGES, estimateTokens, memberLabel, newId, timeAgo } from '../lib/model.js';
import { Icon, TypeBadge, btnDanger, btnGhost, btnPrimary, field, iconBtn, labelCls, useDialog } from './ui.jsx';

function Section({ title, hint, children, id }) {
  return (
    <fieldset className="rounded-md border border-text-muted/20 bg-surface-page p-3" aria-describedby={hint ? `${id}-hint` : undefined}>
      <legend className="px-1 text-sm font-semibold text-text-primary">{title}</legend>
      {hint && (
        <p id={`${id}-hint`} className="mb-2 text-xs text-text-muted">
          {hint}
        </p>
      )}
      {children}
    </fieldset>
  );
}

// One modal for create and edit (M5), grouped into four chunks: details, ready-when, context, outcome.
export function TaskModal({ task, team, onSave, onDelete, onClose, onCopy, onArchive, onSaveToLibrary }) {
  const [draft, setDraft] = useState(task);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [newItem, setNewItem] = useState('');
  const ref = useRef(null);
  useDialog(ref, onClose);
  const isNew = task.id === null;

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const update = (key) => (e) => set({ [key]: e.target.value === '' && key === 'dueDate' ? null : e.target.value });
  const touchContext = (patch) => set({ ...patch, contextUpdatedAt: new Date().toISOString() });
  const setOutcome = (patch) => set({ outcome: { ...draft.outcome, ...patch, updatedAt: new Date().toISOString() } });

  const addItem = () => {
    const text = newItem.trim();
    if (!text) return;
    set({ checklist: [...(draft.checklist || []), { id: newId(), text, done: false }] });
    setNewItem('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    onSave({ ...draft, title: draft.title.trim(), description: draft.description.trim() });
  };

  const tokens = estimateTokens(draft.context || '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-lg bg-surface-card p-5 shadow-xl sm:rounded-lg sm:p-6"
      >
      <form onSubmit={handleSubmit}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="modal-title" className="flex flex-wrap items-center gap-2 text-lg font-semibold text-text-primary">
            <span className="font-mono text-sm font-normal text-text-muted">{draft.key}</span>
            {isNew ? 'New task' : 'Edit task'}
            <TypeBadge type={draft.type} />
          </h2>
          <button type="button" onClick={onClose} className={iconBtn} aria-label="Close without saving">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* 1. Details */}
          <div>
            <label htmlFor="f-title" className={labelCls}>
              Title <span aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <input
              id="f-title"
              data-autofocus
              required
              className={field}
              value={draft.title}
              onChange={update('title')}
              placeholder="e.g. Fix the login form"
            />
          </div>
          <div>
            <label htmlFor="f-desc" className={labelCls}>
              Description
            </label>
            <textarea id="f-desc" rows={2} className={field} value={draft.description} onChange={update('description')} placeholder="What needs doing, in a sentence or two." />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="f-type" className={labelCls}>Type</label>
              <select id="f-type" className={field} value={draft.type} onChange={update('type')}>
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
              </select>
            </div>
            <div>
              <label htmlFor="f-status" className={labelCls}>Status</label>
              <select id="f-status" className={field} value={draft.status} onChange={update('status')}>
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-assignee" className={labelCls}>Assignee</label>
              <select id="f-assignee" className={field} value={draft.assignee} onChange={update('assignee')}>
                <option value="">Unassigned</option>
                {team.map((m) => (
                  <option key={m.id} value={m.name}>{memberLabel(m)}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="f-due" className={labelCls}>Due date</label>
              <input id="f-due" type="date" className={field} value={draft.dueDate ?? ''} onChange={update('dueDate')} />
            </div>
          </div>

          {/* 2. Ready when (acceptance criteria) */}
          <Section id="ready" title="Ready when" hint="What has to be true before this task counts as done.">
            {draft.checklist?.length > 0 && (
              <ul className="mb-2 space-y-1">
                {draft.checklist.map((c) => (
                  <li key={c.id} className="flex items-center gap-2">
                    <input
                      id={`chk-${c.id}`}
                      type="checkbox"
                      checked={c.done}
                      onChange={() => set({ checklist: draft.checklist.map((x) => (x.id === c.id ? { ...x, done: !x.done } : x)) })}
                      className="h-4 w-4 accent-brand-primary touch:h-6 touch:w-6"
                    />
                    <label htmlFor={`chk-${c.id}`} className={`flex-1 text-sm ${c.done ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                      {c.text}
                    </label>
                    <button
                      type="button"
                      className={iconBtn}
                      aria-label={`Remove "${c.text}"`}
                      onClick={() => set({ checklist: draft.checklist.filter((x) => x.id !== c.id) })}
                    >
                      <Icon name="x" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <label htmlFor="f-new-item" className="sr-only">New ready-when item</label>
              <input
                id="f-new-item"
                className={`${field} mt-0`}
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem();
                  }
                }}
                placeholder="e.g. Works on a phone"
              />
              <button type="button" className={btnGhost} onClick={addItem} disabled={!newItem.trim()}>
                Add
              </button>
            </div>
          </Section>

          {/* 3. Context (M9) */}
          <Section id="ctx" title="Context" hint="A paste-ready briefing for your AI or a teammate. Written in Markdown.">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <label htmlFor="f-context" className={labelCls}>Briefing</label>
              <span className="text-xs text-text-muted" aria-live="polite">
                {draft.contextUpdatedAt ? `Last updated ${timeAgo(draft.contextUpdatedAt)}` : 'Not updated yet'} · ≈ {tokens} tokens
              </span>
            </div>
            <textarea
              id="f-context"
              rows={8}
              className={`${field} font-mono text-xs leading-relaxed`}
              value={draft.context ?? ''}
              placeholder={CONTEXT_TEMPLATE}
              onChange={(e) => touchContext({ context: e.target.value })}
            />
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="min-w-[10rem] flex-1">
                <label htmlFor="f-tool" className={labelCls}>AI tool used</label>
                <select
                  id="f-tool"
                  className={field}
                  value={draft.contextTool ?? ''}
                  onChange={(e) => touchContext({ contextTool: e.target.value || null })}
                >
                  <option value="">Not set</option>
                  {CONTEXT_TOOLS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button type="button" className={btnGhost} onClick={() => onSaveToLibrary(draft)} disabled={!draft.context?.trim()}>
                <Icon name="library" size={14} />
                Save to prompt library
              </button>
            </div>
          </Section>

          {/* 4. Outcome ("prompt + AI tool + outcome") */}
          <Section id="outcome" title="Outcome" hint="How did the last prompt go? This tells the next person what to try.">
            <div role="radiogroup" aria-label="Result of the last prompt" className="flex flex-wrap gap-2">
              {OUTCOMES.map((o) => {
                const on = (draft.outcome?.result || '') === o.id;
                return (
                  <label
                    key={o.id || 'none'}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm touch:min-h-[44px] ${
                      on ? 'border-brand-primary bg-brand-primary text-surface-card' : 'border-text-muted/30 text-text-primary hover:bg-text-muted/10'
                    } focus-within:ring-2 focus-within:ring-brand-accent`}
                  >
                    <input
                      type="radio"
                      name="outcome"
                      value={o.id}
                      checked={on}
                      onChange={() => setOutcome({ result: o.id })}
                      className="sr-only"
                    />
                    {o.id && <Icon name={o.id} size={14} />}
                    {o.label}
                  </label>
                );
              })}
            </div>
            <label htmlFor="f-outcome-note" className={`${labelCls} mt-3`}>What happened</label>
            <textarea
              id="f-outcome-note"
              rows={2}
              className={field}
              value={draft.outcome?.note ?? ''}
              onChange={(e) => setOutcome({ note: e.target.value })}
              placeholder="e.g. The crash is fixed, but the error message no longer shows."
            />
          </Section>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {!isNew && !confirmingDelete && (
              <button type="button" className={btnDanger} onClick={() => setConfirmingDelete(true)}>
                <Icon name="trash" size={14} />
                Delete
              </button>
            )}
            {!isNew && confirmingDelete && (
              <div className="flex flex-wrap items-center gap-2" role="alert">
                <span className="text-sm text-text-primary">Delete "{task.title}"? This can't be undone.</span>
                <button type="button" className={btnDanger} onClick={() => onDelete(task.id)}>
                  Yes, delete
                </button>
                <button type="button" className={btnGhost} onClick={() => setConfirmingDelete(false)}>
                  Keep
                </button>
              </div>
            )}
            {!isNew && task.status === 'done' && !confirmingDelete && (
              <button type="button" className={btnGhost} onClick={() => onArchive(task.id)}>
                <Icon name="archive" size={14} />
                Archive
              </button>
            )}
          </div>
          {!confirmingDelete && (
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btnGhost} onClick={() => onCopy(draft)}>
                <Icon name="copy" size={14} />
                Copy context
              </button>
              <button type="button" className={btnGhost} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className={btnPrimary} disabled={!draft.title.trim()}>
                {isNew ? 'Add task' : 'Save changes'}
              </button>
            </div>
          )}
        </div>
      </form>
      </div>
    </div>
  );
}
