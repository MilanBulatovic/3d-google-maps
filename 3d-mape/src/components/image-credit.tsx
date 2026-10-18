import type { ImageCredit } from "@/features/map/types/map-location";

type ImageCreditLineProps = {
  credit: ImageCredit;
  className?: string;
};

export function ImageCreditLine({ credit, className }: ImageCreditLineProps) {
  return (
    <p
      className={
        className ??
        "pointer-events-auto absolute right-2 bottom-2 left-2 z-10 max-w-[calc(100%-1rem)] truncate rounded-full bg-black/55 px-2.5 py-1 text-[11px] leading-4 text-white"
      }
      onPointerDown={(event) => event.stopPropagation()}
    >
      <a
        href={credit.authorUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-white/40 underline-offset-2"
      >
        {credit.author}
      </a>
      {", "}
      <a
        href={credit.licenseUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="underline decoration-white/40 underline-offset-2"
      >
        {credit.license}
      </a>
    </p>
  );
}
