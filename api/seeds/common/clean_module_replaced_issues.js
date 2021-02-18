const Promise = require('bluebird')
const { shouldTriggerModuleReplaced } = require('../../src/plugin/utils')
const {
  issueTypeToId,
  issueStatusToId,
} = require('../../src/shared/dictionary')
const { createMessageContext } = require('../../test/utils/mqUtils')

module.exports = async function cleanModuleReplacedIssues(knex) {
  const moduleReplacedIssue = await issueTypeToId('ModuleReplaced')
  await dropBadTriggeredIssues(knex, moduleReplacedIssue)
  await updateIssueData(knex, moduleReplacedIssue)
  const possibleResultsWithIssues = await getPossibleResultsWithIssues(knex)
  await Promise.each(possibleResultsWithIssues, result =>
    shouldTriggerModuleReplaced(
      knex,
      createMessageContext(),
      result.id,
      result.deviceId,
      result.moduleSerial,
      result.moduleName,
      result.endedOn
    )
  )
  await updateOpenIssues(knex, moduleReplacedIssue)
  //
}

const updateOpenIssues = async (knex, issueTypeId) =>
  knex('Issue')
    .where({ issueTypeId })
    .update({ issueStatusId: await issueStatusToId('Resolved') })

const updateIssueData = async (knex, issueTypeModuleReplacedId) => {
  const issuesToUpdate = await getRightTriggeredIssues(
    knex,
    issueTypeModuleReplacedId
  )
    .clone()
    .groupBy(
      'q.moduleSerial',
      'oldResult.moduleSerial',
      'oldResult.moduleName',
      'q.moduleName',
      'oldResult.deviceid',
      'q.endedOn'
    )
    .max('oldResult.id as oldResultId')
    .select('q.moduleName')

  await knex('Issue i')
    .join('Result r', 'i.resultId', 'r.id')
    .update({
      'i.data': knex.raw("JSON_SET(i.data, '$.moduleName', r.moduleName)"),
    })
    .whereIn('i.id', issuesToUpdate)

  await Promise.each(issuesToUpdate, ({ oldResultId, issueId }) =>
    knex('Issue i')
      .join('Result r', 'i.resultId', 'r.id')
      .update({
        'i.data': knex.raw("JSON_SET(i.data, '$.oldResultId', ?)", [
          oldResultId,
        ]),
      })
      .where('i.id', issueId)
  )
}
const getRightTriggeredIssues = (knex, moduleReplacedIssue) =>
  knex('Result oldResult')
    .join(
      knex('Issue innerIssue')
        .join('Result newResult', 'innerIssue.resultId', 'newResult.id')
        .where('innerIssue.issueTypeid', moduleReplacedIssue)
        .whereNotNull('newResult.moduleName')
        .select(
          'i.id AS issueId',
          'newResult.endedOn',
          knex.raw("i.data->>'$.replacedModuleSerial' AS oldModuleSerial"),
          'newResult.moduleSerial as newModuleSerial',
          'newResult.moduleName AS moduleName',
          'i.deviceId'
        )
        .as('q'),
      builder => {
        builder
          .on('q.deviceId', 'oldResult.deviceId')
          .andOn('q.endedOn', '>', 'oldResult.endedOn')
          .andOn('q.moduleName', 'oldResult.moduleName')
          .andOn('q.oldModuleSerial', 'oldResult.moduleSerial')
      }
    )
    .select('q.issueId as id')

const dropBadTriggeredIssues = async (knex, moduleReplacedIssue) => {
  // find those issues that were triggered ok.
  const rightIssues = await getRightTriggeredIssues(knex, moduleReplacedIssue)
    .clone()
    .pluck('id')
  // Removes those issues triggered badly because the module serial was different but there the result wasn't on the same module bay or because the modulename is null
  await knex('Issue i')
    .where('issueTypeid', moduleReplacedIssue)
    .whereNotIn('i.id', rightIssues)
    .delete()
}

const getPossibleResultsWithIssues = knex =>
  knex('Result r1')
    .join(
      knex('Result r')
        .whereNotNull('r.moduleName')
        .groupBy('r.moduleName', 'r.moduleSerial', 'r.deviceId')
        .select('r.modulename', 'r.moduleSerial', 'r.deviceId')
        .min('r.endedOn')
        .as('q'),
      builder =>
        builder
          .on('r.moduleName', 'q.moduleName')
          .andOn('r.moduleSerial', 'q.moduleSerial')
          .andOn('r.endedOn', 'q.endedOn')
    )
    .select(
      'r1.id',
      'r1.deviceId',
      'r1.endedOn',
      'r1.moduleSerial',
      'r1.moduleName'
    )
