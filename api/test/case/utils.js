const { knex } = require('../../src/db')

async function getFirstCase() {
  return knex('PatientCase').first()
}

async function getFirstPartnerId() {
  const { id } = await knex('Partner').first()
  return id
}

async function getFirstDiseaseId(partnerId) {
  const { id: diseaseId } = await knex('Disease as d')
    .innerJoin('AssayType as at', 'd.id', 'at.diseaseId')
    .innerJoin('Assay as a', 'at.id', 'a.assayTypeId')
    .innerJoin('Result as r', 'a.id', 'r.assayId')
    .where({ 'r.partnerId': partnerId })
    .select('d.id')
    .first()

  return diseaseId
}

module.exports = {
  getFirstCase,
  getFirstPartnerId,
  getFirstDiseaseId,
}
