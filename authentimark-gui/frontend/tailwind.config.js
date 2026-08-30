export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"Martian Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      colors: {
        graphite: '#0E0F13',
        panel: '#181A21',
        panel2: '#1F222B',
        filament: '#F5F3EC',
        signal: '#4ADE80',
        caution: '#FBBF24',
        break: '#FB5D5D',
        trace: '#5B8DEF',
        mute: '#7C808C'
      }
    }
  },
  plugins: []
}
