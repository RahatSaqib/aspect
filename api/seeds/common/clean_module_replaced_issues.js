const Promise = require('bluebird')
const { map, isEmpty } = require('lodash')
const { issueTypeToId } = require('../../src/shared/dictionary')
const logger = require('../../src/shared/logger')

const { createNewIssue, findOpenIssue } = require('../../src/issue/service')
const cleanIssueTypes = require('./remove_unused_issues')

module.exports = async function cleanModuleReplacedIssues(knex, adminUserName, partnerName) {
  try {
    await knex.transaction(async trx => {
      const moduleReplacedIssue = await issueTypeToId('ModuleReplaced')
      if (!moduleReplacedIssue) return
      await dropBadTriggeredIssues(trx, moduleReplacedIssue)
      await updateIssueData(trx, moduleReplacedIssue)
      const possibleResultsWithIssues = await getPossibleResultsWithIssues(trx)
      await Promise.each(possibleResultsWithIssues, async result => {
        const previousResultWithDifferentSerial = await getPreviousResultWithDifferentModuleSerial(
          knex,
          result.deviceId,
          result.moduleName,
          result.moduleSerial,
          result.instrumentSerial,
          result.startedOn
        )

        if (previousResultWithDifferentSerial) {
          const action = {
            type: 'RESULT_MODULE_REPLACED',
            deviceId: result.deviceId,
            resultId: result.id,
            options: {
              data: {
                moduleName: result.moduleName,
                replacedModuleSerial: previousResultWithDifferentSerial.moduleSerial,
                instrumentSerial: result.instrumentSerial,
                newModuleSerial: result.moduleSerial,
                oldResultId: previousResultWithDifferentSerial.id,
              },
            },
          }

          const openIssue = await findOpenIssue(knex, 'ModuleReplaced', action, {
            evaluationFunction: 'filterByModuleReplaced',
          })

          if (!openIssue) {
            await createNewIssue(trx, 'ModuleReplaced', action)
          }
        }
      })
    })
    cleanIssueTypes(knex, adminUserName, partnerName)
  } catch (error) {
    logger.error(error, { reLabel: 'seed:cleanModuleReplacedIssues' })
    throw error
  }
}
const updateIssueData = async (knex, issueTypeModuleReplacedId) => {
  const issuesToUpdate = await getRightTriggeredIssues(knex, issueTypeModuleReplacedId)
    .clone()
    .groupBy(
      'q.newModuleSerial',
      'q.instrumentSerial',
      'oldResult.moduleSerial',
      'oldResult.moduleName',
      'q.moduleName',
      'oldResult.deviceid',
      'q.endedOn'
    )
    .max('oldResult.id as oldResultId')
    .select('q.moduleName', 'q.instrumentSerial')

  await knex('Issue as i')
    .join('Result as r', 'i.resultId', 'r.id')
    .update({
      'i.data': knex.raw("JSON_SET(i.data, '$.moduleName', r.moduleName,'$.instrumentSerial',r.instrumentSerial)"),
    })
    .whereIn(
      'i.id',
      map(issuesToUpdate, ({ issueId }) => issueId)
    )

  await Promise.each(issuesToUpdate, ({ oldResultId, issueId }) =>
    knex('Issue as i')
      .update({
        'i.data': knex.raw("JSON_SET(i.data, '$.oldResultId', ?)", [oldResultId]),
      })
      .where('i.id', issueId)
  )
}
const getRightTriggeredIssues = (knex, moduleReplacedIssue) =>
  knex('Result as oldResult')
    .join(
      knex('Issue as innerIssue')
        .join('Result as newResult', 'innerIssue.resultId', 'newResult.id')
        .where('innerIssue.issueTypeid', moduleReplacedIssue)
        .whereNotNull('newResult.moduleName')
        .select(
          'innerIssue.id AS issueId',
          'newResult.endedOn',
          knex.raw("innerIssue.data->>'$.replacedModuleSerial' AS oldModuleSerial"),
          'newResult.moduleSerial as newModuleSerial',
          'newResult.moduleName',
          'innerIssue.deviceId',
          'newResult.instrumentSerial'
        )
        .as('q'),
      builder => {
        builder
          .on('q.deviceId', 'oldResult.deviceId')
          .andOn('q.endedOn', '>', 'oldResult.endedOn')
          .andOn('q.moduleName', 'oldResult.moduleName')
          .andOn('q.oldModuleSerial', 'oldResult.moduleSerial')
          .andOn('q.instrumentSerial', 'oldResult.instrumentSerial')
      }
    )
    .distinct('q.issueId as issueId')

const dropBadTriggeredIssues = async (knex, moduleReplacedIssue) => {
  // find those issues that were triggered ok.
  const rightIssues = await getRightTriggeredIssues(knex, moduleReplacedIssue).clone().pluck('issueId')
  // Removes those issues triggered badly because the module serial was different but there the result wasn't on the same module bay or because the modulename is null
  await knex('Issue')
    .where('issueTypeId', moduleReplacedIssue)
    .where(builder => {
      if (!isEmpty(rightIssues)) {
        builder.whereNotIn('id', rightIssues)
      }
    })
    .delete()
}

const getPossibleResultsWithIssues = knex =>
  knex('Result as r1')
    .join(
      knex('Result as r')
        .whereNotNull('r.moduleName')
        .groupBy('r.instrumentSerial', 'r.moduleName', 'r.moduleSerial', 'r.deviceId')
        .select('r.modulename', 'r.moduleSerial', 'r.deviceId')
        .min('r.endedOn as endedOn')
        .as('q'),
      builder =>
        builder
          .on('r1.moduleName', 'q.moduleName')
          .andOn('r1.moduleSerial', 'q.moduleSerial')
          .andOn('r1.endedOn', 'q.endedOn')
    )
    .select('r1.id', 'r1.deviceId', 'r1.startedOn', 'r1.moduleSerial', 'r1.moduleName', 'r1.instrumentSerial')

const getPreviousResultWithDifferentModuleSerial = (
  knex,
  deviceId,
  moduleName,
  moduleSerial,
  instrumentSerial,
  startedOn
) =>
  // check if a module was replaced and trigger replacement-issue if it was
  // get the most recent result from the same moduleName as the current result
  knex('Result')
    .where('deviceId', deviceId)
    .where('moduleName', moduleName)
    .whereNotNull('moduleSerial')
    .where('moduleSerial', '<>', moduleSerial)
    .where('instrumentSerial', instrumentSerial)
    .where('startedOn', '<', startedOn)
    .orderBy('endedOn', 'desc')
    .first('moduleSerial', 'id')
