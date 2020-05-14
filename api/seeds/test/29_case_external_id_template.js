module.exports = require('../utils').seed(seed, __filename)

async function seed(knex) {
  await knex('PartnerDisease')
    .whereNull('caseExternalIdTemplate')
    .andWhere('canAutoAssignResultByCaseId', 1)
    .update({
      caseExternalIdTemplate:
        '{{coalesce result.formData.caseId result.data.caseId result.patientData.caseId}}',
    })
}
