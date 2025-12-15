import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout'
import { HomePage } from '@pages/HomePage'
import { ServersPage } from '@pages/ServersPage'
import { PlayerPage } from '@pages/PlayerPage'
import { SearchPage } from '@pages/SearchPage'
import { NotFoundPage } from '@pages/NotFoundPage'
import { usePostLoginRedirect, useSessionExpiry } from '@/hooks'

function App() {
  // Handle post-login redirect to intended destination
  usePostLoginRedirect()

  // Handle session expiry notifications
  // TODO: Replace console.log with actual toast notification when toast library is added
  useSessionExpiry({
    onSessionExpired: () => {
      console.log('[Auth] Session expired - user has been logged out')
      // Future: toast.info('Your session has expired. Please log in again.')
    },
  })

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/servers" element={<ServersPage />} />
        <Route path="/servers/:serverId" element={<ServersPage />} />
        <Route path="/player/:steam64" element={<PlayerPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Layout>
  )
}

export default App
