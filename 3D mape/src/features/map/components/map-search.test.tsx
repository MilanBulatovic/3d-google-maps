import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { MapSearch } from "@/features/map/components/map-search";
import { LOCATIONS } from "@/features/map/data/locations";
import { filterLocations } from "@/features/map/utils/filter-locations";

function SearchHarness({
  onSelect,
  onWorldSearchChange,
}: {
  onSelect: (id: string) => void;
  onWorldSearchChange?: (enabled: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");

  return (
    <MapSearch
      query={query}
      onQueryChange={setQuery}
      category={category}
      categories={[...new Set(LOCATIONS.map((location) => location.category))]}
      onCategoryChange={setCategory}
      results={filterLocations(LOCATIONS, { query, category })}
      selectedId={null}
      onSelect={onSelect}
      onWorldSearchChange={onWorldSearchChange}
    />
  );
}

describe("MapSearch", () => {
  it("filters places and selects a result", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SearchHarness onSelect={onSelect} />);

    const search = screen.getByRole("combobox", { name: "Search places" });
    await user.click(search);
    expect(screen.queryByRole("option")).not.toBeInTheDocument();

    await user.type(search, "zzzz-no-match");
    expect(screen.getByText("No places match your search.")).toBeInTheDocument();

    await user.clear(search);
    const matches = filterLocations(LOCATIONS, { query: "mo", category: "all" });
    await user.type(search, "mo");
    expect(screen.getAllByRole("option").length).toBeGreaterThan(1);
    expect(screen.getAllByRole("option")[0]).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowDown}{Enter}");
    expect(onSelect).toHaveBeenCalledWith(matches[1].id);
    expect(search).toHaveValue(matches[1].name);
  });

  it("switches the field to world search", async () => {
    const user = userEvent.setup();
    const onWorldSearchChange = vi.fn();
    render(<SearchHarness onSelect={vi.fn()} onWorldSearchChange={onWorldSearchChange} />);

    expect(screen.getByRole("button", { name: "Mjesta" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Svijet" }));
    expect(onWorldSearchChange).toHaveBeenCalledWith(true);
  });

  it("credits Google while world search results are open", async () => {
    const user = userEvent.setup();
    render(
      <MapSearch
        query="New York"
        onQueryChange={() => undefined}
        category="all"
        categories={[]}
        onCategoryChange={() => undefined}
        results={[
          {
            id: "world-nyc",
            name: "New York",
            category: "Svijet",
            description: "New York, NY, USA",
            latitude: 40.7128,
            longitude: -74.006,
            dataSource: "google",
          },
        ]}
        selectedId={null}
        onSelect={vi.fn()}
        worldSearch
      />,
    );

    await user.click(screen.getByRole("combobox", { name: "Search the world" }));
    expect(screen.getByRole("link", { name: "Google" })).toHaveAttribute(
      "href",
      "https://www.google.com/maps",
    );
  });
});
