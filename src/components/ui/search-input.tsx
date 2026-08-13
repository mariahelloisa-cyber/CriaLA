import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, placeholder = 'Buscar...', ...props }, ref) => {
    return (
      <div className={cn('relative', containerClassName)}>
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          ref={ref}
          type="search"
          placeholder={placeholder}
          className={cn(
            'h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-body-sm text-foreground',
            'placeholder:text-muted-foreground',
            'transition-colors focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
          {...props}
        />
      </div>
    )
  },
)
SearchInput.displayName = 'SearchInput'
