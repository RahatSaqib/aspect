const _ = require('lodash')
const { transformPatientDataBySchema } = require('./transformPatientDataBySchema')
const { extractFromDataById } = require('./extractFromDataById')

/**
 * Generates search keys using data and followUps array used for the search functionality in Aspect Mobile
 * @param {object} data - The data object.
 * @param {array} followUps - The array of followups.
 * @returns {object} - Object containing the search keys extracted from the given data and followups.
 */

function generateSearchKeys(data, followUps) {
  // console.log(JSON.stringify({ data, followUps }, null, 2))
  const output = {}
  const patientDataRaw =
    !_.isNil(data?.patientData) && !_.isNil(data?.patientDataSchema)
      ? transformPatientDataBySchema(JSON.parse(data.patientData), JSON.parse(data.patientDataSchema))
      : null
  const followUpsData = extractFromDataById(followUps, 'resultId', data?.id)

  _.set(output, 'id', String(data.id))
  _.set(output, 'sampleExternalId', data?.sampleExternalId)
  _.set(output, 'sampleTypeName', data?.sampleTypeName)
  _.set(output, 'sampleSiteExternalId', data?.sampleSiteExternalId)
  _.set(output, 'sampleSite', data?.sampleSiteName)
  _.set(output, 'sampleExternalIdFlat', _.toLower(data?.sampleExternalId?.replace(/[^a-zA-Z0-9]+/g, '')))
  _.set(output, 'sampleTypeNameFlat', _.toLower(data?.sampleTypeName?.replace(/[^a-zA-Z0-9]+/g, '')))
  _.set(output, 'sampleSiteFlat', _.toLower(data?.sampleSiteName?.replace(/[^a-zA-Z0-9]+/g, '')))
  _.set(output, 'resultCategory1Label', _.toLower(data?.resultCategory1Label))
  _.set(output, 'resultCategory1Name', _.toLower(data?.resultCategory1Name))
  _.set(output, 'resultCategory2Label', _.toLower(data?.resultCategory2Label))
  _.set(output, 'resultCategory2Name', _.toLower(data?.resultCategory2Name))
  _.set(output, 'resultTreatmentStatusName', _.toLower(data?.resultTreatmentStatusName))
  _.map(patientDataRaw, ({ value, key }) => {
    if (!_.isNil(value) || !_.isEmpty(value)) {
      _.set(output, `patient${_.upperFirst(key)}`, String(value))
      _.set(output, `patient${_.upperFirst(key)}Flat`, _.toLower(String(value).replace(/[^a-zA-Z0-9]+/g, '')))
    }
  })
  _.map(followUpsData, (value, index) => _.set(output, `followUpi18nKey${index}`, value.followUpi18nKey))
  return _.pickBy(output, _.identity)
}

module.exports = { generateSearchKeys }
