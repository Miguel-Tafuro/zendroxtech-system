/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        amazon: {
          dark: '#131921',
          nav: '#232f3e',
          accent: '#ff9900',
          accentHover: '#e68a00',
          light: '#eaeded'
        },
        zendrox: {
          purple: '#7c3aed',
          indigo: '#4f46e5',
          cyan: '#06b6d4',
          whatsapp: '#25D366',
          whatsappDark: '#1da851'
        }
      }
    },
  },
  plugins: [],
};
