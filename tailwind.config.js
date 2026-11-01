/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FBF7EC',
          100: '#F7EFD0',
          200: '#EFDD9A',
          300: '#E7C964',
          400: '#D4AF37',
          500: '#C9A233',
          600: '#A8822A',
          700: '#876622',
          800: '#654B19',
          900: '#443311',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        fadeUp: 'fadeUp 0.3s ease',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
