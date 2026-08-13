import type { ElementType, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const textVariants = cva('', {
  variants: {
    variant: {
      display: 'text-display font-bold tracking-tight',
      h1: 'text-h1 font-bold tracking-tight',
      h2: 'text-h2 font-semibold tracking-tight',
      h3: 'text-h3 font-semibold',
      h4: 'text-h4 font-semibold',
      body: 'text-body font-normal',
      'body-sm': 'text-body-sm font-normal',
      caption: 'text-caption font-normal text-muted-foreground',
      label: 'text-label font-medium',
      overline: 'text-overline font-semibold uppercase tracking-wider text-muted-foreground',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
})

const defaultElement: Record<NonNullable<VariantProps<typeof textVariants>['variant']>, ElementType> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  body: 'p',
  'body-sm': 'p',
  caption: 'p',
  label: 'span',
  overline: 'span',
}

interface TextProps extends VariantProps<typeof textVariants> {
  as?: ElementType
  className?: string
  children: ReactNode
  id?: string
}

export function Text({ as, variant = 'body', className, children, id }: TextProps) {
  const Component = as ?? defaultElement[variant ?? 'body']
  return (
    <Component id={id} className={cn(textVariants({ variant }), className)}>
      {children}
    </Component>
  )
}
