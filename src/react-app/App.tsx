import { useState, useEffect, createContext, useContext } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import "./App.css";
import { HomePage } from './HomePage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface ThemeCtx { isDark: boolean; toggle: () => void; }
export const ThemeContext = createContext<ThemeCtx>({ isDark: false, toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

function getInitialDark(): boolean {
  const stored = localStorage.getItem('theme');
  if (stored) return stored === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

const queryClient = new QueryClient();

function App() {
  const [isDark, setIsDark] = useState(getInitialDark);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggle = () => setIsDark(d => !d);

  return (
    <ThemeContext.Provider value={{ isDark, toggle }}>
      <ConfigProvider
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorPrimary: '#C8102E',
            colorPrimaryHover: '#8B0000',
            borderRadius: 4,
            fontFamily: "'Jost', system-ui, sans-serif",
          },
        }}
      >
        <MantineProvider forceColorScheme={isDark ? 'dark' : 'light'}>
          <QueryClientProvider client={queryClient}>
            <HomePage />
          </QueryClientProvider>
        </MantineProvider>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
}

export default App;
