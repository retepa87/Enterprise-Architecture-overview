interface StatusBadgeProps {
  status: string
  type?: 'application' | 'tech'
}

const applicationStatusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  sunset: 'bg-orange-100 text-orange-800',
  planned: 'bg-blue-100 text-blue-800',
}

const techStatusColors: Record<string, string> = {
  adopt: 'bg-green-100 text-green-800',
  trial: 'bg-blue-100 text-blue-800',
  assess: 'bg-yellow-100 text-yellow-800',
  hold: 'bg-red-100 text-red-800',
}

export default function StatusBadge({ status, type = 'application' }: StatusBadgeProps) {
  const colors = type === 'tech' ? techStatusColors : applicationStatusColors
  const colorClass = colors[status] || 'bg-gray-100 text-gray-800'

  return (
    <span className={`badge ${colorClass} capitalize`}>
      {status}
    </span>
  )
}
