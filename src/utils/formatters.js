export function formatNumber(value) {
  return new Intl.NumberFormat('en-GB').format(value)
}

export function formatPercent(value) {
  return `${value}%`
}
