import { useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const avatarVariants = cva(
  'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-medium text-secondary-foreground select-none',
  {
    variants: {
      size: {
        sm: 'size-7 text-caption',
        md: 'size-9 text-body-sm',
        lg: 'size-12 text-h4',
      },
    },
    defaultVariants: { size: 'md' },
  },
)

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name: string
  src?: string
  className?: string
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

export function Avatar({ name, src, size, className }: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false)

  return (
    <span className={cn(avatarVariants({ size }), className)}>
      {src && !imgFailed ? (
        <img
          src={src}
          alt={name}
          className="size-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <>
          <span aria-hidden="true">{getInitials(name)}</span>
          <span className="sr-only">{name}</span>
        </>
      )}
    </span>
  )
}
