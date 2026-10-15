import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LocationInfoCard } from "@/features/map/components/location-info-card";
import { LOCATIONS } from "@/features/map/data/locations";

vi.mock("next/image", () => ({
  default: function MockImage({ alt }: { alt: string }) {
    return <span role="img" aria-label={alt} />;
  },
}));

describe("LocationInfoCard", () => {
  it("shows the selected place and external map links", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const location = LOCATIONS.find((item) => item.id === "millennium-bridge");

    if (!location) {
      throw new Error("Expected a development location.");
    }

    render(
      <LocationInfoCard
        location={location}
        onClose={onClose}
        onShowOverview={() => undefined}
      />,
    );

    expect(
      screen.getByRole("heading", { name: location.name }),
    ).toBeInTheDocument();
    expect(screen.getByText(location.category)).toBeInTheDocument();
    expect(screen.getByText(location.description)).toBeInTheDocument();

    const photoCredit = screen.getByRole("link", {
      name: "Bjørn Christian Tørrissen",
    });
    expect(photoCredit).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByRole("link", { name: "CC BY-SA 4.0" })).toHaveAttribute(
      "href",
      "https://creativecommons.org/licenses/by-sa/4.0/",
    );

    const searchLink = screen.getByRole("link", { name: "Open in Google Maps" });
    expect(searchLink).toHaveAttribute("target", "_blank");
    expect(searchLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(searchLink.getAttribute("href")).toContain("api=1");

    const directionsLink = screen.getByRole("link", { name: "Directions" });
    expect(directionsLink).toHaveAttribute("target", "_blank");
    expect(directionsLink.getAttribute("href")).toContain("destination=");

    await user.click(
      screen.getByRole("button", { name: "Close location details" }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps a compact peek on mobile until the place is opened", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    const location = LOCATIONS.find((item) => item.id === "millennium-bridge");

    if (!location) {
      throw new Error("Expected a development location.");
    }

    render(
      <LocationInfoCard
        location={location}
        onClose={() => undefined}
        onShowOverview={() => undefined}
      />,
    );

    expect(
      screen.queryByRole("heading", { name: location.name }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(location.name)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: `Show details for ${location.name}` }),
    );

    expect(
      screen.getByRole("heading", { name: location.name }),
    ).toBeInTheDocument();
    expect(screen.getByText(location.description)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Hide location details" }),
    );
    expect(
      screen.queryByRole("heading", { name: location.name }),
    ).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("shows a fallback when a place has no photo", () => {
    const location = LOCATIONS.find((item) => item.id === "king-nikola-palace");

    if (!location) {
      throw new Error("Expected a location without an image.");
    }

    render(
      <LocationInfoCard
        location={location}
        onClose={() => undefined}
        onShowOverview={() => undefined}
      />,
    );

    expect(
      screen.getByText(`No photo available for ${location.name}`),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Look in detail" }),
    ).not.toBeInTheDocument();
  });

  it("opens the property gallery from a residence card", async () => {
    const user = userEvent.setup();
    const onViewProperty = vi.fn();
    const location = LOCATIONS.find((item) => item.id === "vila-moraca");

    if (!location) {
      throw new Error("Expected a sample residence.");
    }

    render(
      <LocationInfoCard
        location={location}
        onClose={() => undefined}
        onShowOverview={() => undefined}
        onViewProperty={onViewProperty}
      />,
    );

    expect(screen.getByRole("link", { name: "Directions" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Look in detail" }));
    expect(onViewProperty).toHaveBeenCalledOnce();
  });

  it("credits OpenStreetMap on a venue from that dataset", () => {
    const location = LOCATIONS.find(
      (item) => item.id === "djeciji-vrtic-bosko-buha-428430-201693",
    );

    if (!location) {
      throw new Error("Expected an OpenStreetMap kindergarten.");
    }

    render(
      <LocationInfoCard
        location={location}
        onClose={() => undefined}
        onShowOverview={() => undefined}
      />,
    );

    expect(
      screen.getByRole("link", { name: "© OpenStreetMap contributors" }),
    ).toHaveAttribute("href", "https://www.openstreetmap.org/copyright");
    expect(screen.queryByText("OpenStreetMap")).not.toBeInTheDocument();
  });
});
