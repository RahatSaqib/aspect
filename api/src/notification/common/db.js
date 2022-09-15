const { knex, filterParams, filterDateRangeParams, sortPageParams } = require('../../db')
const { addConstraints, getConstraints } = require('../../auth/constraints')

async function getListNotifications(query, credentials) {
  const subquery = knex('NotificationType as nti')
    .leftOuterJoin('JobFunction AS jf', leftBuilder =>
      leftBuilder.on(
        knex.raw(
          `JSON_SEARCH(
                nti.filterCondition->>'$.jobFunctions[*].jobFunctionId',
                'one',
                jf.id
              ) IS NOT NULL
            `
        )
      )
    )
    .leftOuterJoin('Person AS per', leftBuilder =>
      leftBuilder.on(
        knex.raw(
          ` JSON_SEARCH(
              nti.filterCondition->>'$.persons[*].personId',
              'one',
              per.id
            ) IS NOT NULL`
        )
      )
    )
    .distinct('nti.id AS notificationTypeId', 'per.name AS personName', 'per.id as personId', 'jf.name AS jfName')

  const dataConstraints = await getConstraints(credentials)

  const notificationQuery = knex('NotificationType as nt')
    .innerJoin('NotificationTypeCategory as ntc', 'nt.notificationTypeCategoryId', 'ntc.id')
    .leftOuterJoin('Notification as n', 'nt.id', 'n.notificationTypeId')
    .leftJoin('MessageType as m', 'm.id', 'nt.messageTypeId')
    .leftJoin('Partner as p', 'nt.partnerId', 'p.id')
    .modify(filterParams, query, {
      notificationName: 'nt.name',
    })
    .modify(filterDateRangeParams, query, 'lastTriggeredOn')
    .modify(addConstraints, dataConstraints, { partner: 'p' })
    .modify(AddNotificationGeographyConstraints, dataConstraints)

    .max('n.createdOn as lastTriggeredOn')
    .groupBy('nt.id')

  const getItems = notificationQuery
    .clone()
    .leftOuterJoin(subquery.as('filters'), 'nt.id', 'filters.notificationTypeId')
    .modify(sortPageParams, query, 'nt.name')
    .select(
      'nt.id as id',
      'nt.name',
      'nt.enabled',
      knex.raw(`count(distinct n.id) as totalTriggers`),
      knex.raw('COUNT(DISTINCT filters.jfName) as jobFunctionsCount'),
      knex.raw(`GROUP_CONCAT(DISTINCT filters.jfName SEPARATOR ', ') as jobFunctions`),
      knex.raw('COUNT(DISTINCT filters.personName) as personsCount'),
      knex.raw(`GROUP_CONCAT(DISTINCT filters.personName SEPARATOR ', ') as persons`),
      columnCount('alert'),
      knex.raw(`nt.filterCondition->>'$.sendToPatient' as sendToPatient`),
      'ntc.externalId as typeCategory'
    )

  function columnCount(column) {
    return knex.raw(
      `SUM(CASE
          WHEN m.${column}TemplateId IS NULL THEN 0
          ELSE CASE WHEN n.${column}MessageId IS NULL THEN 0 ELSE 1 END END) as ${column}Count`
    )
  }

  const getCount = knex.count('* as count').from(notificationQuery.clone().as('mainQuery')).first()

  const [{ count: total }, data] = await Promise.all([getCount, getItems])

  return { ok: true, total, data, length: data.length }
}

function AddNotificationGeographyConstraints(queryBuilder, dataConstraints) {
  queryBuilder.andWhere(qb => {
    const stateConstraints = dataConstraints.$or?.filter(c => c.geography?.stateId).map(c => c.geography.stateId) || []
    if (stateConstraints.length > 0) {
      stateConstraints.map(stateId =>
        qb.orWhere(b => {
          b.where(knex.raw('nt.filterCondition ->> "$.deviceLevelId"'), 'state')
          b.whereRaw(`'${stateId}' MEMBER OF(nt.filterCondition ->> "$.areaItems[*].value")`)
        })
      )
    }

    const lgaConstraints = dataConstraints.$or?.filter(c => c.geography?.lgaId).map(c => c.geography.lgaId) || []
    if (lgaConstraints.length > 0) {
      lgaConstraints.map(lgaId =>
        qb.orWhere(b => {
          b.where(knex.raw('nt.filterCondition ->> "$.deviceLevelId"'), 'lga')
          b.whereRaw(`'${lgaId}' MEMBER OF(nt.filterCondition ->> "$.areaItems[*].value")`)
        })
      )
    }

    const siteConstraints = dataConstraints.$or?.filter(c => c.site).map(c => c.site.id) || []
    if (siteConstraints.length > 0) {
      siteConstraints.map(siteId =>
        qb.orWhere(b => {
          b.where(knex.raw('nt.filterCondition ->> "$.deviceLevelId"'), 'lab')
          b.whereRaw(`'${siteId}' MEMBER OF(nt.filterCondition ->> "$.areaItems[*].value")`)
        })
      )
    }
  })
}

module.exports = {
  getListNotifications,
}
