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
    if (sample?.sampleData && typeof sample?.sampleData === 'string') {
      sample.sampleData = JSON.parse(sample?.sampleData)
    }
    const clinicalResponseFlags = {
      requiresFollowUp: false,
      hasFollowUp: false,
      noFollowUpPossible: true,
    }
    return {
      id: sample.id,
      patientId: sample?.sampleData?.patientExternalId || null,
      sample: transformSampleData(sample),
      testType: transformEntryType(),
      dbUpdatedOn: sample.updatedOn,
      resultRequiresTreatment: false,
      ...clinicalResponseFlags,
      searchSchema: generateSearchKeys(
        sample,
        sample?.sampleData?.patientExternalId,
        { ...clinicalResponseFlags, followUpStatus: 'followUpNotRequired' },
        []
      ),
      updatedOn: getSampleUpdatedOnDate(sample),
      collectedOn: sample.sampleCollectedOn,
    }
  }).filter(_.identity)
}

module.exports = { transformSampleResponse }
