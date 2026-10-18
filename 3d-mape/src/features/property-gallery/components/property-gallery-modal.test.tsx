import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PropertyGalleryModal } from "@/features/property-gallery/components/property-gallery-modal";
import { PROPERTIES } from "@/features/property-gallery/data/properties";
import type { Property } from "@/features/property-gallery/types";

vi.mock("next/image", () => ({
  default: function MockImage({
    alt,
    src,
    onError,
  }: {
    alt: string;
    src: string;
    onError?: () => void;
  }) {
    useEffect(() => {
      if (String(src).includes("missing")) {
        onError?.();
      }
    }, [onError, src]);

    return <span role="img" aria-label={alt} />;
  },
}));

const residence = PROPERTIES[0];

function GalleryHarness({
  property = residence,
  onClose = () => undefined,
}: {
  property?: Property;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        View Property
      </button>
      {open ? (
        <PropertyGalleryModal
          property={property}
          onClose={() => {
            onClose();
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

describe("PropertyGalleryModal", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("shows the listing and moves between photographs", async () => {
    const user = userEvent.setup();
    render(<PropertyGalleryModal property={residence} onClose={() => undefined} />);

    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    expect(
      screen.getByRole("heading", { name: residence.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(residence.location)).toBeInTheDocument();
    expect(screen.getByText("€420,000")).toBeInTheDocument();
    expect(screen.getByText("3 bedrooms")).toBeInTheDocument();
    expect(screen.getByText("1 / 4")).toBeInTheDocument();
    expect(screen.getByText("Living Room")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "360° view" }),
    ).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: "Next photograph" }));
    expect(screen.getByText("2 / 4")).toBeInTheDocument();
    expect(screen.getByText("Kitchen")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show Terrace" }));
    expect(screen.getByText("4 / 4")).toBeInTheDocument();
    expect(screen.getByText("Terrace")).toBeInTheDocument();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("3 / 4")).toBeInTheDocument();

    const photographs = screen.getByRole("region", {
      name: "Property photographs",
    });
    fireEvent.touchStart(photographs, {
      changedTouches: [{ clientX: 200, clientY: 80 }],
    });
    fireEvent.touchEnd(photographs, {
      changedTouches: [{ clientX: 30, clientY: 84 }],
    });
    expect(screen.getByText("4 / 4")).toBeInTheDocument();
  });

  it("keeps the slideshow paused until it is enabled", async () => {
    vi.useFakeTimers();
    render(<PropertyGalleryModal property={residence} onClose={() => undefined} />);

    const play = screen.getByRole("button", { name: "Play slideshow" });
    expect(play).toHaveAttribute("aria-pressed", "false");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(SLIDESHOW_WAIT);
    });
    expect(screen.getByText("1 / 4")).toBeInTheDocument();

    fireEvent.click(play);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(SLIDESHOW_WAIT);
    });
    expect(screen.getByText("2 / 4")).toBeInTheDocument();
  });

  it("disables the slideshow when reduced motion is requested", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );

    render(<PropertyGalleryModal property={residence} onClose={() => undefined} />);

    expect(screen.getByRole("button", { name: "Play slideshow" })).toBeDisabled();
  });

  it("closes from the button and Escape, then restores focus", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<GalleryHarness onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "View Property" }));
    expect(screen.getByRole("button", { name: "Close gallery" })).toHaveFocus();

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "View Property" })).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("shows a fallback when a listing has no photographs", () => {
    render(
      <PropertyGalleryModal
        property={{ ...residence, images: [], details: undefined }}
        onClose={() => undefined}
      />,
    );

    expect(
      screen.getByText(`No photographs available for ${residence.title}`),
    ).toBeInTheDocument();
    expect(screen.getByText("0 / 0")).toBeInTheDocument();
    expect(screen.queryByText("€420,000")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next photograph" })).toBeDisabled();
  });

  it("shows a fallback when a photograph fails to load", async () => {
    render(
      <PropertyGalleryModal
        property={{
          ...residence,
          images: [
            {
              id: "broken",
              src: "/properties/missing.png",
              alt: "Broken living room",
              roomLabel: "Living Room",
            },
          ],
        }}
        onClose={() => undefined}
      />,
    );

    expect(
      await screen.findByText("Photograph unavailable: Broken living room"),
    ).toBeInTheDocument();
  });
});

const SLIDESHOW_WAIT = 5000;
