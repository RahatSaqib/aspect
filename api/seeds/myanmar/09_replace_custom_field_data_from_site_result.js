module.exports = require('../utils').seed(seed, __filename)
const { parseNotes } = require('../../src/plugin/partner/Myanmar/customFieldsParser')

async function seed(knex) {
  const siteId = 2323 // Replace with the specific siteId you want to process

  const { minId, maxId } = await knex('Result')
    .where('siteId', siteId)
    .first({
      minId: knex.raw('MIN(id)'),
      maxId: knex.raw('MAX(id)'),
    })

  const batchSize = 1000
  const startFrom = minId
  const endAt = maxId

  let processed = startFrom - 1
  while (processed < endAt) {
    const start = processed + 1
    const end = Math.min(processed + batchSize, endAt)
    // eslint-disable-next-line no-console
    console.log(`processing batch: ${start}-${end} for siteId: ${siteId}`)

    // eslint-disable-next-line no-await-in-loop
    const resultsToUpdate = await getResultsToUpdateInRange(knex, start, end, siteId)

    if (resultsToUpdate.length > 0) {
      // eslint-disable-next-line no-await-in-loop
      await knex('Result').insert(resultsToUpdate).onConflict('id').merge()
    }

    processed = end
  }
}

const getResultsToUpdateInRange = async (knex, minId, maxId, siteId) => {
  const range = [minId, maxId]

  const resultsToUpdate = await knex('Result as r')
    .whereBetween('r.id', range)
    .andWhere('r.siteId', siteId)
    .select('r.*')

  const transformedResults = []
  for (const resultToUpdate of resultsToUpdate) {
    try {
      const patientData = JSON.parse(resultToUpdate.patientData)

      const parsedNotesPatientData = parseNotes(resultToUpdate.notes).patientData

      const parsedPatientData = {
        ...parsedNotesPatientData,
      }

      if (patientData.id) {
        parsedPatientData.id = patientData.id
      }

      if (patientData.PatientTownship) {
        parsedPatientData.PatientTownship = patientData.PatientTownship
      }

      if (parsedNotesPatientData.PatientAge) {
        parsedPatientData.age = parsedNotesPatientData.PatientAge
      }

      const transformedResult = {
        ...resultToUpdate,
        patientData: JSON.stringify(parsedPatientData),
      }
      transformedResults.push(transformedResult)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`skip resultId ${resultToUpdate.id} - Error: ${error}`)
    }
  }

  return transformedResults
}
