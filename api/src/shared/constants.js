// External IDs of devices that we use internally and that should be excluded from some lists and counts
const INTERNAL_DEVICE_IDS = ['GxAlert', 'Aspect']
const RELABEL_EXCEL = { reLabel: 'aspect:report:excel' }

const GRAPH_FLAGS = {
  GET_TOTAL_RESULTS: 'GET_TOTAL_RESULTS',
}

const XDR_RESISTANCES = ['INH', 'FLQ', 'AMK', 'KAN', 'CAP', 'ETH']

const DAYS_STOCK_LEFT_RANGES = {
  outOfStock: { min: 0, max: 0 },
  upTo14: { min: 1, max: 14 },
  upTo30: { min: 15, max: 30 },
  upTo90: { min: 31, max: 90 },
  upTo180: { min: 91, max: 180 },
  moreThan180: { min: 181 },
}

module.exports = {
  INTERNAL_DEVICE_IDS,
  RELABEL_EXCEL,
  GRAPH_FLAGS,
  XDR_RESISTANCES,
  DAYS_STOCK_LEFT_RANGES,
}
