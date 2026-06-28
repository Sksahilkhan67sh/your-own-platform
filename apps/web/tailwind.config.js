/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#F7F4EE',
        'surface-alt': '#EFE9DD',
        ink: '#2B2620',
        'ink-soft': '#5C5448',
        accent: {
          DEFAULT: '#44574A',
          hover: '#36463B',
          soft: '#DCE5DD',
        },
        border: '#DDD5C5',
        danger: '#8C3D2E',
        status: {
          available: '#44574A',
          pending: '#8A6D3B',
          sold: '#8C3D2E',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"Inter"', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.75rem, 5vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.01em' }],
        'display-lg': ['clamp(2.25rem, 4vw, 3.25rem)', { lineHeight: '1.08', letterSpacing: '-0.01em' }],
        'display-md': ['clamp(1.75rem, 2.5vw, 2.25rem)', { lineHeight: '1.15' }],
      },
      borderRadius: {
        DEFAULT: '4px',
        card: '6px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(43, 38, 32, 0.04), 0 4px 16px rgba(43, 38, 32, 0.06)',
        'card-hover': '0 2px 4px rgba(43, 38, 32, 0.06), 0 8px 24px rgba(43, 38, 32, 0.10)',
        sticky: '0 -4px 16px rgba(43, 38, 32, 0.08)',
      },
      maxWidth: {
        content: '1280px',
      },
    },
  },
  plugins: [],
};
