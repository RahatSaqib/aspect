const _ = require('lodash')
const { transformEntryType } = require('./transformEntryType')
const { generateTransferStatus } = require('./generateTransferStatus')

/**
 * Generates search keys using result and followUps array used for the search functionality in Aspect Mobile
 * @param {object} result - The result object.
 * @param {string} patientDataId - The patientDataId.
 * @returns {object} - Object containing the search keys extracted from the given result and followups.
 */

function generateSearchKeys(result, patientDataId) {
  const output = {}
  const filterMeta = {
    entryType: transformEntryType(result)?.i18nKey,
    treatmentStatus: result.resultTreatmentStatusExternalId ?? '',
    transferStatus: generateTransferStatus(result)?.transferStatus ?? '',
    assayType: result?.assayExternalId ?? '',
  }
  const transformedPatientId = !_.isNil(patientDataId) ? patientDataId.replace(/[^a-zA-Z0-9]+/g, '') : null
  _.set(output, 'id', String(result.id))
  _.set(output, 'sampleId', result?.sampleExternalId)
  _.set(output, 'sampleIdFlat', _.toLower(result?.sampleExternalId?.replace(/[^a-zA-Z0-9]+/g, '')))
  _.set(output, 'sampleSite', _.toLower(result?.sampleSiteName))

  _.set(output, 'patientId', transformedPatientId)
  _.set(output, 'platform', 'aspect-mobile')
  _.set(output, 'filterMeta', filterMeta)
  return _.pickBy(output, _.identity)
}

module.exports = { generateSearchKeys }
