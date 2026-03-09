/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#effef5',
          100: '#d7fde5',
          200: '#b0fad0',
          300: '#75f4ab',
          400: '#34e584',
          500: '#0fc669', // More vibrant brand emerald
          600: '#06a454',
          700: '#088044',
          800: '#0b6538',
          900: '#0a5330',
        },
        dark: {
          900: '#090a0f',
          800: '#111522',
          700: '#1b2336',
        },
        glass: {
          light: 'rgba(255, 255, 255, 0.7)',
          dark: 'rgba(15, 23, 42, 0.7)',
        }
      },
      boxShadow: {
        '2026': '0 8px 32px -8px rgba(0, 0, 0, 0.08), 0 4px 16px -4px rgba(0, 0, 0, 0.04)',
        '2026-hover': '0 20px 40px -12px rgba(15, 198, 105, 0.15)',
        'glass': '0 4px 24px -4px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      animation: {
        'gradient-pan': 'gradientPan 6s ease infinite',
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        gradientPan: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
