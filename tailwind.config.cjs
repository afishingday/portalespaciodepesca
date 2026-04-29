/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        pt: {
          50:  'rgb(var(--pt-50)  / <alpha-value>)',
          100: 'rgb(var(--pt-100) / <alpha-value>)',
          200: 'rgb(var(--pt-200) / <alpha-value>)',
          500: 'rgb(var(--pt-500) / <alpha-value>)',
          600: 'rgb(var(--pt-600) / <alpha-value>)',
          700: 'rgb(var(--pt-700) / <alpha-value>)',
          800: 'rgb(var(--pt-800) / <alpha-value>)',
          900: 'rgb(var(--pt-900) / <alpha-value>)',
        },
      },
      backgroundImage: {
        'portal-canvas':
          'linear-gradient(165deg, rgb(239 246 255 / 0.93) 0%, rgb(240 253 244 / 0.72) 42%, rgb(219 234 254 / 0.82) 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
