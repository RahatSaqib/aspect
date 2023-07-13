const { knex } = require('../../../db')
const { addConstraints } = require('../../../auth/constraints')

const getFollowUps = (followUpTypeExternalId, dataConstraints) => {
  return knex('FollowUpType as fut')
    .join('FollowUp as fu', 'fut.id', 'fu.followUpTypeId')
    .join('FollowUpAssay as fua', 'fu.id', 'fua.followUpId')
    .join('Assay as a', 'a.id', 'fua.assayId')
    .where('fut.externalId', followUpTypeExternalId)
    .modify(addConstraints, dataConstraints, {
      assay: 'a',
    })
    .select('fu.externalId as id', 'fu.name', 'fu.i18nKey', 'a.externalId as assayExternalId')
}

module.exports = { getFollowUps }
