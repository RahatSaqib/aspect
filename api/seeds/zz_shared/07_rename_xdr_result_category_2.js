/* eslint-disable import/no-dynamic-require */
module.exports = require('../utils').seed(
  async knex =>
    knex('Assay').where({ externalId: 'GxMtbXdr' }).update({
      resultCategory2Label: 'Drug Resistance',
      resultCategory2i18nKey: 'resultCategoryDrugResistance',
    }),
  __filename
)
