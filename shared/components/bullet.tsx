"use client";

import * as React from "react"
import { cn } from "@/lib/utils"

function Bullet({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="bullet"
            className={cn("bg-primary size-2 shrink-0 rounded-full", className)}
            {...props}
        />
    )
}

export { Bullet }
