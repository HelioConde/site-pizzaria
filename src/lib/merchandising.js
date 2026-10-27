/**
 * Merchandising labels must reflect an actual reduction, never an
 * arbitrary or stale "old price" field from the catalog.
 */
export function hasRealDiscount(oldPrice, currentPrice) {
  if (
    oldPrice === null || oldPrice === undefined || oldPrice === "" ||
    currentPrice === null || currentPrice === undefined || currentPrice === ""
  ) return false;

  const oldValue = Number(oldPrice);
  const currentValue = Number(currentPrice);
  return Number.isFinite(oldValue) && Number.isFinite(currentValue) &&
    currentValue >= 0 && oldValue > currentValue;
}
