// External IDs of devices that we use internally and that should be excluded from some lists and counts
const INTERNAL_DEVICE_IDS = ['GxAlert', 'Aspect']
const RELABEL_EXCEL = { reLabel: 'aspect:report:excel' }

const GRAPH_FLAGS = {
  GET_TOTAL_RESULTS: 'GET_TOTAL_RESULTS',
}

module.exports = {
  INTERNAL_DEVICE_IDS,
  RELABEL_EXCEL,
  GRAPH_FLAGS,
}
