import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
} as const;

interface AvatarProps {
  name?: string;
  size?: "sm" | "md" | "lg";
  src?: string;
  className?: string;
}

export function Avatar({ name, size = "md", src, className }: AvatarProps) {
  const initials = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-medium overflow-hidden",
        sizeClasses[size],
        className
      )}
      aria-label={name || "Avatar"}
    >
      {src ? (
        <img
          src={src}
          alt={name || "Avatar"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
