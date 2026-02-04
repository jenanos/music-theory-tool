import { cn } from "./utils";

export function Gradient({
  conic,
  className,
  small,
}: {
  small?: boolean;
  conic?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "absolute mix-blend-normal will-change-[filter] rounded-[100%]",
        small ? "blur-[32px]" : "blur-[75px]",
        conic && "bg-gradient-to-r from-chart-5 via-primary to-chart-2",
        className
      )}
    />
  );
}
