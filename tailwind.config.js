/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin'

// AnchorFlow design tokens (see DESIGN.md §2) — white & charcoal.
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
    // `touch:` variant for phones/tablets: used to grow tap targets to 44px.
    plugin(({ addVariant }) => addVariant('touch', '@media (pointer: coarse)')),
    plugin(({ addBase }) => {
      addBase({
        ':root': {
          '--brand-primary': '17 24 39', // #111827 charcoal
          '--brand-accent': '55 65 81', // #374151 slate
          '--surface-page': '249 250 251', // #F9FAFB
          '--surface-card': '255 255 255', // #FFFFFF
          '--text-primary': '15 23 42', // #0F172A
          '--text-muted': '71 85 105', // #475569
          '--type-feature': '15 118 110', // #0F766E
          '--type-bug': '109 40 217', // #6D28D9
          '--due-safe': '22 101 52', // #166534
          '--due-warning': '146 64 14', // #92400E
          '--due-overdue': '185 28 28', // #B91C1C
          '--due-neutral': '71 85 105', // #475569
        },
        '.dark': {
          '--brand-primary': '243 244 246', // #F3F4F6
          '--brand-accent': '209 213 219', // #D1D5DB
          '--surface-page': '17 24 39', // #111827
          '--surface-card': '31 41 55', // #1F2937
          '--text-primary': '229 231 235', // #E5E7EB
          '--text-muted': '156 163 175', // #9CA3AF
          '--type-feature': '45 212 191', // #2DD4BF
          '--type-bug': '196 181 253', // #C4B5FD
          '--due-safe': '74 222 128', // #4ADE80
          '--due-warning': '251 191 36', // #FBBF24
          '--due-overdue': '248 113 113', // #F87171
          '--due-neutral': '156 163 175', // #9CA3AF
        },
      })
    }),
  ],
}
