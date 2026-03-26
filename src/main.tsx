import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import { ThemeProvider } from './context/themeContext'
import { UserStatusProvider } from './context/userStatusContext' // Import the UserStatusProvider
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { registerSW } from 'virtual:pwa-register'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import './index.scss'

if (
  typeof window !== 'undefined' &&
  import.meta.env.VITE_PUBLIC_POSTHOG_KEY
) {
  posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // Handled manually by AnalyticsProvider
  });
}

registerSW({
  onNeedRefresh() { },
  onOfflineReady() {
    console.log('App ready to work offline')
  },
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <PostHogProvider client={posthog}>
          <UserStatusProvider> {/* Wrap the App with the provider */}
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </UserStatusProvider>
        </PostHogProvider>
      </ClerkProvider>
    </QueryClientProvider>
  </StrictMode>,
)
