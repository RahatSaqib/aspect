module.exports = require('../src/db').migration(up, down)

const Promise = require('bluebird')

async function up(knex) {
  await knex.schema.alterTable('PartnerAssay', async tblPartnerAssay => {
    tblPartnerAssay.string('reliableCaseExternalIdTemplate')
    tblPartnerAssay.string('unreliableCaseExternalIdTemplate')
    tblPartnerAssay.string('reliablePatientExternalIdTemplate')
    tblPartnerAssay.string('unreliablePatientExternalIdTemplate')
  })

  const caseExternalIdTemplates = await knex('PartnerDisease as pd')
    .join('AssayType as at', 'pd.diseaseId', 'at.diseaseId')
    .join('Assay as a', 'a.assayTypeId', 'at.id')
    .join('PartnerAssay as pa', qb => {
      qb.on('a.id', 'pa.assayId').andOn('pd.partnerId', 'pa.partnerId')
    })
    .whereNotNull('pd.caseExternalIdTemplate')
    .select('pd.partnerId', 'pa.assayId', 'pd.canAutoAssignResultByCaseId', 'pd.caseExternalIdTemplate')

  await Promise.each(caseExternalIdTemplates, async caseExternalIdTemplate => {
    const assayCaseIdTemplate = {}
    if (caseExternalIdTemplate.canAutoAssignResultByCaseId) {
      assayCaseIdTemplate.reliableCaseExternalIdTemplate = caseExternalIdTemplate.caseExternalIdTemplate
    } else {
      assayCaseIdTemplate.unreliableCaseExternalIdTemplate = caseExternalIdTemplate.caseExternalIdTemplate
    }
    await knex('PartnerAssay')
      .where({
        partnerId: caseExternalIdTemplate.partnerId,
        assayId: caseExternalIdTemplate.assayId,
      })
      .update(assayCaseIdTemplate)
  })

  await knex.schema.alterTable('PartnerDisease', async tblPartnerDisease => {
    tblPartnerDisease.dropColumn('caseExternalIdTemplate')
    tblPartnerDisease.dropColumn('canAutoAssignResultByCaseId')
  })

  await knex.schema.alterTable('PatientCase', async tblPatientCase => {
    tblPatientCase.integer('createdBy').unsigned().nullable().alter()
    tblPatientCase.integer('updatedBy').unsigned().nullable().alter()
  })

  await knex.schema.alterTable('Patient', async tblPatientCase => {
    tblPatientCase.integer('createdBy').unsigned().nullable().alter()
    tblPatientCase.integer('updatedBy').unsigned().nullable().alter()
  })
}

async function down(knex) {
  await knex.schema.alterTable('PartnerDisease', async tblPartnerDisease => {
    tblPartnerDisease.string('caseExternalIdTemplate')
    tblPartnerDisease.boolean('canAutoAssignResultByCaseId').notNullable().defaultTo(0)
  })

  const reliableCaseExternalIdTemplates = await knex('PartnerAssay as pa')
    .join('Assay as a', 'pa.assayId', 'a.id')
    .join('AssayType as at', 'a.assayTypeId', 'at.id')
    .join('PartnerDisease as pd', qb => {
      qb.on('at.diseaseId', 'pd.diseaseId').andOn('pa.partnerId', 'pd.partnerId')
    })
    .whereNotNull('pa.reliableCaseExternalIdTemplate')
    .groupBy(['pd.partnerId', 'pd.diseaseId'])
    .select('pd.partnerId', 'pd.diseaseId', 'pa.reliableCaseExternalIdTemplate')

  await Promise.each(reliableCaseExternalIdTemplates, async reliableCaseExternalIdTemplate =>
    knex('PartnerDisease')
      .where({
        partnerId: reliableCaseExternalIdTemplate.partnerId,
        diseaseId: reliableCaseExternalIdTemplate.diseaseId,
      })
      .update({
        caseExternalIdTemplate: reliableCaseExternalIdTemplate.reliableCaseExternalIdTemplate,
        canAutoAssignResultByCaseId: 1,
      })
  )

  const unreliableCaseExternalIdTemplates = await knex('PartnerAssay as pa')
    .join('Assay as a', 'pa.assayId', 'a.id')
    .join('AssayType as at', 'a.assayTypeId', 'at.id')
    .join('PartnerDisease as pd', qb => {
      qb.on('at.diseaseId', 'pd.diseaseId').andOn('pa.partnerId', 'pd.partnerId')
    })
    .whereNotNull('pa.unreliableCaseExternalIdTemplate')
    .andWhere(qb => {
      qb.whereNull('pd.caseExternalIdTemplate')
    })
    .groupBy(['pd.partnerId', 'pd.diseaseId'])
    .select('pd.partnerId', 'pd.diseaseId', 'pa.unreliableCaseExternalIdTemplate')

  await Promise.each(unreliableCaseExternalIdTemplates, async unreliableCaseExternalIdTemplate =>
    knex('PartnerDisease')
      .where({
        partnerId: unreliableCaseExternalIdTemplate.partnerId,
        diseaseId: unreliableCaseExternalIdTemplate.diseaseId,
      })
      .update({
        caseExternalIdTemplate: unreliableCaseExternalIdTemplate.unreliableCaseExternalIdTemplate,
        canAutoAssignResultByCaseId: 0,
      })
  )

  await knex.schema.alterTable('PartnerAssay', async tblPartnerAssay => {
    tblPartnerAssay.dropColumn('reliableCaseExternalIdTemplate')
    tblPartnerAssay.dropColumn('unreliableCaseExternalIdTemplate')
    tblPartnerAssay.dropColumn('reliablePatientExternalIdTemplate')
    tblPartnerAssay.dropColumn('unreliablePatientExternalIdTemplate')
  })

  await knex.schema.alterTable('PatientCase', async tblPatientCase => {
    tblPatientCase.integer('createdBy').unsigned().notNullable().alter()
    tblPatientCase.integer('updatedBy').unsigned().notNullable().alter()
  })

  await knex.schema.alterTable('Patient', async tblPatientCase => {
    tblPatientCase.integer('createdBy').unsigned().notNullable().alter()
    tblPatientCase.integer('updatedBy').unsigned().notNullable().alter()
  })
}
