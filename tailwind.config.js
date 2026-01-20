/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/**/*.{html,js}',
    './src/**/*.{html,js}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#A0430A',
        secondary: '#DFE8E6',
        'background-light': '#f8f7f6',
        'background-dark': '#1C1C1C',
        'text-light': '#1a1a1a',
        'text-dark': '#f5f5f5',
        'text-secondary-light': '#666666',
        'text-secondary-dark': '#999999',
        'card-light': '#ffffff',
        'card-dark': '#2a2a2a',
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
