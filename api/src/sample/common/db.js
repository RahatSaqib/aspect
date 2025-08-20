const getSampleByExternalId = (knex, externalId) => {
  return knex('Sample').where('externalId', externalId).first()
}

module.exports = {
  getSampleByExternalId,
}
