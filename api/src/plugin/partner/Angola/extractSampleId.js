const { extractSampleId: defaultExtractSampleId } = require('../../deviceType/extractSampleId')

/**
 * Angola-specific implementation for extracting sample ID from payload result section.
 * First tries the default pattern (3 digits-6 digits-3 digits), and if that fails,
 * then tries the Angola pattern (10 alphanumeric-6 digits-3 alphanumeric).
 * The paths where the sampleId is searched are:
 * - result.sample.id (exact match)
 * - result.data.sampleId (exact match)
 * - result.patient.id (exact match)
 * - result.data.patientId (exact match)
 * - result.notes (contains)
 * - result.data.notes (contains)
 * @param {Object} result - The result part of a GeneXpert payload
 * @returns {string|null} The extracted sample ID or null if no valid sample Id is found
 */
function extractSampleId(result) {
  // First try the default implementation
  const defaultResult = defaultExtractSampleId(result)
  if (defaultResult) {
    return defaultResult
  }

  // If default failed, try old app Angola pattern: [10 alphanumeric]-[6 digits]-[3 alphanumeric]
  const angolaPattern = '[A-Za-z0-9]{10}-\\d{6}-[A-Za-z0-9]{3}'

  let sampleId = result.sample?.id ?? result?.data?.sampleId ?? null
  const exactRegex = new RegExp(`^${angolaPattern}$`)

  if (!sampleId || !exactRegex.test(sampleId)) {
    const patientId = result.patient?.id ?? result.data?.patientId ?? ''
    const matches = patientId.match(exactRegex)
    ;[sampleId] = matches || [sampleId]
  }

  if (!sampleId || !exactRegex.test(sampleId)) {
    const notes = result?.notes ?? result.data?.notes ?? ''
    const searchRegex = new RegExp(`\\b${angolaPattern}\\b`, 'g')
    const matches = notes.match(searchRegex)
    ;[sampleId] = matches || [sampleId]
  }

  // Return Angola pattern result (could be null if no valid ID found)
  if (sampleId && exactRegex.test(sampleId)) {
    return sampleId
  }

  return null
}

module.exports = { extractSampleId }
