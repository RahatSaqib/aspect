const _ = require('lodash')
const { transformPatientDataBySchema } = require('./transformPatientDataBySchema')
const { extractFromDataById } = require('./extractFromDataById')

function generateSearchKeys(data, followUps) {
  const patientData = transformPatientDataBySchema(JSON.parse(data.patientData), JSON.parse(data.patientDataSchema))
  const followUpsData = extractFromDataById(followUps, 'resultId', data.id)
  const output = {
    resultId: data.id,
    sampleExternalId: data.sampleExternalId,
    sampleIdFlat: _.toLower(data?.sampleExternalId?.replace(/[^a-zA-Z0-9]+/g, '')),
    sampleSite: data.sampleOriginSiteName,
    sampleSiteFlat: _.toLower(data?.sampleOriginSiteName?.replace(/[^a-zA-Z0-9]+/g, '')),
    resultCategory1Label: _.toLower(data.resultCategory1Label),
    resultCategory1Name: _.toLower(data.resultCategory1Name),
    resultCategory2Label: _.toLower(data.resultCategory2Label),
    resultCategory2Name: _.toLower(data.resultCategory2Name),
    resultTreatmentStatusName: _.toLower(data.resultTreatmentStatusName),
  }
  _.map(patientData, value => {
    if (!_.isNil(value?.value) || !_.isEmpty(value?.value)) {
      _.set(output, `patient${_.upperFirst(value.key)}`, value?.value)
      _.set(
        output,
        `patient${_.upperFirst(value.key)}Flat`,
        _.isInteger(value?.value) ? _.toString(value?.value) : _.toLower(value?.value?.replace(/[^a-zA-Z0-9]+/g, ''))
      )
    }
  })
  _.map(followUpsData, (value, index) => _.set(output, `followUpi18nKey${index}`, value.followUpi18nKey))
  return _.pickBy(output, _.identity)
}

module.exports = { generateSearchKeys }
