'use client';

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bullet } from "@/components/ui/bullet";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";

interface StatCardProps {
    label: string;
    value?: string | number;
    description?: string;
    icon: React.ElementType;
    intent?: "positive" | "negative" | "neutral";
    children?: React.ReactNode;
    className?: string;
    contentClassName?: string;
    tooltip?: string;
}

export function StatCard({
    label,
    value,
    description,
    icon: Icon,
    intent = "neutral",
    children,
    className,
    contentClassName,
    tooltip
}: StatCardProps) {
    const bulletVariant = intent === "positive" ? "success" : intent === "negative" ? "destructive" : intent === "neutral" ? "warning" : "default";

    const numericValue = value !== undefined && typeof value === 'number' ? value :
        (value !== undefined ? parseFloat(value.toString().replace(/[^0-9.-]/g, '')) : NaN);
    const isNumeric = !isNaN(numericValue);
    const suffix = value !== undefined && typeof value === 'string' ? value.replace(/[0-9.-]/g, '') : '';

    return (
        <Card className={cn("relative overflow-hidden flex flex-col", className)} title={tooltip}>
            <CardHeader className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2.5">
                    <Bullet variant={bulletVariant} />
                    {label}
                </CardTitle>
                <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className={cn("bg-accent flex-1 pt-2 md:pt-6 overflow-clip relative", contentClassName)}>
                {value !== undefined && (
                    <div className="flex items-center">
                        <span className="text-4xl md:text-5xl font-display">
                            {isNumeric && !label.includes('GRADE') ? (
                                <NumberFlow value={numericValue} suffix={suffix} />
                            ) : (
                                value
                            )}
                        </span>
                    </div>
                )}
                {description && (
                    <div className="justify-between">
                        <p className="text-xs md:text-sm font-medium text-muted-foreground tracking-wide uppercase">
                            {description}
                        </p>
                    </div>
                )}
                {children && <div className={cn(value !== undefined || description ? "mt-4" : "")}>{children}</div>}
            </CardContent>
        </Card>
    );
}
