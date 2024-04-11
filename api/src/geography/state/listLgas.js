const { getConstraints, addConstraints } = require('../../auth/constraints')
const { knex, sortPageParams } = require('../../db')

const getAssociatedDataCount = table =>
  knex(`${table} as t`).join('Geography as g', 't.geographyId', 'g.id').where('lgaId', knex.ref('l.id')).count().clone()

async function listLgas({ auth, query }) {
  const dataConstraints = await getConstraints(auth.credentials)

  const lgaQuery = knex('Lga as l').modify(addConstraints, dataConstraints, { lga: 'l' })

  const getItems = lgaQuery
    .clone()
    .modify(sortPageParams, query, 'name')
    .select({
      id: 'id',
      name: 'name',
      resultCount: getAssociatedDataCount('Result'),
      deviceConfigurationCount: getAssociatedDataCount('DeviceConfiguration'),
      targetCount: getAssociatedDataCount('Target'),
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

  const getCount = lgaQuery.clone().count('l.id as count').first()
  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { ok: true, total, length: data.length, data }
}

module.exports = { listLgas }
