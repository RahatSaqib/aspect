const { SITE_TYPE_EXTERNAL_IDS } = require('../../src/shared/constants')

exports.seed = function (knex) {
  return knex('Site as s')
    .join('SiteType as st', 's.siteTypeId', 'st.id')
    .update({
      's.sampleRegistrationAllowed': knex.raw('CASE WHEN st.externalId = ? THEN ? ELSE ? END', [
        SITE_TYPE_EXTERNAL_IDS.CLINIC,
        true,
        false,
      ]),
    })
}
