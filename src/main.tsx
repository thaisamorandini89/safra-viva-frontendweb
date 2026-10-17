import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query' // 1. Importando o TanStack Query
import './index.css'
import App from './App.js'
import AuthProvider from './components/auth/AuthProvider'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 3. Envolvendo o App com os Providers de autenticação e estado do servidor */}
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AuthProvider>
  </StrictMode>,
)