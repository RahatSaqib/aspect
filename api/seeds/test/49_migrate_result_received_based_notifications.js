const {
  allNotificationTypeCategoryToId,
  allResultCategoryToId,
  allAssayToId,
} = require('../../src/shared/dictionary')

module.exports = require('../utils').seed(async knex => {
  const partnerIds = await knex('Partner').pluck('id')
  const { issueBased: issueBasedId, resultBased: resultBasedId } =
    await allNotificationTypeCategoryToId()
  const assayIdByExternalId = await allAssayToId()
  const resultCategoryIdByExternalId = await allResultCategoryToId()

  await Promise.each(partnerIds, async partnerId => {
    const { id: adminId } = await knex('Person as p')
      .innerJoin('Job as j', 'p.id', 'j.personId')
      .innerJoin('JobFunction as jf', 'j.jobFunctionId', 'jf.id')
      .where('p.lastPartnerId', partnerId)
      .andWhere('jf.externalId', knex.raw('admin'))
      .select('p.id')

    const notificationTypes = await knex('NotificationType').where({
      partnerId,
      notificationTypeCategoryId: issueBasedId,
    })

    const now = new Date()

    // Iterate and migrate notification types
    await Promise.each(notificationTypes, async notificationType => {
      // Create the new notification type
      const { issueTypeId, jobFunctionId, level, ...restProps } =
        notificationType
      let issueEscalationTrigger
      const filterCondition = {
        jobFunctions: [
          {
            tags: [],
            checked: true,
            jobFunctionId,
          },
        ],
      }

      // If it corresponds to an escalation level > 1, then the notification has filters
      if (level > 1) {
        ;[issueEscalationTrigger] = await knex('IssueEscalationTrigger')
          .where({
            partnerId,
            escalateToLevel: level,
            issueTypeId,
          })
          .pluck('escalationConditions')

        if (issueEscalationTrigger) {
          const { evaluationMethod, evaluationParameter } = JSON.parse(
            issueEscalationTrigger
          )

          if (evaluationMethod === 'result-category') {
            let { resultCategory1, resultCategory2 } = evaluationParameter
            const { assays } = evaluationParameter

            await Promise.each(assays, async assayExternalId => {
              const assayId = assayIdByExternalId[assayExternalId]

              const scopedResultCategories = []

              // resultcategory1 y resultcategory2 vacios => solo assay
              // resultcategory1 no vacio y resultcategory2 vacio => todos los category groups de resultcategory1, o solo resultcategory1
              // resultcategory1 no vacio y resultcategory2 no vacio => todos los category groups de resultcategory1 y resultcategory2
              // resultcategory1 vacio y resultcategory2 no vacio => todos los category groups de resultcategory2 o lanzar error

              if (resultCategory1 === null || resultCategory1.length === 0)
                resultCategory1 = [null]

              if (resultCategory2 === null || resultCategory2.length === 0)
                resultCategory2 = [null]

              await Promise.each(resultCategory1, async rc1ExternalId => {
                await Promise.each(resultCategory2, async rc2ExternalId => {
                  const resultCategory1Id =
                    rc1ExternalId != null
                      ? resultCategoryIdByExternalId[rc1ExternalId]
                      : null
                  const resultCategory2Id =
                    rc2ExternalId != null
                      ? resultCategoryIdByExternalId[rc2ExternalId]
                      : null

                  const resultCategoryGroups = await knex('ResultCategoryGroup')
                    .where({ assayId })
                    .modify(q => {
                      if (resultCategory1Id !== null) {
                        q.andWhere('resultCategory1Id', resultCategory1Id)
                      }
                      if (resultCategory2Id !== null) {
                        q.andWhere('resultCategory2Id', resultCategory2Id)
                      }
                    })

                  if (resultCategoryGroups.length > 0) {
                    // If result category groups exist, then add all of them as scoped categories
                    resultCategoryGroups.forEach(rcg =>
                      scopedResultCategories.push({
                        label: rcg.name,
                        scope: 'ResultCategoryGroups',
                        value: rcg.externalId,
                      })
                    )
                  } else if (
                    resultCategory1Id !== null &&
                    resultCategory2Id === null
                  ) {
                    // Else if result category 1 was defined in the old condition, then add it as a scoped category
                    const resultCategory1 = await knex('ResultCategory').where(
                      'id',
                      resultCategory1Id
                    )
                    scopedResultCategories.push({
                      label: resultCategory1.name,
                      scope: 'ResultCategories',
                      value: resultCategory1.externalId,
                    })
                  } else {
                    throw new Error(
                      `No result category group defined for the result category 2 external id '${rc2ExternalId}'. The notification can't be migrated.`
                    )
                  }
                })
              })

              filterCondition.result = await Promise.map(
                assays,
                async assayExternalId => {
                  return {
                    assayId: assayIdByExternalId[assayExternalId],
                    resultCategoryId: scopedResultCategories,
                  }
                }
              )
            })
          }
          // ... ignoring all the other possible evaluation-methods (plugin-function, issue-age, sql-script, etc)
        }
      }

      const migratedNotificationType = {
        ...restProps,
        createdOn: now,
        updatedOn: now,
        createdBy: adminId,
        updatedBy: adminId,
        notificationTypeCategoryId: resultBasedId,
        filterCondition,
      }
      await knex('NotificationType').insert(migratedNotificationType)

      // Deprecate the old notification type
    })
  })

  /**
   * {
    "result": [
        {
            -- "assayId": "GxMtbRifUltra",
            -- "resultCategoryId": [
                {
                    "label": "MTB Detected",
                    "scope": "ResultCategoryGroups", OR ResultCategories
                    "value": "GxMtbRifUltraMtbDetected"
                }
            ]
        }
    ],
    -- "areaItems": [
        {
            "label": "Amherst Hospital",
            "value": "Massachusetts_3"
        }
    ],
    -- "jobFunctions": [
        {
            "tags": [],
            "checked": true,
            "jobFunctionId": "1"
        }
    ],
    "deviceLevelId": "lab"
}
   */

  // For each partner
  // For each notification type based on Result Received issue type
  // Get the issue escalation trigger by issue type and level -> get escalation conditions (assays and result categories)
  // Set jobFunctionId = null

  // const now = new Date()
  // const { partnerOneId } = await knex('Partner')
  //   .where({
  //     name: partnerName,
  //   })
  //   .first('id as partnerOneId')
  // const { adminId } = await knex('User')
  //   .where({ name: 'admin' })
  //   .first('id as adminId')
  // const {
  //   id: geographyId,
  //   countryId,
  //   timezone,
  //   culture,
  // } = await knex('Geography as g')
  //   .innerJoin('Country as c', 'c.id', 'g.countryId')
  //   .where({ 'c.a3': 'USA' })
  //   .whereNotNull('g.stateId')
  //   .whereNull('g.lgaId')
  //   .first('g.id', 'c.id as countryId', 'timezone', 'culture')

  // // create regional manager
  // const [regionalManagerUserId] = await knex('User').insert({
  //   name: 'Regional Manager',
  //   password: bcrypt.hashSync('test07', saltRounds),
  //   approved: 1,
  //   createdOn: now,
  //   lockedOut: 0,
  //   failedPasswordAttempts: 0,
  // })

  // const auditFields = {
  //   createdOn: now,
  //   createdBy: adminId,
  //   updatedOn: now,
  //   updatedBy: adminId,
  // }

  // const [regionalManagerPersonId] = await knex('Person').insert({
  //   userId: regionalManagerUserId,
  //   name: 'Regional Manager',
  //   lastPartnerId: partnerOneId,
  //   lastCountryId: countryId,
  //   timezone,
  //   culture,
  //   geographyId,
  //   ...auditFields,
  // })

  // const { id: jobFunctionIdRegionalManager } = await knex('JobFunction')
  //   .where({ externalId: 'regionalOfficer', partnerId: partnerOneId })
  //   .first()
  // const [jobId] = await knex('Job').insert({
  //   personId: regionalManagerPersonId,
  //   jobFunctionId: jobFunctionIdRegionalManager,
  // })
  // await knex('JobContext').insert({ jobId, geographyId })
}, __filename)
