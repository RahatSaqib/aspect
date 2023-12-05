const CONSTS = {
  DATE_RANGE_OPTIONS: {
    LAST_30_DAYS: 'LAST_30_DAYS',
    CURRENT_MONTH: 'CURRENT_MONTH',
    LAST_MONTH: 'LAST_MONTH',
  },
  DATE_RANGE_KEYS: {
    MIN_DATE: 'minDate',
    MAX_DATE: 'maxDate',
    FIXED_MIN_DATE: 'fixedMinDate',
    FIXED_MAX_DATE: 'fixedMaxDate',
    CURRENT_MONTH: 'currentMonth',
    DATE_ADJUSTED: 'dateAdjusted',
    DATE_ADJUSTED_FROM: 'dateAdjustedFrom',
    DATE_ADJUSTED_TO: 'dateAdjustedTo',
    EXPIRES_ON: 'expiresOn',
  },
  DATE_RANGE_START_OF_DAY_KEYS: ['minDate', 'currentMonth', 'dateAdjustedFrom'],
  DATE_RANGE_END_OF_DAY_KEYS: ['maxDate', 'dateAdjustedTo', 'expiresOn'],
}

export default CONSTS
