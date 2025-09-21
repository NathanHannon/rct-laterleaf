import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App'
import { ThemeProvider } from './context/themeContext'
import { UserStatusProvider } from './context/userStatusContext' // Import the UserStatusProvider
import './index.scss'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <UserStatusProvider> {/* Wrap the App with the provider */}
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </UserStatusProvider>
    </ClerkProvider>
  </StrictMode>,
)
