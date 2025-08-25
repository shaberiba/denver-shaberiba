// src/App.tsx
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import "./App.css";
import { HomePage } from './HomePage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function App() {

  const queryClient = new QueryClient()
  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        <HomePage />
      </QueryClientProvider>
    </MantineProvider>
  )
}

export default App;
