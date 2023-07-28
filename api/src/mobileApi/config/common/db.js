const { knex } = require('../../../db')

const getTreatmentStatuses = () => {
  return knex('ResultTreatmentStatus as rts').select('rts.externalId as id', 'rts.name', 'rts.i18nKey')
}

module.exports = { getTreatmentStatuses }
