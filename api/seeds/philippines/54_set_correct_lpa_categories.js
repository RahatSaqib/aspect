const { partnerName } = require('./fixtures/partnerData')

module.exports = require('../utils').seed(async knex => {
  const { id: partnerId } = await knex('Partner').where({ name: partnerName }).first()
  const { id: lpaId } = await knex('Assay').where({ externalId: 'assayLPA' }).first()
  const { id: detectedId } = await knex('ResultCategory').where({ externalId: 'Detected' }).first()
  const { id: notDetectedId } = await knex('ResultCategory').where({ externalId: 'NotDetected' }).first()
  const { id: invalidId } = await knex('ResultCategory').where({ externalId: 'Invalid' }).first()
  await knex('Result')
    .where({ assayId: lpaId, partnerId })
    .whereRaw(
      `(resultData -> '$.encodedResult.mtbComplex' = 'MTB DETECTED' OR resultData -> '$.encodedResult.mtbComplex' = 'MTB NOT DETECTED' OR resultData -> '$.encodedResult.mtbComplex' = 'INVALID')`
    )
    .update(
      'resultCategory1',
      knex.raw(
        `CASE WHEN resultData -> '$.encodedResult.mtbComplex' = 'MTB DETECTED' THEN ${detectedId} ELSE (CASE WHEN resultData -> '$.encodedResult.mtbComplex' = 'MTB NOT DETECTED' THEN ${notDetectedId} ELSE ${invalidId} END) END`
      )
    )
}, __filename)
