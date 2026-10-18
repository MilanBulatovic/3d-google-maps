"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { GalleryControls } from "@/features/property-gallery/components/gallery-controls";
import { PropertyGalleryHeader } from "@/features/property-gallery/components/property-gallery-header";
import { PropertyImageSlider } from "@/features/property-gallery/components/property-image-slider";
import { PropertyPanoramaView } from "@/features/property-gallery/components/property-panorama-view";
import { PropertyThumbnailStrip } from "@/features/property-gallery/components/property-thumbnail-strip";
import { propertyHasPanorama } from "@/features/property-gallery/data/properties";
import type { Property, PropertyViewMode } from "@/features/property-gallery/types";

const SLIDESHOW_INTERVAL_MS = 5000;
const CLOSE_ANIMATION_MS = 240;

type PropertyGalleryModalProps = {
  property: Property;
  onClose: () => void;
};

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function focusableElements(root: HTMLElement): HTMLElement[] {
  return [
    ...root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ];
}

export function PropertyGalleryModal({
  property,
  onClose,
}: PropertyGalleryModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const finished = useRef(false);
  const [index, setIndex] = useState(0);
  const [slideshow, setSlideshow] = useState(false);
  const [closing, setClosing] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const [viewMode, setViewMode] = useState<PropertyViewMode>("photos");
  const [failedIds, setFailedIds] = useState<ReadonlySet<string>>(new Set());
  const panoramaAvailable = propertyHasPanorama(property);
  const image = property.images[index] ?? null;
  const photoMode = viewMode === "photos" || !panoramaAvailable;
  const slideshowRunning =
    slideshow && !reducedMotion && photoMode && property.images.length > 1;

  const finishClose = useCallback(() => {
    if (finished.current) {
      return;
    }

    finished.current = true;
    onClose();
  }, [onClose]);

  function requestClose() {
    if (reducedMotion) {
      finishClose();
      return;
    }

    setClosing(true);
  }

  function step(delta: number) {
    if (!photoMode || property.images.length === 0) {
      return;
    }

    setIndex((current) => {
      const length = property.images.length;
      return (current + delta + length) % length;
    });
  }

  function markFailed(id: string) {
    setFailedIds((current) => {
      if (current.has(id)) {
        return current;
      }

      const next = new Set(current);
      next.add(id);
      return next;
    });
  }

  useEffect(() => {
    const previous = document.activeElement;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
      if (previous instanceof HTMLElement) {
        previous.focus();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!slideshowRunning) {
      return;
    }

    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % property.images.length);
    }, SLIDESHOW_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [property.images.length, slideshowRunning]);

  useEffect(() => {
    if (!closing) {
      return;
    }

    const timer = window.setTimeout(finishClose, CLOSE_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [closing, finishClose]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (reducedMotion) {
          finishClose();
          return;
        }

        setClosing(true);
        return;
      }

      if (
        (event.key === "ArrowRight" || event.key === "ArrowLeft") &&
        photoMode &&
        property.images.length > 0
      ) {
        event.preventDefault();
        const delta = event.key === "ArrowRight" ? 1 : -1;
        const length = property.images.length;
        setIndex((current) => (current + delta + length) % length);
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const items = focusableElements(dialogRef.current);
      if (items.length === 0) {
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finishClose, photoMode, property.images.length, reducedMotion]);

  return (
    <div
      className={`gallery-overlay fixed inset-0 z-50 overflow-hidden bg-[#121612]/80 ${
        closing ? "gallery-overlay-out" : ""
      }`}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) {
          finishClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="property-gallery-title"
        className="gallery-stage absolute inset-0 overflow-hidden"
      >
        {photoMode ? (
          <PropertyImageSlider
            image={image}
            failed={image ? failedIds.has(image.id) : false}
            title={property.title}
            prioritize={index === 0}
            onFail={markFailed}
            onStep={step}
          />
        ) : (
          <PropertyPanoramaView url={property.panoramaUrl ?? ""} />
        )}
        <PropertyGalleryHeader
          title={property.title}
          location={property.location}
          details={property.details}
          closeRef={closeRef}
          panoramaAvailable={panoramaAvailable}
          viewMode={photoMode ? "photos" : "panorama"}
          onViewModeChange={setViewMode}
          onClose={requestClose}
        />
        {photoMode ? (
          <>
            <GalleryControls
              index={index}
              total={property.images.length}
              slideshow={slideshowRunning}
              slideshowDisabled={reducedMotion || property.images.length < 2}
              onPrevious={() => step(-1)}
              onNext={() => step(1)}
              onToggleSlideshow={() => setSlideshow((current) => !current)}
            />
            <PropertyThumbnailStrip
              images={property.images}
              index={index}
              failedIds={failedIds}
              onSelect={setIndex}
              onFail={markFailed}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
