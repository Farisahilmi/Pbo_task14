import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-glass)',
      borderRadius: 'var(--radius-lg)',
      padding: '3px',
      gap: '2px'
    }}>
      <button
        onClick={() => setTheme('light')}
        title="Light Mode (Terang)"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: theme === 'light' ? 'var(--gold-primary)' : 'transparent',
          color: theme === 'light' ? '#0b0d13' : 'var(--text-secondary)',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <Sun size={15} />
      </button>

      <button
        onClick={() => setTheme('dark')}
        title="Dark Mode (Gelap)"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: theme === 'dark' ? 'var(--gold-primary)' : 'transparent',
          color: theme === 'dark' ? '#0b0d13' : 'var(--text-secondary)',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <Moon size={15} />
      </button>

      <button
        onClick={() => setTheme('system')}
        title="System Mode (Mengikuti OS)"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: theme === 'system' ? 'var(--gold-primary)' : 'transparent',
          color: theme === 'system' ? '#0b0d13' : 'var(--text-secondary)',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <Monitor size={15} />
      </button>
    </div>
  );
}
