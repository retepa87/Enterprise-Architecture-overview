import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Applications from './pages/Applications'
import Capabilities from './pages/Capabilities'
import TechComponents from './pages/TechComponents'
import Interfaces from './pages/Interfaces'
import Domains from './pages/Domains'
import CRCCards from './pages/CRCCards'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/applications" element={<Applications />} />
          <Route path="/capabilities" element={<Capabilities />} />
          <Route path="/tech-components" element={<TechComponents />} />
          <Route path="/interfaces" element={<Interfaces />} />
          <Route path="/domains" element={<Domains />} />
          <Route path="/crc-cards" element={<CRCCards />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
