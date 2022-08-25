const pieDataActualFromAPIIn = [
  { cnt: 52, resultCategory1: 'LessThan1000' },
  { cnt: 48, resultCategory1: 'MoreThan1000' },
  { cnt: 10, resultCategory1: 'NotDetected' },
]

const pieDataActualFromAPIOut = [
  { id: 'LessThan1000', label: 'LessThan1000', value: 52 },
  { id: 'MoreThan1000', label: 'MoreThan1000', value: 48 },
  { id: 'NotDetected', label: 'NotDetected', value: 10 },
]

export { pieDataActualFromAPIIn, pieDataActualFromAPIOut }
