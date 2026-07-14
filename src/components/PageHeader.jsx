export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-xl font-bold text-primary-900">{title}</h1>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
