// External IDs of devices that we use internally and that should be excluded from some lists and counts
const INTERNAL_DEVICE_IDS = ['GxAlert', 'Aspect']
const RELABEL_EXCEL = { reLabel: 'aspect:report:excel' }

const GRAPH_FLAGS = {
  GET_TOTAL_RESULTS: 'GET_TOTAL_RESULTS',
  GET_TOTAL_RESULTS_IN_CURRENT_YEAR: 'GET_TOTAL_RESULTS_IN_CURRENT_YEAR',
  GET_TOTAL_RESULTS_IN_PERIOD: 'GET_TOTAL_RESULTS_IN_PERIOD',
  GET_TOTAL_RESULTS_IN_LAST_24_HOURS: 'GET_TOTAL_RESULTS_IN_LAST_24_HOURS',
  GET_AVERAGE_RESULTS_PER_MONTH_CURRENT_YEAR: 'GET_AVERAGE_RESULTS_PER_MONTH_CURRENT_YEAR',
}

const XDR_RESISTANCES = ['INH', 'FLQ', 'AMK', 'KAN', 'CAP', 'ETH']
const XDR_RESISTANCES_COMBO = ['INH_FLQ', 'INH_ETH']
const XDR_RESISTANCE_VALUES = ['Detected', 'NotDetected', 'Indeterminate']

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
  XDR_RESISTANCES_COMBO,
  XDR_RESISTANCE_VALUES,
  DAYS_STOCK_LEFT_RANGES,
}
