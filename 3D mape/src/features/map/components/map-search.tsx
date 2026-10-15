"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Input /*, Select */ } from "@/components/ui/input";
import type { MapLocation } from "@/features/map/types/map-location";
import { GOOGLE_MAPS_URL } from "@/features/map/utils/attribution";

type MapSearchProps = {
  query: string;
  onQueryChange: (value: string) => void;
  category: string;
  categories: readonly string[];
  onCategoryChange: (value: string) => void;
  results: readonly MapLocation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  worldSearch?: boolean;
  montenegroSearch?: boolean;
  onWorldSearchChange?: (enabled: boolean) => void;
  worldStatus?: "idle" | "loading" | "ready" | "empty" | "error";
  worldMessage?: string | null;
};

const SUGGESTION_LIMIT = 8;

function highlightMatch(name: string, query: string) {
  const needle = query.trim();
  const index = needle ? name.toLowerCase().indexOf(needle.toLowerCase()) : -1;
  if (index < 0) {
    return name;
  }

  return (
    <>
      {name.slice(0, index)}
      <mark className="bg-transparent font-semibold text-[#c2410c]">
        {name.slice(index, index + needle.length)}
      </mark>
      {name.slice(index + needle.length)}
    </>
  );
}

export function MapSearch({
  query,
  onQueryChange,
  // category,
  // categories,
  // onCategoryChange,
  results,
  selectedId,
  onSelect,
  worldSearch = false,
  montenegroSearch = false,
  onWorldSearchChange,
  worldStatus = "idle",
  worldMessage = null,
}: MapSearchProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [indexFor, setIndexFor] = useState("");
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const listId = useId();
  const suggestions = results.slice(0, SUGGESTION_LIMIT);
  const resultKey = suggestions.map((location) => location.id).join("\0");
  const remoteSearch = worldSearch || montenegroSearch;
  const canSuggest = remoteSearch || query.trim().length > 0;
  const showPanel = open && canSuggest;
  const activeId =
    showPanel && suggestions[activeIndex]
      ? `${listId}-option-${activeIndex}`
      : undefined;
  const emptyMessage = remoteSearch
    ? query.trim().length < 2
      ? worldSearch
        ? "Type a city or address, such as New York."
        : "Type a city, place, or address in Montenegro."
      : worldStatus === "empty" || worldStatus === "error"
        ? (worldMessage ?? "No places match your search.")
        : worldSearch
          ? "Searching the world…"
          : "Searching Montenegro…"
    : "No places match your search.";
  const showEmpty = showPanel && suggestions.length === 0;

  if (indexFor !== resultKey) {
    setIndexFor(resultKey);
    setActiveIndex(0);
  }

  useEffect(() => {
    optionRefs.current[activeIndex]?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);

  function choose(location: MapLocation) {
    onQueryChange(location.name);
    onSelect(location.id);
    setOpen(false);
  }

  return (
    <div className="relative flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#78716c]"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }

            if (!canSuggest || suggestions.length === 0) {
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex((index) => (index + 1) % suggestions.length);
              return;
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
              setActiveIndex(
                (index) => (index - 1 + suggestions.length) % suggestions.length,
              );
              return;
            }

            if (event.key === "Enter" && suggestions[activeIndex]) {
              event.preventDefault();
              choose(suggestions[activeIndex]);
            }
          }}
          placeholder={
            worldSearch
              ? "Search the world"
              : montenegroSearch
                ? "Search Montenegro"
                : "Search places"
          }
          aria-label={
            worldSearch
              ? "Search the world"
              : montenegroSearch
                ? "Search Montenegro"
                : "Search places"
          }
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={activeId}
          role="combobox"
          autoComplete="off"
          className="w-full pr-3 pl-9"
        />
        {showPanel ? (
          <div
            id={listId}
            className="absolute top-[calc(100%+0.4rem)] right-0 left-0 z-40 overflow-hidden rounded-2xl bg-[#fffaf3] shadow-xl shadow-black/20 ring-1 ring-black/10"
          >
            {showEmpty ? (
              <p className="px-3 py-4 text-sm text-[#57534e]">{emptyMessage}</p>
            ) : (
              <ul className="max-h-72 overflow-auto py-1" role="listbox">
                {suggestions.map((location, index) => {
                  const active = index === activeIndex;
                  const selected = location.id === selectedId;

                  return (
                    <li key={location.id}>
                      <button
                        ref={(node) => {
                          optionRefs.current[index] = node;
                        }}
                        id={`${listId}-option-${index}`}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={`flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left focus-visible:outline-none ${active || selected ? "bg-[#f5f0e8]" : ""}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => choose(location)}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[#1c1917]">
                            {highlightMatch(location.name, query)}
                          </span>
                          {location.address ? (
                            <span className="block truncate text-xs text-[#78716c]">
                              {location.address}
                            </span>
                          ) : null}
                        </span>
                        <span className="shrink-0 text-xs tracking-wide text-[#78716c] uppercase">
                          {location.category}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {remoteSearch ? (
              <p className="border-t border-black/10 px-3 py-2 text-[11px] text-[#57534e]">
                Pretraga:{" "}
                <a
                  className="underline decoration-[#a8a29e] underline-offset-2"
                  href={GOOGLE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google
                </a>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
      <div
        className="flex shrink-0 rounded-full bg-[#e7e5e4] p-0.5"
        role="group"
        aria-label="Search mode"
      >
        <button
          type="button"
          aria-pressed={!worldSearch}
          className={`rounded-full px-2.5 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] ${worldSearch ? "text-[#57534e]" : "bg-[#1c1917] text-[#fffaf3]"}`}
          onClick={() => onWorldSearchChange?.(false)}
        >
          Mjesta
        </button>
        <button
          type="button"
          aria-pressed={worldSearch}
          className={`rounded-full px-2.5 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] ${worldSearch ? "bg-[#1c1917] text-[#fffaf3]" : "text-[#57534e]"}`}
          onClick={() => onWorldSearchChange?.(true)}
        >
          Svijet
        </button>
      </div>
      {/* Category filter hidden for now.
      <Select
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
        aria-label="Filter by category"
        className="sm:w-44"
      >
        <option value="all">All categories</option>
        {categories.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </Select>
      */}
    </div>
  );
}
