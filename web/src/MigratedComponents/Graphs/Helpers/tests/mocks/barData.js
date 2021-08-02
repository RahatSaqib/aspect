const barDataActualFromAPIIn = [
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

const barDataActualFromAPIOut = [
  { month: 'Nov 2019', MoreThan1000: 12, LessThan1000: 4, NotDetected: 2 },
  { month: 'Dec 2019', LessThan1000: 6, MoreThan1000: 7, NotDetected: 4 },
  { month: 'Jan 2020', LessThan1000: 9, NotDetected: 2, MoreThan1000: 7 },
  { month: 'Feb 2020', MoreThan1000: 5, LessThan1000: 12, NotDetected: 1 },
  { month: 'Mar 2020', MoreThan1000: 3, NotDetected: 3, LessThan1000: 11 },
  { month: 'Apr 2020', LessThan1000: 6, MoreThan1000: 5, NotDetected: 1 },
]

const tickDataForBarDisplayMethodPercentageIn = [
  {
    month: 'Nov 19',
    LessThan1000: 52.9412,
    MoreThan1000: 47.0588,
    totalCnt: 17,
  },
  {
    month: 'Dec 19',
    LessThan1000: 40.9091,
    MoreThan1000: 54.5455,
    NotDetected: 4.5455,
    totalCnt: 22,
  },
  {
    month: 'Jan 20',
    LessThan1000: 68.75,
    MoreThan1000: 25,
    NotDetected: 6.25,
    totalCnt: 16,
  },
  {
    month: 'Feb 20',
    NotDetected: 11.1111,
    LessThan1000: 50,
    MoreThan1000: 38.8889,
    totalCnt: 18,
  },
  {
    month: 'Mar 20',
    LessThan1000: 40,
    NotDetected: 15,
    MoreThan1000: 45,
    totalCnt: 20,
  },
  {
    month: 'Apr 20',
    MoreThan1000: 47.0588,
    LessThan1000: 35.2941,
    NotDetected: 17.6471,
    totalCnt: 17,
  },
]

const tickDataForBarDisplayMethodActualIn = [
  { month: 'Nov 19', LessThan1000: 9, MoreThan1000: 8 },
  { month: 'Dec 19', LessThan1000: 9, MoreThan1000: 12, NotDetected: 1 },
  { month: 'Jan 20', LessThan1000: 11, MoreThan1000: 4, NotDetected: 1 },
  { month: 'Feb 20', NotDetected: 2, LessThan1000: 9, MoreThan1000: 7 },
  { month: 'Mar 20', LessThan1000: 8, NotDetected: 3, MoreThan1000: 9 },
  { month: 'Apr 20', MoreThan1000: 8, LessThan1000: 6, NotDetected: 3 },
]

const treatmentAPIOptimumDataIn = [
  { total: 26, onTreatment: 17, monthTested: '2020-05', pcOnTreatment: 65.4 },
  { total: 29, onTreatment: 18, monthTested: '2020-06', pcOnTreatment: 62.1 },
  { total: 36, onTreatment: 21, monthTested: '2020-07', pcOnTreatment: 58.3 },
  { total: 27, onTreatment: 13, monthTested: '2020-08', pcOnTreatment: 48.1 },
  { total: 25, onTreatment: 15, monthTested: '2020-09', pcOnTreatment: 60 },
  { total: 25, onTreatment: 17, monthTested: '2020-10', pcOnTreatment: 68 },
]

const treatmentAPIOptimumDataOut = [
  {
    monthTested: 'May 20',
    Confirmed: 65.4,
    NotConfirmed: 34.6,
    totalCnt: 26,
  },
  {
    monthTested: 'Jun 20',
    Confirmed: 62.1,
    NotConfirmed: 37.9,
    totalCnt: 29,
  },
  {
    monthTested: 'Jul 20',
    Confirmed: 58.3,
    NotConfirmed: 41.7,
    totalCnt: 36,
  },
  {
    monthTested: 'Aug 20',
    Confirmed: 48.1,
    NotConfirmed: 51.9,
    totalCnt: 27,
  },
  {
    monthTested: 'Sep 20',
    Confirmed: 60,
    NotConfirmed: 40,
    totalCnt: 25,
  },
  {
    monthTested: 'Oct 20',
    Confirmed: 68,
    NotConfirmed: 32,
    totalCnt: 25,
  },
]

const treatmentAPISkewedDataIn = [
  { total: 26, onTreatment: 0, monthTested: '2020-05', pcOnTreatment: 0 },
  { total: 29, onTreatment: 0, monthTested: '2020-06', pcOnTreatment: 0 },
  { total: 36, onTreatment: 0, monthTested: '2020-07', pcOnTreatment: 0 },
  { total: 27, onTreatment: 0, monthTested: '2020-08', pcOnTreatment: 0 },
  { total: 25, onTreatment: 0, monthTested: '2020-09', pcOnTreatment: 0 },
  { total: 25, onTreatment: 0, monthTested: '2020-10', pcOnTreatment: 0 },
]

const treatmentAPISkewedDataOppositeIn = [
  { total: 26, onTreatment: 26, monthTested: '2020-05', pcOnTreatment: 100 },
  { total: 29, onTreatment: 29, monthTested: '2020-06', pcOnTreatment: 100 },
  { total: 36, onTreatment: 36, monthTested: '2020-07', pcOnTreatment: 100 },
  { total: 27, onTreatment: 27, monthTested: '2020-08', pcOnTreatment: 100 },
  { total: 25, onTreatment: 25, monthTested: '2020-09', pcOnTreatment: 100 },
  { total: 25, onTreatment: 25, monthTested: '2020-10', pcOnTreatment: 100 },
]

const treatmentAPISkewedPercentageDataOut = [
  {
    monthTested: 'May 20',
    Confirmed: 0,
    NotConfirmed: 100,
    totalCnt: 26,
  },
  {
    monthTested: 'Jun 20',
    Confirmed: 0,
    NotConfirmed: 100,
    totalCnt: 29,
  },
  {
    monthTested: 'Jul 20',
    Confirmed: 0,
    NotConfirmed: 100,
    totalCnt: 36,
  },
  {
    monthTested: 'Aug 20',
    Confirmed: 0,
    NotConfirmed: 100,
    totalCnt: 27,
  },
  {
    monthTested: 'Sep 20',
    Confirmed: 0,
    NotConfirmed: 100,
    totalCnt: 25,
  },
  {
    monthTested: 'Oct 20',
    Confirmed: 0,
    NotConfirmed: 100,
    totalCnt: 25,
  },
]

const treatmentAPISkewedDataOppositePercentageOut = [
  {
    monthTested: 'May 20',
    Confirmed: 100,
    NotConfirmed: 0,
    totalCnt: 26,
  },
  {
    monthTested: 'Jun 20',
    Confirmed: 100,
    NotConfirmed: 0,
    totalCnt: 29,
  },
  {
    monthTested: 'Jul 20',
    Confirmed: 100,
    NotConfirmed: 0,
    totalCnt: 36,
  },
  {
    monthTested: 'Aug 20',
    Confirmed: 100,
    NotConfirmed: 0,
    totalCnt: 27,
  },
  {
    monthTested: 'Sep 20',
    Confirmed: 100,
    NotConfirmed: 0,
    totalCnt: 25,
  },
  {
    monthTested: 'Oct 20',
    Confirmed: 100,
    NotConfirmed: 0,
    totalCnt: 25,
  },
]

const treatmentAPISkewedActualDataOut = [
  {
    monthTested: 'May 20',
    Confirmed: 0,
    NotConfirmed: 26,
    totalCnt: 26,
  },
  {
    monthTested: 'Jun 20',
    Confirmed: 0,
    NotConfirmed: 29,
    totalCnt: 29,
  },
  {
    monthTested: 'Jul 20',
    Confirmed: 0,
    NotConfirmed: 36,
    totalCnt: 36,
  },
  {
    monthTested: 'Aug 20',
    Confirmed: 0,
    NotConfirmed: 27,
    totalCnt: 27,
  },
  {
    monthTested: 'Sep 20',
    Confirmed: 0,
    NotConfirmed: 25,
    totalCnt: 25,
  },
  {
    monthTested: 'Oct 20',
    Confirmed: 0,
    NotConfirmed: 25,
    totalCnt: 25,
  },
]

const barDataForToolTipsNovIn1 = {
  id: 'Detected',
  value: '30.973451327434',
  index: 11,
  indexValue: 'Nov 20',
  data: {
    month: 'Nov 20',
    Detected: '30.973451327434',
    totalCnt: 113,
  },
}

const barDataForToolTipsNovIn2 = {
  id: 'Detected',
  value: '25.499445061043',
  index: 11,
  indexValue: 'Nov 20',
  data: {
    month: 'Nov 20',
    Detected: '25.499445061043',
    totalCnt: 3604,
  },
}

const barDataForToolTipsNovIn3 = {
  id: 'Detected',
  value: '43.744417479583',
  index: 11,
  indexValue: 'Nov 20',
  data: {
    month: 'Nov 20',
    Detected: '43.744417479583',
    totalCnt: 1200000000000,
  },
}

const barDataForToolTipsNovOut1 = {
  color: 'var(--guardsman-red, #d60000)',
  displayId: 'Detected',
  indexValue: 'Nov 20',
  displayValue: {
    value: '30.97%',
    actual: {
      totalCnt: 113,
      percentageToValue: 35,
    },
  },
  externalId: 'Detected',
}

const barDataForToolTipsNovOut2 = {
  color: 'var(--guardsman-red, #d60000)',
  displayId: 'Detected',
  indexValue: 'Nov 20',
  displayValue: {
    value: '25.5%',
    actual: {
      totalCnt: 3604,
      percentageToValue: 919,
    },
  },
  externalId: 'Detected',
}

const barDataForToolTipsNovOut3 = {
  color: 'var(--guardsman-red, #d60000)',
  displayId: 'Detected',
  indexValue: 'Nov 20',
  displayValue: {
    value: '43.74%',
    actual: {
      totalCnt: 1200000000000,
      percentageToValue: 524933009755,
    },
  },
  externalId: 'Detected',
}

const tickDataForBarYAxisShapeBookendsDisplayPercentageOut = [0, 100]
const tickDataForBarYAxisShapeClubSandwichDisplayPercentageOut = [0, 50, 100]
const tickDataForBarYAxisShapeBookendsDisplayActualOut = [0, 22]
const tickDataForBarYAxisShapeClubSandwichDisplayActualOut = [0, 11, 22]
const tickDataForBarXAxisShapeBookendDisplayActualOut = ['Nov 19', 'Apr 20']

export {
  barDataActualFromAPIIn,
  barDataActualFromAPIOut,
  barDataForToolTipsNovIn1,
  barDataForToolTipsNovIn2,
  barDataForToolTipsNovIn3,
  barDataForToolTipsNovOut1,
  barDataForToolTipsNovOut2,
  barDataForToolTipsNovOut3,
  tickDataForBarDisplayMethodPercentageIn,
  tickDataForBarDisplayMethodActualIn,
  tickDataForBarYAxisShapeBookendsDisplayPercentageOut,
  tickDataForBarYAxisShapeClubSandwichDisplayPercentageOut,
  tickDataForBarYAxisShapeBookendsDisplayActualOut,
  tickDataForBarYAxisShapeClubSandwichDisplayActualOut,
  tickDataForBarXAxisShapeBookendDisplayActualOut,
  treatmentAPIOptimumDataIn,
  treatmentAPIOptimumDataOut,
  treatmentAPISkewedDataIn,
  treatmentAPISkewedDataOppositeIn,
  treatmentAPISkewedPercentageDataOut,
  treatmentAPISkewedDataOppositePercentageOut,
  treatmentAPISkewedActualDataOut,
}
