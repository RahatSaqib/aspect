const { parseNotes } = require('./customFieldsParser')

async function transformMergeResultPayload(context) {
  const customFieldsFromNotes = parseNotes(context.payload.result.notes)
  context.payload.result.patient = {
    ...context.payload.result.patient,
    ...customFieldsFromNotes.patientData,
  }
}

module.exports = transformMergeResultPayload
