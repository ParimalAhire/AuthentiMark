export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Archivo', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', '"Instrument Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-mono)', '"Martian Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      colors: {
        graphite: 'var(--graphite)',
        panel: 'var(--panel)',
        panel2: 'var(--panel-2)',
        filament: 'var(--filament)',
        signal: 'var(--signal)',
        caution: 'var(--caution)',
        break: 'var(--break)',
        trace: 'var(--trace)',
        mute: 'var(--mute)'
      }
    }
  },
  plugins: []
}
