export default function StatCard({ icon: Icon, label, value, color = 'primary', suffix = '' }) {
  const colorMap = {
    primary: 'bg-primary-800 text-white',
    secondary: 'bg-secondary-500 text-white',
    accent: 'bg-accent-500 text-white',
    gray: 'bg-gray-100 text-gray-700',
  }
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorMap[color] || colorMap.primary}`}>
        {Icon && <Icon size={22} />}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">
          {value}
          {suffix}
        </p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}
