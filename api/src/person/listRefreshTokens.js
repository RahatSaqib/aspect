const { knex, filterParams, sortPageParams } = require('../db')
const { getConstraints, addConstraints } = require('../auth/constraints')
const { clientTypes } = require('../auth/service')

async function listRefreshTokens(request) {
  const { query, auth } = request
  const dataConstraints = await getConstraints(auth.credentials)

  const tokenQuery = knex('RefreshToken as r')
    .innerJoin('Person as p', 'r.userId', 'p.userId')
    .leftJoin('Partner as prt', 'p.lastPartnerId', 'prt.id')
    .leftJoin('Geography as g', 'p.geographyId', 'g.id')
    .where({ clientType: clientTypes.app })
    .modify(addConstraints, dataConstraints, { partner: 'prt', geography: 'g' })

  const getCount = knex
    .from(tokenQuery.clone().select(knex.raw("CONCAT(p.name, ':', r.clientName) as id")).as('reporterIds'))
    .countDistinct('id as count')
    .first()

  const getItems = tokenQuery
    .clone()
    .modify(sortPageParams, query, 'user')
    .modify(filterParams, query, {
      countryId: 'g.countryId',
      stateId: 'g.stateId',
      lgaId: 'g.lgaId',
      assayId: 'rt.assayId',
      treatmentStatusId: 'rts.id',
      contactNameOrEmail: ['p.name', 'p.email', 'p.email2'],
      deviceName: 'r.clientName',
      revoked: 'r.revoked',
      diseaseId: 'dis.id',
      contactStatus: 'p.disabled',
    })
    .leftJoin('ResultDownloadLog as rdl', queryBuilder => {
      queryBuilder.on('rdl.createdBy', 'r.userId')
      if (query.minDate) {
        queryBuilder.andOn('rdl.createdOn', '>=', knex.raw('?', [query.minDate]))
      }
      if (query.maxDate) {
        queryBuilder.andOn('rdl.createdOn', '<=', knex.raw('?', [query.maxDate]))
      }
    })
    .leftJoin('Result as rt', 'rt.id', 'rdl.resultId')
    .leftJoin('Assay as a', 'a.id', 'rt.assayId')
    .leftJoin('AssayType as at', 'a.assayTypeId', 'at.id')
    .leftJoin('Disease as dis', 'at.diseaseId', 'dis.id')
    .leftJoin('ResultTreatmentStatusLog as rtsl', 'rtsl.id', 'rt.treatmentStatusLogId')
    .leftJoin('ResultTreatmentStatus as rts', 'rts.id', 'rtsl.resultTreatmentStatusId')
    .leftJoin('ResultCategoryAssay as rca', queryBuilder => {
      queryBuilder.on('rca.resultCategoryId', 'rt.resultCategory1').andOn('rca.assayId', 'rt.assayId')
    })
    .groupBy('p.name', 'r.clientName')
    .select(
      knex.raw("CONCAT(p.name, ':', r.clientName) as id"),
      'p.name as user',
      'r.clientName as deviceName',
      'r.createdOn',
      'r.revoked',
      knex.raw(
        'greatest(max(ifnull(r.updatedOn, r.createdOn)), (select max(all_rdl.createdOn) from ResultDownloadLog as all_rdl WHERE all_rdl.createdBy = r.userId)) as lastSeen'
      ),
      knex.raw(
        "sum(case rws.externalId when 'Acknowledged' then 1 else 0 end)/sum(case when rca.requiresTreatment = '1' then 1 else 0 end) as acknowledgedRatio"
      ),
      knex.raw(
        "sum(case when rts.externalId = 'OnTreatment' AND rca.requiresTreatment = '1' then 1 else 0 end)/sum(case when rca.requiresTreatment = '1' then 1 else 0 end) as confirmFollowUpRatio"
      ),
      knex.raw(
        "sum(case when rts.externalId = 'OnTreatment' AND rca.requiresTreatment = '1' then 1 else 0 end) as totalOnTreatment"
      ),
      knex.raw('count(distinct rdl.resultId) as delivered'),
      knex.raw("sum(case when rca.requiresTreatment = '1' then 1 else 0 end) as requiresFollowUp")
    )
    .distinct()
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { ok: true, total, length: data.length, data }
}

module.exports = {
  listRefreshTokens,
}
