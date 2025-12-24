"use client";

import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const bulletVariants = cva(
    "shrink-0 rounded-full",
    {
        variants: {
            variant: {
                default: "bg-primary",
                success: "bg-green-500",
                destructive: "bg-destructive",
                warning: "bg-yellow-500",
            },
            size: {
                default: "size-2",
                sm: "size-1.5",
                lg: "size-3",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

interface BulletProps
    extends React.ComponentProps<"div">,
    VariantProps<typeof bulletVariants> { }

function Bullet({ className, variant, size, ...props }: BulletProps) {
    return (
        <div
            data-slot="bullet"
            className={cn(bulletVariants({ variant, size }), className)}
            {...props}
        />
    )
}

export { Bullet, bulletVariants }
