const { getConstraints, addConstraints } = require('../../auth/constraints')
const { knex, sortPageParams, filterParams } = require('../../db')

const getAssociatedDataCount = table =>
  knex(`${table} as t`)
    .join('Geography as g', 't.geographyId', 'g.id')
    .where('stateId', knex.ref('s.id'))
    .count()
    .clone()

async function listStates({ auth, query }) {
  const dataConstraints = await getConstraints(auth.credentials)

  const stateQuery = knex('State as s')
    .modify(filterParams, query, {
      name: 's.name',
    })
    .modify(addConstraints, dataConstraints, { state: 's' })

  const getItems = stateQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select({
      id: 'id',
      name: 'name',
      abbreviation: 'abbreviation',
      deviceConfigurationCount: getAssociatedDataCount('DeviceConfiguration'),
      targetCount: getAssociatedDataCount('Target'),
      siteCount: getAssociatedDataCount('Site'),
      issueCount: getAssociatedDataCount('Issue'),
      deviceApiKeyCount: getAssociatedDataCount('DeviceApiKey'),
      personCount: getAssociatedDataCount('Person'),
      jobContextCount: getAssociatedDataCount('JobContext'),
      lgaCount: knex('Lga as l').join('Geography as g', 'l.id', 'g.lgaId').where('g.stateId', knex.ref('s.id')).count(),
      notificationCount: knex('NotificationType as nt')
        .where(knex.raw('nt.filterCondition ->> "$.deviceLevelId"'), 'state')
        .whereRaw(`${knex.ref('s.id')} MEMBER OF(nt.filterCondition ->> "$.areaItems[*].value")`)
        .count(),
    })

  const getCount = stateQuery.clone().count('s.id as count').first()
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { ok: true, total, length: data.length, data }
}

module.exports = { listStates }
