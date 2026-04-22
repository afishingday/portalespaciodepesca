/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      backgroundImage: {
        'portal-canvas':
          'linear-gradient(165deg, rgb(239 246 255 / 0.93) 0%, rgb(240 253 244 / 0.72) 42%, rgb(219 234 254 / 0.82) 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
