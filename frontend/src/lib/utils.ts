export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number) {
  return `${value}%`;
}

export function formatElo(delta: number) {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}`;
}
