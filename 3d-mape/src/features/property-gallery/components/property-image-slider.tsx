"use client";

import { ImageOff } from "lucide-react";
import Image from "next/image";
import { useRef, type PointerEvent, type TouchEvent } from "react";

import { ImageCreditLine } from "@/components/image-credit";
import type { PropertyImage } from "@/features/property-gallery/types";

const SWIPE_THRESHOLD_PX = 48;

type PropertyImageSliderProps = {
  image: PropertyImage | null;
  failed: boolean;
  title: string;
  prioritize: boolean;
  onFail: (id: string) => void;
  onStep: (delta: number) => void;
};

export function PropertyImageSlider({
  image,
  failed,
  title,
  prioritize,
  onFail,
  onStep,
}: PropertyImageSliderProps) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const showPhoto = image !== null && !failed;

  function rememberPoint(x: number, y: number) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }

    start.current = { x, y };
  }

  function finishGesture(x: number, y: number) {
    if (!start.current || !Number.isFinite(x) || !Number.isFinite(y)) {
      start.current = null;
      return;
    }

    const deltaX = x - start.current.x;
    const deltaY = y - start.current.y;
    start.current = null;

    if (
      Math.abs(deltaX) < SWIPE_THRESHOLD_PX ||
      Math.abs(deltaX) < Math.abs(deltaY)
    ) {
      return;
    }

    onStep(deltaX < 0 ? 1 : -1);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button != null && event.button !== 0) {
      return;
    }

    rememberPoint(event.clientX, event.clientY);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    finishGesture(event.clientX, event.clientY);
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (start.current) {
      return;
    }

    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }

    rememberPoint(touch.clientX, touch.clientY);
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }

    finishGesture(touch.clientX, touch.clientY);
  }

  return (
    <div
      className="absolute inset-0 touch-pan-y bg-[#1c1917]"
      role="region"
      aria-label="Property photographs"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onPointerCancel={() => {
        start.current = null;
      }}
    >
      {showPhoto ? (
        <Image
          key={image.id}
          src={image.src}
          alt={image.alt}
          fill
          sizes="100vw"
          className="object-cover"
          loading="eager"
          fetchPriority={prioritize ? "high" : "auto"}
          onError={() => onFail(image.id)}
        />
      ) : (
        <div className="flex h-full items-center justify-center px-6 text-center text-[#d6d3d1]">
          <ImageOff className="size-8" aria-hidden="true" />
          <span className="sr-only">
            {image
              ? `Photograph unavailable: ${image.alt}`
              : `No photographs available for ${title}`}
          </span>
        </div>
      )}
      {showPhoto && image.credit ? <ImageCreditLine credit={image.credit} /> : null}
      {image?.roomLabel ? (
        <p className="absolute bottom-28 left-4 z-10 rounded-full bg-black/45 px-3 py-1 text-sm text-white sm:bottom-32 sm:left-6">
          {image.roomLabel}
        </p>
      ) : null}
    </div>
  );
}
