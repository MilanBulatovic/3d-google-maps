import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type MapErrorProps = {
  title: string;
  message: string;
  onRetry?: () => void;
};

export function MapError({ title, message, onRetry }: MapErrorProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#121612] p-6">
      <div className="max-w-md rounded-3xl bg-[#fffaf3] p-6 text-[#1c1917] shadow-2xl shadow-black/40 ring-1 ring-white/10">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-[#44403c]">{message}</p>
        {onRetry ? (
          <Button className="mt-5" onClick={onRetry}>
            <RotateCw className="size-4" aria-hidden="true" />
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}
