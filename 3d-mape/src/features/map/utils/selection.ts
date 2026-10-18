export type SelectionAction =
  | { type: "select"; id: string }
  | { type: "clear" };

export function applySelection(
  currentId: string | null,
  action: SelectionAction,
  locationIds: readonly string[],
): string | null {
  if (action.type === "clear") {
    return null;
  }

  return locationIds.includes(action.id) ? action.id : currentId;
}
