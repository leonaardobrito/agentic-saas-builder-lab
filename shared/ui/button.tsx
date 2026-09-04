import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap select-none rounded-xl text-sm font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/20 focus-visible:border-rose-600 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 shadow-md hover:shadow-lg shadow-rose-600/20 dark:shadow-rose-950/30',
        destructive: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-md shadow-red-500/20',
        outline: 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-900 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm',
        secondary: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 shadow-sm',
        ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100 text-slate-600 dark:text-slate-400',
        link: 'text-rose-600 dark:text-rose-400 underline-offset-4 hover:underline',
      },
      size: {
        default: 'py-2.5 px-5 text-sm',           /* Standard CTA: 2:1 ratio */
        compact: 'py-1.5 px-3 text-xs',             /* Table action */
        lg: 'py-3 px-6 text-base',                   /* Hero/Modal primary */
        sm: 'py-1.5 px-3 text-xs rounded-lg',        /* Legacy compat */
        icon: 'h-10 w-10 p-0 rounded-full',          /* Icon button */
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
