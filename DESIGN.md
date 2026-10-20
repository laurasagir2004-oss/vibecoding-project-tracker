# Vibecoding Project Tracker — Design

**Status:** Completed by Amira Koki (solo project) · Koki's Kanban

**Why this file exists.** This tracker is your tool. It should look like *your* tool — not a generic Kanban with default Tailwind blue. Twenty minutes of design decisions here will be visible on every screen for the next six weeks of Module 5.

**Who owns this.** Amira Koki owns the design as part of a solo project. The colours below are already in `tailwind.config.js`, ready for M4 (`data-model`).

---

## 1. Mood / vibe

One sentence that captures the feeling the tracker should leave you with.

**Calm, clean and professional: a quiet workspace where the only things that shout are deadlines and bugs.**

Two or three references that capture the vibe:

- Linear (linear.app): restrained colour, sharp typography, keyboard-first calm
- Notion: generous whitespace, content first, chrome second
- Vercel dashboard: crisp light/dark pairing, one accent colour, monospace for technical detail

Anti-references — what we are explicitly **not** trying to look like:

- Default Tailwind blue, Trello-style colourful backgrounds, or Jira's dense, cluttered panels. No gradients, no rainbow labels, no visual noise.

## 2. Color palette

These are the colors the build milestones will reference. The hex values are already in `tailwind.config.js`, so components can use Tailwind utility classes (e.g. `bg-brand-primary`, `border-due-warning`).

Light and dark mode share **one set of token names**; components only use the token (e.g. `bg-surface-card`) and the theme supplies the hex. Every text/UI colour has been checked against its card and page background and passes **WCAG 2.1 AA (≥ 4.5:1)** in both modes.

**Accessibility rule:** colour is never the only signal. Every task type and due-date state also has an **icon and a text label**, so the board works for colour-blind users.

### Brand

| Token | Hex (light) | Hex (dark) | Where it shows up |
|---|---|---|---|
| `brand-primary` | `#4F46E5` | `#818CF8` | Header, "+" button, focus rings |
| `brand-accent` | `#0369A1` | `#38BDF8` | Highlights, hover states, links |
| `surface-page` | `#F8FAFC` | `#0B0F17` | Page background |
| `surface-card` | `#FFFFFF` | `#161B26` | Card background |
| `text-primary` | `#0F172A` | `#E2E8F0` | Body text |
| `text-muted` | `#475569` | `#94A3B8` | Captions, dates, counts |

### Task type (M6 `tag-style`)

| Token | Hex (light) | Hex (dark) | When used |
|---|---|---|---|
| `type-feature` | `#0F766E` | `#2DD4BF` | Cards tagged `feature` (teal stripe + Sparkles icon + "Feature" label) |
| `type-bug` | `#BE185D` | `#F472B6` | Cards tagged `bug` (rose stripe + Bug icon + "Bug" label) |

Bug is rose, not red, so it is never confused with the red "overdue" state.

### Due-date states (M8 `due-tint`)

| Token | Hex (light) | Hex (dark) | When used | Icon + label |
|---|---|---|---|---|
| `due-safe` | `#15803D` | `#4ADE80` | More than 2 days out | CalendarCheck · "Due in 5d" |
| `due-warning` | `#B45309` | `#FBBF24` | Less than 24 hours | Clock · "Due today" |
| `due-overdue` | `#B91C1C` | `#F87171` | Past due | AlertTriangle · "Overdue" |
| `due-neutral` | `#64748B` | `#94A3B8` | Done (overrides date) | CheckCircle · "Done" |

Cards use the due colour for the date badge text with a 10% tint behind it (e.g. `bg-due-warning/10 text-due-warning`), rather than flooding the whole card.

## 3. Typography

| Role | Font | Why |
|---|---|---|
| Heading | **Inter** (semibold) | A neutral, highly legible UI typeface that reads as professional without getting in the way of the content. |
| Body | **Inter** (regular) | Using one family keeps the interface calm and consistent, and Inter stays crisp at small screen sizes. |
| Monospace (tags, badges, code) | **JetBrains Mono** | Signals "developer tool" and makes pasted prompt context, IDs and badges easy to scan. |

Suggested sizes:

- Page title: 24 px / semibold
- Section header: 16 px / semibold uppercase
- Card title: 14 px / medium
- Body: 14 px / regular
- Caption: 12 px / regular muted

## 4. Component principles

- **Cards:** Flat `surface-card` with a 1px subtle border and a 3px type-coloured left stripe; a soft shadow appears only on hover, so the board stays quiet until you interact.
- **Buttons:** Solid `brand-primary` fill for the one primary action per view, outline/ghost for everything else; no gradients, generous padding, rounded-md, and a visible 2px focus ring for keyboard users.
- **Modal:** Centred, max-w-lg, `surface-card` panel on a 50% black backdrop; closes on Esc, keeps keyboard focus inside, and puts the primary action bottom-right.
- **Empty states:** Dashed border, muted text and one helpful next step, never sad and never blank.
- **Drag affordance (if used):** None for now; status changes through a labelled dropdown in the modal, which also works with a keyboard and screen reader.

## 5. Voice / microcopy

Tone: calm, direct, a little warm. Short sentences, no jargon, no exclamation marks except to celebrate.

| Where | Text |
|---|---|
| "+" button label | `+ New task` |
| Empty column placeholder | `Nothing here yet. Add a task to get moving.` |
| Toast after "Copy as Prompt Context" | `Context copied. Paste it into your AI to pick up where you left off.` |
| Confirm-delete message | `Delete "{title}"? This can't be undone.` |
| Handoff toast (M7 `task-owner`) | `Handed off to {name}.` |

## 6. Logo / wordmark

- **Product name:** Koki's Kanban
- **Wordmark style:** The name in Inter semibold, `brand-primary` colour, with a small Lucide `LayoutGrid` icon before it; the tagline "Where every prompt finds its way home." sits underneath in `text-muted`.

## 7. Out of scope (this hackathon)

To keep design tight, the following are explicitly not part of `design-done`:

- ~~A dark mode toggle. Pick one mode and ship it.~~ **Deliberate exception:** light and dark palettes are both defined in §2 as shared tokens, so a toggle costs very little to build. It is planned as a candidate for **M12 secret-sauce** (follows the system setting by default and remembers the user's choice). Justification: user control, comfort for late-night work, and accessibility for users sensitive to bright screens.
- Multiple themes beyond light/dark. One brand, applied consistently.
- Animations beyond a 200 ms fade on toast notifications.
- A custom icon set. Use [Lucide icons](https://lucide.dev) if needed.

---

*DESIGN.md version: hackathon-starter v1 · completed by Amira Koki*