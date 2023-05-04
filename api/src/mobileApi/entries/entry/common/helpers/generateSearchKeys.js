const _ = require('lodash')
const { transformPatientDataBySchema } = require('./transformPatientDataBySchema')
const { extractFromDataById } = require('./extractFromDataById')
const { transformEntryType } = require('./transformEntryType')
const { generateTransferStatus } = require('./generateTransferStatus')

/**
 * Generates search keys using result and followUps array used for the search functionality in Aspect Mobile
 * @param {object} result - The result object.
 * @param {array} followUps - The array of followups.
 * @returns {object} - Object containing the search keys extracted from the given result and followups.
 */

function generateSearchKeys(result, followUps) {
  const output = {}
  // const patientDataRaw =
  //   !_.isNil(result?.patientData) && !_.isNil(result?.patientDataSchema)
  //     ? transformPatientDataBySchema(JSON.parse(result.patientData), JSON.parse(result.patientDataSchema))
  //     : null
  // const followUpsData = extractFromDataById(followUps, 'resultId', result?.id)

  // console.log(JSON.stringify(transfer, null, 2))

  const filterMeta = {
    entryType: transformEntryType(result)?.i18nKey,
    treatmentStatus: result.resultTreatmentStatusExternalId ?? '',
    transferStatus: generateTransferStatus(result)?.transferStatus ?? '',
  }

  _.set(output, 'id', String(result.id))
  _.set(output, 'platform', 'aspect-mobile')
  _.set(output, 'filterMeta', filterMeta)
  // _.set(output, 'sampleExternalId', result?.sampleExternalId)
  // _.set(output, 'sampleTypeName', result?.sampleTypeName)
  // _.set(output, 'sampleSiteExternalId', result?.sampleSiteExternalId)
  // _.set(output, 'sampleSite', result?.sampleSiteName)
  // _.set(output, 'sampleExternalIdFlat', _.toLower(result?.sampleExternalId?.replace(/[^a-zA-Z0-9]+/g, '')))
  // _.set(output, 'sampleTypeNameFlat', _.toLower(result?.sampleTypeName?.replace(/[^a-zA-Z0-9]+/g, '')))
  // _.set(output, 'sampleSiteFlat', _.toLower(result?.sampleSiteName?.replace(/[^a-zA-Z0-9]+/g, '')))
  // _.set(output, 'resultCategory1Label', _.toLower(result?.resultCategory1Label))
  // _.set(output, 'resultCategory1Name', _.toLower(result?.resultCategory1Name))
  // _.set(output, 'resultCategory2Label', _.toLower(result?.resultCategory2Label))
  // _.set(output, 'resultCategory2Name', _.toLower(result?.resultCategory2Name))
  // _.set(output, 'resultTreatmentStatusName', _.toLower(result?.resultTreatmentStatusName))
  // _.map(patientDataRaw, ({ value, key }) => {
  //   if (!_.isNil(value) || !_.isEmpty(value)) {
  //     _.set(output, `patient${_.upperFirst(key)}`, String(value))
  //     _.set(output, `patient${_.upperFirst(key)}Flat`, _.toLower(String(value).replace(/[^a-zA-Z0-9]+/g, '')))
  //   }
  // })
  // _.map(followUpsData, (value, index) => _.set(output, `followUpi18nKey${index}`, value.followUpi18nKey))
  return _.pickBy(output, _.identity)
}

module.exports = { generateSearchKeys }
