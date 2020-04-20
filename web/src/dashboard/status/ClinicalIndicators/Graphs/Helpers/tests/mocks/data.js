/**
 * localhost:8080/api/result/clinical-indicator-aggregations
 * ?assay=GxHiv1Vl
 * &minDate=2019-11-01
 * &maxDate=2020-04-20
 * &groupBy=month
 * &groupBy=resultCategory1
 */

const byMonthSimpleGroupByIn = [
  { cnt: 12, month: '2019-11', resultCategory1: 'MoreThan1000' },
  { cnt: 4, month: '2019-11', resultCategory1: 'LessThan1000' },
  { cnt: 2, month: '2019-11', resultCategory1: 'NotDetected' },

  { cnt: 6, month: '2019-12', resultCategory1: 'LessThan1000' },
  { cnt: 7, month: '2019-12', resultCategory1: 'MoreThan1000' },
  { cnt: 4, month: '2019-12', resultCategory1: 'NotDetected' },

  { cnt: 9, month: '2020-01', resultCategory1: 'LessThan1000' },
  { cnt: 2, month: '2020-01', resultCategory1: 'NotDetected' },
  { cnt: 7, month: '2020-01', resultCategory1: 'MoreThan1000' },

  { cnt: 5, month: '2020-02', resultCategory1: 'MoreThan1000' },
  { cnt: 12, month: '2020-02', resultCategory1: 'LessThan1000' },
  { cnt: 1, month: '2020-02', resultCategory1: 'NotDetected' },

  { cnt: 3, month: '2020-03', resultCategory1: 'MoreThan1000' },
  { cnt: 3, month: '2020-03', resultCategory1: 'NotDetected' },
  { cnt: 11, month: '2020-03', resultCategory1: 'LessThan1000' },

  { cnt: 6, month: '2020-04', resultCategory1: 'LessThan1000' },
  { cnt: 5, month: '2020-04', resultCategory1: 'MoreThan1000' },
  { cnt: 1, month: '2020-04', resultCategory1: 'NotDetected' },
]

const byMonthSimpleGroupByExpectedOut = {
  '2019-11': {
    month: 'Nov 2019',
    MoreThan1000: 12,
    LessThan1000: 4,
    NotDetected: 2,
  },
  '2019-12': {
    month: 'Dec 2019',
    LessThan1000: 6,
    MoreThan1000: 7,
    NotDetected: 4,
  },
  '2020-01': {
    month: 'Jan 2020',
    LessThan1000: 9,
    NotDetected: 2,
    MoreThan1000: 7,
  },
  '2020-02': {
    month: 'Feb 2020',
    MoreThan1000: 5,
    LessThan1000: 12,
    NotDetected: 1,
  },
  '2020-03': {
    month: 'Mar 2020',
    MoreThan1000: 3,
    NotDetected: 3,
    LessThan1000: 11,
  },
  '2020-04': {
    month: 'Apr 2020',
    LessThan1000: 6,
    MoreThan1000: 5,
    NotDetected: 1,
  },
}

const normalisedByMonthSimpleOutExpected = [
  {
    month: 'Nov 2019',
    MoreThan1000: 12,
    LessThan1000: 4,
    NotDetected: 2,
  },
  {
    month: 'Dec 2019',
    LessThan1000: 6,
    MoreThan1000: 7,
    NotDetected: 4,
  },
  {
    month: 'Jan 2020',
    LessThan1000: 9,
    NotDetected: 2,
    MoreThan1000: 7,
  },
  {
    month: 'Feb 2020',
    MoreThan1000: 5,
    LessThan1000: 12,
    NotDetected: 1,
  },
  {
    month: 'Mar 2020',
    MoreThan1000: 3,
    NotDetected: 3,
    LessThan1000: 11,
  },
  {
    month: 'Apr 2020',
    LessThan1000: 6,
    MoreThan1000: 5,
    NotDetected: 1,
  },
]

const percentageSplitByMonthSimpleExpectedOut = [
  {
    month: 'Nov 2019',
    MoreThan1000: '66.6667',
    LessThan1000: '22.2222',
    NotDetected: '11.1111',
  },
  {
    month: 'Dec 2019',
    LessThan1000: '35.2941',
    MoreThan1000: '41.1765',
    NotDetected: '23.5294',
  },
  {
    month: 'Jan 2020',
    LessThan1000: '50.0000',
    NotDetected: '11.1111',
    MoreThan1000: '38.8889',
  },
  {
    month: 'Feb 2020',
    MoreThan1000: '27.7778',
    LessThan1000: '66.6667',
    NotDetected: '5.55556',
  },
  {
    month: 'Mar 2020',
    MoreThan1000: '17.6471',
    NotDetected: '17.6471',
    LessThan1000: '64.7059',
  },
  {
    month: 'Apr 2020',
    LessThan1000: '50.0000',
    MoreThan1000: '41.6667',
    NotDetected: '8.33333',
  },
]

/** ___________________________________________ */

/**
 * localhost:8080/api/result/clinical-indicator-aggregations
 * ?assay=GxMtbRif
 * &minDate=2019-11-01
 * &maxDate=2020-04-20
 * &groupBy=month
 * &groupBy=resultCategory1
 * &groupBy=resultCategory2
 * &resultCategory1=Detected
 */
const byMonthResultCategory1DetectedIn = [
  {
    cnt: 2,
    month: '2019-11',
    resultCategory1: 'Detected',
    resultCategory2: 'NotDetected',
  },
  {
    cnt: 1,
    month: '2019-11',
    resultCategory1: 'Detected',
    resultCategory2: 'Indeterminate',
  },
  {
    cnt: 2,
    month: '2019-12',
    resultCategory1: 'Detected',
    resultCategory2: 'NotDetected',
  },
  {
    cnt: 1,
    month: '2020-01',
    resultCategory1: 'Detected',
    resultCategory2: 'NotDetected',
  },
  {
    cnt: 1,
    month: '2020-01',
    resultCategory1: 'Detected',
    resultCategory2: 'Detected',
  },
  {
    cnt: 1,
    month: '2020-02',
    resultCategory1: 'Detected',
    resultCategory2: 'NotDetected',
  },
]

const byMonthResultCategory1DetectedExpectedOut = {
  '2019-11': {
    month: 'Nov 2019',
    NotDetected: 2,
    Indeterminate: 1,
  },
  '2019-12': {
    month: 'Dec 2019',
    NotDetected: 2,
  },
  '2020-01': {
    month: 'Jan 2020',
    NotDetected: 1,
    Detected: 1,
  },
  '2020-02': {
    month: 'Feb 2020',
    NotDetected: 1,
  },
}

/** ___________________________________________ */

export {
  byMonthSimpleGroupByIn,
  byMonthSimpleGroupByExpectedOut,
  normalisedByMonthSimpleOutExpected,
  percentageSplitByMonthSimpleExpectedOut,
  byMonthResultCategory1DetectedIn,
  byMonthResultCategory1DetectedExpectedOut,
}
