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
      resultBasedScope: nt.resultBasedScope,
      id: nt.id,
    }
  })

  // const { daysLimitToNotifyResults, hoursNotificationsShouldWaitForCustomFields } = await knex('Partner')
  //     .where('id', result.partnerId)
  //     .first()

  let resultIds = []

  messageContext.bindActionCreators({ resultReadyForNotification })

  await Promise.each(notificationTypes, async nt => {
    const ntResultIds = await knex('Result as r')
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
        if (nt.deviceLevel !== 'national') {
          const areaItemsIds = nt.areaScope.map(as => as.value)
          if (nt.deviceLevel === 'state') {
            query.whereIn('g.stateId', areaItemsIds)
          } else if (nt.deviceLevel === 'lab') {
            query.whereIn('s.id', areaItemsIds)
          } else if (nt.deviceLevel === 'lga') {
            query.whereIn('g.lgaId', areaItemsIds)
          }
        }

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
      //  .where('r.endedOn', '>=', nt.updatedOn)
      // Results that timed out
      .andWhere(
        knex.raw('DATE_ADD(r.endedOn, INTERVAL p.hoursNotificationsShouldWaitForCustomFields HOUR)'),
        '<',
        knex.raw('NOW()')
      )
      .whereNull('n.id')
      .pluck('r.id')

    resultIds = uniq([...resultIds, ...ntResultIds])
    resultIds.forEach(rId => messageContext.resultReadyForNotification(rId, nt.resultBasedScope === 'updated'))
  })
}

module.exports = notifyTimedOutResults
