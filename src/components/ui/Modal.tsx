'use client'

import { useEffect, type ReactNode } from 'react'
import { XMarkIcon } from '@heroicons/react/24/solid'
import Button from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  closable?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closable = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={closable ? onClose : undefined}
      />

      {/* Panel */}
      <div
        className={`relative w-full ${sizes[size]} bg-white rounded-2xl shadow-2xl animate-slide-up z-10`}
      >
        {/* Header */}
        {(title || closable) && (
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            {title && (
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            )}
            {closable && (
              <button
                onClick={onClose}
                className="ml-auto p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Tutup"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
