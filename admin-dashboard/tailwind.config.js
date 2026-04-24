/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#faf7f2',
          100: '#f2e9db',
          200: '#e2cfae',
          300: '#cfae7c',
          400: '#b88a52',
          500: '#9b6d3b',
          600: '#7d5530',
          700: '#603f26',
          800: '#422a19',
          900: '#26170d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
