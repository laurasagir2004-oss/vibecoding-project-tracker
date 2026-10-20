/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin'

// Koki's Kanban design tokens (see DESIGN.md §2).
// Light values live on :root, dark values on .dark — components only use token names.
const c = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand:   { primary: c('brand-primary'), accent: c('brand-accent') },
        surface: { page: c('surface-page'), card: c('surface-card') },
        text:    { primary: c('text-primary'), muted: c('text-muted') },
        type:    { feature: c('type-feature'), bug: c('type-bug') },
        due:     { safe: c('due-safe'), warning: c('due-warning'), overdue: c('due-overdue'), neutral: c('due-neutral') },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': {
          '--brand-primary': '79 70 229',   // #4F46E5
          '--brand-accent': '3 105 161',    // #0369A1
          '--surface-page': '248 250 252',  // #F8FAFC
          '--surface-card': '255 255 255',  // #FFFFFF
          '--text-primary': '15 23 42',     // #0F172A
          '--text-muted': '71 85 105',      // #475569
          '--type-feature': '15 118 110',   // #0F766E
          '--type-bug': '190 24 93',        // #BE185D
          '--due-safe': '21 128 61',        // #15803D
          '--due-warning': '180 83 9',      // #B45309
          '--due-overdue': '185 28 28',     // #B91C1C
          '--due-neutral': '100 116 139',   // #64748B
        },
        '.dark': {
          '--brand-primary': '129 140 248', // #818CF8
          '--brand-accent': '56 189 248',   // #38BDF8
          '--surface-page': '11 15 23',     // #0B0F17
          '--surface-card': '22 27 38',     // #161B26
          '--text-primary': '226 232 240',  // #E2E8F0
          '--text-muted': '148 163 184',    // #94A3B8
          '--type-feature': '45 212 191',   // #2DD4BF
          '--type-bug': '244 114 182',      // #F472B6
          '--due-safe': '74 222 128',       // #4ADE80
          '--due-warning': '251 191 36',    // #FBBF24
          '--due-overdue': '248 113 113',   // #F87171
          '--due-neutral': '148 163 184',   // #94A3B8
        },
      })
    }),
  ],
}