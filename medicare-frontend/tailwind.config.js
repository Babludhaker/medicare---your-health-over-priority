/** @type {import('tailwindcss').Config} */

// Design system for MediCare Connect.
// Aesthetic: a calm, trustworthy clinical look — deep pine/teal primary,
// warm paper-white surfaces, a clay accent for warmth. Reassuring and
// precise rather than flashy.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary — deep pine green. Conveys calm, health, trust.
        pine: {
          50: '#f0f6f3',
          100: '#d9e9e1',
          200: '#b3d3c4',
          300: '#84b6a1',
          400: '#56947d',
          500: '#387862',
          600: '#2b604f',
          700: '#244d41',
          800: '#1f3f36',
          900: '#1b342e',
          950: '#0d1c18',
        },
        // Accent — warm clay. Used sparingly for CTAs and highlights.
        clay: {
          50: '#fbf3ef',
          100: '#f6e1d7',
          200: '#ecc3af',
          300: '#df9d80',
          400: '#d17a57',
          500: '#c25e3a',
          600: '#a8492c',
          700: '#8a3a26',
          800: '#713124',
          900: '#5f2b21',
        },
        // Warm neutral paper tones for backgrounds and text.
        paper: {
          50: '#fdfcfa',
          100: '#f7f4ee',
          200: '#ece7dc',
          300: '#dbd3c3',
          400: '#b8ad98',
          500: '#94886f',
          600: '#766b54',
          700: '#5d5443',
          800: '#3f3a30',
          900: '#272420',
        },
      },
      fontFamily: {
        // Distinctive serif for display/headings — characterful, editorial.
        display: ['"Fraunces"', 'Georgia', 'serif'],
        // Clean, readable grotesque for body and UI.
        sans: ['"Inter Tight"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(27,52,46,0.04), 0 8px 24px -8px rgba(27,52,46,0.12)',
        lift: '0 4px 8px rgba(27,52,46,0.06), 0 24px 48px -12px rgba(27,52,46,0.18)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
