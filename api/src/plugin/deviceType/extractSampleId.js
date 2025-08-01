/**
 * Default implementation for extracting sample ID from payload result section.
 * The sample ID must match the pattern of 3 digits, followed by 6 digits, followed by 3 digits
 * (e.g. "123-456789-012").
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
  const sampleIdPattern = '\\d{3}-\\d{6}-\\d{3}'

  let sampleId = result.sample?.id ?? result?.data?.sampleId ?? null
  const exactRegex = new RegExp(`^${sampleIdPattern}$`)

  if (!sampleId || !exactRegex.test(sampleId)) {
    const patientId = result.patient?.id ?? result.data?.patientId ?? ''
    const matches = patientId.match(exactRegex)
    ;[sampleId] = matches || [sampleId]
  }

  if (!sampleId || !exactRegex.test(sampleId)) {
    const notes = result?.notes ?? result.data?.notes ?? ''
    const searchRegex = new RegExp(`\\b${sampleIdPattern}\\b`, 'g')
    const matches = notes.match(searchRegex)
    ;[sampleId] = matches || [sampleId]
  }
  return sampleId
}

module.exports = { extractSampleId }
