const getSampleByExternalId = (knex, externalId) => {
  return knex('Sample').where('externalId', externalId).first()
}

const getSampleIdByExternalId = async (knex, externalId) => {
  const { id: sampleId } = (await knex('Sample').where('externalId', externalId).first('id')) || {}
  return sampleId
}

module.exports = {
  getSampleByExternalId,
  getSampleIdByExternalId,
}
