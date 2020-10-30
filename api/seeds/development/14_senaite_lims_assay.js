module.exports = require('../utils').seed(seed, __filename)

const { seedSenaiteLimsAssays } = require('../utils_senaite_lims')

async function seed(knex) {
  return seedSenaiteLimsAssays(knex, [
    'assayBdMgitAst',
    'assayBdMgitGnd',
    'assayGenoTypeMTBCV1',
    'assayGenoTypeMTBDRplusV2',
    'assayGenoTypeMTBDRslV1',
    'assayGenoTypeMTBDRslV2',
  ])
}
