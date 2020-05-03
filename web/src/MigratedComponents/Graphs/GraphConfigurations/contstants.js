import BarGraph from '../Graphs/BarGraph'
import PieGraph from '../Graphs/PieGraph'
import { getTimePeriod } from '../Graphs/Helpers'

const getDate = getTimePeriod
const CALCMETHOD = { percentage: 'percentage', actual: 'actual' }
const SECTIONCLASSHALF = 'Section--withStatus--half'
const BARCLASS = 'clinicalIndicators__bar'
const BARHALFCLASS = 'clinicalIndicators__bar--half'
const PIECLASS = 'clinicalIndicators__pie'
const PIEINDEX = { count: 'cnt' }
const GENDER = { male: 'male', female: 'female', index: 'gender' }
const RESULT = {
  result1: 'resultCategory1',
  result2: 'resultCategory2',
  followUp: 'followUp',
  gender: 'gender',
  male: 'Male',
  female: 'Female',
}
const FOLLOWUP = {
  icu: 'admissionToHospitalIcu',
  hospital: 'admissionToHospital',
  self: 'selfQuarantine',
  quarantine: 'quarantine',
}
const FOLLOWUPTYPE = {
  treatment: 'treament',
  outcome: 'outcome',
}
const DATAKEYS = {
  day: 'byDay',
  stack: 'byDayStacked',
  outcomeNegative: 'byOutcomeNegative',
  outcomeRecovered: 'byOutcomeRecovered',
  outcomeDistributionStack: 'byOutcomeDistributionStacked',
  outcomeDistribution: 'byOutcomeDistribution',
  recoveryByGender: 'recoveryByGender',
  month: 'byMonth',
  male: 'male',
  female: 'female',
  aggregate: 'aggregate',
}

const DAY = {
  single: 'day',
  plural: 'days',
  format: 'dd MMM',
  formatShort: 'MMM dd',
}

const MONTH = {
  single: 'month',
  plural: 'months',
  format: 'MMM yyyy',
}

const CONST = {
  getDate,
  BarGraph,
  PieGraph,
  CALCMETHOD,
  SECTIONCLASSHALF,
  BARCLASS,
  BARHALFCLASS,
  FOLLOWUP,
  FOLLOWUPTYPE,
  PIECLASS,
  PIEINDEX,
  GENDER,
  RESULT,
  DATAKEYS,
  DAY,
  MONTH,
}

export default CONST
