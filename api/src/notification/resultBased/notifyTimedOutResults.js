const Promise = require('bluebird')
const uniq = require('lodash/uniq')
const { knex } = require('../../db')
const { resultReadyForNotification } = require('../../result/actions')

const notifyTimedOutResults = async (_, { messageContext }) => {
  let notificationTypes = await knex('NotificationType as nt')
    .innerJoin('NotificationTypeCategory as ntc', 'nt.notificationTypeCategoryId', 'ntc.id')
    .select([
      knex.raw("filterCondition->>'$.result' as resultScope"),
      knex.raw("filterCondition->>'$.areaItems' as areaScope"),
      knex.raw("filterCondition->>'$.deviceLevelId' as deviceLevel"),
      knex.raw("filterCondition->>'$.resultBasedScope' as resultBasedScope"),
      'updatedOn',
      'nt.id',
    ])
    .where('ntc.externalId', 'resultBased')
    .andWhere('enabled', true)

  notificationTypes = notificationTypes.map(nt => {
    return {
      resultScope: nt.resultScope ? JSON.parse(nt.resultScope) : null,
      areaScope: nt.areaScope ? JSON.parse(nt.areaScope) : null,
      deviceLevel: nt.deviceLevel,
      updatedOn: nt.updatedOn,
      id: nt.id,
    }
  })

  let resultIds = []

  messageContext.bindActionCreators({ resultReadyForNotification })

  await Promise.each(notificationTypes, async nt => {
    const ntResultIdsQuery = knex('Result as r')
      .innerJoin('Assay as a', 'r.assayId', 'a.id')
      .leftJoin('Notification as n', join => {
        join.on('r.id', 'n.resultId')
        join.andOn(knex.raw(`${nt.id} = n.notificationTypeId`))
      })
      .leftJoin('ResultCategoryGroup as rcg', join => {
        join.on('r.resultCategory1', 'rcg.resultCategory1Id')
        join.andOn('r.resultCategory2', 'rcg.resultCategory2Id')
        join.andOn('r.assayId', 'rcg.assayId')
      })
      .innerJoin('Device as d', 'r.deviceId', 'd.id')
      .innerJoin('Site as s', 'd.siteId', 's.id')
      .innerJoin('Geography as g', 's.geographyId', 'g.id')
      .innerJoin('Partner as p', 'r.partnerId', 'p.id')
      .modify(query => {
        const areaItemsIds = nt.areaScope
        if (nt.deviceLevel !== 'national' && areaItemsIds) {
          if (nt.deviceLevel === 'state') {
            query.whereIn('g.stateId', areaItemsIds)
          } else if (nt.deviceLevel === 'lab') {
            query.whereIn('s.id', areaItemsIds)
          } else if (nt.deviceLevel === 'lga') {
            query.whereIn('g.lgaId', areaItemsIds)
          }
        }

        if (nt.resultScope)
          query.andWhere(assayWhere => {
            nt.resultScope.forEach(({ assayId: assayExternalId, resultCategoryId: resultCategories }) => {
              assayWhere.orWhere('a.externalId', assayExternalId)

              resultCategories.forEach(rc => {
                if (rc.scope === 'ResultCategoryGroups') assayWhere.andWhere('rcg.externalId', rc.value)
              })
            })
          })
      })
      // Results created after updating the notification for the last time
      // We don't want to notify results created when the notification had a different configuration
      .where('r.endedOn', '>=', nt.updatedOn)
      // Results that timed out
      .andWhere(
        knex.raw('DATE_ADD(r.endedOn, INTERVAL p.hoursNotificationsShouldWaitForCustomFields HOUR)'),
        '<',
        knex.raw('NOW()')
      )
      // Results that are not older than the limit set to the partner
      .andWhere(knex.raw('DATE_ADD(r.endedOn, INTERVAL p.daysLimitToNotifyResults DAY)'), '>', knex.raw('NOW()'))
      .whereNull('n.id')
      .pluck('r.id')

    const ntResultIds = await ntResultIdsQuery

    resultIds = uniq([...resultIds, ...ntResultIds])
    resultIds.forEach(rId => messageContext.resultReadyForNotification(rId, nt.resultBasedScope === 'updated'))
  })
}

module.exports = notifyTimedOutResults
