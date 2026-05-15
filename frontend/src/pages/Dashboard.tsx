import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  AppWindow,
  Network,
  Cpu,
  ArrowLeftRight,
  Globe,
  CreditCard,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import { dashboardApi } from '../api/dashboard'
import PageHeader from '../components/PageHeader'

const statCards = [
  { label: 'Applications', key: 'total_applications' as const, icon: AppWindow, href: '/applications', color: 'bg-blue-50 text-blue-600' },
  { label: 'Capabilities', key: 'total_capabilities' as const, icon: Network, href: '/capabilities', color: 'bg-purple-50 text-purple-600' },
  { label: 'Tech Components', key: 'total_tech_components' as const, icon: Cpu, href: '/tech-components', color: 'bg-green-50 text-green-600' },
  { label: 'Interfaces', key: 'total_interfaces' as const, icon: ArrowLeftRight, href: '/interfaces', color: 'bg-orange-50 text-orange-600' },
  { label: 'Business Domains', key: 'total_domains' as const, icon: Globe, href: '/domains', color: 'bg-teal-50 text-teal-600' },
  { label: 'CRC Cards', key: 'total_crc_cards' as const, icon: CreditCard, href: '/crc-cards', color: 'bg-pink-50 text-pink-600' },
]

const appStatusColors: Record<string, string> = {
  active: 'bg-green-500',
  sunset: 'bg-orange-500',
  planned: 'bg-blue-500',
}

const techStatusColors: Record<string, string> = {
  adopt: 'bg-green-500',
  trial: 'bg-blue-500',
  assess: 'bg-yellow-500',
  hold: 'bg-red-500',
}

export default function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getStats,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-red-500">
        <AlertCircle size={20} />
        <span>Failed to load dashboard. Is the backend running?</span>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Enterprise Architecture overview and key metrics"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map(({ label, key, icon: Icon, href, color }) => (
          <Link
            key={key}
            to={href}
            className="card p-4 hover:shadow-md transition-shadow group"
          >
            <div className={`inline-flex p-2 rounded-lg ${color} mb-3`}>
              <Icon size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-0.5">
              {stats?.[key] ?? 0}
            </div>
            <div className="text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
              {label}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Applications by Status */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-800">Applications by Status</h2>
          </div>
          {stats && Object.keys(stats.applications_by_status).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.applications_by_status).map(([status, count]) => {
                const total = stats.total_applications
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium text-gray-700">{status}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${appStatusColors[status] || 'bg-gray-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No applications yet</p>
          )}
        </div>

        {/* Tech Components by Ring */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={18} className="text-green-600" />
            <h2 className="font-semibold text-gray-800">Tech Radar Rings</h2>
          </div>
          {stats && Object.keys(stats.tech_components_by_status).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(stats.tech_components_by_status).map(([status, count]) => {
                const total = stats.total_tech_components
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium text-gray-700">{status}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${techStatusColors[status] || 'bg-gray-400'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No tech components yet</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-6 card p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Quick Navigation</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {statCards.map(({ label, icon: Icon, href, color }) => (
            <Link
              key={href}
              to={href}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <div className={`p-1.5 rounded ${color}`}>
                <Icon size={16} />
              </div>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
