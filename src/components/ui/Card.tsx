import { type HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered'
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'md', className, children, ...props }, ref) => {
    const base = 'rounded-2xl bg-white transition-all duration-200'
    const variants = {
      default: 'shadow-card',
      elevated: 'shadow-card-hover',
      bordered: 'border border-gray-100 shadow-sm',
    }
    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    }
    return (
      <div
        ref={ref}
        className={clsx(base, variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'
export default Card
