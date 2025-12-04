import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import Link from "@/components/ui/TransitionLink";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-button text-small transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-border focus-visible:ring-border focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-text-primary hover:shadow-md active:shadow-none border border-border",
        destructive:
          "bg-destructive text-white! hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline: "bg-background hover:bg-secondary hover:text-text-primary",
        primary:
          "button-primary before:transition-transform before:duration-1000 before:ease-extreme hover:before:scale-x-105 hover:before:scale-y-98",
        secondary: "bg-primary/50 text-text-primary hover:bg-primary/80",
        ghost:
          "hover:bg-primary text-text-primary border-transparent hover:text-text-primary hover:shadow-md active:shadow-none",
        link: "text-text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-button gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-button px-6 has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = VariantProps<typeof buttonVariants> & {
  asChild?: boolean;
  className?: string;
} & (
    | (React.ComponentProps<"button"> & { href?: never })
    | (React.ComponentProps<typeof Link> & { href: string })
  );

function Button({
  className,
  variant,
  size,
  asChild = false,
  href,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    buttonVariants({ variant, size, className }),
    "text-small"
  );

  const isPrimary = variant === "primary";
  const content = isPrimary ? (
    <span
      className="relative"
      style={{
        display: "inherit",
        alignItems: "inherit",
        justifyContent: "inherit",
        gap: "inherit",
        flexWrap: "inherit",
        flexDirection: "inherit",
        flexShrink: "inherit",
        flexGrow: "inherit",
        flexBasis: "inherit",
        flex: "inherit",
      }}
    >
      {children}
    </span>
  ) : (
    children
  );

  if (href) {
    return (
      <Link
        {...(props as Omit<React.ComponentProps<typeof Link>, "href">)}
        href={href}
        data-slot="button"
        className={classes}
      >
        {content}
      </Link>
    );
  }

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={classes}
      {...(props as React.ComponentProps<"button">)}
    >
      {content}
    </Comp>
  );
}

export { Button, buttonVariants };
