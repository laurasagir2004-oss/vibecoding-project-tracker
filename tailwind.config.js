/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin'

// Amira's Kanban design tokens (see DESIGN.md §2) — maroon & pink.
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
          '--brand-primary': '136 19 55',   // #881337 maroon
          '--brand-accent': '190 24 93',    // #BE185D pink
          '--surface-page': '253 248 249',  // #FDF8F9 blush white
          '--surface-card': '255 255 255',  // #FFFFFF
          '--text-primary': '28 25 23',     // #1C1917
          '--text-muted': '87 83 78',       // #57534E
          '--type-feature': '15 118 110',   // #0F766E teal
          '--type-bug': '109 40 217',       // #6D28D9 violet
          '--due-safe': '21 128 61',        // #15803D
          '--due-warning': '180 83 9',      // #B45309
          '--due-overdue': '185 28 28',     // #B91C1C
          '--due-neutral': '100 116 139',   // #64748B
        },
        '.dark': {
          '--brand-primary': '249 168 212', // #F9A8D4
          '--brand-accent': '244 114 182',  // #F472B6
          '--surface-page': '20 11 15',     // #140B0F
          '--surface-card': '33 20 26',     // #21141A
          '--text-primary': '245 240 242',  // #F5F0F2
          '--text-muted': '168 162 158',    // #A8A29E
          '--type-feature': '45 212 191',   // #2DD4BF
          '--type-bug': '196 181 253',      // #C4B5FD
          '--due-safe': '74 222 128',       // #4ADE80
          '--due-warning': '251 191 36',    // #FBBF24
          '--due-overdue': '248 113 113',   // #F87171
          '--due-neutral': '168 162 158',   // #A8A29E
        },
      })
    }),
  ],
}