const _ = require('lodash')
const subMonths = require('date-fns/subMonths')
const formatISO = require('date-fns/formatISO')
const { transformEntryType } = require('./transformEntryType')
const { transformSampleData } = require('./transformSample')
const { getSampleUpdatedOnDate } = require('./getTrueUpdatedOnDates')
const { generateSearchKeys } = require('./generateSearchKeys')
const { MONTHS_HISTORY_TO_LOOK_UP } = require('../../../common/consts')

function transformSampleResponse(query, data, results) {
  const output = []
  if (_.isEmpty(data)) return []
  const minUpdatedOn = query?.minUpdatedOn ?? formatISO(subMonths(new Date(), MONTHS_HISTORY_TO_LOOK_UP))
  _.map(data, sample => {
    if (!_.isEmpty(_.find(results, { sample: { id: sample.id } }))) return
    if (_.lt(new Date(sample.collectedOn), minUpdatedOn)) return
    output.push({
      id: sample.id,
      sample: transformSampleData(sample),
      testType: transformEntryType(),
      dbUpdatedOn: sample.updatedOn,
      searchSchema: generateSearchKeys(sample, sample?.sampleData?.patientId),
      updatedOn: getSampleUpdatedOnDate(sample),
      collectedOn: sample.sampleCollectedOn,
    })
  })
  return output
}

module.exports = { transformSampleResponse }
