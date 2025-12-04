import { Routes, Route } from 'react-router-dom'
import { Layout } from '@components/layout/Layout'
import { HomePage } from '@pages/HomePage'
import { ServersPage } from '@pages/ServersPage'
import { PlayerPage } from '@pages/PlayerPage'
import { SearchPage } from '@pages/SearchPage'
import { NotFoundPage } from '@pages/NotFoundPage'

function App() {
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
