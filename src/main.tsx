import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import { queryClient } from './api/queryClient'
import { enableMocking } from './mocks/enableMocking'

const container = document.getElementById('root')
if (!container) throw new Error('Root element not found')

// The mock worker must be active before the first request, so render after it starts
void enableMocking().then(() => {
  createRoot(container).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  )
})