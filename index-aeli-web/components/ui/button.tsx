import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-light shadow-md",
        outline:
          "border border-zinc-200 bg-background hover:bg-zinc-50 hover:text-zinc-900",
        secondary:
          "bg-white text-zinc-900 hover:bg-zinc-100 shadow-sm border border-zinc-200",
        ghost:
          "hover:bg-zinc-50 hover:text-zinc-900",
        destructive:
          "bg-red-50 text-red-600 hover:bg-red-100",
        link: "text-primary underline-offset-4 hover:underline",
        marketing: "bg-marketing-btn text-white hover:bg-marketing-btn-hover font-display font-bold shadow-sm transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0",
        cobalt: "bg-primary hover:bg-primary-light disabled:bg-primary/90 text-white font-display font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:-translate-y-0.5 active:translate-y-0"
      },
      size: {
        default:
          "h-10 px-6",
        xs: "h-6 gap-1 px-2 text-xs",
        sm: "h-8 gap-1 px-3 text-[0.8rem]",
        lg: "h-12 gap-1.5 px-8 text-base",
        xl: "h-14 px-8 text-base",
        icon: "size-10",
        "icon-xs": "size-6",
        "icon-sm": "size-8",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
