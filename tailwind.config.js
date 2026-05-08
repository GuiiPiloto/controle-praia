/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      screens: {
        'xs': '400px',
      },
      fontSize: {
        'responsive-xs': ['clamp(0.7rem, 1.5vw, 0.8rem)', { lineHeight: '1.2' }],
        'responsive-sm': ['clamp(0.8rem, 2vw, 0.95rem)', { lineHeight: '1.3' }],
        'responsive-base': ['clamp(0.9rem, 2.5vw, 1.1rem)', { lineHeight: '1.4' }],
        'responsive-lg': ['clamp(1.1rem, 3vw, 1.5rem)', { lineHeight: '1.3' }],
        'responsive-xl': ['clamp(1.3rem, 4vw, 2rem)', { lineHeight: '1.2' }],
        'responsive-2xl': ['clamp(1.5rem, 5vw, 2.5rem)', { lineHeight: '1.15' }],
        'responsive-3xl': ['clamp(1.8rem, 6vw, 3rem)', { lineHeight: '1.1' }],
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      minHeight: {
        'touch': '48px',
        'touch-sm': '44px',
      },
      minWidth: {
        'touch': '48px',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
        'shimmer': 'shimmer 8s ease-in-out infinite',
        'sunset-drift': 'sunset-drift 12s ease-in-out infinite',
        'wave': 'wave 15s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'glow': {
          '0%': { boxShadow: '0 0 20px rgba(34, 211, 238, 0.1)' },
          '100%': { boxShadow: '0 0 40px rgba(34, 211, 238, 0.2)' },
        },
        'shimmer': {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
        'sunset-drift': {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(2%, -1%) scale(1.02)' },
          '66%': { transform: 'translate(-1%, 1%) scale(0.98)' },
          '100%': { transform: 'translate(0, 0) scale(1)' },
        },
        'wave': {
          '0%': { transform: 'translateX(0) translateY(0)' },
          '25%': { transform: 'translateX(3%) translateY(-2%)' },
          '50%': { transform: 'translateX(0) translateY(0)' },
          '75%': { transform: 'translateX(-3%) translateY(2%)' },
          '100%': { transform: 'translateX(0) translateY(0)' },
        },
      },
      colors: {
        sunset: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        ocean: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        tropical: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
      },
    },
  },
  plugins: [],
}