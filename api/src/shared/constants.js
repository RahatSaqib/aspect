// External IDs of devices that we use internally and that should be excluded from some lists and counts
const INTERNAL_DEVICE_IDS = ['GxAlert', 'Aspect']
const RELABEL_EXCEL = { reLabel: 'aspect:report:excel' }
const IGNORED_SENTRY_ERRORS = [/^Cannot authorize API Key$/]
const GRAPH_FLAGS = {
  GET_TOTAL_RESULTS: 'GET_TOTAL_RESULTS',
  GET_TOTAL_RESULTS_IN_CURRENT_YEAR: 'GET_TOTAL_RESULTS_IN_CURRENT_YEAR',
  GET_TOTAL_RESULTS_IN_PERIOD: 'GET_TOTAL_RESULTS_IN_PERIOD',
  GET_TOTAL_RESULTS_FOR_TODAY: 'GET_TOTAL_RESULTS_FOR_TODAY',
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

const WEBHOOK_SERVERS = {
  CepheidC360: 'CepheidC360',
}

const EXTERNAL_IDS = Object.freeze({
  SEND_RESULT_TO_CEPHEID: 'sendResultToCepheid',
})

const GENEXPERT_ASSAYS = Object.freeze({
  GX_MTB_XDR: 'GxMtbXdr',
  GX_MTB_RIFULTRA: 'GxMtbRifUltra',
  GX_MTB_RIF: 'GxMtbRif',
  GX_HIV1QUAL: 'GxHiv1Qual',
  GX_EBOLA: 'GxEbola',
  ASSAY_GX_COVID19: 'assayGXCovid19',
  GX_HIV1VL: 'GxHiv1Vl',
  GX_HCV: 'GxHcv',
})

const SITE_TYPE_EXTERNAL_IDS = Object.freeze({
  LAB: 'lab',
  CLINIC: 'clinic',
  WAREHOUSE: 'warehouse',
})

const ISSUE_CATEGORY_EXTERNAL_IDS = {
  CepheidC360InstrumentLogsReceived: 'CepheidC360InstrumentLogsReceived',
}

const ISSUE_TYPE_EXTERNAL_IDS = {
  CepheidC360InstrumentLogsReceived: 'CepheidC360InstrumentLogsReceived',
}

const INVENTORY_ADJUSTMENT = Object.freeze({
  CURRENT_SITE_AND_PROVIDER: 'currentSiteAndProviderAdjustment',
  CURRENT_SITE: 'currentSiteAdjustment',
  CURRENT_SITE_AND_PROVIDER_AND_NATIONAL: 'currentSiteAndProviderAndNationalAdjustment',
})

const INVENTORY_STRATEGY = Object.freeze({
  EXPIRATION_DATE: 'withExpirationDateStrategy',
  LOT_NUMBER: 'withLotStrategy',
  LOT_AND_EXPIRATION_DATE: 'withLotAndExpirationDateStrategy',
})

module.exports = {
  IGNORED_SENTRY_ERRORS,
  INTERNAL_DEVICE_IDS,
  RELABEL_EXCEL,
  GRAPH_FLAGS,
  XDR_RESISTANCES,
  XDR_RESISTANCES_COMBO,
  XDR_RESISTANCE_VALUES,
  DAYS_STOCK_LEFT_RANGES,
  WEBHOOK_SERVERS,
  EXTERNAL_IDS,
  GENEXPERT_ASSAYS,
  SITE_TYPE_EXTERNAL_IDS,
  ISSUE_CATEGORY_EXTERNAL_IDS,
  ISSUE_TYPE_EXTERNAL_IDS,
  INVENTORY_ADJUSTMENT,
  INVENTORY_STRATEGY,
}
