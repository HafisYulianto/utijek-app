export default function LoadingSpinner({
  size = 'md',
  color = 'maroon',
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'maroon' | 'white' | 'gray'
}) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-[3px]',
    xl: 'w-16 h-16 border-4',
  }

  const colors = {
    maroon: 'border-uti-maroon-100 border-t-uti-maroon',
    white: 'border-white/20 border-t-white',
    gray: 'border-gray-100 border-t-gray-500',
  }

  return (
    <div
      className={`rounded-full animate-spin ${sizes[size]} ${colors[color]}`}
      role="status"
      aria-label="Loading..."
    />
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <div className="w-16 h-16 rounded-2xl bg-maroon-gradient flex items-center justify-center shadow-maroon">
        <span className="text-2xl font-black text-white">U</span>
      </div>
      <LoadingSpinner size="md" color="maroon" />
      <p className="text-sm text-gray-500">Memuat...</p>
    </div>
  )
}
