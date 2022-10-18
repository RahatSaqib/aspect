const logger = require('../shared/logger')

const filterByModuleSerial = (queryBuilder, { moduleSerial }, aliases = { issue: 'i' }) => {
  logger.debug(`moduleSerial: ${moduleSerial}`, {
    reLabel: 'issues:filterByModuleSerial',
  })
  if (moduleSerial) queryBuilder.whereRaw(`${aliases.issue}.data->>"$.moduleSerial"=?`, [moduleSerial])
  return queryBuilder
}
const filterByInstrumentSerial = (queryBuilder, { instrumentSerial }, aliases = { issue: 'i' }) => {
  logger.debug(`instrument serial:${instrumentSerial}`, {
    reLabel: 'issues:filterByInstrumentSerial',
  })
  if (instrumentSerial) queryBuilder.whereRaw(`${aliases.issue}.data->>"$.instrumentSerial"=?`, [instrumentSerial])
  return queryBuilder
}
const filterByInstrumentAndModuleSerial = (
  queryBuilder,
  { instrumentSerial, moduleSerial },
  aliases = { issue: 'i' }
) => {
  logger.debug(`instrument serial:${instrumentSerial},moduleSerial: ${moduleSerial}`, {
    reLabel: 'issues:filterByInstrumentAndModuleSerial',
  })
  return filterByModuleSerial(
    filterByInstrumentSerial(queryBuilder, { instrumentSerial }, aliases),
    { moduleSerial },
    aliases
  )
}
const filterByLotAndAssay = (queryBuilder, { assayId, consumableLot }, aliases = { issue: 'i' }) => {
  logger.debug(`Assay id:${assayId},Consumable lot: ${consumableLot}`, {
    reLabel: 'issues:filterByLotAndAssay',
  })

  if (assayId && consumableLot)
    queryBuilder.whereRaw(`${aliases.issue}.data->>"$.assayId"=? and ${aliases.issue}.data->>"$.consumableLot"=?`, [
      assayId,
      consumableLot,
    ])
  return queryBuilder
}

const filterByModuleReplaced = (
  queryBuilder,
  { newModuleSerial, replacedModuleSerial, instrumentSerial },
  aliases = { issue: 'i' }
) => {
  logger.debug(
    `moduleName: ${newModuleSerial}, Module Serial: ${replacedModuleSerial} and instrumentSerial: ${instrumentSerial}`,
    {
      reLabel: 'issues:filterByModuleReplaced',
    }
  )
  if (newModuleSerial && replacedModuleSerial)
    queryBuilder.whereRaw(
      `${aliases.issue}.data->>"$.newModuleSerial"=? and ${aliases.issue}.data->>"$.replacedModuleSerial"=? and ${aliases.issue}.data->>"$.instrumentSerial"=?`,
      [newModuleSerial, replacedModuleSerial, instrumentSerial]
    )
  return queryBuilder
}
module.exports = {
  filterByInstrumentSerial,
  filterByLotAndAssay,
  filterByModuleSerial,
  filterByModuleReplaced,
  filterByInstrumentAndModuleSerial,
}
