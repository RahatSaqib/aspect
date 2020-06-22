/** ___________________________________________ */

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

const divergentDataFromAPIIn = [
  {
    cnt: 1,
    day: '2020-03-06',
    gender: 'Female',
    age: '15',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-03-14',
    gender: 'Female',
    age: '6',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-03-15',
    gender: 'Male',
    age: '6',
    followUp: 'unknown',
  },
  {
    cnt: 1,
    day: '2020-03-18',
    gender: 'Female',
    age: '22',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-03-19',
    gender: 'Male',
    age: '25',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-03-20',
    gender: 'Male',
    age: '23',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-03-22',
    gender: 'Male',
    age: '8',
    followUp: 'unknown',
  },
  {
    cnt: 1,
    day: '2020-03-25',
    gender: 'Female',
    age: '22',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-03-29',
    gender: 'Female',
    age: '23',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-04',
    gender: 'Male',
    age: '30',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-07',
    gender: 'Female',
    age: '17',
    followUp: 'unknown',
  },
  {
    cnt: 1,
    day: '2020-04-08',
    gender: 'Female',
    age: '11',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-10',
    gender: 'Female',
    age: '0',
    followUp: 'unknown',
  },
  {
    cnt: 1,
    day: '2020-04-10',
    gender: 'Male',
    age: '0',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-11',
    gender: 'Male',
    age: '22',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-04-12',
    gender: 'Male',
    age: '19',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-04-12',
    gender: 'Male',
    age: '25',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-04-13',
    gender: 'Male',
    age: '13',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-04-15',
    gender: 'Female',
    age: '28',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-04-16',
    gender: 'Female',
    age: '25',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-17',
    gender: 'Female',
    age: '25',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-04-17',
    gender: 'Female',
    age: '13',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-18',
    gender: 'Male',
    age: '3',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-04-19',
    gender: 'Female',
    age: '10',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-20',
    gender: 'Female',
    age: '21',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-20',
    gender: 'Female',
    age: '10',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-04-22',
    gender: 'Male',
    age: '4',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-04-22',
    gender: 'Male',
    age: '25',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-23',
    gender: 'Female',
    age: '12',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-04-23',
    gender: 'Male',
    age: '9',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-23',
    gender: 'Male',
    age: '17',
    followUp: 'unknown',
  },
  {
    cnt: 1,
    day: '2020-04-24',
    gender: 'Female',
    age: '29',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-25',
    gender: 'Female',
    age: '26',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-25',
    gender: 'Female',
    age: '4',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-25',
    gender: 'Male',
    age: '29',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-26',
    gender: 'Female',
    age: '6',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-27',
    gender: 'Female',
    age: '15',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-27',
    gender: 'Female',
    age: '12',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-27',
    gender: 'Female',
    age: '29',
    followUp: 'unknown',
  },
  {
    cnt: 1,
    day: '2020-04-28',
    gender: 'Male',
    age: '8',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-28',
    gender: 'Female',
    age: '14',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-28',
    gender: 'Male',
    age: '0',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-04-28',
    gender: 'Male',
    age: '0',
    followUp: 'unknown',
  },
  {
    cnt: 1,
    day: '2020-04-29',
    gender: 'Male',
    age: '9',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-04-30',
    gender: 'Female',
    age: '13',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-04-30',
    gender: 'Male',
    age: '23',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-30',
    gender: 'Female',
    age: '16',
    followUp: 'died',
  },
  {
    cnt: 1,
    day: '2020-04-30',
    gender: 'Female',
    age: '11',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-30',
    gender: 'Male',
    age: '28',
    followUp: 'recovered',
  },
  {
    cnt: 1,
    day: '2020-04-30',
    gender: 'Female',
    age: '1',
    followUp: 'died',
  },
]

const divergentDataFromAPIOut = [
  { inRange: '0-9', Female: 6, Male: -11 },
  { inRange: '10-19', Female: 14, Male: -4 },
  { inRange: '20-29', Female: 11, Male: -9 },
  { inRange: '30-39', Male: -2 },
]

const tickDataForBarDisplayMethodPercentageIn = [
  {
    month: 'Nov 19',
    LessThan1000: '52.9412',
    MoreThan1000: '47.0588',
  },
  {
    month: 'Dec 19',
    LessThan1000: '40.9091',
    MoreThan1000: '54.5455',
    NotDetected: '4.5455',
  },
  {
    month: 'Jan 20',
    LessThan1000: '68.7500',
    MoreThan1000: '25.0000',
    NotDetected: '6.2500',
  },
  {
    month: 'Feb 20',
    NotDetected: '11.1111',
    LessThan1000: '50.0000',
    MoreThan1000: '38.8889',
  },
  {
    month: 'Mar 20',
    LessThan1000: '40.0000',
    NotDetected: '15.0000',
    MoreThan1000: '45.0000',
  },
  {
    month: 'Apr 20',
    MoreThan1000: '47.0588',
    LessThan1000: '35.2941',
    NotDetected: '17.6471',
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

const tickDataForBarYAxisShapeBookendsDisplayPercentageOut = [0, 100]
const tickDataForBarYAxisShapeClubSandwichDisplayPercentageOut = [0, 50, 100]
const tickDataForBarYAxisShapeBookendsDisplayActualOut = [0, 22]
const tickDataForBarYAxisShapeClubSandwichDisplayActualOut = [0, 11, 22]
const tickDataForBarXAxisShapeBookendDisplayActualOut = ['Nov 19', 'Apr 20']

const groupByKeyGrouped = {
  '2019-11': {
    month: 'Nov 19',
    LessThan1000: 9,
    MoreThan1000: 8,
  },
  '2019-12': {
    month: 'Dec 19',
    LessThan1000: 9,
    MoreThan1000: 12,
    NotDetected: 1,
  },
  '2020-01': {
    month: 'Jan 20',
    LessThan1000: 11,
    MoreThan1000: 4,
    NotDetected: 1,
  },
  '2020-02': {
    month: 'Feb 20',
    NotDetected: 2,
    LessThan1000: 9,
    MoreThan1000: 7,
  },
  '2020-03': {
    month: 'Mar 20',
    LessThan1000: 8,
    NotDetected: 3,
    MoreThan1000: 9,
  },
  '2020-04': {
    month: 'Apr 20',
    MoreThan1000: 8,
    LessThan1000: 6,
    NotDetected: 3,
  },
}

export {
  barDataActualFromAPIIn,
  barDataActualFromAPIOut,
  pieDataActualFromAPIIn,
  pieDataActualFromAPIOut,
  divergentDataFromAPIIn,
  divergentDataFromAPIOut,
  tickDataForBarDisplayMethodPercentageIn,
  tickDataForBarDisplayMethodActualIn,
  tickDataForBarYAxisShapeBookendsDisplayPercentageOut,
  tickDataForBarYAxisShapeClubSandwichDisplayPercentageOut,
  tickDataForBarYAxisShapeBookendsDisplayActualOut,
  tickDataForBarYAxisShapeClubSandwichDisplayActualOut,
  tickDataForBarXAxisShapeBookendDisplayActualOut,
  groupByKeyGrouped,
}
