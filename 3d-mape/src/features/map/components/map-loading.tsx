import { Skeleton } from "@/components/ui/skeleton";

export function MapLoading() {
  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center bg-[#121612]"
      role="status"
      aria-live="polite"
    >
      <div className="flex w-64 flex-col items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full bg-white/10" />
        <Skeleton className="h-2 w-40 bg-white/10" />
        <p className="text-sm tracking-wide text-[#d6d3d1]">
          Loading photorealistic map
        </p>
      </div>
    </div>
  );
}
