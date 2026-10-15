import type { InputHTMLAttributes, Ref, SelectHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const fieldClassName =
  "h-10 rounded-full bg-white/80 px-3 text-sm text-[#1c1917] ring-1 ring-black/10 outline-none placeholder:text-[#78716c] focus-visible:ring-2 focus-visible:ring-[#c2410c]";

export function Input({
  className,
  ref,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} className={cn(fieldClassName, className)} {...props} />;
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClassName, "pr-8", className)} {...props} />;
}
