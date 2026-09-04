'use client'

interface OnlineToggleProps {
  isOnline: boolean
  onToggle: (value: boolean) => void
}

export default function OnlineToggle({ isOnline, onToggle }: OnlineToggleProps) {
  return (
    <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3">
      <div>
        <p className="text-white font-bold text-base">
          {isOnline ? '🟢 Kamu Online' : '🔴 Kamu Offline'}
        </p>
        <p className="text-uti-maroon-200 text-xs mt-0.5">
          {isOnline
            ? 'GPS aktif · Siap menerima pesanan'
            : 'Aktifkan untuk mulai menerima pesanan'}
        </p>
      </div>

      {/* Toggle Switch */}
      <button
        onClick={() => onToggle(!isOnline)}
        id="btn-online-toggle"
        aria-label={isOnline ? 'Go Offline' : 'Go Online'}
        className={`relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-uti-maroon ${
          isOnline ? 'bg-green-400' : 'bg-white/20'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center text-xs ${
            isOnline ? 'translate-x-7' : 'translate-x-0'
          }`}
        >
          {isOnline ? '✓' : ''}
        </span>
      </button>
    </div>
  )
}
