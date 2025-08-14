import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#ffe01b',
          dark: '#f6d006'
        }
      },
      borderRadius: {
        lg: '12px',
        xl: '16px'
      },
      boxShadow: {
        card: '0 2px 10px rgba(0,0,0,0.06)'
      }
    }
  },
  plugins: []
};

export default config;


