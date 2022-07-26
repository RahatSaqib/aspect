module.exports = require('../utils').seed(seed, __filename)

const { upsertGeneXpertDeviceTypeAndAssays } = require('../common')

const { patientData } = require('./fixtures/geneXpertPatientDataSchema.json')

async function seed(knex) {
  // Grant access to sites
  // Reuse previously seeded "static" data

  const { id: permissionSiteAdminId } = await knex('Permission')
    .where('module', 'site')
    .where('activity', 'admin')
    .first('id')

  const { id: jobFunctionIdAdmin } = await knex('JobFunction').where('name', 'Admin').first('id')

  const { jobFunctionId } = knex('JobFunctionPermission')
    .where('jobFunctionId', jobFunctionIdAdmin)
    .where('permissionId', permissionSiteAdminId)
    .first('jobFunctionId')

  if (!jobFunctionId)
    await knex('JobFunctionPermission').insert([
      {
        jobFunctionId: jobFunctionIdAdmin,
        permissionId: permissionSiteAdminId,
      },
    ])
  await upsertGeneXpertDeviceTypeAndAssays(
    knex,
    ['GxUnknown', 'GxHcv', 'GxHiv', 'GxMtbRif', 'GxMtbRifUltra', 'GxHiv1Vl', 'GxHiv1Qual', 'GxEbola'],
    patientData
  )
}
