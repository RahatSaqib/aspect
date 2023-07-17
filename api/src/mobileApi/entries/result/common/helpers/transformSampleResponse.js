const _ = require('lodash')
const subMonths = require('date-fns/subMonths')
const formatISO = require('date-fns/formatISO')
const { transformEntryType } = require('./transformEntryType')
const { transformSampleData } = require('./transformSample')
const { getSampleUpdatedOnDate } = require('./getTrueUpdatedOnDates')
const { generateSearchKeys } = require('./generateSearchKeys')
const { MONTHS_HISTORY_TO_LOOK_UP } = require('../../../common/consts')

function transformSampleResponse(query, data, results) {
  if (_.isEmpty(data)) return []
  const minUpdatedOn = query?.minUpdatedOn ?? formatISO(subMonths(new Date(), MONTHS_HISTORY_TO_LOOK_UP))
  return _.map(data, sample => {
    if (!_.isEmpty(_.find(results, { sample: { id: sample.id } }))) return
    if (_.lt(new Date(sample.collectedOn), minUpdatedOn)) return
    const clinicalResponseFlags = {
      requiresFollowUp: false,
      hasFollowUp: false,
      noFollowUpPossible: true,
    }
    return {
      id: sample.id,
      patientId: sample?.sampleData?.patientId || null,
      sample: transformSampleData(sample),
      testType: transformEntryType(),
      dbUpdatedOn: sample.updatedOn,
      ...clinicalResponseFlags,
      searchSchema: generateSearchKeys(sample, sample?.sampleData?.patientId, clinicalResponseFlags),
      updatedOn: getSampleUpdatedOnDate(sample),
      collectedOn: sample.sampleCollectedOn,
    }
  }).filter(_.identity)
}

module.exports = { transformSampleResponse }
