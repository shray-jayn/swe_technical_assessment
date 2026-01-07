import * as React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ 
  className, 
  variant = "rectangular",
  width,
  height,
  style,
  ...props 
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton",
        variant === "circular" && "rounded-full",
        variant === "text" && "rounded-md h-4",
        className
      )}
      style={{
        width: width,
        height: height,
        ...style,
      }}
      {...props}
    />
  );
}

// Pre-built skeleton variants
export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton height={120} />
      <div className="space-y-2">
        <Skeleton variant="text" />
        <Skeleton variant="text" width="80%" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col gap-4 rounded-2xl border border-border/40 bg-card/80 p-4 shadow-lg shadow-black/5 backdrop-blur-sm animate-fade-in-up md:flex-row md:items-center"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Skeleton width={48} height={48} className="rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton width="40%" height={18} />
              <Skeleton width="30%" height={14} />
            </div>
          </div>
          <div className="flex flex-1 gap-4 min-w-0">
            <div className="hidden sm:flex flex-1 gap-4">
              <div className="flex-1 space-y-2">
                <Skeleton width="60%" height={16} />
                <Skeleton width="35%" height={12} />
              </div>
              <div className="flex-1 space-y-2">
                <Skeleton width="50%" height={16} />
                <Skeleton width="25%" height={12} />
              </div>
            </div>
            <div className="flex justify-end w-full sm:w-auto">
              <Skeleton width={110} height={40} className="rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="min-h-screen bg-background p-6 space-y-8">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton width={180} height={32} />
          <Skeleton width={80} height={28} className="rounded-full" />
        </div>
        <Skeleton width={140} height={44} className="rounded-xl" />
      </div>
      
      {/* Title skeleton */}
      <div className="space-y-4">
        <Skeleton width={160} height={28} className="rounded-full" />
        <Skeleton width={300} height={48} />
        <Skeleton width={400} height={20} />
      </div>
      
      {/* Table skeleton */}
      <SkeletonTable rows={6} />
    </div>
  );
}
