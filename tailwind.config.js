/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        white: '#ffffff',
        'gray-light': '#f5f5f5',
        'gray-mid': '#e5e5e5',
        'gray-dark': '#888888',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Assuming Inter is available or fallback
        serif: ['Playfair Display', 'serif'], // For editorial touches if needed
      },
      borderRadius: {
        none: '0px',
        sm: '0px',
        DEFAULT: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '9999px',
      },
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
        premium: '0.2em', // Custom for headers
      },
    },
  },
  plugins: [],
};
