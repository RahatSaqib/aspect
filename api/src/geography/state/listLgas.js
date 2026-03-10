const { getConstraints, addConstraints } = require('../../auth/constraints')
const { knex, sortPageParams, filterParams } = require('../../db')

const getAssociatedDataCount = table =>
  knex(`${table} as t`).join('Geography as g', 't.geographyId', 'g.id').where('lgaId', knex.ref('l.id')).count().clone()

async function listLgas({ auth, query }) {
  const dataConstraints = await getConstraints(auth.credentials)

  const lgaQuery = knex('Geography as g')
    .join('Country as c', 'g.countryId', 'c.id')
    .join('State as s', 'g.stateId', 's.id')
    .join('Lga as l', 'g.lgaId', 'l.id')
    .modify(filterParams, query, {
      stateId: 'g.stateId',
      name: 'l.name',
    })
    .modify(addConstraints, dataConstraints, { country: 'c', state: 's', lga: 'l' })

  const getItems = lgaQuery
    .clone()
    .modify(sortPageParams, query, 'name', { name: 'l.name' })
    .select({
      id: 'l.id',
      name: 'l.name',
      stateId: 's.id',
      stateName: 's.name',
      siteCount: getAssociatedDataCount('Site'),
      issueCount: getAssociatedDataCount('Issue'),
      deviceApiKeyCount: getAssociatedDataCount('DeviceApiKey'),
      personCount: getAssociatedDataCount('Person'),
      jobContextCount: getAssociatedDataCount('JobContext'),
      notificationCount: knex('NotificationType as nt')
        .where(knex.raw('nt.filterCondition ->> "$.deviceLevelId"'), 'lga')
        .whereRaw(`${knex.ref('l.id')} MEMBER OF(nt.filterCondition ->> "$.areaItems[*].value")`)
        .count(),
    })

  const isDeletionDisabled = i =>
    i.siteCount > 0 ||
    i.issueCount > 0 ||
    i.deviceApiKeyCount > 0 ||
    i.personCount > 0 ||
    i.jobContextCount > 0 ||
    i.notificationCount > 0

  const getCount = lgaQuery.clone().count('l.id as count').first()
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return {
    ok: true,
    total,
    length: data.length,
    data: data.map(i => ({ ...i, cannotDelete: isDeletionDisabled(i) })),
  }
}

module.exports = { listLgas }
