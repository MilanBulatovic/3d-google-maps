import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "ghost" | "icon";
};

export function Button({
  className,
  variant = "solid",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf3] disabled:pointer-events-none disabled:opacity-40",
        variant === "solid" &&
          "bg-[#1c1917] px-3.5 py-2 text-[#fffaf3] hover:bg-[#292524]",
        variant === "ghost" &&
          "bg-white/80 px-3 py-2 text-[#1c1917] ring-1 ring-black/10 hover:bg-white",
        variant === "icon" &&
          "size-10 bg-white/85 text-[#1c1917] ring-1 ring-black/10 hover:bg-white",
        className,
      )}
      {...props}
    />
  );
}
