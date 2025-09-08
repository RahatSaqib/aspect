module.exports = require('../utils').seed(seed, __filename)
const { sampleTypeToId } = require('../../src/shared/dictionary')

async function seed(knex) {
  const { minId, maxId } = await knex('Result').first({
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
    console.log(`processing batch: ${start}-${end}`)

    // eslint-disable-next-line no-await-in-loop
    const samplesToUpdate = await getSamplesToUpdateInRange(knex, start, end)

    if (samplesToUpdate.length > 0) {
      // eslint-disable-next-line no-await-in-loop
      await knex('Sample').insert(samplesToUpdate).onConflict('id').merge()
    }

    processed = end
  }
}

const getSamplesToUpdateInRange = async (knex, minId, maxId) => {
  const range = [minId, maxId]

  const results = await knex('Result as r')
    .join('Sample as s', 'r.sampleId', 's.id')
    .whereBetween('r.id', range)
    .select('s.*', 'r.patientData as patientDataJson', 'r.id as resultId')

  const transformedSamples = []
  for (const { patientDataJson, resultId, ...sampleToUpdate } of results) {
    try {
      const patientData = JSON.parse(patientDataJson)

      if (patientData && patientData.SampleType) {
        // eslint-disable-next-line no-await-in-loop
        const sampleTypeId = await sampleTypeToId(patientData.SampleType)
        if (sampleTypeId !== null) {
          sampleToUpdate.sampleTypeId = sampleTypeId
        }
      }
      transformedSamples.push(sampleToUpdate)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(`skip resultId ${resultId} - Error: ${error}`)
    }
  }

  return transformedSamples
}
