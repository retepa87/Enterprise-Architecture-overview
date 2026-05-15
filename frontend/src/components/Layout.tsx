import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  AppWindow,
  Network,
  Cpu,
  ArrowLeftRight,
  Globe,
  CreditCard,
  Search,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'
import { dashboardApi } from '../api/dashboard'
import { useQuery } from '@tanstack/react-query'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/applications', icon: AppWindow, label: 'Applications' },
  { to: '/capabilities', icon: Network, label: 'Capability Map' },
  { to: '/tech-components', icon: Cpu, label: 'Tech Radar' },
  { to: '/interfaces', icon: ArrowLeftRight, label: 'Interfaces' },
  { to: '/domains', icon: Globe, label: 'Domains' },
  { to: '/crc-cards', icon: CreditCard, label: 'CRC Cards' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()

  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => dashboardApi.search(searchQuery),
    enabled: searchQuery.length >= 2,
    staleTime: 500,
  })

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleResultClick = (type: string, id: number) => {
    const routeMap: Record<string, string> = {
      application: '/applications',
      capability: '/capabilities',
      tech_component: '/tech-components',
      interface: '/interfaces',
      domain: '/domains',
      crc_card: '/crc-cards',
    }
    navigate(`${routeMap[type] || '/'}`)
    setSearchOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 bg-gray-900 text-white flex flex-col transition-all duration-300`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {sidebarOpen && (
            <div>
              <h1 className="text-sm font-bold text-white">EA Tool</h1>
              <p className="text-xs text-gray-400">Enterprise Architecture</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search everything..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSearchOpen(true)
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchOpen && searchQuery.length >= 2 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
                {!searchResults || searchResults.results.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-gray-500">No results found</div>
                ) : (
                  searchResults.results.map((result, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleResultClick(result.type, result.id)}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-100 last:border-0"
                    >
                      <ChevronRight size={14} className="mt-0.5 text-gray-400 flex-shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-gray-800">{result.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{result.type.replace('_', ' ')}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Overlay to close search */}
      {searchOpen && searchQuery.length >= 2 && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setSearchOpen(false)}
        />
      )}
    </div>
  )
}
